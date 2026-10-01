#!/usr/bin/env python3
"""Mastering der Tonspur (numpy + scipy): auf ca. -14 LUFS anheben und Spitzen
bei -1 dBFS begrenzen (Limiter mit 5 ms Vorschau, 80 ms Release).

Warum hier und nicht in Remotion: Remotion summiert Sprecher, Musik und
Effekte und schreibt 16-bit-PCM. Damit dabei nichts clippt, mischt
SoundTrack.tsx mit Reserve (MIX_GAIN); erst hier wird die Lautheit auf das
Niveau gebracht, das TikTok/Reels erwarten. Remotions eingebautes ffmpeg ist
abgespeckt, deshalb kein loudnorm/alimiter, sondern dieser kleine Limiter.

Aufruf: python3 scripts/master.py ein.wav aus.wav
"""
import sys
import wave

import numpy as np
from scipy.ndimage import minimum_filter1d
from scipy.signal import lfilter

TARGET_LUFS = -14.0
CEILING = 10 ** (-1.0 / 20)


def read(path):
    with wave.open(path) as w:
        sr, ch = w.getframerate(), w.getnchannels()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").reshape(-1, ch).astype(float) / 32768
    return x, sr


def write(path, x, sr):
    pcm = np.clip(np.round(x * 32767), -32768, 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(x.shape[1])
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def lufs(x, sr):
    """Integrierte Lautheit nach ITU-R BS.1770 (K-Filter für 44,1/48 kHz, Gating)."""
    b0 = [1.53512485958697, -2.69169618940638, 1.19839281085285]
    a0 = [1.0, -1.69065929318241, 0.73248077421585]
    b1 = [1.0, -2.0, 1.0]
    a1 = [1.0, -1.99004745483398, 0.99007225036621]
    y = lfilter(b1, a1, lfilter(b0, a0, x, axis=0), axis=0)
    blk, hop = int(0.4 * sr), int(0.1 * sr)
    ms = np.array([np.mean(y[i:i + blk] ** 2, axis=0).sum() for i in range(0, len(y) - blk, hop)])
    lk = -0.691 + 10 * np.log10(ms + 1e-12)
    g = ms[lk > -70]
    rel = -0.691 + 10 * np.log10(g.mean()) - 10
    return -0.691 + 10 * np.log10(ms[(lk > -70) & (lk > rel)].mean())


def limit(x, sr):
    peak = np.max(np.abs(x), axis=1)
    need = np.minimum(1.0, CEILING / np.maximum(peak, 1e-9))
    look = int(0.005 * sr)
    need = minimum_filter1d(need, size=2 * look + 1)  # früh genug runter
    rel = np.exp(-1 / (0.08 * sr))
    g = np.empty_like(need)
    cur = 1.0
    for i, v in enumerate(need):
        cur = v if v < cur else rel * cur + (1 - rel) * v
        g[i] = cur
    return x * g[:, None]


def main():
    src, dst = sys.argv[1], sys.argv[2]
    x, sr = read(src)
    before = lufs(x, sr)
    # Zweimal: der Limiter nimmt etwas Lautheit weg, der zweite Durchgang gleicht aus
    for _ in range(2):
        x = limit(x * 10 ** ((TARGET_LUFS - lufs(x, sr)) / 20), sr)
    write(dst, x, sr)
    print(f"Mastering: {before:.1f} -> {lufs(x, sr):.1f} LUFS, Spitze {20 * np.log10(np.max(np.abs(x))):.2f} dBFS")


if __name__ == "__main__":
    main()
