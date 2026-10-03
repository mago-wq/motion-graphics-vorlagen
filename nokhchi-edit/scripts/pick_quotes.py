#!/usr/bin/env python3
"""Wählt pro Zitat den verständlichsten Take (Whisper, russisch) und kopiert ihn nach
assets-src/quotes/<name>.wav – daraus baut scripts/build_audio.py die Fassung „mit Zitaten“."""
import re
import shutil
from pathlib import Path

import soundfile as sf
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
Q = ROOT / "assets-src" / "quotes"



# Wortlaute aus make_quotes.py (eine Quelle der Wahrheit)
_src = Path(__file__).with_name("make_quotes.py").read_text()
_ns: dict = {}
exec(_src[_src.index("QUOTES = {"):_src.index("# Synthetische Referenzstimmen")], _ns)
TEXTS = _ns["QUOTES"]


def norm(t: str) -> str:
    t = t.lower().replace("ё", "е")
    return " ".join(re.sub(r"[^а-яa-zäöüß ]", " ", t).split())


def cer(a: str, b: str) -> float:
    a, b = norm(a), norm(b)
    d = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        prev, d[0] = d[0], i
        for j, cb in enumerate(b, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (ca != cb))
    return d[len(b)] / max(1, len(b))


def main(langs):
    model = WhisperModel("medium", device="cpu", compute_type="int8")
    for lang in langs:
        for name, text in TEXTS[lang].items():
            best = None
            for f in sorted(Q.glob(f"{name}_{lang}_take*.wav")):
                segs, _ = model.transcribe(str(f), language=lang, beam_size=5)
                heard = " ".join(seg.text for seg in segs)
                dur = sf.info(f).duration
                score = cer(text, heard)
                print(f"{f.name}: {dur:5.2f} s  Fehlerquote {score:.2f}  „{heard.strip()}“", flush=True)
                if best is None or score < best[0]:
                    best = (score, f)
            if best:
                shutil.copy2(best[1], Q / f"{name}_{lang}.wav")
                print(f"  → {name}_{lang}.wav = {best[1].name}")


if __name__ == "__main__":
    import sys
    main(sys.argv[1:] or ["ru", "de"])
