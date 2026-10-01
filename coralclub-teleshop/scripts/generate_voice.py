#!/usr/bin/env python3
"""Erzeugt die Sprecherspur public/ton/sprecher.wav und src/sprecher.json.

Läuft NICHT im Node-Projekt, sondern in einer eigenen Python-Umgebung mit
Qwen3-TTS (Apache-2.0, läuft auf CPU) und faster-whisper. Einrichtung und
Aufruf stehen in der README ("Stimme neu erzeugen").

Ablauf
  1. Referenzstimme: eine mit dem VoiceDesign-Modell entworfene Aufnahme
     (public/ton/referenz.wav + Text in src/sprechertext.json). Sie legt die
     Klangfarbe fest, damit alle Sätze nach demselben Sprecher klingen.
  2. Pro Zeile mehrere Takes: per Klon (Base-Modell mit der Referenz) und per
     VoiceDesign (Klangfarbe + Regieanweisung der Zeile). Klon hält die Stimme
     stabil, Design bringt die Emotion der Zeile – erzeugt wird beides.
  3. Jeder Take wird gemessen statt angehört:
       - Whisper-Transkript gegen den Solltext (Zeichen-Ähnlichkeit),
       - Sprecher-Ähnlichkeit zur Mitte aller Klon-Takes (WavLM-Sprecherverifikation),
       - Natürlichkeit (UTMOS22, 1–5, erkennt gepresste/verzerrte Takes),
       - Tonhöhen-Spannweite (lebendig statt monoton),
       - Geschlecht und Stimmlage als Plausibilität.
     Der beste Take pro Zeile gewinnt (Formel in score()).
  4. Takes werden auf die Sprache zugeschnitten, auf gleiche Lautheit gebracht,
     mit den Pausen aus sprechertext.json aneinandergereiht und die Wort-
     zeitstempel (Whisper) global umgerechnet -> src/sprecher.json.

Aufruf (aus coralclub-teleshop/):
  python scripts/generate_voice.py --models ~/tts/models [--takes 3] [--nur hook,cta]
"""
import argparse
import gc
import json
import re
import time
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
TEXT = json.loads((ROOT / "src" / "sprechertext.json").read_text(encoding="utf-8"))
TAKES_DIR = ROOT / "out" / "takes"
OUT_WAV = ROOT / "public" / "ton" / "sprecher.wav"
OUT_JSON = ROOT / "src" / "sprecher.json"
SR_OUT = 44100
TARGET_LUFS = -16.0

# Klangfarbe des Sprechers. Gilt für jede Zeile im Design-Modus, die Regie-
# anweisung der Zeile kommt dahinter.
TIMBRE = TEXT["sprecher"]["klangfarbe"]


def log(*a):
    print(*a, flush=True)


# ---------------------------------------------------------------- Text-Vergleich

def norm_text(s):
    from num2words import num2words
    s = s.lower().replace("–", " ").replace("-", " ").replace("%", " prozent")
    s = s.replace("klub", "club")  # Whisper schreibt "Klubpreis"
    s = re.sub(r"\d+", lambda m: num2words(int(m.group()), lang="de"), s)
    s = s.replace("einhundert", "hundert")
    return re.sub(r"[^a-zäöüß]", "", s)


def text_match(expected, heard):
    return SequenceMatcher(None, norm_text(expected), norm_text(heard)).ratio()


def tokens(text):
    """Wörter des Solltexts, Satzzeichen bleiben dran (für die Anzeige)."""
    return [t for t in text.split() if re.search(r"\w", t)]


def align(text, heard_words):
    """Zeitstempel auf die Wörter des SOLLtexts übertragen.

    Whisper schreibt Zahlen als Ziffern ("120"), trennt Namen anders
    ("Oshin Min") oder fasst Wörter zusammen ("23,75"). Deshalb werden
    Soll- und Hör-Text zeichenweise (normalisiert) aufeinander abgebildet
    und jede Soll-Position in eine Zeit innerhalb des Hör-Worts umgerechnet.
    Ergebnis: ein Eintrag pro Soll-Wort mit Start/Ende in Sekunden.
    """
    exp = tokens(text)
    e_str, e_owner = "", []
    for i, t in enumerate(exp):
        n = norm_text(t)
        e_str += n
        e_owner += [i] * len(n)
    w_str, w_pos = "", []  # pro Zeichen: Zeitpunkt (linear im Wort verteilt)
    for w in heard_words:
        n = norm_text(w["w"])
        for k in range(len(n)):
            w_pos.append(w["s"] + (w["e"] - w["s"]) * k / max(len(n), 1))
            w_str += n[k]
        if n:
            w_pos[-1] = max(w_pos[-1], w["e"] - 1e-3)
    char_time = [None] * len(e_str)
    for a, b, size in SequenceMatcher(None, e_str, w_str, autojunk=False).get_matching_blocks():
        for k in range(size):
            char_time[a + k] = w_pos[b + k]
    out = []
    for i, t in enumerate(exp):
        idx = [k for k, o in enumerate(e_owner) if o == i and char_time[k] is not None]
        if idx:
            s, e = char_time[idx[0]], char_time[idx[-1]]
            out.append(dict(w=t, s=s, e=max(e, s + 0.05)))
        else:
            out.append(dict(w=t, s=None, e=None))
    # Lücken (kein Zeichen getroffen) zwischen den Nachbarn interpolieren
    for i, o in enumerate(out):
        if o["s"] is None:
            prev = next((out[j]["e"] for j in range(i - 1, -1, -1) if out[j]["e"] is not None), heard_words[0]["s"])
            nxt = next((out[j]["s"] for j in range(i + 1, len(out)) if out[j]["s"] is not None), heard_words[-1]["e"])
            o["s"], o["e"] = prev, max(nxt, prev + 0.05)
    return out


# ---------------------------------------------------------------- Messungen

def pitch_stats(y, sr):
    """Median-Tonhöhe und Streuung in Halbtönen (Praat-Autokorrelation)."""
    import parselmouth
    p = parselmouth.Sound(y.astype(np.float64), sampling_frequency=sr).to_pitch_ac(
        pitch_floor=65, pitch_ceiling=600, very_accurate=True)
    f0 = p.selected_array["frequency"]
    f0 = f0[f0 > 0]
    if len(f0) < 10:
        return 0.0, 0.0
    st = 12 * np.log2(f0 / np.median(f0))
    return float(np.median(f0)), float(np.std(st))


def trim(y, sr, pad=0.04):
    """Stille vorne/hinten weg (RMS-Schwelle), kleiner Rand bleibt."""
    hop = int(sr * 0.005)
    frames = np.lib.stride_tricks.sliding_window_view(np.pad(y, (0, hop * 4)), hop * 4)[::hop]
    rms = np.sqrt((frames ** 2).mean(1))
    on = np.where(rms > max(rms.max() * 0.025, 1e-4))[0]
    if not len(on):
        return y
    a = max(0, on[0] * hop - int(pad * sr))
    b = min(len(y), on[-1] * hop + hop * 4 + int(pad * sr))
    out = y[a:b].copy()
    n = int(0.008 * sr)
    out[:n] *= np.linspace(0, 1, n)
    out[-n:] *= np.linspace(1, 0, n)
    return out


def tempo(y, sr, factor):
    """Schneller sprechen ohne Tonhöhenänderung (ffmpeg atempo). Im Test kostete
    +8 % etwa 0,1–0,2 UTMOS-Punkte, Rubberband klang deutlich schlechter."""
    if abs(factor - 1.0) < 1e-3:
        return y
    import subprocess
    import soundfile as sf
    import io
    buf = io.BytesIO()
    sf.write(buf, y, sr, format="WAV", subtype="FLOAT")
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", "pipe:0", "-af", f"atempo={factor}", "-f", "wav", "-acodec", "pcm_f32le", "pipe:1"],
                         input=buf.getvalue(), capture_output=True, check=True).stdout
    z, _ = sf.read(io.BytesIO(out), dtype="float32")
    return z


def prepare(path, line):
    """Take laden, Stille abschneiden, Tempo anpassen. Messung und Zusammenbau
    nutzen genau diese Fassung, damit die Wortzeiten stimmen."""
    import soundfile as sf
    y, sr = sf.read(path, dtype="float32")
    y = trim(y, sr)
    return tempo(y, sr, line.get("tempo", TEXT["sprecher"].get("tempo", 1.0))), sr


def score(t):
    """Text muss stimmen (sonst raus), Stimme muss zur Referenz passen und
    natürlich klingen, danach zählt Lebendigkeit. Gewichte an den Probeläufen
    geeicht: Kandidaten über ~300 Hz klangen gepresst (UTMOS um 1,5–2,1).
    Der Tempo-Bonus (schnellster Take der Zeile) kommt in main() dazu."""
    if t["match"] < 0.9 or t["min_p"] < 0.25:
        return -1.0
    s = 3.0 * (t["match"] - 0.9) * 10                       # 0..3
    s += 4.0 * min(max(t["sim"] - 0.85, 0.0), 0.15) / 0.15     # 0..4
    if t["sim"] < 0.9:  # klingt nach einem anderen Sprecher
        s -= 3.0
    s += 2.0 * min(max(t["mos"] - 2.5, 0.0), 1.5) / 1.5       # 0..2
    s += 1.5 * min(t["sd_st"], 5.0) / 5.0                    # 0..1.5
    if t["f0"] > 300:
        s -= 2.0
    if t["male"] < 0.8:
        s -= 5.0
    return round(s, 3)


# ---------------------------------------------------------------- Hauptablauf

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", required=True, help="Ordner mit den Qwen3-TTS-Modellen")
    ap.add_argument("--takes", type=int, default=3, help="Takes pro Zeile und Modus")
    ap.add_argument("--nur", default="", help="nur diese Zeilen-IDs neu erzeugen (Komma-getrennt)")
    ap.add_argument("--modi", default="klon,design")
    ap.add_argument("--nur-zusammensetzen", action="store_true", help="vorhandene Takes neu bewerten und zusammensetzen")
    args = ap.parse_args()

    import soundfile as sf
    import torch
    from qwen_tts import Qwen3TTSModel

    torch.set_num_threads(4)
    models = Path(args.models).expanduser()
    TAKES_DIR.mkdir(parents=True, exist_ok=True)
    lines = TEXT["zeilen"]
    todo = [l for l in lines if not args.nur or l["id"] in args.nur.split(",")]
    modi = args.modi.split(",")
    ref_wav = ROOT / TEXT["sprecher"]["referenz"]
    ref_text = TEXT["sprecher"]["referenzText"]

    if not args.nur_zusammensetzen:
        # 1) Design-Takes
        if "design" in modi:
            m = Qwen3TTSModel.from_pretrained(str(models / "Qwen3-TTS-12Hz-1.7B-VoiceDesign"), device_map="cpu", dtype=torch.float32)
            for line in todo:
                for k in range(args.takes):
                    torch.manual_seed(100 + k)
                    t0 = time.time()
                    wavs, sr = m.generate_voice_design(text=line["text"], language="German",
                                                       instruct=f"{TIMBRE}{line['stil_zh']}")
                    sf.write(TAKES_DIR / f"{line['id']}__design{k}.wav", wavs[0], sr)
                    log(f"design {line['id']} #{k}: {len(wavs[0]) / sr:.2f}s in {time.time() - t0:.0f}s")
            del m
            gc.collect()
        # 2) Klon-Takes
        if "klon" in modi:
            m = Qwen3TTSModel.from_pretrained(str(models / "Qwen3-TTS-12Hz-1.7B-Base"), device_map="cpu", dtype=torch.float32)
            prompt = m.create_voice_clone_prompt(ref_audio=str(ref_wav), ref_text=ref_text)
            for line in todo:
                for k in range(args.takes):
                    torch.manual_seed(200 + k)
                    t0 = time.time()
                    wavs, sr = m.generate_voice_clone(text=line["text"], language="German", voice_clone_prompt=prompt)
                    sf.write(TAKES_DIR / f"{line['id']}__klon{k}.wav", wavs[0], sr)
                    log(f"klon {line['id']} #{k}: {len(wavs[0]) / sr:.2f}s in {time.time() - t0:.0f}s")
            del m
            gc.collect()

    # 3) Messen
    import librosa
    from faster_whisper import WhisperModel
    from transformers import pipeline

    # Sprecher-Ähnlichkeit mit WavLM (Sprecher-Verifikation). Der Sprecher-Encoder
    # von Qwen trennte nicht (alle Takes > 0,94); WavLM zeigte die Ausreißer klar.
    # Bezug ist die Mitte aller Klon-Takes = die Stimme, die das Video trägt.
    from transformers import AutoFeatureExtractor, WavLMForXVector
    sv_fe = AutoFeatureExtractor.from_pretrained("microsoft/wavlm-base-plus-sv")
    sv = WavLMForXVector.from_pretrained("microsoft/wavlm-base-plus-sv").eval()

    def embed(y, sr):
        y16 = librosa.resample(y, orig_sr=sr, target_sr=16000)
        with torch.no_grad():
            e = sv(**sv_fe(y16, sampling_rate=16000, return_tensors="pt")).embeddings[0]
        e = e.numpy()
        return e / np.linalg.norm(e)

    takes = {f.name: f for f in sorted(TAKES_DIR.glob("*__*.wav"))}
    line_of = {l["id"]: l for l in lines}
    emb = {name: embed(*prepare(f, line_of[name.split("__")[0]])) for name, f in takes.items() if name.split("__")[0] in line_of}
    klon = [e for name, e in emb.items() if "__klon" in name]
    ref_emb = np.mean(klon, axis=0) if klon else embed(*sf.read(ref_wav, dtype="float32"))
    ref_emb = ref_emb / np.linalg.norm(ref_emb)
    whisper = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
    from transformers import AutoModel
    utmos = AutoModel.from_pretrained("prj-beatrice/utmos22-torch-native", trust_remote_code=True).eval()
    gender = pipeline("audio-classification", model="prithivMLmods/Common-Voice-Gender-Detection", device="cpu")

    cache_file = TAKES_DIR / "messung-cache.json"
    cache = json.loads(cache_file.read_text()) if cache_file.exists() else {}
    results = {}
    for line in lines:
        cands = []
        for f in sorted(TAKES_DIR.glob(f"{line['id']}__*.wav")):
            key = f"{f.name}|{f.stat().st_mtime_ns}|{line.get('tempo', TEXT['sprecher'].get('tempo', 1.0))}|{line['text']}"
            if key in cache:
                t = cache[key]
                t["sim"] = round(float(emb[f.name] @ ref_emb), 3)
                t["score"] = score(t)
                cands.append(t)
                continue
            y, sr = prepare(f, line)
            segs, _ = whisper.transcribe(y if sr == 16000 else librosa.resample(y, orig_sr=sr, target_sr=16000),
                                         language="de", word_timestamps=True, beam_size=5)
            words = [dict(w=w.word.strip(), s=w.start, e=w.end, p=w.probability) for s in segs for w in s.words]
            heard = " ".join(w["w"] for w in words)
            f0, sd = pitch_stats(y, sr)
            g = {d["label"]: d["score"] for d in gender({"raw": librosa.resample(y, orig_sr=sr, target_sr=16000), "sampling_rate": 16000})}
            with torch.inference_mode():
                mos = float(utmos(torch.from_numpy(y), sampling_rate=sr).scores[0])
            t = dict(file=f.name, dur=round(len(y) / sr, 2), heard=heard, match=round(text_match(line["text"], heard), 3), mos=round(mos, 2),
                     min_p=round(min((w["p"] for w in words), default=0), 2), sim=round(float(emb[f.name] @ ref_emb), 3),
                     f0=round(f0, 1), sd_st=round(sd, 2), male=round(g.get("male", 0), 3), words=words)
            t["score"] = score(t)
            cache[key] = t
            cands.append(t)
            log(f"  {f.name:28s} {t['dur']:5.2f}s match {t['match']:.3f} p {t['min_p']:.2f} sim {t['sim']:.3f} "
                f"MOS {t['mos']:.2f} F0 {t['f0']:5.1f} sd {t['sd_st']:.2f} male {t['male']:.2f} -> {t['score']:6.2f} | {heard}")
        if not cands:
            raise SystemExit(f"Keine Takes für {line['id']}")
        # Tempo-Bonus: Werbesprecher sind schnell. Bis +2 Punkte für den schnellsten
        # gültigen Take der Zeile, 0 ab 25 % langsamer.
        fastest = min(c["dur"] for c in cands if c["score"] >= 0) if any(c["score"] >= 0 for c in cands) else 0
        for c in cands:
            if c["score"] >= 0 and fastest:
                c["score"] = round(c["score"] + 2.0 * min(max((fastest / c["dur"] - 0.75) / 0.25, 0.0), 1.0), 3)
        for c in cands:
            log(f"  {c['file']:28s} {c['dur']:5.2f}s match {c['match']:.3f} sim {c['sim']:.3f} MOS {c['mos']:.2f} F0 {c['f0']:5.1f} sd {c['sd_st']:.2f} -> {c['score']:6.2f}")
        wahl = line.get("take")
        best = next((c for c in cands if c["file"] == wahl), None) if wahl else max(cands, key=lambda c: c["score"])
        if best["score"] < 0:
            log(f"WARNUNG {line['id']}: kein Take besteht die Textprüfung, nehme {best['file']}")
        results[line["id"]] = best
        log(f"=> {line['id']}: {best['file']}")
    cache_file.write_text(json.dumps(cache, ensure_ascii=False, default=float), encoding="utf-8")

    # 4) Zusammensetzen
    import pyloudnorm as pyln
    meter = pyln.Meter(SR_OUT)
    track, out_lines, t = [], [], 0.0
    for line in lines:
        best = results[line["id"]]
        y, sr = prepare(TAKES_DIR / best["file"], line)
        y = librosa.resample(y, orig_sr=sr, target_sr=SR_OUT)
        y = pyln.normalize.loudness(y, meter.integrated_loudness(y), TARGET_LUFS)
        # Whisper-Zeiten stammen aus dem getrimmten Take -> gleiche Zeitachse;
        # auf die Soll-Wörter umgerechnet, damit Bild und Musik nach Namen suchen können
        words = [dict(w=w["w"], s=round(t + w["s"], 3), e=round(t + w["e"], 3)) for w in align(line["text"], best["words"])]
        out_lines.append(dict(id=line["id"], text=line["text"], start=round(t, 3), ende=round(t + len(y) / SR_OUT, 3),
                              take=best["file"], woerter=words))
        track.append(y)
        t += len(y) / SR_OUT
        gap = np.zeros(int(line["pause"] * SR_OUT), dtype=np.float32)
        track.append(gap)
        t += len(gap) / SR_OUT
    voice = np.concatenate(track)
    peak = np.max(np.abs(voice))
    if peak > 0.89:  # -1 dBFS, sanfte Begrenzung statt Clipping
        voice = np.tanh(voice / 0.89 * 1.2) / np.tanh(1.2) * 0.89
    OUT_WAV.parent.mkdir(parents=True, exist_ok=True)
    sf.write(OUT_WAV, voice, SR_OUT, subtype="PCM_16")
    OUT_JSON.write_text(json.dumps(dict(_hinweis="Erzeugt von scripts/generate_voice.py – nicht von Hand ändern.",
                                        dauer=round(len(voice) / SR_OUT, 3), zeilen=out_lines), ensure_ascii=False, indent=1) + "\n",
                        encoding="utf-8")
    (ROOT / "out" / "takes" / "bewertung.json").write_text(json.dumps(results, ensure_ascii=False, indent=1, default=float), encoding="utf-8")
    log(f"Fertig: {OUT_WAV.relative_to(ROOT)} ({len(voice) / SR_OUT:.2f} s) und {OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
