#!/usr/bin/env python3
"""Bringt die fertige Tonspur auf -14 LUFS und begrenzt Spitzen auf -2 dBFS.

Aufruf: python3 scripts/lautheit.py ein.wav aus.wav   (braucht numpy, scipy, soundfile, pyloudnorm)
Wird von scripts/render.sh aufgerufen.
"""
import sys

import numpy as np
import pyloudnorm
import soundfile as sf
from scipy.ndimage import minimum_filter1d
from scipy.signal import lfilter

ZIEL_LUFS = -14.0
DECKE_DB = -2.0


def limiter(x, sr, ceiling_db=DECKE_DB, lookahead_ms=4.0, release_ms=90.0):
    """Einfacher Spitzenbegrenzer mit Vorausschau: senkt die Lautstärke kurz vor einer
    Spitze ab und lässt sie danach weich wieder los."""
    ceiling = 10 ** (ceiling_db / 20)
    peak = np.max(np.abs(x), axis=1)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    la = int(sr * lookahead_ms / 1000)
    gain = minimum_filter1d(need, size=2 * la + 1, mode="nearest")
    # Loslassen: Glättung nur nach oben (Absenken sofort, Erholen über release_ms)
    a = np.exp(-1 / (sr * release_ms / 1000))
    smooth = lfilter([1 - a], [1, -a], gain, zi=[gain[0] * a])[0]
    gain = np.minimum(gain, smooth)
    return x * gain[:, None], 20 * np.log10(np.min(gain))


def main():
    src, dst = sys.argv[1], sys.argv[2]
    x, sr = sf.read(src, dtype="float64", always_2d=True)
    meter = pyloudnorm.Meter(sr)
    before = meter.integrated_loudness(x)
    x = x * 10 ** ((ZIEL_LUFS - before) / 20)
    x, reduction = limiter(x, sr)
    after = meter.integrated_loudness(x)
    sf.write(dst, x, sr, subtype="PCM_16")
    peak = 20 * np.log10(np.max(np.abs(x)))
    print(f"Lautheit {before:.1f} -> {after:.1f} LUFS, Spitze {peak:.1f} dBFS, Begrenzer max. {reduction:.1f} dB")


if __name__ == "__main__":
    main()
