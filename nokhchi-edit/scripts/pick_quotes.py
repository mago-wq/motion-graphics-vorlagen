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

TEXTS = {
    "pushkin": "Славный Бей-Булат, гроза Кавказа.",
    "baysangur": "Вот с ними поговорите вы о вашем деле. Они вас услышат скорее, нежели я.",
    "solzh": "Но была одна нация, которая совсем не поддалась психологии покорности. "
             "Не одиночки, не бунтари, а вся нация целиком. Это — чечены.",
    "grachev": "Грозный можно взять одним парашютно-десантным полком за два часа.",
}


def norm(t: str) -> str:
    return " ".join(re.sub(r"[^а-я ]", " ", t.lower().replace("ё", "е")).split())


def cer(a: str, b: str) -> float:
    a, b = norm(a), norm(b)
    d = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        prev, d[0] = d[0], i
        for j, cb in enumerate(b, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (ca != cb))
    return d[len(b)] / max(1, len(b))


def main():
    model = WhisperModel("medium", device="cpu", compute_type="int8")
    for name, text in TEXTS.items():
        best = None
        for f in sorted(Q.glob(f"{name}_take*.wav")):
            segs, _ = model.transcribe(str(f), language="ru", beam_size=5)
            heard = " ".join(s.text for s in segs)
            dur = sf.info(f).duration
            score = cer(text, heard)
            print(f"{f.name}: {dur:5.2f} s  Fehlerquote {score:.2f}  „{heard.strip()}“", flush=True)
            if best is None or score < best[0]:
                best = (score, f)
        if best:
            shutil.copy2(best[1], Q / f"{name}.wav")
            print(f"  → {name}.wav = {best[1].name}")


if __name__ == "__main__":
    main()
