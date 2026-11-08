#!/usr/bin/env python3
"""Baut die Tonspur des Edits und die Zeitleiste für Remotion.

Eingang (nicht im Repo, siehe scripts/fetch_nasheed.sh):
  assets-src/nasheed/original.wav   Nasheed „ملحمة الشيشان“ (reiner Chor, keine Instrumente)
  assets-src/sfx/*                  natürliche Geräusche (Wind, Wolf, Donner, Stahl, Pferde, Schritte)

Ausgang:
  public/audio/mix.wav   fertige Tonspur (44,1 kHz, Stereo, −9,5 LUFS)
  src/timeline.json      alle Zeitpunkte in Sekunden der Ausgabe (Wörter, Rufe, Schläge, Treffer)

Aufbau wie in der TikTok-Referenz 1 (Frage/Antwort, dann Drop):
  cold  0,35 s Wind + Wolf
  l2    „حسبوا اقتحامك نزهة لجيوشهم“  – Sie dachten, dich zu stürmen sei ein Spaziergang für ihre Heere
  l3    „كلا فتلك عرائن الشجعان“       – Nein. Das ist das Revier der Tapferen.
  drop  sechs Rufe „شيشان!“ – Bass und Schläge aus der Stimme
  end   Nachhall, Wolfsgeheul

Grundsatz (Wunsch des Auftraggebers, wie im nokhchi-edit): keine Instrumente, keine
Synthesizer-Töne, keine Trommeln. Bass und „Dum“-Schläge werden aus der Stimme selbst geformt
(verlangsamter Vokal, Tonhöhe fällt wie bei einem 808; Sub-Bass = Stimme eine Oktave tiefer,
nur < 95 Hz). Dazu nur natürliche Geräusche. Schläge schwer und tief, keine hellen Klicks.
"""
from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import pyloudnorm
import soundfile as sf
from scipy import signal
from scipy.ndimage import minimum_filter1d

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
SR = 44100
BASE = 1.18  # wie ein beschleunigter TikTok-Sound (Tempo und Tonhöhe, wie eine Bandmaschine)
rng = np.random.default_rng(11)

# Quellzeiten (Sekunden im Original) – gemessen an Hüllkurve und Reibelauten, siehe README
L2 = (31.20, 39.02)       # حسبوا اقتحامك نزهة لجيوشهم
L3 = (39.02, 44.31)       # كلا فتلك عرائن الشجعان  (direkt anschließend, gleiche Aufnahme)
DROP = (138.42, 157.22)   # شيشان ×6 (Chor, zweite Dreiergruppe eine Oktave tiefer)
COLD = 0.35
END = 2.7

# Wortanfänge (Quelle, grob) → werden auf den nächsten Einsatz eingerastet.
# Schlüssel = Anker für die Einblendungen in src/words.ts
WORDS = {
    "sie": 31.30, "dachten": 32.30,            # حسبوا  (ḥa-si-bū)
    "dich": 33.62, "stuermen": 34.33,           # اقتحامك (iq-ti-ḥā-mak)
    "sei": 34.95, "spaziergang": 35.48,         # نزهة   (nuz-ha-tan)
    "fuer": 36.55, "heere": 37.30,              # لجيوشهم (li-ju-yū-shi-him)
    "nein": 39.02,                              # كلا
    "dasist": 40.15,                            # فتلك
    "revier": 40.85,                            # عرائن
    "der": 42.28, "tapferen": 42.60,            # الشجعان (ash-shuj-ʿān)
}
# Rufe: „Shi“ (Auftakt) und „shan“ (Hauptton) – Reibelaut-Spitzen, werden eingerastet
SHI = [138.55, 141.86, 144.88, 148.15, 151.22, 154.35]
SHAN = [139.25, 142.29, 145.33, 148.62, 151.66, 154.83]


# ---------------------------------------------------------------- Hilfen

def db(x: float) -> float:
    return 10 ** (x / 20)


def load(path: Path, mono=False) -> np.ndarray:
    if path.suffix.lower() != ".wav":
        tmp = Path(tempfile.mkdtemp()) / "x.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-ar", str(SR), "-ac", "2", str(tmp)], check=True)
        path = tmp
    y, sr = sf.read(path, dtype="float32", always_2d=True)
    if sr != SR:
        y = signal.resample_poly(y, SR, sr, axis=0).astype(np.float32)
    if y.shape[1] == 1:
        y = np.repeat(y, 2, axis=1)
    return y.mean(axis=1) if mono else y[:, :2]


def ffmpeg_filter(y: np.ndarray, af: str) -> np.ndarray:
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
    shape = (lambda n: np.linspace(0, 1, n)[:, None]) if y.ndim == 2 else (lambda n: np.linspace(0, 1, n))
    if a:
        y[:a] *= shape(a)
    if b:
        y[-b:] *= shape(b)[::-1]
    return y


def stereo(y: np.ndarray) -> np.ndarray:
    return np.stack([y, y], axis=1) if y.ndim == 1 else y


def make_ir(seconds=2.6, predelay=0.025, lp=6500, seed=1) -> np.ndarray:
    """Synthetischer Hall (exponentiell abklingendes, dekorreliertes Rauschen)."""
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = r.standard_normal((n, 2)) * np.exp(-6.9 * t / seconds)[:, None]
    ir = butter(ir, "low", lp, 2)
    ir = np.concatenate([np.zeros((int(predelay * SR), 2)), ir])
    return (ir / np.sqrt((ir ** 2).sum(axis=0))).astype(np.float32)


IR_HALL = make_ir(3.2, 0.035, 5000, 1)   # Bergschlucht: lang, dunkel
IR_ROOM = make_ir(0.9, 0.012, 7000, 2)


def reverb(y: np.ndarray, ir=IR_HALL) -> np.ndarray:
    y = stereo(y)
    return np.stack([signal.fftconvolve(y[:, c], ir[:, c])[: len(y) + len(ir)] for c in range(2)], axis=1)


def varying_biquad(y: np.ndarray, design, values: np.ndarray, block=256) -> np.ndarray:
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


def lowshelf_design(gain_db, f0=150.0, q=0.7):
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
    sm = signal.lfilter([1 - a], [1, -a], g)
    return y * np.minimum(g, sm)[:, None]


def place(bus: np.ndarray, sound: np.ndarray, t: float, gain=1.0, pan=0.0):
    s = int(round(t * SR))
    snd = stereo(sound) * gain
    if pan:
        snd = snd * np.array([np.sqrt(0.5 - pan / 2), np.sqrt(0.5 + pan / 2)]) * np.sqrt(2)
    if s < 0:
        snd, s = snd[-s:], 0
    if s >= len(bus):
        return
    e = min(len(bus), s + len(snd))
    bus[s:e] += snd[: e - s]


def ramp(points, n):
    """Keyframes [(Anteil 0–1, Wert), …] über n Samples (Konstante erlaubt)."""
    if isinstance(points, (int, float)):
        return np.full(n, float(points))
    xs, ys = zip(*points)
    return np.interp(np.linspace(0, 1, n), xs, ys)


# ---------------------------------------------------------------- Nasheed: Ausschnitte und Einrasten

ORIG = load(SRC / "nasheed" / "original.wav")
MONO = ORIG.mean(axis=1)


def band_env(lo, hi, hop=0.005):
    x = butter(butter(MONO, "high", lo, 4), "low", hi, 4)
    k = int(hop * SR)
    e = np.sqrt(np.convolve(x ** 2, np.ones(3 * k) / (3 * k), mode="same")[::k])
    return e, hop


FRIC, FHOP = band_env(2200, 3900)
_on_env = np.maximum(0, np.diff(np.log(band_env(80, 3900)[0] + 1e-6), prepend=0))


def snap_peak(t, win=0.09):
    """Reibelaut-Spitze („sch“) nahe t."""
    a, b = int((t - win) / FHOP), int((t + win) / FHOP)
    return (a + int(np.argmax(FRIC[a:b]))) * FHOP


def snap_onset(t, win=0.10):
    """Stärkster Pegelanstieg nahe t (Silbeneinsatz)."""
    a, b = int((t - win) / FHOP), int((t + win) / FHOP)
    sm = np.convolve(_on_env, np.ones(4) / 4, mode="same")
    return (a + int(np.argmax(sm[a:b]))) * FHOP


def take(a, b, rate=BASE, fin=0.025, fout=0.03) -> np.ndarray:
    """Ausschnitt [a, b] s, wie Band mit `rate` abgespielt (Tempo und Tonhöhe)."""
    seg = ORIG[int(a * SR): int(b * SR)]
    # 1,18 = 59/50 → exakte Umrechnung ohne Rundungsdrift
    up, down = 50, 59
    assert abs(down / up - rate) < 1e-9
    out = signal.resample_poly(seg, up, down, axis=0).astype(np.float32)
    return fade(out, fin, fout)


# ---------------------------------------------------------------- Stimm-Schläge („Dum“)

def find_grain() -> np.ndarray:
    """Kräftiger, tiefer Vokal aus der zweiten Dreiergruppe der Rufe – Rohstoff aller Schläge."""
    best, best_e = None, -1
    for t in np.arange(148.66, 150.4, 0.02):
        s = int(t * SR)
        g = MONO[s: s + int(0.30 * SR)]
        e = np.sqrt(np.mean(g[: int(0.08 * SR)] ** 2))
        if e > best_e:
            best, best_e = g, e
    return best / (np.abs(best).max() + 1e-9)


GRAIN = find_grain()


def grain_f0() -> float:
    import librosa
    f0, voiced, _ = librosa.pyin(GRAIN[: int(0.25 * SR)], fmin=60, fmax=500, sr=SR, frame_length=2048)
    f = f0[voiced] if voiced.any() else np.array([110.0])
    return float(np.median(f))


F0 = grain_f0()


def make_dum(length=0.8, f_start=118.0, f_end=46.0, sweep=0.09, decay=0.38, punch=0.22) -> np.ndarray:
    """Schwerer „Dum“ aus der Stimme: Vokal so verlangsamt, dass sein Grundton von f_start auf
    f_end fällt (wie ein 808), tiefpassgefiltert bis nur dieser Grundton bleibt. Kein Klick."""
    n = int(length * SR)
    t = np.arange(n) / SR
    f = f_end + (f_start - f_end) * np.exp(-t / sweep)
    pos = np.cumsum(f / F0)
    pos -= pos[0]
    loop = np.concatenate([GRAIN] * 10)
    body = np.interp(pos, np.arange(len(loop)), loop, right=0.0)
    body = butter(butter(body, "low", 150, 4), "high", 25, 2)
    body /= np.abs(body).max() + 1e-9
    body *= np.exp(-t / decay) * np.minimum(1, t / 0.0015)
    k = int(0.06 * SR)
    pr = np.interp(np.cumsum(np.full(k, 0.5)), np.arange(len(GRAIN)), GRAIN)
    pr = butter(butter(pr, "low", 500, 2), "high", 90, 2) * np.exp(-np.arange(k) / (0.018 * SR))
    body[:k] += punch * pr / (np.abs(pr).max() + 1e-9)
    body = np.tanh(2.6 * body) / np.tanh(2.6)
    return fade(body, 0.0005, 0.03)


DUM = make_dum()
DUM_SOFT = make_dum(0.7, 105, 48, 0.08, 0.30, 0.12)
BOOM = make_dum(2.4, 108, 37, 0.16, 0.95, 0.45)


# ---------------------------------------------------------------- Geräusche

def sfx(name: str) -> np.ndarray:
    return load(SRC / "sfx" / name)


def stretch(y: np.ndarray, tempo=1.0, pitch=1.0) -> np.ndarray:
    return ffmpeg_filter(y, f"rubberband=tempo={tempo}:pitch={pitch}:transients=smooth")


def loop_to(y: np.ndarray, seconds: float, xf=0.4) -> np.ndarray:
    n, k = int(seconds * SR), int(xf * SR)
    out = y.copy()
    while len(out) < n + k:
        b = out[-k:] * np.linspace(1, 0, k)[:, None] + y[:k] * np.linspace(0, 1, k)[:, None]
        out = np.concatenate([out[:-k], b, y[k:]])
    return fade(out[:n], 0.3, 0.6)


def reverse_swell(seconds=1.0) -> np.ndarray:
    """Rückwärts abgespielter Donner-Nachhall als Sog vor dem Drop."""
    th = sfx("thunder_b.mp3")
    tail = reverb(th[: int(1.2 * SR)], IR_HALL)[: int(seconds * SR)]
    sw = tail[::-1].copy()
    return (sw / (np.abs(sw).max() + 1e-9) * np.linspace(0.15, 1, len(sw))[:, None] ** 2).astype(np.float32)


def heartbeat() -> np.ndarray:
    n = int(0.9 * SR)
    out = np.zeros(n)
    for start, amp in ((0.0, 1.0), (0.22, 0.7)):
        k = int(0.16 * SR)
        burst = rng.standard_normal(k) * np.exp(-np.arange(k) / SR / 0.035)
        burst = butter(butter(burst, "low", 90, 4), "high", 25, 2)
        s = int(start * SR)
        out[s:s + k] += amp * burst / (np.abs(burst).max() + 1e-9)
    return stereo(np.tanh(1.5 * out))


def exciter(v: np.ndarray) -> np.ndarray:
    """Die Aufnahme endet bei ~4,7 kHz (nach Beschleunigung). Obertöne aus der Stimme selbst
    (Sättigung des oberen Bands, nur der neue Anteil über 5 kHz) geben wieder Luft und Biss."""
    band = butter(butter(v, "high", 2000, 2), "low", 4600, 4)
    harm = np.tanh(5 * band / (np.abs(band).max() + 1e-9))
    harm = butter(harm, "high", 5200, 4)
    return harm / (np.abs(harm).max() + 1e-9)


# ---------------------------------------------------------------- Zusammenbau

def norm(y: np.ndarray, peak=1.0) -> np.ndarray:
    return (y / (np.abs(y).max() + 1e-9) * peak).astype(np.float32)


def loudest(y: np.ndarray, seconds: float) -> np.ndarray:
    """Lautester Ausschnitt der Länge `seconds` (z. B. der eigentliche Knurrer in einer Aufnahme)."""
    n = int(seconds * SR)
    e = np.convolve((y ** 2).mean(axis=1), np.ones(n) / n, mode="valid")
    i = int(np.argmax(e))
    return y[i: i + n]


def crackle(seconds=0.6) -> np.ndarray:
    """Funkenknistern: kurze, gefilterte Knackser (für die Funken-Clips)."""
    n = int(seconds * SR)
    out = np.zeros(n)
    for _ in range(int(seconds * 40)):
        s0 = rng.integers(0, n - 400)
        k = int(rng.integers(40, 300))
        c = rng.standard_normal(k) * np.exp(-np.arange(k) / (k / 5))
        out[s0:s0 + k] += rng.uniform(0.2, 1.0) * c
    return fade(stereo(butter(out, "high", 1500, 2) * 0.5).astype(np.float32), 0.01, 0.2)


# Blitze im Gewitter-Clip (Sekunden im Clip, gemessen an der Helligkeit) – dort kommt Donner
STORM_FLASHES = [0.7, 1.13, 1.43, 1.63]
WOLF_KEYS = {"wolf_loup": "knurren", "wolf_face": "angriff", "wolf_howl_zoo": "angriff",
             "wolf_portrait_v": "knurren", "wolf_howl_rock": "heulen"}
HORSE_KEYS = {"hooves", "horses_mountain", "horses_herd"}
STEEL_KEYS = {"kinjal_met_a", "kinjal_met_b", "weapons_platz"}


def place_plan_sfx(fx, plan, wolves, clashes, stone):
    """Geräusche genau dort, wo man ihr Motiv sieht (Einstellungen aus src/plan.ts)."""
    fps = 30.0
    items = sorted(plan["shots"] + plan["tops"], key=lambda x: x["from"])
    # --- Pferde: echte Hufe (einzelnes Pferd auf Erde), langsamer und tiefer, nur solange Pferde im Bild sind
    runs = []
    for it in plan["shots"]:
        if it["key"] in HORSE_KEYS:
            a, b = it["from"] / fps, it["to"] / fps
            if runs and a - runs[-1][1] < 0.25:
                runs[-1][1] = max(runs[-1][1], b)
            else:
                runs.append([a, b])
    hoof = sfx("mk_hufe_dreck.mp3")[int(0.15 * SR): int(2.05 * SR)]
    hoof = stretch(hoof, tempo=0.78, pitch=0.82)               # weniger, schwerere Schläge
    hoof = varying_biquad(butter(hoof, "low", 3800, 2), lowshelf_design, np.full(len(hoof), 6.0))
    hoof = norm(hoof, 0.9)
    for a, b in runs:
        place(fx, fade(loop_to(hoof, b - a + 0.15, 0.08), 0.06, 0.18), a, 0.62, pan=0.1)
    neigh = norm(loudest(sfx("mk_hengst_wiehern.mp3"), 1.3))
    first_mountain = next((it for it in plan["shots"] if it["key"] == "horses_mountain"), None)
    if first_mountain:
        place(fx, fade(neigh, 0.02, 0.4), first_mountain["from"] / fps, 0.32, pan=-0.2)
    snort = norm(loudest(sfx("mk_pferd_schnauben.mp3"), 0.8))
    for it in plan["shots"]:
        if it["key"] == "chechen_rider_1910":
            place(fx, fade(snort, 0.01, 0.2), it["from"] / fps + 0.05, 0.45, pan=0.15)
    # --- Wölfe: aggressives Knurren/Fauchen auf jedem Wolfsbild (Heulen nur beim heulenden Wolf)
    growl = norm(loudest(sfx("mk_wolf_knurren.mp3"), 0.7))
    attack = norm(loudest(sfx("mk_wolf_angriff.mp3"), 0.9))
    howl_short = norm(fade(wolves[int(3.4 * SR): int(5.0 * SR)], 0.05, 0.5))
    snd = {"knurren": (growl, 0.85), "angriff": (attack, 0.8), "heulen": (howl_short, 0.6)}
    last = {}
    for it in items:
        kind = WOLF_KEYS.get(it["key"])
        if not kind:
            continue
        t = it["from"] / fps
        if t - last.get(it["key"], -9) < 0.6:   # Negativ-Blitz und Einstellung direkt danach: nur einmal
            continue
        last[it["key"]] = t
        y, g = snd[kind]
        place(fx, y, t, g, pan=float(rng.uniform(-0.25, 0.25)))
        place(fx, reverb(y, IR_ROOM)[: len(y) + SR // 2], t, g * 0.25)
    # --- Gewitter: Donner genau auf den Blitzen im Clip
    thunder_hit = norm(sfx("mk_donner_einzel.mp3")[: int(3.0 * SR)])
    for it in plan["shots"]:
        if it["key"] == "storm_peaks":
            for lt in STORM_FLASHES:
                t = it["from"] / fps + (lt - it.get("clipAt", 0))
                if it["from"] / fps <= t < it["to"] / fps:
                    place(fx, fade(thunder_hit, 0.002, 1.0), t, 0.75)
    # --- Stahl auf Dolchen und Waffen, Hammer an der Schmiede, Knistern bei den Funken
    for it in plan["shots"]:
        t = it["from"] / fps
        if it["key"] in STEEL_KEYS:
            place(fx, clashes[sum(map(ord, it["key"])) % 3], t, 0.45, pan=float(rng.uniform(-0.3, 0.3)))
        elif it["key"] == "forge_blade":
            place(fx, butter(clashes[0], "low", 2500, 2), t + 0.02, 0.5)
            place(fx, stone, t + 0.02, 0.45)
        elif it["key"] in ("sparks_fall", "sparks_black"):
            place(fx, crackle((it["to"] - it["from"]) / fps + 0.2), t, 0.5)


def main():
    # Zeitachse der Ausgabe
    t_l2 = COLD
    l23 = take(L2[0], L3[1])                                  # durchgehende Aufnahme
    t_l3 = t_l2 + (L3[0] - L2[0]) / BASE
    t_drop = t_l2 + len(l23) / SR
    drop = take(DROP[0], DROP[1], fin=0.012, fout=0.07)
    t_end = t_drop + len(drop) / SR
    total = t_end + END
    N = int((total + 0.6) * SR)

    def out_t(src: float) -> float:
        if L2[0] <= src <= L3[1]:
            return t_l2 + (src - L2[0]) / BASE
        if DROP[0] <= src <= DROP[1]:
            return t_drop + (src - DROP[0]) / BASE
        raise ValueError(src)

    voc = np.zeros((N, 2), np.float32)
    place(voc, l23, t_l2)
    place(voc, drop, t_drop)

    words = {k: round(out_t(snap_onset(v)), 4) for k, v in WORDS.items()}
    words["nein"] = round(t_l3, 4)  # Schnitt-/Einsatzpunkt selbst
    shi = [out_t(snap_peak(t)) for t in SHI]
    shan = [out_t(snap_peak(t)) for t in SHAN]

    # ---- Effektkurven über die ganze Länge (Keyframes in Ausgabesekunden)
    tt = np.arange(N) / SR

    def curve(points):
        xs, ys = zip(*points)
        return np.interp(tt, xs, ys)

    lp = curve([(0, 2700), (t_l3 - 0.02, 3300), (t_l3 + 0.02, 9000), (t_drop - 0.6, 9000), (t_drop - 0.05, 2600), (t_drop, 20000), (total, 20000)])
    shelf = curve([(0, 3), (t_l3, 4), (t_l3 + 0.05, 7), (t_drop, 7), (t_drop + 0.01, 9), (total, 9)])
    drive = curve([(0, 1.2), (t_l3, 1.3), (t_l3 + 0.05, 1.8), (t_drop, 1.8), (t_drop + 0.01, 2.6), (total, 2.6)])
    gain = curve([(0, -0.5), (t_l3 - 0.01, 0.0), (t_l3 + 0.03, 0), (t_drop, 0), (total, 0)])
    verb = curve([(0, 0.42), (t_l3, 0.38), (t_l3 + 0.05, 0.26), (t_drop - 0.3, 0.32), (t_drop, 0.14), (t_end - 0.4, 0.14), (t_end, 0.55), (total, 0.55)])
    sub_amt = curve([(0, 0), (t_drop - 0.01, 0), (t_drop + 0.02, 1.0), (t_end, 1.0), (t_end + 0.4, 0), (total, 0)])
    exc_amt = curve([(0, 0.0), (t_l3, 0.0), (t_l3 + 0.05, 0.10), (t_drop, 0.10), (t_drop + 0.01, 0.22), (total, 0.22)])

    # ---- Stimme bearbeiten
    v = varying_biquad(voc, lowshelf_design, shelf)
    v = varying_biquad(v, lp_design, lp)
    v = varying_biquad(v, lp_design, lp)
    v = butter(v, "high", 45, 2)
    v = saturate(v / (np.abs(v).max() + 1e-9) * 0.9, drive)
    exc = exciter(v)
    v = v + exc * (exc_amt * 0.5)[:, None] * np.abs(v).max()
    v *= (10 ** (gain / 20))[:, None]

    # ---- Schläge
    hits = []  # (t, art)
    perc = np.zeros((N, 2))
    # Intro: keine Schläge (wie die Referenz) – nur „NEIN.“ und die drei Wörter danach
    place(perc, BOOM, words["nein"], 0.95)
    hits.append((words["nein"], "boom"))
    for k in ("dasist", "revier", "tapferen"):
        place(perc, DUM_SOFT, words[k], 0.55 if k != "tapferen" else 0.75)
        hits.append((words[k], "soft"))
    # Drop: Hauptton („shan“) schwer, zwei Schläge im Raster danach, Auftakt („Shi“) leicht
    beats = []
    for k in range(6):
        d = shan[k]
        b = (shan[k + 1] - d) / 4 if k < 5 else (shan[5] - shan[4]) / 4
        heavy = k in (0, 3, 5)
        place(perc, BOOM if heavy else DUM, d, 1.0 if heavy else 1.05)
        hits.append((d, "boom" if heavy else "dum"))
        beats.append(dict(t=round(d, 4), call=k, beat=0))
        for j in (1, 2):
            if k == 5 and j == 2:
                break
            place(perc, DUM, d + j * b, 0.92)
            hits.append((d + j * b, "dum"))
            beats.append(dict(t=round(d + j * b, 4), call=k, beat=j))
        if k < 5:
            place(perc, DUM_SOFT, shi[k + 1], 0.7)
            hits.append((shi[k + 1], "pickup"))
    # Allererster Auftakt des Drops
    hits.append((shi[0], "pickup"))

    # Ducking: Stimme und Bass weichen den Schlägen kurz aus
    duck = np.zeros(N)
    for t, kind in hits:
        depth = {"boom": 0.55, "dum": 0.42, "soft": 0.2, "pickup": 0.18}[kind]
        s = int(t * SR)
        e = min(N, s + int(0.25 * SR))
        duck[s:e] = np.maximum(duck[s:e], depth * np.exp(-np.arange(e - s) / (0.12 * SR)))
    duck = signal.lfilter([0.15], [1, -0.85], duck)
    v *= (1 - duck)[:, None]

    # ---- Sub-Bass: Stimme eine Oktave tiefer, nur < 95 Hz
    sub = ffmpeg_filter(voc.mean(axis=1).astype(np.float32), "rubberband=pitch=0.5:formant=shifted")[:N]
    sub = np.concatenate([sub, np.zeros(max(0, N - len(sub)))])
    sub = butter(butter(sub, "low", 95, 4), "high", 30, 2)
    sub = np.tanh(3 * sub / (np.abs(sub).max() + 1e-9))
    sub = stereo(sub * sub_amt * (1 - 1.6 * duck).clip(0, 1))

    # ---- Hall
    hall = reverb(v * verb[:, None], IR_HALL)[:N]

    # ---- Zeitleiste jetzt schon schreiben: der Schnittplan (src/plan.ts) hängt an ihr,
    # und die Geräusche hängen am Schnittplan (jedes Geräusch auf „seiner“ Einstellung)
    place(perc, BOOM, t_end - 0.02, 0.55)
    hits.append((t_end - 0.02, "boom"))
    tl = dict(
        fps=30, duration=round(total, 4), base=BASE,
        sections=dict(cold=[0, round(t_l2, 4)], l2=[round(t_l2, 4), round(t_l3, 4)], l3=[round(t_l3, 4), round(t_drop, 4)],
                      drop=[round(t_drop, 4), round(t_end, 4)], end=[round(t_end, 4), round(total, 4)]),
        words=words,
        shi=[round(x, 4) for x in shi], shan=[round(x, 4) for x in shan],
        beats=beats,
        hits=sorted([dict(t=round(t, 4), kind=k) for t, k in hits], key=lambda h: h["t"]),
    )
    (ROOT / "src" / "timeline.json").write_text(json.dumps(tl, indent=1))
    plan = json.loads(subprocess.run(["node", "scripts/export_plan.mjs"], cwd=ROOT, check=True,
                                     capture_output=True, text=True).stdout)

    # ---- Geräusche (keine Wörter, keine Instrumente)
    fx = np.zeros((N, 2))
    wind = loop_to(stretch(sfx("wind_b.mp3"), tempo=0.6, pitch=0.85), N / SR + 0.1)
    wolves = sfx("wolf_howls_nps.ogg")
    thunder = sfx("thunder_b.mp3")
    stone = sfx("stone_a.mp3")
    clash = sfx("clash_b.mp3")
    clashes = [clash[int(a * SR): int(a * SR) + int(0.75 * SR)] for a in (0.18, 0.98, 2.22)]
    march = sfx("march_a.mp3")

    wind_env = curve([(0, 0.0), (0.05, 0.5), (t_drop - 0.2, 0.42), (t_drop, 0.22), (t_end, 0.22), (t_end + 0.3, 0.5), (total, 0.35)])
    fx += wind[:N] * wind_env[:, None]
    # Einstieg: Wolf und ferner Donner sofort ab Frame 0 (Ausschnitt mit ansteigendem Geheul)
    howl_in = fade(wolves[int(3.4 * SR): int(7.4 * SR)], 0.05, 1.6)
    place(fx, howl_in, 0.0, 0.85, pan=-0.15)
    place(fx, reverb(howl_in, IR_HALL)[: 5 * SR], 0.0, 0.25, pan=0.25)
    place(fx, butter(thunder, "low", 900, 2), 0.02, 0.55)
    # „für ihre Heere“: fernes Marschieren (tiefpassgefiltert, im Hall)
    steps = loop_to(march, 2.9, 0.15)
    steps = butter(steps, "low", 1400, 2)
    place(fx, steps * np.linspace(0, 1, len(steps))[:, None] ** 0.7, words["fuer"] - 0.4, 0.55)
    place(fx, reverb(steps, IR_HALL)[: int(3.6 * SR)], words["fuer"] - 0.4, 0.22)
    # „NEIN.“: Donner, Stein, Stahl
    place(fx, thunder, words["nein"] - 0.01, 0.95)
    place(fx, stone, words["nein"], 0.7)
    place(fx, clashes[0], words["nein"], 0.55)
    place(fx, reverb(clashes[0], IR_HALL)[: 2 * SR], words["nein"], 0.25)
    # Sog in den Drop, Herzschlag im letzten Wort
    place(fx, heartbeat(), words["tapferen"] + 0.05, 0.6)
    place(fx, reverse_swell(1.1), shan[0] - 1.1, 0.85)
    # Drop: Donner + Stein auf den schweren Rufen, Stahl sparsam, Pferde unter Ruf 2–5
    for k in (0, 3, 5):
        place(fx, thunder, shan[k] - 0.01, 0.95 if k != 5 else 0.8)
        place(fx, stone, shan[k], 0.65)
    # Blitze auf den leichten Rufen (weißer Blitz im Bild): kurzer, trockener Donnerschlag
    crack = norm(sfx("mk_donner_einzel.mp3")[: int(2.2 * SR)])
    for k in (1, 2, 4):
        place(fx, fade(crack, 0.002, 0.8), shan[k] - 0.01, 0.42)
    place_plan_sfx(fx, plan, wolves, clashes, stone)
    # Ende: Nachhall, Wolfsgeheul, Wind
    howl_out = fade(wolves[int(12.0 * SR): int(16.2 * SR)], 0.25, 1.6)
    place(fx, howl_out, t_end - 0.35, 0.95, pan=0.1)
    place(fx, reverb(howl_out, IR_HALL)[: 6 * SR], t_end - 0.35, 0.35, pan=-0.2)

    # ---- Summe und Mastering
    music = 0.92 * v + 0.36 * hall + 1.3 * stereo(perc) + 0.8 * sub + 0.8 * fx
    loud = master(music, total, ROOT / "public" / "audio" / "mix.wav", t_end)

    print(f"mix.wav: {total:.2f} s, Lautheit vorher {loud:.1f} LUFS, Grundton Korn {F0:.0f} Hz")
    for k, (a, b) in tl["sections"].items():
        print(f"  {k:5s} {a:6.2f} – {b:6.2f}")
    print("  Wörter:", {k: round(x, 2) for k, x in words.items()})
    print("  Shi:", [round(x, 2) for x in shi])
    print("  shan:", [round(x, 2) for x in shan])


def master(mix, total, dest, t_end):
    mix = butter(mix, "high", 22, 2)
    env = np.sqrt(signal.lfilter([0.002], [1, -0.998], (mix ** 2).mean(axis=1)))
    thr = db(-14)
    g = np.where(env > thr, (thr / np.maximum(env, 1e-9)) ** 0.45, 1.0)
    mix = mix * g[:, None]
    meter = pyloudnorm.Meter(SR)
    loud = meter.integrated_loudness(mix[: int(t_end * SR)])
    mix = mix * db(-9.5 - loud)
    mix = limiter(mix, db(-1.0))
    mix = fade(mix[: int(total * SR)], 0.002, 0.35)
    dest.parent.mkdir(parents=True, exist_ok=True)
    sf.write(dest, mix.astype(np.float32), SR, subtype="PCM_24")
    return loud


if __name__ == "__main__":
    main()
