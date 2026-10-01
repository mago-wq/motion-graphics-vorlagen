#!/usr/bin/env python3
"""Erzeugt alle Toneffekte des Teleshopping-Videos per Code (nur numpy).

Uebernommen aus coralclub-ad (Einschlag, Strich, Kasse, Stempel, Riss, Wasser,
Pop, Tick, Klack, Abschluss) und ergaenzt um die typischen Geraeusche alter
TV-Werbung: Plattenkratzer, Glitzer, Gong-Ding, Fernseher-Einschalten,
Rausch-Zapp und ein grosser Zoom-Whoosh. Keine Samples, alles synthetisch.
Die Musik kommt getrennt aus scripts/generate_music.py.

Ausgabe:
  public/sfx/*.wav              44,1 kHz, 16 bit, Stereo
  src/audio/sfx-manifest.json   Dateiname, Laenge und "Anker" je Effekt.
                                Der Anker ist der Moment im File, der auf das
                                Bild-Ereignis fallen soll (z. B. der Klick beim
                                Aufsetzen des Produkts). src/audio/cues.ts legt
                                die Effekte damit framegenau an.

Neu erzeugen:  npm run sfx   (Zufall ist geseedet -> identische Dateien)
"""
import json
import wave
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "sfx"
MANIFEST = ROOT / "src" / "audio" / "sfx-manifest.json"

rng = np.random.default_rng(2026)


# ---------------------------------------------------------------- Grundbausteine

def time_axis(dur):
    return np.arange(int(round(dur * SR))) / SR


def noise(n):
    return rng.standard_normal(n)


def svf(x, cutoff, q=0.707, mode="bp"):
    """Zustandsvariablen-Filter (TPT). cutoff darf pro Sample variieren,
    damit lassen sich Sweeps (Whoosh) bauen. mode: lp | bp | hp."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    g = np.tan(np.pi * np.clip(cutoff, 20.0, SR * 0.45) / SR)
    k = 1.0 / q
    a1 = 1.0 / (1.0 + g * (g + k))
    a2 = g * a1
    a3 = g * a2
    a1, a2, a3, xs = a1.tolist(), a2.tolist(), a3.tolist(), x.tolist()
    ic1 = ic2 = 0.0
    lp, bp = [0.0] * len(xs), [0.0] * len(xs)
    for i, v0 in enumerate(xs):
        v3 = v0 - ic2
        v1 = a1[i] * ic1 + a2[i] * v3
        v2 = ic2 + a2[i] * ic1 + a3[i] * v3
        ic1 = 2.0 * v1 - ic1
        ic2 = 2.0 * v2 - ic2
        lp[i], bp[i] = v2, v1
    lp, bp = np.array(lp), np.array(bp)
    if mode == "lp":
        return lp
    if mode == "bp":
        return bp * k  # normiert: 0 dB in der Mitte des Bandes
    return x - k * bp - lp


def peak_norm(x):
    m = np.max(np.abs(x))
    return x / m if m > 0 else x


def fades(x, fade_in=0.002, fade_out=0.01):
    """Kurze Blenden gegen Knackser am Anfang und Ende."""
    n_in, n_out = int(fade_in * SR), int(fade_out * SR)
    x = x.copy()
    if n_in:
        x[:n_in] *= np.linspace(0, 1, n_in)
    if n_out:
        x[-n_out:] *= np.linspace(1, 0, n_out) ** 2
    return x


def pan(mono, position):
    """Konstante Leistung. position -1 (links) .. +1 (rechts), auch als Kurve."""
    p = np.broadcast_to(np.asarray(position, dtype=float), mono.shape)
    angle = (p + 1.0) * np.pi / 4.0
    return np.stack([mono * np.cos(angle), mono * np.sin(angle)], axis=1)


def smoothstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def damped_modes(t, modes):
    """Summe gedaempfter Sinus-Schwingungen [(freq, amp, tau), ...].
    Unharmonische Frequenzen -> Metall/Holz, keine Tonfolge."""
    return sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / tau) for f, a, tau in modes)


# ---------------------------------------------------------------- Effekte

def einschlag(strong=False):
    """Tiefer Bassschlag: fallender Sinus-Sweep + Rausch-Kante + dumpfer Koerper."""
    dur = 0.72 if strong else 0.42
    t = time_axis(dur)
    n = len(t)
    f_end, f_drop, drop_tau = (36.0, 125.0, 0.05) if strong else (50.0, 100.0, 0.028)
    freq = f_end + f_drop * np.exp(-t / drop_tau)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * (1 - np.exp(-t / 0.0015)) * np.exp(-t / (0.26 if strong else 0.12))
    edge = peak_norm(svf(noise(n), 2600 if strong else 2000, 0.7, "lp")) * np.exp(-t / 0.004)
    thud = peak_norm(svf(noise(n), 160, 0.9, "lp")) * np.exp(-t / 0.05)
    mono = body + 0.30 * edge + 0.55 * thud
    mono = np.tanh(1.8 * peak_norm(mono))  # leichte Saettigung fuer Druck
    stereo = pan(mono, 0.0)
    if strong:
        # breiter Nachhall-Rumpeln, links/rechts unkorreliert
        tail_env = (1 - np.exp(-t / 0.02)) * np.exp(-t / 0.22)
        left = peak_norm(svf(noise(n), 110, 0.8, "lp")) * tail_env
        right = peak_norm(svf(noise(n), 110, 0.8, "lp")) * tail_env
        stereo += 0.22 * np.stack([left, right], axis=1)
    return fades(stereo[:, 0]), fades(stereo[:, 1]), 0.004


def whoosh(dur, f_start, f_peak, f_end, peak_at, q, pan_from, pan_to, air=0.35):
    """Luftzug: Bandrauschen, dessen Mittenfrequenz hoch- und wieder runterlaeuft."""
    t = time_axis(dur)
    n = len(t)
    rise = f_start * (f_peak / f_start) ** np.clip(t / peak_at, 0, 1)
    fall = f_peak * (f_end / f_peak) ** np.clip((t - peak_at) / (dur - peak_at), 0, 1)
    center = np.where(t < peak_at, rise, fall)
    body = svf(noise(n), center, q, "bp")
    airy = svf(noise(n), center * 3.2, 0.9, "bp")
    envelope = np.where(
        t < peak_at,
        smoothstep(t / peak_at) ** 1.5,
        (1 - np.clip((t - peak_at) / (dur - peak_at), 0, 1)) ** 2.2,
    )
    mono = peak_norm((body + air * airy) * envelope)
    position = pan_from + (pan_to - pan_from) * smoothstep(t / (peak_at * 1.6))
    stereo = pan(mono, position)
    return fades(stereo[:, 0]), fades(stereo[:, 1]), peak_at


def klack():
    """Weiches Klack beim Einrasten: gedaempfter Holzton + kurzer Klick."""
    dur = 0.13
    t = time_axis(dur)
    n = len(t)
    click = peak_norm(svf(noise(n), 2400, 0.7, "lp")) * np.exp(-t / 0.0022)
    wood = damped_modes(t, [(640, 1.0, 0.022), (1390, 0.5, 0.013), (2210, 0.28, 0.008), (330, 0.45, 0.03)])
    mono = svf(0.6 * click + 0.8 * peak_norm(wood), 4200, 0.7, "lp")
    stereo = pan(peak_norm(mono), 0.0)
    return fades(stereo[:, 0], 0.0005), fades(stereo[:, 1], 0.0005), 0.002


def tick():
    """Ein einzelner Tick. Immer dieselbe Datei -> gleichbleibende Tonhoehe."""
    dur = 0.035
    t = time_axis(dur)
    n = len(t)
    click = peak_norm(svf(noise(n), 1800, 0.7, "hp")) * np.exp(-t / 0.0007)
    body = np.sin(2 * np.pi * 2350 * t) * np.exp(-t / 0.0035)
    mono = peak_norm(0.5 * click + 0.8 * body)
    stereo = pan(mono, 0.0)
    return fades(stereo[:, 0], 0.0003, 0.004), fades(stereo[:, 1], 0.0003, 0.004), 0.0


def abschluss_schlag():
    """Dezenter Abschluss-Schlag: weicher Bass-Puls + leiser Luftschweif, kein Ton."""
    dur = 0.62
    t = time_axis(dur)
    n = len(t)
    freq = 58 + 70 * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * (1 - np.exp(-t / 0.003)) * np.exp(-t / 0.17)
    edge = peak_norm(svf(noise(n), 1400, 0.7, "lp")) * np.exp(-t / 0.006)
    mono = np.tanh(1.3 * peak_norm(body + 0.22 * edge))
    air_env = smoothstep(t / 0.03) * np.exp(-t / 0.18)
    air_l = peak_norm(svf(noise(n), 6500, 0.8, "hp")) * air_env
    air_r = peak_norm(svf(noise(n), 6500, 0.8, "hp")) * air_env
    stereo = pan(mono, 0.0) + 0.07 * np.stack([air_l, air_r], axis=1)
    return fades(stereo[:, 0]), fades(stereo[:, 1]), 0.004


def pop():
    """Sehr leises Pop fuer den pulsierenden Button."""
    dur = 0.085
    t = time_axis(dur)
    n = len(t)
    freq = 260 + 520 * np.exp(-t / 0.009)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * (1 - np.exp(-t / 0.0008)) * np.exp(-t / 0.016)
    click = peak_norm(svf(noise(n), 3000, 0.7, "lp")) * np.exp(-t / 0.0012)
    stereo = pan(peak_norm(body + 0.15 * click), 0.0)
    return fades(stereo[:, 0], 0.0005), fades(stereo[:, 1], 0.0005), 0.004


def strich(dur=0.26, bright=1.0):
    """Filzstift-Strich quer ueber den Preis: helles Rauschen, dessen Band nach
    oben zieht, mit fuenf winzigen Kanten (die fuenf Farbsegmente)."""
    t = time_axis(dur)
    n = len(t)
    center = 1800 * bright * (4.2 ** smoothstep(t / (dur * 0.7)))
    body = svf(noise(n), center, 1.4, "bp")
    env = smoothstep(t / 0.02) * (1 - np.clip(t / dur, 0, 1)) ** 1.6
    edges = np.zeros(n)
    for k in range(5):
        start = int((0.012 + k * 0.03) * SR)
        length = int(0.006 * SR)
        edges[start:start + length] += np.hanning(length)
    mono = peak_norm(body * env * (0.7 + 0.6 * edges))
    stereo = pan(mono, np.linspace(-0.55, 0.55, n))  # laeuft mit dem Strich von links nach rechts
    return fades(stereo[:, 0], 0.001), fades(stereo[:, 1], 0.001), 0.0


def fall(dur=0.55):
    """Durchgestrichener Preis kippt weg: Luftzug, dessen Band nach unten faellt."""
    t = time_axis(dur)
    n = len(t)
    center = 2400 * (0.12 ** (t / dur))
    body = svf(noise(n), center, 1.6, "bp")
    env = smoothstep(t / 0.05) * (1 - t / dur) ** 1.4
    mono = peak_norm(body * env)
    stereo = pan(mono, np.linspace(0.0, -0.4, n))
    return fades(stereo[:, 0]), fades(stereo[:, 1]), 0.0


def kaching():
    """Muenze trifft auf: zwei kurze Metall-Anschlaege (unharmonisch) und ein
    kleines Klirren. Anker ist der erste Anschlag."""
    dur = 0.5
    t = time_axis(dur)
    n = len(t)
    out = np.zeros(n)
    for offset, amp, detune in [(0.0, 1.0, 1.0), (0.055, 0.6, 1.07), (0.12, 0.25, 0.96)]:
        tc = np.clip(t - offset, 0, None)
        on = (t >= offset).astype(float)
        metal = damped_modes(tc, [
            (2630 * detune, 1.0, 0.09),
            (3950 * detune, 0.75, 0.07),
            (5710 * detune, 0.5, 0.05),
            (7480 * detune, 0.35, 0.035),
            (1810 * detune, 0.3, 0.06),
        ])
        click = svf(noise(n), 4000, 0.7, "hp") * np.exp(-tc / 0.0008)
        out += amp * on * (peak_norm(metal) + 0.5 * peak_norm(click))
    stereo = pan(peak_norm(out), 0.1)
    return fades(stereo[:, 0], 0.0005), fades(stereo[:, 1], 0.0005), 0.001


def stempel():
    """Stempel knallt aufs Papier: dumpfer Schlag + kurzer Papier-Klatsch."""
    dur = 0.3
    t = time_axis(dur)
    n = len(t)
    freq = 70 + 90 * np.exp(-t / 0.02)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * (1 - np.exp(-t / 0.001)) * np.exp(-t / 0.06)
    slap = peak_norm(svf(noise(n), 1700, 0.9, "bp")) * np.exp(-t / 0.012)
    mono = np.tanh(1.5 * peak_norm(body + 0.8 * slap))
    stereo = pan(mono, 0.15)
    return fades(stereo[:, 0], 0.0005), fades(stereo[:, 1], 0.0005), 0.003


def chirp(t, start, f0, rise, tau):
    """Einzelnes Blaeschen: kurzer Sinus, dessen Tonhoehe schnell steigt."""
    tb = np.clip(t - start, 0, None)
    on = (t >= start).astype(float)
    freq = f0 * (1 + rise * (1 - np.exp(-tb / 0.01)))
    phase = 2 * np.pi * np.cumsum(freq * on) / SR
    return on * np.sin(phase) * np.exp(-tb / tau)


def wasser():
    """Sachet ins Wasser: Plopp (Tropfen-Resonanz mit steigender Tonhoehe),
    danach ein paar aufsteigende Blaeschen. Anker ist der Plopp."""
    dur = 0.7
    t = time_axis(dur)
    n = len(t)
    at = 0.02
    tc = np.clip(t - at, 0, None)
    plop = chirp(t, at, 380, 2.4, 0.045)
    splash = peak_norm(svf(noise(n), 3200, 0.8, "bp")) * smoothstep(t / at) * np.exp(-tc / 0.03)
    bubbles = np.zeros(n)
    start = at + 0.08
    while start < dur - 0.08:
        bubbles += chirp(t, start, rng.uniform(900, 1700), 1.2, 0.012) * rng.uniform(0.2, 0.5)
        start += rng.uniform(0.035, 0.07)
    mono = peak_norm(plop + 0.3 * splash + 0.55 * bubbles)
    stereo = pan(mono, np.linspace(0, 0.3, n))
    return fades(stereo[:, 0], 0.001), fades(stereo[:, 1]), at


def riss():
    """Stick wird aufgerissen, Pulver rieselt: knisternde Rausch-Koerner, dann
    ein feines, helles Rieseln. Anker ist der erste Riss."""
    dur = 0.6
    t = time_axis(dur)
    n = len(t)
    tear = np.zeros(n)
    pos = 0.0
    while pos < 0.16:
        start, length = int(pos * SR), int(rng.uniform(0.002, 0.007) * SR)
        tear[start:start + length] += rng.uniform(0.4, 1.0) * np.hanning(length)
        pos += rng.uniform(0.003, 0.011)
    tear = svf(noise(n), 2600, 0.8, "bp") * tear
    sprinkle_env = smoothstep((t - 0.12) / 0.06) * np.clip(1 - (t - 0.18) / (dur - 0.18), 0, 1) ** 1.5
    grains = (rng.random(n) < 0.02) * rng.uniform(0.2, 1.0, n)
    sprinkle = svf(grains + 0.08 * noise(n), 7000, 0.9, "hp") * sprinkle_env
    mono = peak_norm(peak_norm(tear) + 0.35 * peak_norm(sprinkle))
    stereo = pan(mono, np.linspace(-0.2, 0.2, n))
    return fades(stereo[:, 0], 0.0005), fades(stereo[:, 1]), 0.001


def glas():
    """Glasflaeschchen setzt auf: harter Klick + helle, unharmonische Glasresonanz."""
    dur = 0.6
    t = time_axis(dur)
    n = len(t)
    click = peak_norm(svf(noise(n), 3000, 0.7, "hp")) * np.exp(-t / 0.0012)
    ring = damped_modes(t, [
        (2140, 1.0, 0.16),
        (3390, 0.6, 0.12),
        (5210, 0.45, 0.08),
        (7330, 0.3, 0.05),
        (1260, 0.25, 0.1),
    ])
    thud = peak_norm(svf(noise(n), 300, 0.8, "lp")) * np.exp(-t / 0.02)
    mono = peak_norm(0.7 * click + 0.8 * peak_norm(ring) + 0.4 * thud)
    stereo = pan(mono, -0.1)
    return fades(stereo[:, 0], 0.0005), fades(stereo[:, 1]), 0.001


def blubb():
    """Weiches Aufspringen (Preis-Schild): kurzer Plopp nach oben, trocken."""
    dur = 0.12
    t = time_axis(dur)
    body = chirp(t, 0.0, 300, 2.3, 0.025) * (1 - np.exp(-t / 0.0008))
    stereo = pan(peak_norm(body), 0.0)
    return fades(stereo[:, 0], 0.0005), fades(stereo[:, 1], 0.0005), 0.004


# ---------------------------------------------------------------- TV-Werbung (neu)

def kratzer():
    """Plattenkratzer: zwei schnelle Hin-und-Her-Striche. Ein Bandrauschen und ein
    gesaegter Ton laufen mit derselben Tonhoehenkurve, wie eine angehaltene Platte."""
    dur = 0.42
    t = time_axis(dur)
    n = len(t)
    # Abspielgeschwindigkeit: vor, zurueck, vor (Betrag = Tonhoehe)
    rate = np.interp(t, [0, 0.07, 0.13, 0.2, 0.27, 0.42], [0.2, 1.6, 0.1, 1.9, 0.4, 0.0])
    center = 300 + 1500 * rate
    body = svf(noise(n), center, 2.2, "bp")
    phase = np.cumsum(180 * rate) / SR
    tone = 2.0 * (phase % 1.0) - 1.0
    tone = svf(tone, 2500, 0.7, "lp")
    env = smoothstep(t / 0.01) * np.clip(rate / 1.9, 0, 1) ** 0.6 * (1 - t / dur) ** 0.5
    mono = np.tanh(2.0 * peak_norm(peak_norm(body) + 0.45 * peak_norm(tone)) * env)
    stereo = pan(peak_norm(mono), np.interp(t, [0, 0.2, 0.42], [-0.2, 0.25, 0.0]))
    return fades(stereo[:, 0], 0.001), fades(stereo[:, 1]), 0.0


def glitzer():
    """Glitzern beim Stern/Produkt: zehn helle, kurze, unharmonische Pings,
    gestaffelt und im Stereobild verteilt."""
    dur = 0.75
    t = time_axis(dur)
    n = len(t)
    left, right = np.zeros(n), np.zeros(n)
    for k in range(10):
        start = 0.012 + k * 0.042 + rng.uniform(-0.01, 0.01)
        f = rng.uniform(3200, 7600)
        tc = np.clip(t - start, 0, None)
        on = (t >= start).astype(float)
        ping = on * damped_modes(tc, [(f, 1.0, 0.07), (f * 1.51, 0.4, 0.04)]) * (1 - np.exp(-tc / 0.0006))
        amp = 0.9 ** k
        p = rng.uniform(-0.8, 0.8)
        left += amp * ping * np.cos((p + 1) * np.pi / 4)
        right += amp * ping * np.sin((p + 1) * np.pi / 4)
    shimmer = svf(noise(n), 9000, 0.8, "hp") * smoothstep(t / 0.05) * np.exp(-t / 0.18)
    left, right = left + 0.05 * shimmer, right + 0.05 * shimmer
    m = max(np.max(np.abs(left)), np.max(np.abs(right)))
    return fades(left / m, 0.0005), fades(right / m), 0.012


def ding():
    """Gong-Ding wie in der Spielshow: Glockenteiltoene (1 : 2,76 : 5,40 : 8,93),
    harter Anschlag, langes Ausklingen. Fuer den Preis-Moment."""
    dur = 1.1
    t = time_axis(dur)
    n = len(t)
    f = 1046.5
    bell = damped_modes(t, [(f, 1.0, 0.42), (f * 2.0, 0.35, 0.3), (f * 2.76, 0.45, 0.18),
                            (f * 5.40, 0.25, 0.08), (f * 8.93, 0.12, 0.04)])
    strike = peak_norm(svf(noise(n), 5000, 0.7, "hp")) * np.exp(-t / 0.0015)
    mono = peak_norm(peak_norm(bell) * (1 - np.exp(-t / 0.0007)) + 0.25 * strike)
    stereo = pan(mono, 0.0)
    return fades(stereo[:, 0], 0.0005), fades(stereo[:, 1], 0.002, 0.05), 0.001


def tv_an():
    """Roehrenfernseher geht an: dumpfes Klacken, kurzes statisches Knistern,
    das in einem steigenden Brummen verschwindet."""
    dur = 0.5
    t = time_axis(dur)
    n = len(t)
    thunk = damped_modes(t, [(95, 1.0, 0.05), (210, 0.4, 0.03)]) * (1 - np.exp(-t / 0.001))
    static = svf(noise(n), 3500, 0.6, "bp") * smoothstep(t / 0.01) * np.exp(-t / 0.09)
    crackle = (rng.random(n) < 0.004) * rng.uniform(0.3, 1.0, n)
    crackle = svf(crackle, 4500, 0.8, "hp") * np.exp(-t / 0.12)
    sweep = np.sin(2 * np.pi * np.cumsum(120 + 900 * smoothstep(t / dur)) / SR) * smoothstep(t / 0.05) * (1 - t / dur) ** 2
    mono = peak_norm(peak_norm(thunk) + 0.55 * peak_norm(static) + 0.3 * peak_norm(crackle) + 0.12 * sweep)
    stereo = pan(mono, 0.0)
    return fades(stereo[:, 0], 0.0005), fades(stereo[:, 1]), 0.001


def zapp():
    """Kurzes Rauschen wie beim Senderwechsel (Schnitt ins Schwarzweiss)."""
    dur = 0.22
    t = time_axis(dur)
    n = len(t)
    hiss = svf(noise(n), 4200, 0.5, "bp")
    hum = np.sign(np.sin(2 * np.pi * 50 * t)) * 0.3
    env = smoothstep(t / 0.004) * (1 - np.clip(t / dur, 0, 1)) ** 1.3
    mono = np.tanh(1.6 * peak_norm(hiss + 0.25 * svf(hum, 900, 0.7, "lp")) * env)
    l = peak_norm(mono + 0.2 * svf(noise(n), 6000, 0.7, "hp") * env)
    r = peak_norm(mono + 0.2 * svf(noise(n), 6000, 0.7, "hp") * env)
    return fades(l, 0.0005), fades(r), 0.0


# ---------------------------------------------------------------- Pegel & Export

# Spitzenpegel je Datei in dBFS. Effekte liegen hier leiser als in coralclub-ad,
# weil der Sprecher fuehrt: Die Stimme steht bei etwa -16 LUFS, Effekte setzen
# Akzente zwischen den Woertern, nie darueber.
SOUNDS = {
    "einschlag": (lambda: einschlag(False), -9.0),
    "einschlag_stark": (lambda: einschlag(True), -5.0),
    "strich": (strich, -11.0),
    "kaching": (kaching, -10.0),
    "stempel": (stempel, -9.0),
    "wasser": (wasser, -10.0),
    "riss": (riss, -11.0),
    "klack": (klack, -13.0),
    "tick": (tick, -18.0),
    "pop": (pop, -18.0),
    "abschluss_schlag": (abschluss_schlag, -8.0),
    "wisch": (lambda: whoosh(0.45, 260, 1500, 420, 0.2, 0.9, -0.7, 0.7, air=0.5), -13.0),
    "zoom": (lambda: whoosh(0.8, 180, 2400, 260, 0.55, 0.8, 0.6, -0.6, air=0.6), -10.0),
    "kratzer": (kratzer, -9.0),
    "glitzer": (glitzer, -15.0),
    "ding": (ding, -11.0),
    "tv_an": (tv_an, -10.0),
    "zapp": (zapp, -15.0),
}


def write_wav(path, left, right):
    data = np.stack([left, right], axis=1)
    pcm = np.clip(np.round(data * 32767), -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for name, (make, peak_db) in SOUNDS.items():
        left, right, anchor = make()
        stereo = np.stack([left, right], axis=1)
        stereo = stereo / np.max(np.abs(stereo)) * 10 ** (peak_db / 20)
        write_wav(OUT_DIR / f"{name}.wav", stereo[:, 0], stereo[:, 1])
        manifest[name] = {
            "file": f"sfx/{name}.wav",
            "duration": round(len(left) / SR, 4),
            "anchor": round(anchor, 4),
        }
        print(f"{name:24s} {len(left) / SR:5.2f} s   Spitze {peak_db:6.1f} dBFS   Anker {anchor * 1000:4.0f} ms")
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"-> {OUT_DIR.relative_to(ROOT)}/ und {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
