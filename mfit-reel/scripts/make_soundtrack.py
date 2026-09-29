#!/usr/bin/env python3
"""Soundtrack des MFit-Reels: eigene Musik + Sounddesign, komplett synthetisiert.

Kein Sample, keine fremde Aufnahme: alles entsteht hier aus Oszillatoren,
gefiltertem Rauschen und FM-Synthese (geseedet, also bei jedem Lauf identisch).
Damit gehören Musik und Effekte vollständig zum Video, es gibt keine Lizenz- und
keine Content-ID-Frage bei Instagram.

Stil: Trap/Phonk-Beat, 150 BPM (Halftime-Groove), a-Moll, 808-Bass, Phonk-Cowbell.
Zeitpunkte liest das Skript aus src/timeline.json, derselben Datei, aus der die
Animationen ihre Frames berechnen. Jeder Effekt sitzt auf dem Frame seiner Animation.

Ausgabe:
  public/audio/mfit-soundtrack.wav   fertige Mischung (48 kHz, 16 Bit, Stereo)
  out/stems/musik.wav, out/stems/effekte.wav   Stems ohne Mastering (für Kunden/Nachbearbeitung)

Aufruf: python3 scripts/make_soundtrack.py   (braucht numpy, scipy, pyloudnorm)
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
from scipy import signal
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / 'src' / 'timeline.json').read_text(encoding='utf-8'))

SR = 48000
BPM = TL['bpm']
BEAT = 60.0 / BPM                      # 0,4 s
STEP = BEAT / 4                        # Sechzehntel
TOTAL = TL['totalBeats'] * BEAT        # 35,2 s
N = int(round(TOTAL * SR))
FPS = TL['fps']
rng = np.random.default_rng(2026)

# Lautheit der fertigen Mischung (integriert) und Obergrenze True Peak
TARGET_LUFS = -12.5
# Reserve für die AAC-Kodierung: Transienten (Clap, Klicks) schwingen dort bis ~1,5 dB über
CEILING_DBTP = -2.2


def sec(beat: float) -> float:
    return beat * BEAT


def frames_to_sec(frames: float) -> float:
    return frames / FPS


# ---------------------------------------------------------------- Grundbausteine

def tvec(dur: float) -> np.ndarray:
    return np.arange(int(round(dur * SR))) / SR


def midi_hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def noise(n: int) -> np.ndarray:
    return rng.standard_normal(n)


def sos(kind: str, freq, order: int = 2):
    nyq = SR / 2
    if isinstance(freq, (list, tuple)):
        wn = [min(f / nyq, 0.999) for f in freq]
    else:
        wn = min(freq / nyq, 0.999)
    return signal.butter(order, wn, btype=kind, output='sos')


def filt(x: np.ndarray, kind: str, freq, order: int = 2) -> np.ndarray:
    return signal.sosfilt(sos(kind, freq, order), x)


def sweep(x: np.ndarray, kind: str, f_start, f_end, curve: float = 1.0, block: int = 256) -> np.ndarray:
    """Zeitvariabler Filter (blockweise), Grenzfrequenz exponentiell von f_start nach f_end."""
    out = np.zeros_like(x)
    n = len(x)
    zi = None
    for i in range(0, n, block):
        p = (i / max(1, n - 1)) ** curve
        if isinstance(f_start, (list, tuple)):
            f = [a * (b / a) ** p for a, b in zip(f_start, f_end)]
        else:
            f = f_start * (f_end / f_start) ** p
        s = sos(kind, f)
        if zi is None:
            zi = np.zeros((s.shape[0], 2))
        out[i:i + block], zi = signal.sosfilt(s, x[i:i + block], zi=zi)
    return out


def env_exp(n: int, tau: float, attack: float = 0.001) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-6), 0, 1)
    return a * np.exp(-t / tau)


def fade_tail(x: np.ndarray, dur: float = 0.01) -> np.ndarray:
    k = min(len(x), int(dur * SR))
    if k > 0:
        x = x.copy()
        x[-k:] *= np.linspace(1, 0, k)
    return x


def polyblep(ph: np.ndarray, dt: np.ndarray) -> np.ndarray:
    out = np.zeros_like(ph)
    m = ph < dt
    x = ph[m] / dt[m]
    out[m] = x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    out[m] = x * x + x + x + 1
    return out


def saw(freq: np.ndarray | float, n: int, phase0: float = 0.0) -> np.ndarray:
    f = np.full(n, freq) if np.isscalar(freq) else freq
    dt = f / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    return 2 * ph - 1 - polyblep(ph, dt)


def square(freq: float, n: int) -> np.ndarray:
    dt = np.full(n, freq / SR)
    ph = np.cumsum(dt) % 1.0
    sq = np.where(ph < 0.5, 1.0, -1.0)
    sq += polyblep(ph, dt)
    sq -= polyblep((ph + 0.5) % 1.0, dt)
    return sq


def sine_sweep(f: np.ndarray) -> np.ndarray:
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


class Bus:
    """Stereo-Spur. Signale werden an Zeitpunkten (Sekunden) eingemischt."""

    def __init__(self, name: str):
        self.name = name
        self.x = np.zeros((2, N))

    def add(self, sig: np.ndarray, at: float, gain: float = 1.0, pan: float = 0.0, align_end: bool = False):
        if sig.ndim == 1:
            angle = (pan + 1) * np.pi / 4
            st = np.vstack([sig * np.cos(angle), sig * np.sin(angle)]) * np.sqrt(2)
        else:
            st = sig
        st = st * gain
        start = int(round(at * SR)) - (st.shape[1] if align_end else 0)
        a, b = max(0, start), min(N, start + st.shape[1])
        if b > a:
            self.x[:, a:b] += st[:, a - start:b - start]


# ---------------------------------------------------------------- Instrumente

def kick(vel: float = 1.0) -> np.ndarray:
    t = tvec(0.42)
    f = 50 + 115 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(len(t), 0.14, 0.0008)
    click = filt(noise(len(t)), 'highpass', 2500) * env_exp(len(t), 0.0025, 0.0006) * 0.45
    return np.tanh(1.8 * (body + click)) * 0.8 * vel


def bass808(freq: float, dur: float, vel: float = 1.0, glide_to: float | None = None) -> np.ndarray:
    t = tvec(dur + 0.04)
    f = freq * (1 + 0.35 * np.exp(-t / 0.018))
    if glide_to is not None:
        g = np.clip((t - (dur - 0.09)) / 0.08, 0, 1)
        f = f * (glide_to / freq) ** (g * g * (3 - 2 * g))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    amp = np.clip(t / 0.004, 0, 1) * np.exp(-t / 1.6)
    rel = np.clip((dur + 0.04 - t) / 0.04, 0, 1)
    # Sättigung: Obertöne, damit der Bass auch auf Handy-Lautsprechern hörbar ist
    y = (np.tanh(3.2 * s) * 0.55 + s * 0.45) * amp * rel
    growl = filt(np.tanh(9 * s) * amp * rel, 'highpass', 140)
    return filt(y + growl * 0.55, 'lowpass', 2200) * vel


def clap(vel: float = 1.0) -> np.ndarray:
    t = tvec(0.5)
    n = len(t)
    nz = noise(n)
    burst = np.zeros(n)
    for k, off in enumerate([0.0, 0.009, 0.018, 0.028]):
        i = int(off * SR)
        tt = np.arange(n - i) / SR
        e = np.zeros(n)
        # 1 ms Anstieg: ohne ihn erzeugt der AAC-Encoder Pre-Echo, das über die Spitzen schießt
        e[i:] = np.sin(np.pi / 2 * np.clip(tt / 0.001, 0, 1)) ** 2 * np.exp(-tt / (0.004 if k < 3 else 0.11))
        burst += e * (0.8 if k < 3 else 1.0)
    c = filt(nz * burst, 'bandpass', [900, 3600])
    body = np.sin(2 * np.pi * 190 * t) * env_exp(n, 0.05) * 0.5
    snap = filt(noise(n), 'highpass', 5000) * env_exp(n, 0.07, 0.0015) * 0.3
    return np.tanh(1.3 * (c * 1.6 + body * 0.8 + snap * 1.3)) * 1.0 * vel


# TR-808-Becken: sechs Rechteck-Oszillatoren mit schiefen Frequenzen, gefiltert
_HAT_FREQS = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0]


def hat(open_: bool = False, vel: float = 1.0) -> np.ndarray:
    dur = 0.32 if open_ else 0.06
    n = int(dur * SR)
    metal = sum(square(f * 1.0, n) for f in _HAT_FREQS)
    metal = filt(metal, 'bandpass', [7000, 13000], 2)
    nz = filt(noise(n), 'highpass', 8000) * 0.6
    e = env_exp(n, 0.2 if open_ else 0.022, 0.0005)
    return (metal * 0.3 + nz) * e * 0.6 * vel


def cowbell(freq: float, vel: float = 1.0) -> np.ndarray:
    """TR-808-Cowbell (zwei Rechtecke im Verhältnis 1:1,48), tonal gespielt: der Phonk-Sound."""
    n = int(0.45 * SR)
    s = square(freq, n) * 0.6 + square(freq * 1.4815, n) * 0.4
    s = filt(s, 'bandpass', [freq * 0.9, freq * 4.2], 2)
    t = np.arange(n) / SR
    e = np.clip(t / 0.0006, 0, 1) * (0.72 * np.exp(-t / 0.028) + 0.28 * np.exp(-t / 0.2))
    return s * e * 0.95 * vel


def bell(freq: float, dur: float = 0.9, vel: float = 1.0, ratio: float = 2.0, index: float = 3.0, tau: float = 0.3) -> np.ndarray:
    """FM-Glocke / Pluck: Modulationsindex fällt ab, klingt erst hell, dann rund."""
    t = tvec(dur)
    idx = index * np.exp(-t / 0.12) + 0.35
    mod = np.sin(2 * np.pi * freq * ratio * t)
    car = np.sin(2 * np.pi * freq * t + idx * mod)
    body = np.sin(2 * np.pi * freq * 0.5 * t) * 0.22 * np.exp(-t / (tau * 1.3))
    amp = np.clip(t / 0.0015, 0, 1) * np.exp(-t / tau)
    return fade_tail((car * amp + body) * 0.5 * vel, 0.02)


def pad_chord(notes: list[int], dur: float, cutoff: float | tuple[float, float], vel: float = 1.0) -> np.ndarray:
    """Breite Fläche: pro Ton drei leicht verstimmte Sägezähne, weich gefiltert, Stereo."""
    n = int((dur + 0.35) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for m in notes:
        f = midi_hz(m)
        for ch, det in enumerate([(-9, 4), (-3, 10)]):
            v = sum(saw(f * 2 ** (c / 1200), n, phase0=rng.random()) for c in det) / len(det)
            out[ch] += v
    for ch in range(2):
        if isinstance(cutoff, tuple):
            out[ch] = sweep(out[ch], 'lowpass', cutoff[0], cutoff[1], curve=1.6)
        else:
            out[ch] = filt(out[ch], 'lowpass', cutoff)
    amp = np.clip(t / 0.09, 0, 1) * np.clip((dur + 0.35 - t) / 0.35, 0, 1)
    return out * amp * 0.11 * vel


# ---------------------------------------------------------------- Effekte

def impact(size: float = 1.0) -> np.ndarray:
    t = tvec(2.0 if size > 0.7 else 1.0)
    n = len(t)
    f = 32 + 48 * np.exp(-t / 0.25)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.55 * size, 0.002) * 0.6
    crack = filt(noise(n), 'bandpass', [180, 5000]) * env_exp(n, 0.05 + 0.1 * size, 0.0005) * 1.0
    air = filt(noise(n), 'highpass', 6000) * env_exp(n, 0.35 * size) * 0.12
    return np.tanh(1.5 * (boom + crack + air)) * 0.95 * size


def reverse_swell(dur: float = 1.2) -> np.ndarray:
    """Rückwärts-Becken: schwillt an und endet genau auf dem Ziel (align_end)."""
    n = int(dur * SR)
    x = filt(noise(n), 'highpass', 2500) * np.exp(-np.arange(n) / SR / (dur * 0.35))
    return x[::-1] * 0.45


def riser(dur: float) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = sweep(noise(n), 'bandpass', [300, 600], [6000, 12000], curve=1.3)
    tone = sine_sweep(180 * (1600 / 180) ** ((t / dur) ** 1.4)) * 0.25
    amp = (t / dur) ** 2.2
    return (nz * 0.9 + tone) * amp * 0.5


def whoosh(dur: float = 0.35, up: bool = False) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    a, b = (500, 6000) if up else (6000, 500)
    x = sweep(noise(n), 'bandpass', [a * 0.7, a * 1.5], [b * 0.7, b * 1.5], curve=1.0)
    amp = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return x * amp * 0.45


def zip_line(dur: float = 0.32) -> np.ndarray:
    """Surren der Angelschnur beim Fallen: fallender Ton mit Rauschanteil."""
    t = tvec(dur)
    f = 2400 * (380 / 2400) ** (t / dur)
    tone = sine_sweep(f) * 0.3
    nz = sweep(noise(len(t)), 'bandpass', [2000, 4000], [300, 700]) * 0.5
    amp = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.8
    return (tone + nz) * amp * 0.35


def ting(freq: float, vel: float = 1.0) -> np.ndarray:
    """Metallisches Ping (Haken): unharmonische FM, klingt lange aus."""
    return bell(freq, 1.1, vel, ratio=1.414, index=2.2, tau=0.42) * 0.8


def tick_ui(freq: float, vel: float = 1.0) -> np.ndarray:
    """Häkchen-Sound: kurzer Tock plus heller Ton in der Tonart."""
    t = tvec(0.35)
    n = len(t)
    tock = np.sin(2 * np.pi * 1400 * t) * env_exp(n, 0.008, 0.0008) * 0.6
    tone = bell(freq, 0.35, 1.0, ratio=2.0, index=1.4, tau=0.12)
    return (tock + tone) * 0.9 * vel


def clack(vel: float = 1.0) -> np.ndarray:
    """Einrasten der Walze: holziger Klack."""
    t = tvec(0.12)
    n = len(t)
    wood = np.sin(2 * np.pi * 1150 * t) * env_exp(n, 0.018, 0.0008)
    nz = filt(noise(n), 'bandpass', [1500, 5000]) * env_exp(n, 0.006, 0.0008)
    return (wood * 0.7 + nz * 0.6) * 0.6 * vel


def reel_ticks(start: float, stop: float) -> list[float]:
    """Klicks einer abbremsenden Walze: anfangs dicht, zum Einrasten hin seltener."""
    times, tt, gap = [], start, 0.028
    while tt < stop - 0.02:
        times.append(tt)
        tt += gap
        gap *= 1.09
    return times


def click(vel: float = 1.0) -> np.ndarray:
    n = int(0.02 * SR)
    return filt(noise(n), 'bandpass', [2500, 7000]) * env_exp(n, 0.002, 0.0008) * 0.35 * vel


def clink() -> np.ndarray:
    """Kette reißt: helles, unharmonisches Metall."""
    t = tvec(0.6)
    n = len(t)
    parts = [(2310, 0.35, 0.18), (3870, 0.25, 0.12), (6120, 0.15, 0.06), (1480, 0.3, 0.25)]
    x = sum(a * np.sin(2 * np.pi * f * t) * env_exp(n, tau, 0.0003) for f, a, tau in parts)
    snap = filt(noise(n), 'highpass', 3000) * env_exp(n, 0.004, 0.0008)
    return (x + snap * 0.8) * 0.55


def pop(freq: float = 700, vel: float = 1.0) -> np.ndarray:
    t = tvec(0.12)
    f = freq * (1 + 0.8 * np.exp(-t / 0.012))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(len(t), 0.03, 0.0005) * 0.5 * vel


def slash() -> np.ndarray:
    """Durchstreichen: scharfer Zisch von hell nach tiefer."""
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    x = sweep(noise(n), 'bandpass', [7000, 12000], [1200, 2600], curve=0.6)
    amp = np.clip(t / 0.004, 0, 1) * np.exp(-t / 0.09)
    return x * amp * 0.9


def shimmer(dur: float = 0.8, vel: float = 1.0) -> np.ndarray:
    """Glitzern für den Goldglanz: viele kurze, hohe Töne."""
    n = int(dur * SR)
    out = np.zeros(n)
    for _ in range(26):
        f = rng.uniform(3500, 9000)
        start = int(rng.uniform(0, dur * 0.7) * SR)
        length = int(rng.uniform(0.05, 0.18) * SR)
        length = min(length, n - start)
        tt = np.arange(length) / SR
        out[start:start + length] += np.sin(2 * np.pi * f * tt) * env_exp(length, 0.05, 0.002)
    return out * 0.08 * vel


def scan_sound(dur: float) -> np.ndarray:
    """Face-ID-Scan: leiser, leicht pulsierender Ton, der langsam steigt."""
    t = tvec(dur)
    f = 900 * (1500 / 900) ** (t / dur)
    tone = sine_sweep(f) * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * t))
    amp = np.clip(t / 0.08, 0, 1) * np.clip((dur - t) / 0.08, 0, 1)
    return tone * amp * 0.07


def denied(vel: float = 1.0) -> np.ndarray:
    """Kurzer, tiefer Doppelton für "KEINE KARTE." usw."""
    t = tvec(0.16)
    x = np.sin(2 * np.pi * 330 * t) + 0.5 * np.sin(2 * np.pi * 660 * t)
    return x * env_exp(len(t), 0.05, 0.002) * 0.16 * vel


def unlock_chime(vel: float = 1.0) -> np.ndarray:
    """Audio-Logo: A – E – A (Quinte, Oktave), wie ein Entsperren."""
    n = int(1.6 * SR)
    out = np.zeros(n)
    for k, m in enumerate([81, 88, 93]):
        b = bell(midi_hz(m), 1.4, 1.0 - 0.1 * k, ratio=3.0, index=1.8, tau=0.45)
        i = int(k * 0.075 * SR)
        out[i:i + len(b)] += b[: n - i]
    return out * 0.55 * vel


def bubbles(dur: float = 0.9) -> np.ndarray:
    """Getränk füllt sich: kleine aufsteigende Blubber-Töne."""
    n = int(dur * SR)
    out = np.zeros(n)
    for _ in range(14):
        start = int(rng.uniform(0, dur * 0.85) * SR)
        length = int(0.04 * SR)
        length = min(length, n - start)
        tt = np.arange(length) / SR
        f0 = rng.uniform(350, 700)
        f = f0 * (2.4 ** (tt / 0.04))
        out[start:start + length] += np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(length, 0.012, 0.001)
    return out * 0.18


def thud(vel: float = 1.0) -> np.ndarray:
    t = tvec(0.3)
    f = 70 + 60 * np.exp(-t / 0.02)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(len(t), 0.08, 0.001) * 0.6 * vel


# ---------------------------------------------------------------- Harmonie

CHORDS = {
    'Am': {'pad': [57, 60, 64, 69], 'root': 33},
    'F': {'pad': [53, 57, 60, 65], 'root': 29},
    'Dm': {'pad': [50, 57, 62, 65], 'root': 38},
    'E': {'pad': [52, 56, 59, 64], 'root': 28},
}
# Melodie (Sechzehntel-Schritt, MIDI) je Akkord: dasselbe Muster, transponiert
MOTIF = {
    'Am': [(0, 81), (3, 81), (6, 84), (8, 83), (10, 81), (12, 76), (14, 79)],
    'F': [(0, 77), (3, 77), (6, 81), (8, 79), (10, 77), (12, 72), (14, 76)],
    'Dm': [(0, 74), (3, 74), (6, 77), (8, 76), (10, 74), (12, 69), (14, 72)],
    'E': [(0, 80), (3, 80), (6, 83), (8, 81), (10, 80), (12, 76), (14, 71)],
}


def part_at(beat: float) -> str:
    for sec_ in TL['music']:
        if sec_['from'] <= beat < sec_['to']:
            return sec_['part']
    return 'finale'


# ---------------------------------------------------------------- Musik

def build_music(drums: Bus, bass: Bus, music: Bus, fx: Bus) -> list[float]:
    """Spielt die Musik nach dem Abschnittsplan. Gibt die Kick-Zeitpunkte zurück (für Sidechain)."""
    kicks: list[float] = []
    bars = TL['totalBeats'] // TL['beatsPerBar']
    chords = TL['chords']
    kick_a = [0, 10]
    kick_b = [0, 6, 10]
    gap_ranges = [TL['haken']['stille'], TL['anker']['stille']]

    def in_gap(beat: float) -> bool:
        return any(a <= beat < b for a, b in gap_ranges)

    for bar in range(bars):
        b0 = bar * 4
        part = part_at(b0)
        chord = chords[bar]
        nxt = chords[bar + 1] if bar + 1 < bars else chord
        t0 = sec(b0)
        pad_notes = CHORDS[chord]['pad']

        if part == 'voll':
            pattern = kick_a if bar % 2 == 0 else kick_b
            for s in pattern:
                if in_gap(b0 + s / 4):
                    continue
                drums.add(kick(1.0 if s == 0 else 0.85), t0 + s * STEP)
                kicks.append(t0 + s * STEP)
            drums.add(clap(1.0), t0 + 8 * STEP)
            music.add(clap(0.35), t0 + 8 * STEP)  # Hallanteil
            # Hi-Hats: Achtel, am Taktende im Wechsel Sechzehntel- und Zweiunddreißigstel-Rolls
            for s in range(0, 16, 2):
                drums.add(hat(vel=0.9 if s % 4 == 0 else 0.6), t0 + s * STEP, pan=-0.15 if s % 4 else 0.12)
            if bar % 2 == 1:
                for k in range(8):
                    drums.add(hat(vel=0.35 + k * 0.06), t0 + 12 * STEP + k * STEP / 2, pan=0.2)
            else:
                drums.add(hat(vel=0.5), t0 + 13 * STEP, pan=0.2)
                drums.add(hat(True, 0.45), t0 + 14 * STEP, pan=-0.2)
            # 808 auf den Kicks, Grundton des Akkords, am Taktende Glide zum nächsten
            root = midi_hz(CHORDS[chord]['root'])
            for i, s in enumerate(pattern):
                end_s = pattern[i + 1] if i + 1 < len(pattern) else 16
                dur = (end_s - s) * STEP
                glide = midi_hz(CHORDS[nxt]['root']) if (i == len(pattern) - 1 and nxt != chord and bar % 2 == 1) else None
                bass.add(bass808(root, dur, 0.95, glide), t0 + s * STEP)
            # Phonk-Cowbell-Melodie + leise Fläche
            for s, m in MOTIF[chord]:
                music.add(cowbell(midi_hz(m - 12), 0.9 if s in (0, 6) else 0.7), t0 + s * STEP, pan=0.12)
            music.add(pad_chord(pad_notes, 4 * BEAT, 2300, 0.7), t0)

        elif part == 'breakdown':
            music.add(pad_chord(pad_notes, 4 * BEAT, 950, 1.2), t0)
            for s, m in MOTIF[chord]:
                music.add(bell(midi_hz(m), 0.8, 0.55, ratio=2.0, index=2.4, tau=0.32), t0 + s * STEP, pan=-0.08)
            for s in range(0, 16, 2):
                drums.add(hat(vel=0.28), t0 + s * STEP, pan=0.25)
            drums.add(clap(0.45), t0 + 8 * STEP)

        elif part == 'build':
            music.add(pad_chord(pad_notes, 4 * BEAT, (700, 5500), 1.1), t0)
            for s, m in MOTIF[chord]:
                if in_gap(b0 + s / 4):
                    continue
                music.add(bell(midi_hz(m), 0.6, 0.5, ratio=2.0, index=2.6, tau=0.25), t0 + s * STEP, pan=-0.08)
            # Snare-Roll: Achtel → Sechzehntel → Zweiunddreißigstel
            hits = [x * 2 for x in range(4)] + [8 + x for x in range(4)] + [12 + x * 0.5 for x in range(8)]
            for i, s in enumerate(hits):
                if in_gap(b0 + s / 4):
                    continue
                drums.add(clap(0.35 + 0.55 * i / len(hits)), t0 + s * STEP)
            # Kick auf den Vierteln, außer in der Lücke vor dem Drop
            for s in (0, 4, 8, 12):
                if in_gap(b0 + s / 4):
                    continue
                drums.add(kick(0.7), t0 + s * STEP)
                kicks.append(t0 + s * STEP)
            gap_start = min((a for a, b in gap_ranges if b0 <= a < b0 + 4), default=b0 + 4)
            fx.add(riser(sec(gap_start) - t0), t0, gain=0.9)

        elif part == 'pause':
            gap_start = TL['anker']['stille'][0]
            dur = sec(gap_start) - t0
            music.add(pad_chord(pad_notes, dur, (600, 3000), 1.1), t0)
            for s, m in MOTIF[chord][:4]:
                music.add(bell(midi_hz(m), 0.7, 0.45, ratio=2.0, index=2.0, tau=0.3), t0 + s * STEP)
            for s in range(0, 12, 2):
                drums.add(hat(vel=0.25), t0 + s * STEP, pan=0.25)
            fx.add(riser(dur), t0, gain=0.55)

        elif part == 'finale':
            music.add(pad_chord(pad_notes + [pad_notes[0] + 12], 3.0, (1800, 900), 1.5), t0)
            bass.add(bass808(midi_hz(CHORDS[chord]['root']), 2.2, 1.0), t0)
            drums.add(kick(1.0), t0)
            kicks.append(t0)

    return kicks


# ---------------------------------------------------------------- Sounddesign nach Zeitplan

def build_fx(fx: Bus, drums: Bus):
    H, K, IT = TL['hook'], TL['haken'], TL['items']
    R, A, P, C, E = TL['recap'], TL['anker'], TL['preis'], TL['cta'], TL['ende']
    tick_notes = [81, 84, 86, 88, 91, 93, 96]  # a-Moll-Pentatonik aufwärts: jedes Häkchen einen Ton höher

    # --- Hook
    fx.add(impact(1.0), sec(H['premium']))
    fx.add(whoosh(0.25, up=True), sec(H['fuer']) - 0.08, gain=0.6, pan=-0.2)
    lock_times = [sec(b) for b in H['ziffern']]
    for tt in reel_ticks(sec(H['rollen']) + 0.05, lock_times[0]):
        fx.add(click(0.9), tt, pan=rng.uniform(-0.3, 0.3))
    for i, tt in enumerate(lock_times):
        fx.add(clack(0.8 + 0.1 * i), tt, pan=-0.3 + 0.2 * i)
    fx.add(impact(0.55), sec(H['landet']))
    fx.add(tick_ui(midi_hz(88), 0.5), sec(H['imMonat']))
    fx.add(whoosh(0.3, up=True), sec(H['abgang']) - 0.1, gain=0.8)

    # --- Haken
    # Haken fallen vor dem Beat los (HookSwarm) und rasten auf dem Beat ein: Surren davor, Ping darauf
    fx.add(zip_line(), sec(K['faellt']) - 0.2, gain=0.9)
    fx.add(ting(midi_hz(76)), sec(K['faellt']), gain=0.9)
    fx.add(impact(0.5), sec(K['haken']))
    fx.add(whoosh(0.5, up=False), sec(K['ehrlich']) - 0.15, gain=0.7)
    fx.add(thud(1.0), sec(K['esGibt']) + frames_to_sec(3))
    fx.add(impact(0.35), sec(K['esGibt']) + frames_to_sec(3), gain=0.8)
    arp = [76, 80, 83, 88, 92, 95]  # E-Dur aufwärts: Spannung, löst sich im Drop nach a-Moll
    for i, b in enumerate(K['vermehren']):
        fx.add(zip_line(0.22), sec(b) - 0.18, gain=0.45, pan=-0.6 + 0.2 * i)
        fx.add(ting(midi_hz(arp[i]), 0.8), sec(b), pan=-0.5 + 0.2 * i)
    fx.add(whoosh(0.45, up=True), sec(K['einholen']), gain=0.9)
    fx.add(reverse_swell(0.9), sec(IT[0]['start']), align_end=True, gain=0.8)

    # --- Häkchen
    fx.add(impact(1.0), sec(IT[0]['start']))
    for i, item in enumerate(IT):
        if i > 0:
            fx.add(whoosh(0.28, up=False), sec(item['start']) - 0.12, gain=0.55, pan=0.4)
        fx.add(tick_ui(midi_hz(tick_notes[i])), sec(item['tick']), pan=-0.45 + 0.15 * i)
    ev = [it['events'] for it in IT]
    fx.add(clink(), sec(ev[0]['bruch']) + frames_to_sec(1))
    for tt in reel_ticks(sec(IT[1]['start']) - frames_to_sec(2), sec(ev[1]['null'])):
        fx.add(click(0.8), tt)
    fx.add(clack(1.0), sec(ev[1]['null']))
    u0, u1 = ev[2]['umlauf']
    for k in range(int((u1 - u0) * 4)):
        if (u0 + k / 4) % 4 == 2:
            continue  # dort liegt der Clap; beides gleichzeitig bringt den AAC-Encoder zum Übersteuern
        fx.add(click(0.35 + 0.02 * k), sec(u0) + k * STEP, pan=0.3)
    fx.add(shimmer(0.7, 0.8), sec(u1) - 0.05)
    fx.add(scan_sound(sec(ev[3]['entsperrt']) - sec(ev[3]['scan'])), sec(ev[3]['scan']))
    for b in ev[3]['nein']:
        fx.add(denied(), sec(b))
    fx.add(unlock_chime(), sec(ev[3]['entsperrt']))
    fx.add(bubbles(0.9), sec(ev[4]['fuellen']) + frames_to_sec(2))
    fx.add(pop(620), sec(ev[5]['schild']) + frames_to_sec(2))
    fx.add(whoosh(0.9, up=True), sec(ev[6]['linie']), gain=0.35)
    for i, b in enumerate(ev[6]['stationen']):
        fx.add(pop(midi_hz([76, 79, 81, 84, 86, 88][i]), 0.9), sec(b), pan=-0.2 + 0.08 * i)
    for b in ev[6]['neu']:
        fx.add(pop(1400, 0.6), sec(b), pan=0.35)
        fx.add(shimmer(0.4, 0.5), sec(b))

    # --- Recap: Kaskade aufwärts
    fx.add(whoosh(0.3, up=True), sec(R['titel']) - 0.1, gain=0.5)
    for i, b in enumerate(R['zeilen']):
        fx.add(tick_ui(midi_hz(tick_notes[i]), 0.75), sec(b), pan=-0.3 + 0.1 * i)

    # --- Anker: in die Stille hinein
    for b in A['worte']:
        fx.add(thud(0.5), sec(b))
    fx.add(impact(0.4), sec(A['preis']))
    fx.add(slash(), sec(A['strich']))
    fx.add(reverse_swell(0.4), sec(P['slam']), align_end=True, gain=0.9)

    # --- Preis: zweiter Drop
    fx.add(impact(1.0), sec(P['slam']))
    fx.add(shimmer(1.0, 1.0), sec(P['slam']) + 0.05)
    fx.add(tick_ui(midi_hz(88), 0.5), sec(P['imMonat']))
    fx.add(slash(), sec(P['statt']) + frames_to_sec(3), gain=0.35)
    for b in P['details']:
        fx.add(pop(900, 0.6), sec(b))
    fx.add(shimmer(0.8, 0.9), sec(P['glanz']))

    # --- Probetraining
    fx.add(whoosh(0.35, up=True), sec(C['frage']) - 0.12, gain=0.6)
    fx.add(impact(0.35), sec(C['antwort']))
    fx.add(whoosh(0.35, up=True), sec(C['titel']) - 0.12, gain=0.6)
    fx.add(impact(0.45), sec(C['titel']))
    for i, b in enumerate(C['punkte']):
        fx.add(tick_ui(midi_hz([88, 91, 93][i]), 0.8), sec(b))
    fx.add(whoosh(0.35, up=True), sec(C['aufruf']) - 0.12, gain=0.5)
    fx.add(pop(820, 0.7), sec(C['partner']))

    # --- Ende: Häkchen → Logo, Audio-Logo auf dem letzten Schlag
    fx.add(tick_ui(midi_hz(93), 0.9), sec(E['rahmen']) - frames_to_sec(1))
    fx.add(whoosh(0.5, up=True), sec(E['rahmen']) + frames_to_sec(8), gain=0.6)
    for i in range(3):
        fx.add(thud(0.45), sec(E['rahmen']) + frames_to_sec(22 + i * 4 + 5))
    fx.add(shimmer(0.9, 0.9), sec(E['logo']) + frames_to_sec(26))
    fx.add(impact(0.3), sec(E['claim'][0]))
    fx.add(impact(0.3), sec(E['claim'][1]))
    fx.add(reverse_swell(1.2), sec(E['finale']), align_end=True)
    fx.add(impact(1.0), sec(E['finale']))
    fx.add(unlock_chime(1.1), sec(E['finale']) + 0.02)
    fx.add(shimmer(1.2, 1.0), sec(E['finale']) + 0.05)


# ---------------------------------------------------------------- Hall, Sidechain, Mastering

def reverb_ir(dur: float = 2.2, rt60: float = 1.5) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    decay = np.exp(-6.9 * t / rt60)
    ir = np.vstack([noise(n), noise(n)]) * decay
    ir = np.vstack([filt(ir[0], 'lowpass', 6500), filt(ir[1], 'lowpass', 6500)])
    pre = int(0.018 * SR)
    ir = np.concatenate([np.zeros((2, pre)), ir], axis=1)
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def convolve(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    out = np.vstack([signal.fftconvolve(x[0], ir[0])[:N], signal.fftconvolve(x[1], ir[1])[:N]])
    return out


def sidechain(kicks: list[float], depth: float = 0.45, release: float = 0.13) -> np.ndarray:
    env = np.zeros(N)
    for k in kicks:
        i = int(k * SR)
        m = min(N - i, int(release * 6 * SR))
        if m > 0:
            env[i:i + m] = np.maximum(env[i:i + m], np.exp(-np.arange(m) / SR / release))
    return 1 - depth * env


def true_peak(x: np.ndarray) -> float:
    up = signal.resample_poly(x, 4, 1, axis=1)
    return float(np.max(np.abs(up)))


def limiter(x: np.ndarray, ceiling: float, lookahead: float = 0.004, release: float = 0.08) -> np.ndarray:
    """Lookahead-Limiter mit True-Peak-Erkennung: Verstärkung folgt dem Spitzenwert, weich zurück."""
    la = int(lookahead * SR)
    # True-Peak-Erkennung: Spitzen zwischen den Abtastwerten (4-fach überabgetastet) mitzählen
    up = np.abs(signal.resample_poly(x, 4, 1, axis=1))[:, : 4 * x.shape[1]]
    peak = up.reshape(2, x.shape[1], 4).max(axis=2).max(axis=0)
    from scipy.ndimage import maximum_filter1d
    peak = maximum_filter1d(peak, size=2 * la + 1)
    gain = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    # Glätten: sofort runter, langsam zurück
    a = np.exp(-1.0 / (release * SR))
    smoothed = np.empty_like(gain)
    g = 1.0
    for i in range(len(gain)):
        target = gain[i]
        g = target if target < g else a * g + (1 - a) * target
        smoothed[i] = g
    return x * smoothed


def write_wav(path: Path, x: np.ndarray):
    path.parent.mkdir(parents=True, exist_ok=True)
    dither = (rng.random(x.shape) - rng.random(x.shape)) / 32768.0
    y = np.clip(x + dither, -1, 1)
    wavfile.write(path, SR, (y.T * 32767).astype(np.int16))


def main():
    drums, bass, music, fx = Bus('drums'), Bus('bass'), Bus('musik'), Bus('fx')
    kicks = build_music(drums, bass, music, fx)
    build_fx(fx, drums)

    ir = reverb_ir()
    sc = sidechain(kicks)
    music.x *= sc
    wet_music = convolve(music.x, ir) * 0.22
    wet_fx = convolve(fx.x, ir) * 0.18

    musik = drums.x * 0.9 + bass.x * 0.5 + music.x * 1.0 + wet_music
    effekte = fx.x * 0.8 + wet_fx
    mix = musik + effekte

    # Ausklingen: ab 0,9 s vor Schluss sanft auf null, die letzten 0,3 s sind still
    ramp = np.ones(N)
    f0, f1 = N - int(0.9 * SR), N - int(0.3 * SR)
    ramp[f0:f1] = np.cos(np.linspace(0, np.pi / 2, f1 - f0)) ** 2
    ramp[f1:] = 0
    mix *= ramp

    # Unhörbaren Tiefstbass entfernen: schafft Luft für Lautheit, klingt auf keinem Gerät anders
    mix = np.vstack([filt(mix[0], 'highpass', 32), filt(mix[1], 'highpass', 32)])

    # Lautheit angleichen, dann begrenzen (mehrmals, weil der Limiter die Lautheit etwas senkt)
    meter = pyln.Meter(SR)
    ceiling = 10 ** (CEILING_DBTP / 20) * 0.97
    for _ in range(3):
        loud = meter.integrated_loudness(mix.T)
        mix *= 10 ** ((TARGET_LUFS - loud) / 20)
        before = mix
        mix = limiter(mix, ceiling)
    gr = 20 * np.log10(np.maximum(np.max(np.abs(mix), axis=0), 1e-9) / np.maximum(np.max(np.abs(before), axis=0), 1e-9))
    print(f'Limiter: max. {-gr.min():.1f} dB Absenkung, {np.mean(gr < -3) * 100:.1f} % der Zeit mehr als 3 dB')
    tp = true_peak(mix)
    if tp > 10 ** (CEILING_DBTP / 20):
        mix *= 10 ** (CEILING_DBTP / 20) / tp

    loud = meter.integrated_loudness(mix.T)
    tp_db = 20 * np.log10(true_peak(mix))
    write_wav(ROOT / 'public' / 'audio' / 'mfit-soundtrack.wav', mix)
    stems = ROOT / 'out' / 'stems'
    norm = 0.9 / max(np.max(np.abs(musik)), np.max(np.abs(effekte)))
    write_wav(stems / 'musik.wav', musik * norm)
    write_wav(stems / 'effekte.wav', effekte * norm)
    print(f'Soundtrack: {TOTAL:.2f} s, {loud:.1f} LUFS, True Peak {tp_db:.2f} dBTP')
    print('  public/audio/mfit-soundtrack.wav  +  out/stems/musik.wav, out/stems/effekte.wav')


if __name__ == '__main__':
    main()
