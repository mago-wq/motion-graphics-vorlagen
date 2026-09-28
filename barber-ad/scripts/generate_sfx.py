#!/usr/bin/env python3
"""Erzeugt alle Toneffekte des Barber-Ads per Code (nur numpy).

Keine Musik, keine Samples, keine Melodien: nur gefiltertes Rauschen,
gedaempfte Schwingungen und Klicks. Tonhoehen sind entweder fallende
Bass-Sweeps (Einschlag) oder unharmonische Resonanzen (Metall, Holz).

Ausgabe:
  public/sfx/*.wav              44,1 kHz, 16 bit, Stereo
  src/audio/sfx-manifest.json   Dateiname, Laenge und "Anker" je Effekt.
                                Der Anker ist der Moment im File, der auf das
                                Bild-Ereignis fallen soll (z. B. der Klick beim
                                Schliessen der Schere). src/audio/cues.ts legt
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

rng = np.random.default_rng(1995)


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


def kratzen(dur=0.78):
    """Leises Kratzen einer Feder: Bandrauschen, koernig moduliert."""
    t = time_axis(dur)
    n = len(t)
    bright = svf(noise(n), 3400, 1.3, "bp")
    grit = svf(noise(n), 1500, 2.2, "bp")
    grains = np.zeros(n)
    pos = 0.0
    while pos < dur:
        pos += rng.uniform(0.016, 0.045)
        start, length = int(pos * SR), int(rng.uniform(0.008, 0.028) * SR)
        window = np.hanning(length) * rng.uniform(0.35, 1.0)
        end = min(n, start + length)
        if start < n:
            grains[start:end] += window[: end - start]
    envelope = smoothstep(t / 0.08) * smoothstep((dur - t) / 0.16)
    mono = (0.8 * bright + 0.45 * grit) * (0.3 + grains) * envelope
    stereo = pan(peak_norm(mono), np.linspace(-0.2, 0.2, n))  # wandert mit dem Stift
    return stereo[:, 0], stereo[:, 1], 0.0


def schnipp(variant=0):
    """Scharfes Schnipp: Klingen gleiten (Rauschen), dann metallischer Klick."""
    dur = 0.17
    t = time_axis(dur)
    n = len(t)
    close_at = 0.038  # Anker: Klingen treffen sich
    detune = 1.0 + 0.035 * variant
    slide_env = np.where(t < close_at, (t / close_at) ** 2, np.exp(-(t - close_at) / 0.002))
    slide = peak_norm(svf(noise(n), 6200, 0.8, "hp")) * slide_env
    tc = np.clip(t - close_at, 0, None)
    after = (t >= close_at).astype(float)
    click = peak_norm(svf(noise(n), 2500, 0.7, "hp")) * np.exp(-tc / 0.0009) * after
    metal = damped_modes(tc, [
        (3120 * detune, 1.0, 0.016),
        (4760 * detune, 0.7, 0.012),
        (6930 * detune, 0.5, 0.009),
        (8420 * detune, 0.35, 0.006),
        (2270 * detune, 0.35, 0.02),
    ]) * after
    mono = 0.45 * slide + 1.0 * click + 0.55 * peak_norm(metal)
    stereo = pan(peak_norm(mono), 0.05 if variant else -0.05)
    return fades(stereo[:, 0], 0.001), fades(stereo[:, 1], 0.001), close_at


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


def swish():
    """Kurzes, helles Swish fuer den Goldstreifen; wird zur Seite hin breiter."""
    dur = 0.34
    t = time_axis(dur)
    n = len(t)
    peak_at = 0.09
    center = np.where(t < peak_at, 2600 * (7200 / 2600) ** (t / peak_at), 7200)
    env = np.where(t < peak_at, smoothstep(t / peak_at), (1 - (t - peak_at) / (dur - peak_at)) ** 2.5)
    mid = svf(noise(n), center, 1.1, "bp") * env
    side_l = svf(noise(n), center, 1.1, "bp") * env
    side_r = svf(noise(n), center, 1.1, "bp") * env
    width = smoothstep(t / 0.2)  # Streifen laeuft von der Mitte nach aussen
    left = (1 - width) * mid + width * side_l
    right = (1 - width) * mid + width * side_r
    stereo = np.stack([left, right], axis=1)
    stereo /= np.max(np.abs(stereo))
    return fades(stereo[:, 0]), fades(stereo[:, 1]), 0.05


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


def swipe_rahmen(dur=1.0, card_w=920.0, card_h=820.0):
    """Swipe, waehrend sich der Goldrahmen einmal um die Karte zeichnet.
    Lautstaerke folgt der Zeichengeschwindigkeit (ease-in-out), das Panorama
    folgt der Position des Stifts auf dem Rahmen (oben l->r, rechts, unten r->l, links)."""
    t = time_axis(dur)
    n = len(t)
    u = np.clip(t / dur, 0, 1)
    progress = np.where(u < 0.5, 4 * u**3, 1 - (-2 * u + 2) ** 3 / 2)  # Easing.inOut(cubic)
    speed = np.gradient(progress)
    speed = speed / speed.max()
    perimeter = 2 * (card_w + card_h)
    s = progress * perimeter
    pos = np.select(
        [s < card_w, s < card_w + card_h, s < 2 * card_w + card_h],
        [-0.6 + 1.2 * s / card_w, 0.6, 0.6 - 1.2 * (s - card_w - card_h) / card_w],
        -0.6,
    )
    body = svf(noise(n), 900 + 2600 * speed, 1.0, "bp")
    airy = svf(noise(n), 5200, 0.9, "bp")
    mono = peak_norm((body + 0.25 * airy) * (0.08 + speed) * smoothstep((dur - t) / 0.12))
    stereo = pan(mono, pos)
    return fades(stereo[:, 0], 0.01), fades(stereo[:, 1], 0.01), 0.0


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


# ---------------------------------------------------------------- Pegel & Export

# Spitzenpegel je Datei in dBFS. Die Mischung liegt damit bei etwa -3 dBFS
# (lautester Moment: letzter Einschlag der Hook-Szene). Die leisen Effekte
# liegen bewusst nur 5-15 dB darunter, damit sie auch auf Handy-Lautsprechern
# hoerbar bleiben ("ausgewogen" statt "Hook laut, Rest verschwindet").
SOUNDS = {
    "einschlag": (lambda: einschlag(False), -8.0),
    "einschlag_stark": (lambda: einschlag(True), -3.5),
    "kratzen": (kratzen, -18.0),
    "schnipp_1": (lambda: schnipp(0), -7.0),
    "schnipp_2": (lambda: schnipp(1), -7.5),
    "whoosh_karte_links": (lambda: whoosh(0.36, 520, 2100, 800, 0.1, 1.2, -0.85, 0.0), -11.5),
    "whoosh_karte_rechts": (lambda: whoosh(0.36, 540, 2200, 820, 0.1, 1.2, 0.85, 0.0), -11.5),
    "klack": (klack, -11.0),
    "swish": (swish, -14.0),
    "tick": (tick, -16.0),
    "swipe_rahmen": (swipe_rahmen, -16.0),
    "abschluss_schlag": (abschluss_schlag, -7.5),
    "pop": (pop, -22.0),
    "whoosh_uebergang_seite": (lambda: whoosh(0.5, 260, 1300, 380, 0.17, 0.9, 0.7, -0.7, air=0.5), -9.5),
    "whoosh_uebergang_hoch": (lambda: whoosh(0.5, 220, 1500, 520, 0.17, 0.9, 0.0, 0.0, air=0.5), -10.0),
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
