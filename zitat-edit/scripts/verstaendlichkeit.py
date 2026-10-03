#!/usr/bin/env python3
"""Versteht man jedes Wort? Spracherkennung (Whisper) auf dem fertigen Mix.

Hört out/zitat-edit-ton.wav ab und vergleicht mit dem Text aus config.ts.
Fehlende oder falsch verstandene Wörter heißen meist: Regen, Vögel oder ein
Effekt liegen an dieser Stelle zu laut unter der Stimme (src/audio/cues.ts).
Aufruf: npm run check:sprache   (läuft in der Stimm-Umgebung)
"""
import sys

import librosa
import numpy as np
import soundfile as sf

from stimme_kostenlos import score_take
from zitat_config import ROOT, load_config, spoken_words

MIX = ROOT / "out" / "zitat-edit-ton.wav"


def main():
    if not MIX.exists():
        sys.exit("out/zitat-edit-ton.wav fehlt – erst npm run render")
    from faster_whisper import WhisperModel

    expected = [w["wort"] for w in spoken_words(load_config())]
    y, sr = sf.read(MIX, dtype="float32")
    y = librosa.resample(y.mean(axis=1) if y.ndim > 1 else y, orig_sr=sr, target_sr=16000)
    model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(y.astype(np.float32), language="de", word_timestamps=True, beam_size=5)
    words = [w for s in segs for w in s.words]
    score, errors, _ = score_take(expected, words)
    print("Gehört:", "".join(w.word for w in words).strip())
    if errors:
        print("Nicht sauber verstanden:", "; ".join(errors))
        sys.exit(1)
    print(f"Alle {len(expected)} Wörter verstanden.")


if __name__ == "__main__":
    main()
