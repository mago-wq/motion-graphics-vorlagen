#!/usr/bin/env python3
"""Macht aus stimme/roh.wav die fertige Stimme des Videos.

Egal ob die Rohstimme kostenlos erzeugt, von ElevenLabs kommt oder selbst
aufgenommen ist: Dieser Schritt ist für alle gleich.

1. Wort-Grenzen exakt bestimmen (Forced Alignment mit einem deutschen
   wav2vec2-Modell, Apache-2.0, und torchaudio).
2. Abschnitte aus config.ts ausschneiden, jeden in Tempo und Tonhöhe
   anpassen (stimme.tempo x abschnitt.tempo, stimme.tiefer) und mit genau
   der eingestellten Pause zwischen den Wörtern wieder zusammensetzen.
   "leiser"-Abschnitte werden zurückgenommen.
3. Klang wie im Vorbild: warm und dunkel (EQ), gleichmäßig (Kompressor),
   breiter Hall in Stereo (stimme.hall), am Ende Platz zum Ausklingen.
4. Lautheit -18 LUFS (im Video kommen Regen und Effekte dazu).

Ausgabe:
  public/stimme/stimme.wav    44,1 kHz, 16 bit, Stereo
  src/stimme/woerter.json     Start/Ende jedes Wortes in Sekunden ab Dateibeginn

Aufruf: npm run stimme:bearbeiten   (oder ~/.venvs/tts/bin/python scripts/stimme_bearbeiten.py)
Zum Vergleichen mehrerer Stimmen, ohne das Projekt zu verändern:
  ... stimme_bearbeiten.py --roh out/stimmen/rob-roh.wav --aus out/stimmen/rob.wav --tiefer 0 --tempo 0.95
"""
import argparse
import json
from pathlib import Path

import librosa
import numpy as np
import pedalboard as pb
import pyloudnorm
import soundfile as sf
import torch
import torchaudio

from zitat_config import FERTIG_WAV, FERTIG_WOERTER, ROH_WAV, ROOT, check_tafeln, load_config, spoken_words

SR = 44100
LUFS = -18.0
VORLAUF = 0.03   # s Luft vor dem hörbaren Beginn eines Abschnitts
NACHLAUF = 0.05  # s Luft nach dem hörbaren Ende eines Abschnitts
AUSKLANG = 2.8   # s Stille am Ende für den Hall


ALIGN_MODEL = "jonatasgrosman/wav2vec2-large-xlsr-53-german"  # Apache-2.0, auch kommerziell nutzbar


def align(y, sr, words):
    """Start und Ende jedes Wortes in Sekunden, plus mittlere Sicherheit je Wort.

    Forced Alignment: Das deutsche Spracherkennungsmodell liefert pro 20 ms die
    Wahrscheinlichkeit jedes Buchstabens, torchaudio legt den bekannten Text
    bestmöglich darauf. Genauer als die Zeitstempel einer freien Erkennung.
    """
    from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

    processor = Wav2Vec2Processor.from_pretrained(ALIGN_MODEL)
    model = Wav2Vec2ForCTC.from_pretrained(ALIGN_MODEL).eval()
    vocab = processor.tokenizer.get_vocab()
    audio = librosa.resample(y, orig_sr=sr, target_sr=16000)
    with torch.inference_mode():
        logits = model(processor(audio, sampling_rate=16000, return_tensors="pt").input_values).logits
    emission = torch.log_softmax(logits, dim=-1)

    # Zielfolge: Buchstaben der Wörter, getrennt durch das Wort-Trennzeichen "|"
    tokens, owner = [], []
    for i, w in enumerate(words):
        chars = [c for c in w.lower().replace("ẞ", "ß") if c in vocab and c != "|"]
        if not chars:
            raise SystemExit(f"Wort ohne aussprechbare Buchstaben: {w!r}")
        if tokens:
            tokens.append(vocab["|"])
            owner.append(None)
        tokens += [vocab[c] for c in chars]
        owner += [i] * len(chars)
    aligned, scores = torchaudio.functional.forced_align(
        emission, torch.tensor([tokens], dtype=torch.int32), blank=processor.tokenizer.pad_token_id)
    spans = torchaudio.functional.merge_tokens(aligned[0], scores[0].exp())

    sec_per_frame = len(audio) / emission.shape[1] / 16000
    out = [{"start": None, "ende": None, "scores": []} for _ in words]
    for span, i in zip(spans, owner):
        if i is None:
            continue
        o = out[i]
        o["start"] = span.start * sec_per_frame if o["start"] is None else o["start"]
        o["ende"] = span.end * sec_per_frame
        o["scores"].append(span.score)
    return [{"start": o["start"], "ende": o["ende"], "sicherheit": float(np.mean(o["scores"]))} for o in out]


def envelope_db(y, sr, ms=10):
    """Pegelverlauf (RMS über ms Millisekunden) je Sample."""
    n = max(1, int(sr * ms / 1000))
    return np.sqrt(np.convolve(y ** 2, np.ones(n) / n, mode="same"))


def cut_point(env, sr, t0, t1, ref):
    """Mitte der längsten Stille zwischen t0 und t1. Stille heißt hier: mehr als
    50 dB unter dem lautesten Moment. Der leiseste Einzelpunkt reicht nicht: Er läge
    z. B. im Verschluss vor dem "t" von "bittest", und das "t" landete beim nächsten Wort."""
    a, b = int(t0 * sr), int(t1 * sr)
    if b - a < int(0.03 * sr):
        return (t0 + t1) / 2
    quiet = np.append(env[a:b] < ref * 10 ** (-50 / 20), False)
    best, start = (0, 0), None
    for i, q in enumerate(quiet):
        if q and start is None:
            start = i
        elif not q and start is not None:
            best = max(best, (start, i), key=lambda r: r[1] - r[0])
            start = None
    if best[1] == best[0]:
        return (a + int(np.argmin(env[a:b]))) / sr
    return (a + (best[0] + best[1]) // 2) / sr


def audible_bounds(env, sr, t0, t1, first_start, last_end, ref):
    """Hörbarer Anfang und hörbares Ende eines Abschnitts zwischen den Schnittpunkten
    (höchstens 36 dB unter dem lautesten Moment, Atmer liegen darunter). Das Alignment
    markiert Wortenden etwas zu früh, ausklingende Laute wie das "s" in "Adams" gehören
    aber noch dazu."""
    a, b = int(t0 * sr), int(t1 * sr)
    above = np.where(env[a:b] > ref * 10 ** (-36 / 20))[0]
    if not len(above):
        return first_start, last_end
    return min((a + above[0]) / sr, first_start), max((a + above[-1]) / sr, last_end)


def fade(x, sr, ms=8):
    n = min(int(sr * ms / 1000), len(x) // 2)
    if n > 0:
        ramp = np.linspace(0, 1, n)
        x[:n] *= ramp
        x[-n:] *= ramp[::-1]
    return x


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--roh", help="andere Rohstimme statt stimme/roh.wav")
    ap.add_argument("--aus", help="nur Hörprobe hierhin schreiben (Projekt bleibt unverändert)")
    ap.add_argument("--tiefer", type=float, help="statt stimme.tiefer aus config.ts")
    ap.add_argument("--tempo", type=float, help="statt stimme.tempo aus config.ts")
    args = ap.parse_args()

    cfg = load_config()
    check_tafeln(cfg)
    st = dict(cfg["stimme"])
    if args.tiefer is not None:
        st["tiefer"] = args.tiefer
    if args.tempo is not None:
        st["tempo"] = args.tempo
    spoken = spoken_words(cfg)
    words = [w["wort"] for w in spoken]

    y, sr = sf.read(args.roh or ROH_WAV, dtype="float32")
    y = y.mean(axis=1) if y.ndim > 1 else y
    y = librosa.resample(y, orig_sr=sr, target_sr=SR) if sr != SR else y
    peak = np.max(np.abs(y))
    y = y / peak * 0.5 if peak > 0 else y

    al = align(y, SR, words)
    weak = [(words[i], round(a["sicherheit"], 2)) for i, a in enumerate(al) if a["sicherheit"] < 0.35]
    if weak:
        print(f"Hinweis: unsichere Wörter (anhören): {weak}")

    # ---------------------------------------------------------- Abschnitte neu zusammensetzen
    n_abschnitte = len(cfg["abschnitte"])
    idx = [[i for i, w in enumerate(spoken) if w["abschnitt"] == a] for a in range(n_abschnitte)]
    env = envelope_db(y, SR)
    ref = env.max()
    cuts = [0.0]
    for a in range(n_abschnitte - 1):
        cuts.append(cut_point(env, SR, al[idx[a][-1]]["ende"], al[idx[a + 1][0]]["start"], ref))
    cuts.append(len(y) / SR)

    # Jeder Abschnitt wird einzeln in Tempo und Tonhöhe angepasst (eigenes Tempo
    # möglich), dann mit exakt der eingestellten Pause zwischen den Wörtern verbunden.
    parts = [np.zeros(int(0.05 * SR), dtype=np.float32)]
    timings, t, tail = [], 0.05, 0.0
    for a, ab in enumerate(cfg["abschnitte"]):
        first, last = al[idx[a][0]], al[idx[a][-1]]
        hoer_start, hoer_ende = audible_bounds(env, SR, cuts[a], cuts[a + 1], first["start"], last["ende"], ref)
        s0 = max(cuts[a], hoer_start - VORLAUF)
        s1 = min(cuts[a + 1], hoer_ende + NACHLAUF)
        raw = fade(y[int(s0 * SR): int(s1 * SR)].copy(), SR)
        piece = pb.time_stretch(raw[None, :], SR, stretch_factor=st["tempo"] * ab.get("tempo", 1.0),
                                pitch_shift_in_semitones=-st["tiefer"], preserve_formants=True)[0]
        piece = fade(piece, SR) * (10 ** (-st["leiserUm"] / 20) if ab.get("leiser") else 1.0)
        scale = len(piece) / len(raw)
        # Pause = Stille zwischen hörbarem Ende und hörbarem Beginn
        head = (hoer_start - s0) * scale
        if a > 0:
            gap = max(0.0, cfg["abschnitte"][a - 1]["pauseDanach"] - tail - head)
            parts.append(np.zeros(int(gap * SR), dtype=np.float32))
            t += int(gap * SR) / SR
        for i in idx[a]:
            timings.append({"wort": words[i], "abschnitt": a,
                            "start": t + (al[i]["start"] - s0) * scale, "ende": t + (al[i]["ende"] - s0) * scale})
        parts.append(piece.astype(np.float32))
        t += len(piece) / SR
        tail = (s1 - hoer_ende) * scale

    # ---------------------------------------------------------- Klang
    voice = np.concatenate(parts + [np.zeros(int(AUSKLANG * SR), dtype=np.float32)])
    tone = pb.Pedalboard([
        # Warm, aber auf Handy-Lautsprechern verständlich: wenig Bass-Anhebung,
        # Mulm bei 350 Hz raus, Präsenz um 3 kHz und etwas Luft obenrum
        pb.HighpassFilter(cutoff_frequency_hz=75),
        pb.LowShelfFilter(cutoff_frequency_hz=160, gain_db=1.0),
        pb.PeakFilter(cutoff_frequency_hz=350, gain_db=-2.5, q=1.0),
        pb.PeakFilter(cutoff_frequency_hz=3000, gain_db=3.0, q=0.9),
        pb.HighShelfFilter(cutoff_frequency_hz=7000, gain_db=2.0),
        pb.Compressor(threshold_db=-24, ratio=3.0, attack_ms=8, release_ms=160),
    ])
    voice = tone(voice[None, :], SR)[0]
    stereo = np.stack([voice, voice])
    hall = pb.Pedalboard([
        pb.Delay(delay_seconds=0.028, feedback=0.0, mix=1.0),
        pb.Reverb(room_size=0.9, damping=0.45, wet_level=1.0, dry_level=0.0, width=1.0),
        pb.HighpassFilter(cutoff_frequency_hz=220),
        pb.LowpassFilter(cutoff_frequency_hz=6500),
    ])
    wet = hall(stereo, SR)
    mixed = stereo * (1 - 0.35 * st["hall"]) + wet * (0.9 * st["hall"])

    meter = pyloudnorm.Meter(SR)
    loud = meter.integrated_loudness(mixed.T)
    mixed *= 10 ** ((LUFS - loud) / 20)
    peak_db = 20 * np.log10(np.max(np.abs(mixed)))
    if peak_db > -1.0:
        mixed = pb.Limiter(threshold_db=-1.5, release_ms=80)(mixed.astype(np.float32), SR)

    if args.aus:
        sf.write(args.aus, mixed.T, SR, subtype="PCM_16")
        print(f"Hörprobe: {args.aus} ({mixed.shape[1] / SR:.1f} s), Projekt unverändert")
        return
    FERTIG_WAV.parent.mkdir(parents=True, exist_ok=True)
    sf.write(FERTIG_WAV, mixed.T, SR, subtype="PCM_16")

    corr = np.corrcoef(mixed[0], mixed[1])[0, 1]
    speech_end = timings[-1]["ende"]
    data = {
        "dauer": round(mixed.shape[1] / SR, 3),
        "sprechEnde": round(speech_end, 3),
        "woerter": [{**w, "start": round(w["start"], 3), "ende": round(w["ende"], 3)} for w in timings],
    }
    FERTIG_WOERTER.parent.mkdir(parents=True, exist_ok=True)
    FERTIG_WOERTER.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")

    print(f"Stimme: {FERTIG_WAV.relative_to(ROOT)} ({data['dauer']} s, gesprochen bis {speech_end:.2f} s)")
    print(f"Wort-Zeiten: {FERTIG_WOERTER.relative_to(ROOT)}")
    print(f"Lautheit {LUFS} LUFS, Stereo-Korrelation {corr:.2f} (1 = trocken, kleiner = mehr Hall)")
    for w in data["woerter"]:
        print(f"  {w['start']:6.2f}-{w['ende']:6.2f}  {w['wort']}")


if __name__ == "__main__":
    main()
