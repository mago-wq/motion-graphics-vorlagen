#!/usr/bin/env python3
"""Erzeugt public/regen.wav: Regen an der Scheibe, 15 s, Stereo, 44,1 kHz.

Warum selbst erzeugt statt aus einer Bibliothek: keine Lizenzfrage, und der
Ton ist exakt so lang wie das Video und *kreisförmig* gebaut. Rauschen wird im
Frequenzraum über genau die Videolänge erzeugt, Tropfen am Ende laufen über den
Anfang weiter. Deshalb gibt es im TikTok-Loop keinen Knack und keinen Sprung.

Schichten:
  1. Regenrauschen (Zischen, Schwerpunkt 1-6 kHz)
  2. ferner Regen / Stadt (tiefes Rauschen unter 300 Hz)
  3. einzelne Tropfen auf Glas (kurze, gedämpfte Klicks, zufällig verteilt)

Lautheit absichtlich niedrig (ca. -24 LUFS): Das ist nur das Bett unter der
Rezitation (public/rezitation, siehe README).
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
SECONDS = 15.0
N = int(SR * SECONDS)
rng = np.random.default_rng(94)  # fester Seed: jedes Rendern klingt gleich


def shaped_noise(lo_hz: float, hi_hz: float, tilt: float) -> np.ndarray:
    """Kreisförmiges Rauschen mit Bandpass und Neigung (tilt<0 = dunkler)."""
    spec = rng.normal(size=N // 2 + 1) + 1j * rng.normal(size=N // 2 + 1)
    f = np.fft.rfftfreq(N, 1 / SR)
    f[0] = 1
    gain = (f / 1000.0) ** tilt
    # weiche Flanken statt harter Kanten
    gain *= 1 / (1 + (lo_hz / f) ** 4)
    gain *= 1 / (1 + (f / hi_hz) ** 4)
    sig = np.fft.irfft(spec * gain, n=N)
    return sig / np.max(np.abs(sig))


def drops(count: int, pan_spread: float) -> np.ndarray:
    out = np.zeros((2, N))
    length = int(0.05 * SR)
    t = np.arange(length) / SR
    for _ in range(count):
        start = rng.integers(0, N)
        freq = rng.uniform(1800, 4200)
        decay = rng.uniform(70, 160)
        amp = rng.uniform(0.15, 1.0) ** 2
        click = np.sin(2 * np.pi * freq * t) * np.exp(-decay * t) * amp
        click[: int(0.0015 * SR)] *= np.linspace(0, 1, int(0.0015 * SR))
        pan = np.clip(0.5 + rng.normal(0, pan_spread), 0, 1)
        idx = (start + np.arange(length)) % N  # über das Ende hinaus = Anfang
        out[0, idx] += click * np.sqrt(1 - pan)
        out[1, idx] += click * np.sqrt(pan)
    return out


hiss = np.stack([shaped_noise(900, 7000, -0.4), shaped_noise(900, 7000, -0.4)])
low = np.stack([shaped_noise(40, 300, -1.0), shaped_noise(40, 300, -1.0)])
# Regen ist nicht gleichmäßig: langsames Atmen der Lautstärke, auch kreisförmig
breath = 1 + 0.18 * np.sin(2 * np.pi * 2 * np.arange(N) / N) + 0.08 * np.sin(
    2 * np.pi * 5 * np.arange(N) / N + 1.3
)
mix = 0.55 * hiss * breath + 0.5 * low + 0.22 * drops(260, 0.22)

# auf ca. -24 LUFS bringen (RMS-Näherung genügt für ein Rauschbett)
rms = np.sqrt(np.mean(mix**2))
mix *= 10 ** (-28 / 20) / rms
peak = np.max(np.abs(mix))
if peak > 0.89:
    mix *= 0.89 / peak

pcm = (mix.T * 32767).astype(np.int16)
target = Path(__file__).resolve().parent.parent / "public" / "regen.wav"
with wave.open(str(target), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"geschrieben: {target}")
