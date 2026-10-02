#!/usr/bin/env python3
"""Baut die komplette Tonspur des Edits und die Zeitleiste für Remotion.

Eingang (nicht im Repo, siehe scripts/fetch_nasheed.sh):
  assets-src/nasheed/vocals.wav        Nasheed „Джохар Дудаев“, Beat per KI entfernt (nur Stimme)
  assets-src/nasheed/beats_orig.json   Taktraster der Originalfassung (aus dem entfernten Beat)
  assets-src/sfx/*.mp3                 natürliche Geräusche

Ausgang:
  public/audio/mix.wav   fertige Tonspur (44,1 kHz, Stereo)
  src/timeline.json      alle Zeitpunkte (Schläge, Abschnitte, Treffer) in Sekunden der Ausgabe

Grundsatz (Wunsch des Auftraggebers): keine Instrumente. Alles Tonale kommt aus der Stimme
selbst – Tempo/Tonhöhe, Filter, Bass-Anhebung, Verzerrung. Die „Dum“-Schläge und der
Sub-Bass werden aus der Stimme geformt. Dazu nur natürliche Geräusche (Donner, Stahl, Wind …).
"""
from __future__ import annotations

import json
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pyloudnorm
import soundfile as sf
from scipy import signal
from scipy.ndimage import map_coordinates, minimum_filter1d

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
SR = 44100
BASE = 1.1825  # Tempo wie im TikTok-Sound (gemessen am Ausschnitt des Nutzers)
SLOW = 0.80    # tiefe, langsame Fassung für 1944
COLD_OPEN = 1.0  # Sekunden ohne Gesang am Anfang (nur Wind und Wolf)

rng = np.random.default_rng(7)


# ---------------------------------------------------------------- Hilfen

def db(x: float) -> float:
    return 10 ** (x / 20)


def load(path: Path, mono=False) -> np.ndarray:
    """Liest beliebige Audiodatei als float32 (n, 2) bzw. (n,) in 44,1 kHz."""
    if path.suffix.lower() != ".wav":
        tmp = Path(tempfile.mkdtemp()) / "x.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-ar", str(SR), str(tmp)], check=True)
        path = tmp
    y, sr = sf.read(path, dtype="float32", always_2d=True)
    if sr != SR:
        y = signal.resample_poly(y, SR, sr, axis=0).astype(np.float32)
    if y.shape[1] == 1:
        y = np.repeat(y, 2, axis=1)
    return y.mean(axis=1) if mono else y[:, :2]


def ffmpeg_filter(y: np.ndarray, af: str) -> np.ndarray:
    """Schickt ein Signal durch einen ffmpeg-Filter (z. B. rubberband) und zurück."""
    d = Path(tempfile.mkdtemp())
    sf.write(d / "in.wav", y, SR, subtype="FLOAT")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(d / "in.wav"), "-af", af, "-ar", str(SR),
                    "-c:a", "pcm_f32le", str(d / "out.wav")], check=True)
    out, _ = sf.read(d / "out.wav", dtype="float32", always_2d=True)
    return out if y.ndim == 2 else out.mean(axis=1)


def butter(y, kind, freq, order=2):
    sos = signal.butter(order, np.clip(freq, 10, SR / 2 - 100), btype=kind, fs=SR, output="sos")
    return signal.sosfilt(sos, y, axis=0)


def fade(y: np.ndarray, fin=0.004, fout=0.004) -> np.ndarray:
    y = y.copy()
    a, b = int(fin * SR), int(fout * SR)
    if a:
        y[:a] *= np.linspace(0, 1, a)[:, None] if y.ndim == 2 else np.linspace(0, 1, a)
    if b:
        y[-b:] *= np.linspace(1, 0, b)[:, None] if y.ndim == 2 else np.linspace(1, 0, b)
    return y


def stereo(y: np.ndarray) -> np.ndarray:
    return np.stack([y, y], axis=1) if y.ndim == 1 else y


def make_ir(seconds=2.6, predelay=0.025, lp=6500, seed=1) -> np.ndarray:
    """Synthetischer Hall (exponentiell abklingendes, dekorreliertes Rauschen)."""
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    env = np.exp(-6.9 * t / seconds)
    ir = r.standard_normal((n, 2)) * env[:, None]
    ir = butter(ir, "low", lp, 2)
    ir = np.concatenate([np.zeros((int(predelay * SR), 2)), ir])
    return (ir / np.sqrt((ir ** 2).sum(axis=0))).astype(np.float32)


IR_HALL = make_ir(2.8, 0.03, 5500, 1)
IR_ROOM = make_ir(0.9, 0.012, 7000, 2)


def reverb(y: np.ndarray, ir=IR_HALL) -> np.ndarray:
    y = stereo(y)
    return np.stack([signal.fftconvolve(y[:, c], ir[:, c])[: len(y) + len(ir)] for c in range(2)], axis=1)


def varying_biquad(y: np.ndarray, design, values: np.ndarray, block=256) -> np.ndarray:
    """Biquad mit zeitlich veränderlichem Parameter (blockweise, Zustand wird mitgeführt)."""
    out = np.empty_like(y)
    zi = None
    for s in range(0, len(y), block):
        b, a = design(float(values[min(s + block // 2, len(values) - 1)]))
        if zi is None:
            zi = np.zeros((max(len(a), len(b)) - 1, y.shape[1]))
        out[s:s + block], zi = signal.lfilter(b, a, y[s:s + block], axis=0, zi=zi)
    return out


def lp_design(fc):
    return signal.butter(2, min(fc, SR / 2 - 200), "low", fs=SR)


def lowshelf_design(gain_db, f0=140.0, q=0.7):
    """RBJ-Kuhschwanz-Filter (Bassanhebung direkt auf der Stimme)."""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    cw = np.cos(w0)
    b0 = A * ((A + 1) - (A - 1) * cw + 2 * np.sqrt(A) * alpha)
    b1 = 2 * A * ((A - 1) - (A + 1) * cw)
    b2 = A * ((A + 1) - (A - 1) * cw - 2 * np.sqrt(A) * alpha)
    a0 = (A + 1) + (A - 1) * cw + 2 * np.sqrt(A) * alpha
    a1 = -2 * ((A - 1) + (A + 1) * cw)
    a2 = (A + 1) + (A - 1) * cw - 2 * np.sqrt(A) * alpha
    return np.array([b0, b1, b2]) / a0, np.array([1, a1 / a0, a2 / a0])


def saturate(y: np.ndarray, drive: np.ndarray) -> np.ndarray:
    d = np.maximum(drive, 1e-3)[:, None]
    return np.tanh(y * d) / np.tanh(d)


def limiter(y: np.ndarray, ceiling=db(-1.0), look=0.004, release=0.12) -> np.ndarray:
    peak = np.abs(y).max(axis=1)
    g = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    g = minimum_filter1d(g, int(look * SR) * 2 + 1)
    a = np.exp(-1.0 / (release * SR))
    # Erholung langsam, Absenkung sofort (min-Filter hat sie vorgezogen)
    sm = signal.lfilter([1 - a], [1, -a], g)
    # Kein Versatz: das zentrierte Minimum-Fenster schaut bereits voraus,
    # die Zeitleiste bleibt dadurch samplegenau.
    return y * np.minimum(g, sm)[:, None]


# ---------------------------------------------------------------- Nasheed + Taktraster

VOC = load(SRC / "nasheed" / "vocals.wav")
BEATS = np.array(json.load(open(SRC / "nasheed" / "beats_orig.json"))["beats"])
BEAT_LEN = float(np.median(np.diff(BEATS)))


def bt(b: float) -> float:
    """Quellzeit (s) eines (auch gebrochenen) Schlags."""
    i = int(np.floor(b))
    return float(BEATS[i] + (b - i) * (BEATS[i + 1] - BEATS[i]))


def read_at(pos_samples: np.ndarray) -> np.ndarray:
    """Kubische Interpolation der Stimme an beliebigen Quellpositionen (Samples)."""
    return np.stack([map_coordinates(VOC[:, c], [pos_samples], order=3, mode="nearest") for c in range(2)], axis=1)


@dataclass
class Seg:
    name: str
    b0: float               # Quell-Schlag Anfang
    b1: float               # Quell-Schlag Ende
    rate: tuple = (BASE, BASE)  # Abspielrate Anfang/Ende (Tempo + Tonhöhe, wie Bandmaschine)
    curve: float = 1.0      # Form der Rampe (>1 = später schnell)
    repeats: int = 1        # Stotter-Wiederholungen des Ausschnitts
    fx: dict = field(default_factory=dict)
    marks: dict = field(default_factory=dict)  # Name -> Quell-Schlag
    gap: float = 0.0        # Stille (Ausgabe-Sekunden) statt Gesang


def render_seg(seg: Seg):
    """Gibt (Audio, Liste[(Quell-Schlag, Ausgabezeit relativ)]) zurück."""
    if seg.gap:
        return np.zeros((int(seg.gap * SR), 2), np.float32), []
    s0, s1 = bt(seg.b0) * SR, bt(seg.b1) * SR
    L = s1 - s0  # negativ = rückwärts (Rückspulen)
    r0, r1 = seg.rate
    u = np.linspace(0, 1, 2048)
    prof = r0 + (r1 - r0) * u ** seg.curve
    n = int(round(abs(L) / prof.mean()))
    rates = np.interp(np.linspace(0, 1, n), u, prof)
    pos = np.concatenate([[0.0], np.cumsum(rates[:-1])])
    pos *= abs(L) / max(pos[-1] + rates[-1], 1e-9)
    one = read_at(s0 + np.sign(L) * pos)
    one = fade(one, 0.003, 0.003)
    audio = np.concatenate([one] * seg.repeats)
    beats = []
    if L < 0:
        return audio.astype(np.float32), beats
    for k in range(seg.repeats):
        for b in np.arange(np.ceil(seg.b0), seg.b1, 1.0):
            src = (bt(b) - bt(seg.b0)) * SR
            t = np.interp(src, pos, np.arange(n)) / SR
            beats.append((float(b), k * n / SR + t))
    return audio.astype(np.float32), beats


# Ablauf: jeder Abschnitt nennt seinen Quell-Bereich (in Schlägen der Originalfassung) und die Bearbeitung.
# fx-Schlüssel: lp (Hz, Anfang→Ende), shelf (dB), drive, gain (dB), verb (Hallanteil), sub (Sub-Bass-Pegel)
ARR = [
    # 0  Kurzer kalter Einstieg: Wind und Wolf (1 s)
    Seg("cold", 0, 0, gap=COLD_OPEN),
    # 1  Chant gedämpft – nach 4 Schlägen offen, Bass-Schlag beim Öffnen. Dzurdzuketien, Türme, Simsir
    Seg("chant", 96, 112, fx=dict(lp=[(0, 380), (0.25, 16000), (1, 16000)], shelf=7, drive=1.8,
                                 gain=[(0, -8), (0.25, -1.5), (1, -1)], verb=[(0, 0.5), (0.25, 0.22), (1, 0.22)], sub=[(0, 0.2), (0.25, 0.7), (1, 0.7)]),
        marks=dict(dzurdzuk=96, towers=100, simsir=104, timur=108)),
    # 2  Strophe – Sheikh Mansur, Taimi Bibolt, Kaukasuskrieg
    Seg("verse", 112, 124, fx=dict(lp=16000, shelf=8, drive=2.2, gain=-1, verb=0.16, sub=0.8),
        marks=dict(mansur=112, bibolt=116, war=120)),
    # 4  Anlauf, Stotterer, Bandstopp, Atemzug
    Seg("build", 124, 126, fx=dict(lp=16000, shelf=8, drive=2.3, gain=(-1, 0), verb=(0.16, 0.25), sub=0.8)),
    Seg("stutter", 126, 126.25, repeats=4, fx=dict(lp=(1800, 9000), shelf=8, drive=2.2, gain=0, verb=0.3, sub=0.3)),
    Seg("tapestop", 127, 127.8, rate=(BASE, 0.0), curve=1.0, fx=dict(lp=(16000, 1500), shelf=9, drive=2.4, gain=(0, -3), verb=(0.4, 0.6), sub=0.6)),
    Seg("breath", 0, 0, gap=0.42),
    # 5  DROP – Baysangur
    Seg("drop1", 128, 140, fx=dict(lp=16000, shelf=10, drive=2.8, gain=0, verb=0.12, sub=1.0),
        marks=dict(drop1=128, arm=132, eye=134, leg=136, fought=137)),
    # 6  Tief und langsam: Zitat am Grab
    Seg("deep", 140, 144, rate=(0.86, 0.86), fx=dict(lp=5000, shelf=11, drive=2.4, gain=-1, verb=(0.35, 0.45), sub=1.0),
        marks=dict(quote=140)),
    # 7  Abreken / Zelimkhan
    Seg("abrek", 144, 152, fx=dict(lp=16000, shelf=10, drive=2.8, gain=0, verb=0.12, sub=1.0),
        marks=dict(abrek=144, zelimkhan=148)),
    # 8  1944: tief, gedämpft, weit weg
    Seg("y1944", 152, 164, rate=(SLOW, SLOW), fx=dict(lp=(950, 700), shelf=6, drive=1.3, gain=(-10, -12), verb=(0.65, 0.7), sub=0.5),
        marks=dict(born=152, deport=156, solzh=160)),
    # 9  Aufstieg 1957: Band läuft an, Filter öffnet
    Seg("rise", 164, 167, rate=(SLOW * 0.75, BASE), curve=1.6, fx=dict(lp=(700, 16000), shelf=8, drive=1.3, gain=(-12, 0), verb=(0.5, 0.2), sub=0.6),
        marks=dict(return1957=164)),
    Seg("stutter2", 167, 167.25, repeats=4, fx=dict(lp=(3000, 16000), shelf=9, drive=2.4, gain=(0, 1), verb=0.2, sub=0.3)),
    # 10 FINALE – Dzhokhar Dudayev, Rückblick, NOKHCHI
    Seg("finale", 168, 183, fx=dict(lp=16000, shelf=11, drive=3.0, gain=0, verb=(0.12, 0.15), sub=1.0),
        marks=dict(drop2=168, dudayev=168, freedom=172, recap=176, nokhchi=180)),
    Seg("stutter3", 183, 183.25, repeats=4, fx=dict(lp=(16000, 2500), shelf=11, drive=3.0, gain=(0, -2), verb=(0.2, 0.5), sub=0.6)),
    # 11 Ende: letzter Schlag, Nachhall, Wolf
    Seg("end", 0, 0, gap=2.6),
]


def ramp(v, n):
    """Konstante, (Anfang, Ende) oder Keyframes [(Anteil, Wert), …] über die Abschnittslänge."""
    if isinstance(v, (int, float)):
        return np.full(n, float(v))
    if isinstance(v, list):
        xs, ys = zip(*v)
        return np.interp(np.linspace(0, 1, n), xs, ys)
    return np.linspace(float(v[0]), float(v[1]), n)


def build_vocal():
    parts, timeline_beats, sections, marks = [], [], {}, {}
    curves = {k: [] for k in ("lp", "shelf", "drive", "gain", "verb", "sub")}
    t = 0.0
    for seg in ARR:
        audio, beats = render_seg(seg)
        n = len(audio)
        fx = seg.fx
        curves["lp"].append(ramp(fx.get("lp", 16000), n))
        curves["shelf"].append(ramp(fx.get("shelf", 0), n))
        curves["drive"].append(ramp(fx.get("drive", 1.0), n))
        curves["gain"].append(ramp(fx.get("gain", -120 if seg.gap else 0), n))
        curves["verb"].append(ramp(fx.get("verb", 0), n))
        curves["sub"].append(ramp(fx.get("sub", 0), n))
        sections[seg.name] = [t, t + n / SR]
        for b, tb in beats:
            timeline_beats.append(dict(t=round(t + tb, 4), src=b, sec=seg.name))
        for name, b in seg.marks.items():
            hit = [tb for bb, tb in beats if bb == b]
            marks[name] = round(t + (hit[0] if hit else 0.0), 4)
        parts.append(audio)
        t += n / SR
    voc = np.concatenate(parts)
    C = {k: np.concatenate(v) for k, v in curves.items()}
    return voc, C, timeline_beats, sections, marks


# ---------------------------------------------------------------- Stimm-Schläge („Dum“) und Sub-Bass

def find_grain() -> np.ndarray:
    """Kräftiger Vokal-Einsatz aus dem lauten Teil – Rohstoff für alle Schläge."""
    mono = VOC.mean(axis=1)
    best, best_e = None, -1
    for b in range(128, 184):
        s = int(bt(b) * SR)
        g = mono[s: s + int(0.30 * SR)]
        e = np.sqrt(np.mean(g[: int(0.08 * SR)] ** 2))
        if e > best_e:
            best, best_e = g, e
    return best / (np.abs(best).max() + 1e-9)


GRAIN = find_grain()


def grain_f0() -> float:
    import librosa
    f0, voiced, _ = librosa.pyin(GRAIN[: int(0.25 * SR)], fmin=70, fmax=600, sr=SR, frame_length=2048)
    f = f0[voiced] if voiced.any() else np.array([160.0])
    return float(np.median(f))


F0 = grain_f0()


def make_dum(length=0.8, f_start=118.0, f_end=46.0, sweep=0.09, decay=0.38, punch=0.22) -> np.ndarray:
    """Schwerer „Dum“ aus der Stimme.

    Der Vokal wird so stark verlangsamt, dass sein Grundton von f_start auf f_end fällt
    (wie bei einem 808), und so stark tiefpassgefiltert, dass nur dieser Grundton bleibt.
    Eine zweite, kürzere Kopie desselben Vokals gibt den Druck im Tiefmittenbereich.
    Kein heller Klick – der hatte genervt.
    """
    n = int(length * SR)
    t = np.arange(n) / SR
    f = f_end + (f_start - f_end) * np.exp(-t / sweep)
    rates = f / F0
    pos = np.cumsum(rates) - rates[0]
    loop = np.concatenate([GRAIN] * 8)  # der Vokal reicht so auch für lange Schläge
    body = np.interp(pos, np.arange(len(loop)), loop, right=0.0)
    body = butter(butter(body, "low", 150, 4), "high", 25, 2)
    body /= np.abs(body).max() + 1e-9
    env = np.exp(-t / decay) * np.minimum(1, t / 0.0015)
    body *= env
    # Druck: derselbe Vokal, eine Oktave tiefer, nur 60 ms, 90–500 Hz
    k = int(0.06 * SR)
    pr = np.interp(np.cumsum(np.full(k, 0.5)), np.arange(len(GRAIN)), GRAIN)
    pr = butter(butter(pr, "low", 500, 2), "high", 90, 2) * np.exp(-np.arange(k) / (0.018 * SR))
    body[:k] += punch * pr / (np.abs(pr).max() + 1e-9)
    body = np.tanh(2.6 * body) / np.tanh(2.6)  # Obertöne, damit der Bass auch am Handy hörbar ist
    return fade(body, 0.0005, 0.03)


DUM = make_dum()
DUM_HALF = make_dum(0.9, 110, 44, 0.10, 0.42, 0.3)
BOOM = make_dum(2.6, 105, 38, 0.16, 0.95, 0.45)


def place(bus: np.ndarray, sound: np.ndarray, t: float, gain=1.0, pan=0.0):
    s = int(round(t * SR))
    if s >= len(bus):
        return
    snd = stereo(sound) * gain
    if pan:
        snd = snd * np.array([np.sqrt(0.5 - pan / 2), np.sqrt(0.5 + pan / 2)]) * np.sqrt(2)
    e = min(len(bus), s + len(snd))
    if s < 0:
        snd = snd[-s:]
        s = 0
    bus[s:e] += snd[: e - s]


# ---------------------------------------------------------------- Geräusche

def sfx(name: str) -> np.ndarray:
    return load(SRC / "sfx" / name)


def stretch(y: np.ndarray, tempo=1.0, pitch=1.0) -> np.ndarray:
    return ffmpeg_filter(y, f"rubberband=tempo={tempo}:pitch={pitch}:transients=smooth")


def loop_to(y: np.ndarray, seconds: float, xf=0.4) -> np.ndarray:
    n = int(seconds * SR)
    k = int(xf * SR)
    out = y.copy()
    while len(out) < n + k:
        a = out[:-k]
        b = out[-k:] * np.linspace(1, 0, k)[:, None] + y[:k] * np.linspace(0, 1, k)[:, None]
        out = np.concatenate([a, b, y[k:]])
    return fade(out[:n], 0.3, 0.6)


def whoosh(length=0.6, f0=300, f1=4500, rise=True) -> np.ndarray:
    """Luftzug: Rauschen durch wandernden Bandpass (natürlicher Schwung, kein Ton)."""
    n = int(length * SR)
    noise = rng.standard_normal((n, 2))
    u = np.linspace(0, 1, n)
    fc = f0 * (f1 / f0) ** (u if rise else 1 - u)

    def bp(fcv):
        lo, hi = fcv / 1.6, min(fcv * 1.6, SR / 2 - 500)
        return signal.butter(2, [lo, hi], "band", fs=SR)
    y = varying_biquad(noise, bp, fc)
    env = np.sin(np.pi * u) ** (1.6 if rise else 1.0)
    if rise:
        env = u ** 2.2
    return (y * env[:, None] / (np.abs(y).max() + 1e-9)).astype(np.float32)


def heartbeat() -> np.ndarray:
    """Zwei dumpfe Herzschläge (lub-dub) aus gefiltertem Rauschen."""
    n = int(0.9 * SR)
    out = np.zeros(n)
    for start, amp in ((0.0, 1.0), (0.22, 0.7)):
        k = int(0.16 * SR)
        t = np.arange(k) / SR
        burst = rng.standard_normal(k) * np.exp(-t / 0.035)
        burst = butter(butter(burst, "low", 90, 4), "high", 25, 2)
        s = int(start * SR)
        out[s:s + k] += amp * burst / (np.abs(burst).max() + 1e-9)
    return stereo(np.tanh(1.5 * out))


def fire_crackle(seconds=4.0) -> np.ndarray:
    n = int(seconds * SR)
    bed = butter(butter(rng.standard_normal((n, 2)), "low", 2200, 2), "high", 250, 2) * 0.06
    for _ in range(int(seconds * 28)):
        s = rng.integers(0, n - 800)
        k = rng.integers(60, 600)
        click = rng.standard_normal(k) * np.exp(-np.arange(k) / (k / 5))
        click = butter(click, "high", 1200, 2)
        bed[s:s + k] += (rng.uniform(0.1, 0.9) * click)[:, None] * np.array([rng.uniform(.5, 1), rng.uniform(.5, 1)])
    return fade(bed.astype(np.float32), 0.4, 0.8)


def reverse_swell(seconds=1.0) -> np.ndarray:
    """Rückwärts abgespielter Donner-Nachhall als Sog vor dem Drop."""
    th = sfx("thunder_b.mp3")
    tail = reverb(th[: int(1.2 * SR)], IR_HALL)[: int(seconds * SR)]
    sw = tail[::-1].copy()
    return (sw / (np.abs(sw).max() + 1e-9) * np.linspace(0.2, 1, len(sw))[:, None] ** 2).astype(np.float32)


# ---------------------------------------------------------------- Mischung

def main():
    voc, C, beats, sections, marks = build_vocal()
    N = len(voc) + int(3.5 * SR)
    pad = lambda c, v=0.0: np.concatenate([c, np.full(N - len(c), v)])
    voc = np.concatenate([voc, np.zeros((N - len(voc), 2), np.float32)])
    for k in C:
        C[k] = pad(C[k], {"lp": 16000, "gain": -120}.get(k, 0.0))
    T = lambda name: marks[name]

    # --- Stimme bearbeiten
    v = varying_biquad(voc, lowshelf_design, C["shelf"])
    v = varying_biquad(v, lp_design, C["lp"])
    v = varying_biquad(v, lp_design, C["lp"])
    v = butter(v, "high", 45, 2)
    v = saturate(v / (np.abs(v).max() + 1e-9) * 0.9, C["drive"])

    # Stopp-Schläge: Gesang setzt für einen Schlag aus, nur der Treffer steht im Raum
    gate = np.ones(N)
    beat_out = BEAT_LEN / BASE
    for key in ("arm", "eye", "leg"):
        s, e = int(T(key) * SR), int((T(key) + beat_out * 0.95) * SR)
        gate[s:e] = 0.0
    gate = signal.lfilter([0.02], [1, -0.98], gate)  # 1-2 ms Glättung gegen Knackser
    v *= (gate * 10 ** (C["gain"] / 20))[:, None]

    # --- Schlag-Spur aus der Stimme
    hits = []  # (t, art) für die Zeitleiste – Bild reagiert auf genau diese Treffer
    perc = np.zeros((N, 2))
    sec_beats = lambda name: [b["t"] for b in beats if b["sec"] == name]
    # Geschichte beginnt: halbe Zeit (jeder zweite Schlag), schwer – im letzten Takt jeder Schlag
    for i, t in enumerate(sec_beats("chant")):
        if i % 2 == 0 or i >= 12:
            place(perc, DUM_HALF if i < 12 else DUM, t, 1.0)
            hits.append((t, "dum"))
    for name in ("verse", "build", "drop1", "deep", "abrek", "finale"):
        for t in sec_beats(name):
            place(perc, DUM, t, 1.0)
            hits.append((t, "dum"))
    booms = [T("towers"), T("drop1"), T("arm"), T("eye"), T("leg"), T("abrek"), T("drop2"), T("recap")]
    for t in booms:
        place(perc, BOOM, t, 1.0)
        hits.append((t, "boom"))
    last = sections["stutter3"][1]
    place(perc, BOOM, last, 1.0)
    hits.append((last, "boom"))
    # Stotterer: Bild blitzt mit, Ton bleibt nur Stimme
    for name in ("stutter", "stutter2", "stutter3"):
        a, e = sections[name]
        for k in range(4):
            hits.append((a + k * (e - a) / 4, "stutter"))
    # doppelte Schläge entfernen (Boom ersetzt Dum)
    boom_t = {round(t, 3) for t, k in hits if k == "boom"}
    hits = [(t, k) for t, k in hits if k == "boom" or round(t, 3) not in boom_t]

    # Ducking: Stimme und Bass weichen den Schlägen kurz aus (Pumpen)
    duck = np.zeros(N)
    for t, kind in hits:
        if kind in ("dum", "boom", "eighth"):
            s = int(t * SR)
            k = int(0.25 * SR)
            depth = {"boom": 0.6, "dum": 0.45, "eighth": 0.2}[kind]
            e = min(N, s + k)
            duck[s:e] = np.maximum(duck[s:e], depth * np.exp(-np.arange(e - s) / (0.12 * SR)))
    duck = signal.lfilter([0.15], [1, -0.85], duck)
    v *= (1 - duck)[:, None]

    # --- Sub-Bass: Stimme eine Oktave tiefer, nur unter 95 Hz (als Bass hörbar, nicht als Stimme)
    sub = ffmpeg_filter(voc.mean(axis=1).astype(np.float32), "rubberband=pitch=0.5:formant=shifted")[:N]
    sub = np.concatenate([sub, np.zeros(N - len(sub))])
    sub = butter(sub, "low", 95, 4)
    sub = butter(sub, "high", 30, 2)
    sub = np.tanh(3 * sub / (np.abs(sub).max() + 1e-9))
    sub = stereo(sub * C["sub"] * (1 - 1.6 * duck).clip(0, 1) * gate)

    # --- Hall (getrennter Bus)
    verb = reverb(v * C["verb"][:, None], IR_HALL)[:N]

    # --- Geräusche (keine gesprochenen Wörter – auf Wunsch entfernt)
    fx = np.zeros((N, 2))
    wind = loop_to(stretch(sfx("wind_b.mp3"), tempo=0.6, pitch=0.85), 6.0)
    clash = sfx("clash_b.mp3")
    clashes = [clash[int(a * SR): int(a * SR) + int(0.75 * SR)] for a in (0.18, 0.98, 2.22)]
    # Einstieg: Wind und Wolf sofort ab Frame 0
    place(fx, wind, 0.0, 0.55)
    place(fx, stretch(sfx("wolf_b.mp3"), tempo=0.5, pitch=0.95), 0.03, 0.6, pan=-0.2)
    place(fx, reverb(stretch(sfx("wolf_b.mp3"), tempo=0.5, pitch=0.95), IR_HALL)[: 3 * SR], 0.03, 0.28, pan=0.3)
    # Dzurdzuketien / Simsir
    place(fx, butter(sfx("thunder_b.mp3"), "low", 1200, 2), T("dzurdzuk") - 0.02, 0.5)
    place(fx, sfx("thunder_b.mp3"), T("towers") - 0.01, 0.8)  # Chant öffnet sich: Donner + Bass-Schlag
    place(fx, sfx("horses_a.mp3"), T("simsir") - 0.4, 0.5, pan=0.25)
    place(fx, reverb(sfx("horses_a.mp3"), IR_ROOM)[: 6 * SR], T("timur") - 0.2, 0.35, pan=-0.25)
    # Stahl auf den Taktanfängen der Strophe
    for i, key in enumerate(("mansur", "bibolt", "war")):
        place(fx, clashes[i % 3], T(key) - 0.01, 0.5, pan=(-0.3, 0.3, 0.0)[i])
    for k, t in enumerate(sec_beats("verse")[9:12]):  # Kaukasuskrieg: Klingen im Takt
        place(fx, clashes[(k + 1) % 3], t, 0.35, pan=(-0.4, 0.4)[k % 2])
    place(fx, fire_crackle(4.5), T("war") - 0.3, 0.35)
    place(fx, sfx("march_a.mp3"), T("mansur") + 0.05, 0.45)
    # Anlauf: Sog, Bandstopp, Herzschlag in der Stille
    place(fx, whoosh(1.1, 250, 6000, True), sections["build"][0] + 0.05, 0.35)
    place(fx, reverse_swell(0.95), sections["breath"][1] - 0.95, 0.75)
    place(fx, heartbeat(), sections["breath"][0] - 0.05, 0.9)
    # DROP: Donner + Steinschlag; Stopp-Schläge mit Stahl und Stein
    place(fx, sfx("thunder_b.mp3"), T("drop1") - 0.01, 0.95)
    place(fx, sfx("stone_a.mp3"), T("drop1"), 0.8)
    for key in ("arm", "eye", "leg"):
        place(fx, clashes[0], T(key), 0.75)
        place(fx, reverb(clashes[0], IR_HALL)[: int(2 * SR)], T(key), 0.3)
        place(fx, sfx("stone_a.mp3"), T(key), 0.6)
    place(fx, clashes[1], T("fought"), 0.45)
    place(fx, whoosh(0.5, 4000, 300, False), T("quote") - 0.02, 0.4)
    place(fx, wind[: int(4 * SR)], T("quote"), 0.35)
    place(fx, sfx("stone_a.mp3"), T("abrek"), 0.6)
    place(fx, sfx("horses_a.mp3"), T("zelimkhan") - 0.3, 0.4, pan=0.3)
    # 1944: Wind, Herzschlag, Stille
    place(fx, sfx("thunder_b.mp3"), T("born") - 0.02, 0.55)
    place(fx, loop_to(stretch(sfx("wind_b.mp3"), tempo=0.5, pitch=0.75), sections["y1944"][1] - sections["y1944"][0] + 1.0), T("born"), 0.7)
    for k in range(3):
        place(fx, heartbeat(), T("deport") + k * 1.25, 0.55 - 0.1 * k)
    # Aufstieg und Finale
    place(fx, whoosh(sections["rise"][1] - sections["rise"][0] + 0.3, 200, 7000, True), sections["rise"][0], 0.5)
    place(fx, reverse_swell(1.0), T("drop2") - 1.0, 0.8)
    place(fx, sfx("thunder_b.mp3"), T("drop2") - 0.01, 1.0)
    place(fx, sfx("stone_a.mp3"), T("drop2"), 0.85)
    place(fx, sfx("horses_a.mp3"), T("freedom") - 0.2, 0.45)
    place(fx, clashes[2], T("recap"), 0.6)
    place(fx, sfx("thunder_b.mp3"), T("nokhchi"), 0.8)
    # Ende: letzter Schlag, Nachhall, Wolf
    end0 = sections["end"][0]
    place(fx, sfx("thunder_b.mp3"), end0, 0.7)
    place(fx, stretch(sfx("wolf_b.mp3"), tempo=0.5, pitch=0.95), end0 + 0.45, 0.55, pan=0.2)
    place(fx, reverb(stretch(sfx("wolf_b.mp3"), tempo=0.5, pitch=0.95), IR_HALL)[: 3 * SR], end0 + 0.45, 0.25, pan=-0.2)
    place(fx, wind, end0 + 0.2, 0.35)

    # --- Summe
    mix = 0.9 * v + 0.34 * verb + 1.35 * stereo(perc) + 0.8 * sub + 0.85 * fx
    mix = butter(mix, "high", 22, 2)
    # Bus-Kompression (sanft) über RMS-Hüllkurve
    env = np.sqrt(signal.lfilter([0.002], [1, -0.998], (mix ** 2).mean(axis=1)))
    thr = db(-14)
    g = np.where(env > thr, (thr / np.maximum(env, 1e-9)) ** 0.45, 1.0)
    mix *= g[:, None]
    # Lautheit wie üblich bei Edits: kräftig, aber mit Luft für die Schläge
    meter = pyloudnorm.Meter(SR)
    loud = meter.integrated_loudness(mix[: int(sections["end"][0] * SR)])
    mix *= db(-9.5 - loud)
    mix = limiter(mix, db(-1.0))
    total = sections["end"][1] + 0.4
    mix = fade(mix[: int(total * SR)], 0.002, 0.25)
    out = ROOT / "public" / "audio" / "mix.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, mix.astype(np.float32), SR, subtype="PCM_24")

    tl = dict(
        fps=30, duration=round(total, 4), beatLen=round(beat_out, 5), base=BASE,
        sections={k: [round(a, 4), round(b, 4)] for k, (a, b) in sections.items()},
        marks=marks,
        beats=beats,
        hits=sorted([dict(t=round(t, 4), kind=k) for t, k in hits], key=lambda h: h["t"]),
    )
    (ROOT / "src" / "timeline.json").write_text(json.dumps(tl, indent=1))
    print(f"mix.wav: {total:.2f} s, Lautheit vorher {loud:.1f} LUFS, Spitze {20*np.log10(np.abs(mix).max()):.1f} dBFS")
    for k, (a, b) in sections.items():
        print(f"  {k:10s} {a:6.2f} – {b:6.2f}")
    print("  Marken:", {k: round(x, 2) for k, x in marks.items()})


if __name__ == "__main__":
    main()
