#!/usr/bin/env python3
"""Kostenlose deutsche Stimme, lokal auf der CPU erzeugt -> stimme/roh.wav

Modell: Chatterbox Multilingual (Resemble AI, MIT-Lizenz).
Klangvorlage: Thorsten-Voice (Thorsten Müller, CC0). Thorsten hat seine Stimme
ausdrücklich für freie Sprachsynthese aufgenommen und freigegeben. Die
Vorlage liegt als stimme/referenz.flac bei. Fehlt sie, wird sie aus dem
Datensatz neu zusammengesetzt (zwei neutrale Sätze, siehe REFERENZ_IDS).

Ablauf: Der ganze Text wird mehrmals am Stück gesprochen (kurze Stücke
einzeln erzeugen führt bei diesem Modell zu angehängtem Kauderwelsch).
Jeder Versuch wird per Spracherkennung (Whisper) gegen den Text geprüft.
Der beste Versuch wird nach dem letzten Wort abgeschnitten und als
stimme/roh.wav gespeichert. Alle Versuche liegen in stimme/versuche/.

Danach: python scripts/stimme_bearbeiten.py (Pausen, Klang, Hall, Wort-Zeiten).
Beides zusammen: npm run stimme

Aufruf: ~/.venvs/tts/bin/python scripts/stimme_kostenlos.py [--versuche 4]
        ... --auswahl 3   nimmt Versuch 3 aus stimme/versuche/, ohne neu zu erzeugen
                          (zum Beispiel, wenn er beim Anhören am besten klingt)
"""
import argparse
import difflib
import io
import json
import time

import numpy as np
import soundfile as sf

from zitat_config import ROH_WAV, STIMME_DIR, check_tafeln, full_text, load_config, norm, spoken_words

REFERENZ = STIMME_DIR / "referenz.flac"
REFERENZ_QUELLE = "datasets/Thorsten-Voice/TV-44kHz-Full/TV-2022.10-Neutral/train-00000-of-00008.parquet"
REFERENZ_IDS = [
    "dd01c488-10f3-a683-00cf-4d215f4d9b19---d1b3400ade45bdef42a86ebc61759baf",
    "dd01c488-10f3-a683-00cf-4d215f4d9b19---63122a3fc97c5a9baf868942a73a4d1a",
]

# Ruhig, nicht übertrieben: wenig "exaggeration", niedriges cfg = gemächlicheres Tempo
TTS = {"exaggeration": 0.45, "cfg_weight": 0.35, "temperature": 0.7}


def build_reference():
    import librosa
    import pyarrow.parquet as pq
    from huggingface_hub import HfFileSystem

    pf = pq.ParquetFile(HfFileSystem().open(REFERENZ_QUELLE, "rb", block_size=4 * 1024 * 1024))
    rows = {}
    for g in range(pf.num_row_groups):
        for r in pf.read_row_group(g, columns=["id", "audio"]).to_pylist():
            if r["id"] in REFERENZ_IDS:
                rows[r["id"]] = r["audio"]["bytes"]
        if len(rows) == len(REFERENZ_IDS):
            break
    parts = []
    for rid in REFERENZ_IDS:
        y, sr = sf.read(io.BytesIO(rows[rid]))
        y = y.mean(axis=1) if y.ndim > 1 else y
        parts += [librosa.effects.trim(y, top_db=35)[0], np.zeros(int(0.35 * sr))]
    sf.write(REFERENZ, np.concatenate(parts), sr)
    print(f"Klangvorlage erstellt: {REFERENZ.relative_to(STIMME_DIR.parent)}")


def score_take(expected, recognized):
    """Vergleicht erkannte mit erwarteten Wörtern. Höher ist besser.
    Gibt auch das Ende des letzten erwarteten Wortes zurück (dort wird abgeschnitten)."""
    exp = [norm(w) for w in expected]
    rec = [norm(w.word) for w in recognized]
    sm = difflib.SequenceMatcher(a=exp, b=rec, autojunk=False)
    score, errors, last_end = 0.0, [], None
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op == "equal":
            score += a1 - a0
            last_end = recognized[b1 - 1].end
        elif op == "replace":
            for i, j in zip(range(a0, a1), range(b0, b1)):
                if difflib.SequenceMatcher(a=exp[i], b=rec[j]).ratio() >= 0.75:
                    score += 0.7
                else:
                    score -= 1
                    errors.append(f"{expected[i]} -> {recognized[j].word.strip()}")
                last_end = recognized[j].end
            score -= abs((a1 - a0) - (b1 - b0))
        elif op == "delete":
            score -= a1 - a0
            errors += [f"fehlt: {w}" for w in expected[a0:a1]]
        elif op == "insert":
            trailing = a0 == len(exp)
            # Angehängtes nach dem letzten Wort wird abgeschnitten, zählt weniger
            score -= 0.3 * (b1 - b0) if trailing else (b1 - b0)
            errors += [f"{'angehängt' if trailing else 'zusätzlich'}: {w.word.strip()}" for w in recognized[b0:b1]]
    return score, errors, last_end


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--versuche", type=int, default=4)
    ap.add_argument("--auswahl", type=int, help="vorhandenen Versuch nehmen statt neu zu erzeugen")
    args = ap.parse_args()
    out_dir = STIMME_DIR / "versuche"
    if args.auswahl:
        results = json.loads((out_dir / "bericht.json").read_text())
        return save([r for r in results if r["versuch"] == args.auswahl][0], out_dir, len(results[0]["gehoert"].split()))

    cfg = load_config()
    check_tafeln(cfg)
    text = full_text(cfg)
    expected = [w["wort"] for w in spoken_words(cfg)]

    if not REFERENZ.exists():
        build_reference()

    import torch
    import torchaudio
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    from faster_whisper import WhisperModel

    model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
    whisper = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Text: {text}")
    results = []
    for seed in range(1, args.versuche + 1):
        t0 = time.time()
        torch.manual_seed(seed)
        wav = model.generate(text, language_id="de", audio_prompt_path=str(REFERENZ), **TTS)
        path = out_dir / f"versuch-{seed}.wav"
        torchaudio.save(str(path), wav, model.sr)
        y, sr = sf.read(path)
        segs, _ = whisper.transcribe(y.astype(np.float32) if sr == 16000 else _to16k(y, sr), language="de", word_timestamps=True, beam_size=5)
        words = [w for s in segs for w in s.words]
        score, errors, last_end = score_take(expected, words)
        heard = "".join(w.word for w in words).strip()
        results.append({"versuch": seed, "punkte": round(score, 2), "fehler": errors, "gehoert": heard,
                        "ende_letztes_wort": last_end, "datei": path.name, "dauer": round(len(y) / sr, 2)})
        print(f"Versuch {seed}: {score:5.1f} Punkte, {len(y) / sr:4.1f} s, {time.time() - t0:3.0f} s Rechenzeit"
              + (f" | {'; '.join(errors)}" if errors else " | fehlerfrei"), flush=True)

    (out_dir / "bericht.json").write_text(json.dumps(results, ensure_ascii=False, indent=2))
    # Bei Gleichstand der ruhigste Versuch (letztes Wort am spätesten = langsamstes Tempo)
    best = max(results, key=lambda r: (r["punkte"], r["ende_letztes_wort"] or 0))
    save(best, out_dir, len(expected))


def save(best, out_dir, n_words):
    y, sr = sf.read(out_dir / best["datei"])
    if best["ende_letztes_wort"] is not None:
        y = y[: int((best["ende_letztes_wort"] + 0.35) * sr)]
    sf.write(ROH_WAV, y, sr)
    print(f"\nGewählt: Versuch {best['versuch']} ({best['punkte']} von {n_words} Punkten)")
    print(f"Gehört: {best['gehoert']}")
    if best["fehler"]:
        print(f"Achtung: {'; '.join(best['fehler'])} -> anhören, ggf. mit mehr --versuche neu erzeugen")
    print(f"Gespeichert: {ROH_WAV.relative_to(STIMME_DIR.parent)}")


def _to16k(y, sr):
    import librosa

    return librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=16000)


if __name__ == "__main__":
    main()
