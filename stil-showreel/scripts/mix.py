"""Mischt die Geräusche aus dem earshot-Kit auf die Einsätze aus audio/cues.json.

Aufruf (mit dem Python von earshot, dort sind numpy, soundfile, pyloudnorm installiert):
    /opt/earshot/.venv/bin/python scripts/mix.py
Schreibt public/ton/mix.wav (48 kHz, Stereo, 24 Bit).

Ausrichtung je Rolle aus audio/kit/kit.lock.json: 'onset' legt den Beginn des Geräuschs auf den Frame,
'peak' den lautesten Moment (Whooshes, Riser), 'end' das Ende. Danach Lautheit auf -14 LUFS
(üblich für TikTok/Reels/Shorts), Spitzen über einen einfachen Limiter auf höchstens -1,5 dBFS.
Ab STILL_FROM ist Stille.
"""
import json
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import lfilter, resample_poly

ROOT = Path(__file__).resolve().parent.parent
TARGET_LUFS = -14.0
CEILING_DB = -3.5  # wahre Spitze (4-fach überabgetastet); AAC legt bei diesen harten Klicks bis zu 2,5 dB drauf

cues = json.loads((ROOT / 'audio/cues.json').read_text())
lock = json.loads((ROOT / 'audio/kit/kit.lock.json').read_text())
sr = lock['sr']
fps = cues['fps']
n = int(round(cues['duration_frames'] / fps * sr))
mix = np.zeros((n, 2))
used: dict[str, int] = {}
report = []

for ev in cues['events']:
    role = lock['roles'].get(ev['kind'])
    if role is None:
        raise SystemExit(f"Rolle fehlt im Kit: {ev['kind']}")
    k = used.get(ev['kind'], 0)
    used[ev['kind']] = k + 1
    take = role['takes'][k % len(role['takes'])]
    data, tsr = sf.read(ROOT / 'audio/kit' / take['file'], always_2d=True)
    assert tsr == sr
    if data.shape[1] == 1:
        data = np.repeat(data, 2, axis=1)
    sync = {'onset': take['onset_s'], 'peak': take['peak_s'], 'end': take['end_s']}[role['align']]
    start = int(round((ev['f'] / fps - sync) * sr))
    gain = 10 ** ((role['level_db'] + ev.get('gain_db', 0)) / 20)
    a, b = max(0, start), min(n, start + len(data))
    if b > a:
        mix[a:b] += data[a - start : b - start] * gain
    report.append((ev['f'], ev['kind'], take['file'], round(start / sr, 3)))

# Stille ab STILL_FROM (kurze Blende davor, damit nichts knackt)
still = int(round(cues['still_from'] / fps * sr))
fade = int(0.04 * sr)
mix[still - fade : still] *= np.linspace(1, 0, fade)[:, None]
mix[still:] = 0



def peaking(x: np.ndarray, f0: float, gain_db: float, q: float) -> np.ndarray:
    """Glockenfilter (RBJ-Kochbuch)."""
    a = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / sr
    al = np.sin(w) / (2 * q)
    b = np.array([1 + al * a, -2 * np.cos(w), 1 - al * a])
    aa = np.array([1 + al / a, -2 * np.cos(w), 1 - al / a])
    return lfilter(b / aa[0], aa / aa[0], x, axis=0)


# Mitten 1–4 kHz etwas zurück: viele Klicks und Pops liegen dort (earshot critique: −8,6 dB Anteil, Profis bis −10,5 dB)
mix = peaking(mix, 2200, -2.5, 0.7)

meter = pyln.Meter(sr)


def true_peak(x: np.ndarray) -> np.ndarray:
    """Spitze je Sample aus 4-facher Überabtastung (Inter-Sample-Spitzen)."""
    up = resample_poly(x, 4, 1, axis=0)
    return np.abs(up).reshape(len(x), 4, 2).max(axis=(1, 2))


def limit(x: np.ndarray, ceiling: float) -> np.ndarray:
    """Spitzenbegrenzer mit 3 ms Vorausschau und 60 ms Rückstellzeit."""
    peak = true_peak(x)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    look = int(0.003 * sr)
    # Vorausschau: Minimum über das kommende Fenster
    padded = np.concatenate([need, np.ones(look)])
    g = np.lib.stride_tricks.sliding_window_view(padded, look + 1).min(axis=1)[: len(need)]
    rel = np.exp(-1 / (0.06 * sr))
    out = np.empty_like(g)
    cur = 1.0
    for i, v in enumerate(g):
        cur = v if v < cur else v + (cur - v) * rel
        out[i] = cur
    return x * out[:, None]


ceiling = 10 ** (CEILING_DB / 20)
for _ in range(3):
    loud = meter.integrated_loudness(mix[:still])
    mix *= 10 ** ((TARGET_LUFS - loud) / 20)
    mix = limit(mix, ceiling)
loud = meter.integrated_loudness(mix[:still])

out = ROOT / 'public/ton/mix.wav'
out.parent.mkdir(parents=True, exist_ok=True)
sf.write(out, mix, sr, subtype='PCM_24')
print(f'{out.relative_to(ROOT)}: {len(report)} Einsätze, {loud:.1f} LUFS, wahre Spitze {20 * np.log10(true_peak(mix).max()):.1f} dBTP')
