#!/usr/bin/env python3
"""Erzeugt das Musikbett public/ton/musik.wav per Code (numpy + scipy) und
src/musik-ereignisse.json mit den Zeitpunkten, die auch das Bild nutzt.

Stil: Teleshopping-Werbung der 2000er. 120 BPM, C-Dur (C | Am | F | G),
Funk-Bass, Offbeat-Klavierakkorde, Bläser-Stabs, Fanfare. Der Ablauf richtet
sich nach dem Sprecher (src/sprecher.json), nicht nach festen Takten:

  Start         TV geht an, Bläser-Hit, Groove A unter "Meine Damen und Herren"
  "Kennen ..."  Bandstopp (der Groove leiert aus), Schwarzweiß-Teil: nur ein
                leises Moll-Pad, Uhr tickt (Effekt aus cues.ts)
  nach "nix?"   trauriges Posaunen-"Wah-wah-wah-waaah"
  "Darf ich vorstellen:"  Trommelwirbel
  "Oceanmin"    Becken + Fanfare, Groove B setzt ein
  nach Claim    Musik stoppt hart (Plattenkratzer), "Aber das ist noch nicht
                alles!" über Riser und Wirbel
  danach        Einschlag, Groove C (dichter, mit Bläser-Riffs)
  Ende CTA      Schluss-Fanfare, klingt aus, letzte halbe Sekunde Stille

Die Musik wird unter der Stimme automatisch abgesenkt (Ducking aus der
Hüllkurve von public/ton/sprecher.wav), damit jedes Wort verständlich bleibt.

Neu erzeugen: npm run musik   (nach jeder neuen Sprecherspur)
"""
import json
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
VO = json.loads((ROOT / "src" / "sprecher.json").read_text(encoding="utf-8"))
VO_WAV = ROOT / "public" / "ton" / "sprecher.wav"
OUT = ROOT / "public" / "ton" / "musik.wav"
EVENTS_OUT = ROOT / "src" / "musik-ereignisse.json"

BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(2003)

# ---------------------------------------------------------------- Zeitplan aus dem Sprecher

LINES = {l["id"]: l for l in VO["zeilen"]}


def word_start(line_id, prefix):
    """Beginn des ersten Worts der Zeile, das mit prefix anfängt (ohne Groß/klein)."""
    for w in LINES[line_id]["woerter"]:
        if w["w"].lower().strip(".,!?:–-").startswith(prefix.lower()):
            return w["s"]
    raise SystemExit(f"Wort '{prefix}' in Zeile {line_id} nicht gefunden – Sprecherspur prüfen")


def word_end(line_id, prefix):
    for w in LINES[line_id]["woerter"]:
        if w["w"].lower().strip(".,!?:–-").startswith(prefix.lower()):
            return w["e"]
    raise SystemExit(f"Wort '{prefix}' in Zeile {line_id} nicht gefunden")


VO_END = LINES["cta"]["ende"]
EV = {
    "start": 0.0,
    "bandstopp": LINES["kennen"]["start"] - 0.12,
    "posaune": LINES["kaffee"]["ende"] + 0.05,
    "wirbel": LINES["reveal"]["start"],
    "fanfare": word_start("reveal", "ocean"),
    "stopp": LINES["claim"]["ende"] + 0.04,
    "einschlag": LINES["abernoch"]["ende"] + 0.02,
    "preis": word_start("preis", "neunzehn"),
    "schluss": VO_END + 0.08,
}
# Posaune: drei kurze Töne und ein langer (Bb, A, Ab, G); Bild sackt auf jedem Ton ab
POSAUNE = [(58, 0.2), (57, 0.2), (56, 0.2), (55, 0.6)]
DUR = round(EV["schluss"] + 1.75, 3)  # Fanfare + Nachklang + 0,5 s Stille
EV["stillAb"] = round(DUR - 0.5, 3)
EV["dauer"] = DUR
N = int(DUR * SR)

# ---------------------------------------------------------------- Bausteine


def tax(d):
    return np.arange(int(d * SR)) / SR


def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, kind, fs=SR, output="sos"), x)


def saw(f, t):
    return 2.0 * ((f * t) % 1.0) - 1.0


def norm(x):
    m = np.max(np.abs(x))
    return x / m if m > 0 else x


def adsr(n, a, d, s, r):
    e = np.full(n, s, dtype=float)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na) if na else e[:na]
    nd = min(nd, n - na)
    e[na:na + nd] = np.linspace(1, s, nd) if nd else e[na:na + nd]
    nr = min(nr, n)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def place(buf, start, sig, gain=1.0, pan=0.0):
    i = int(round(start * SR))
    if i >= len(buf) or i + len(sig) <= 0:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    sig = sig[: len(buf) - i]
    ang = (pan + 1) * np.pi / 4
    if sig.ndim == 1:
        buf[i:i + len(sig), 0] += gain * sig * np.cos(ang)
        buf[i:i + len(sig), 1] += gain * sig * np.sin(ang)
    else:
        buf[i:i + len(sig)] += gain * sig


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


# --- Schlagzeug

def kick():
    t = tax(0.32)
    f = 48 + 95 * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    click = filt(rng.standard_normal(len(t)), "lowpass", 3000) * np.exp(-t / 0.003)
    return np.tanh(1.6 * norm(body + 0.25 * click))


def snare():
    t = tax(0.22)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    nz = filt(rng.standard_normal(len(t)), "bandpass", [1200, 7000]) * np.exp(-t / 0.06)
    return norm(0.6 * body + nz)


def clap():
    t = tax(0.2)
    nz = filt(rng.standard_normal(len(t)), "bandpass", [900, 3500])
    env = np.zeros(len(t))
    for k, off in enumerate([0, 0.011, 0.022]):
        env += (t >= off) * np.exp(-np.clip(t - off, 0, None) / (0.006 if k < 2 else 0.07))
    return norm(nz * env)


def hat(open_=False):
    t = tax(0.25 if open_ else 0.05)
    nz = filt(rng.standard_normal(len(t)), "highpass", 7500)
    return norm(nz * np.exp(-t / (0.08 if open_ else 0.012)))


def crash():
    t = tax(2.2)
    nz = filt(rng.standard_normal(len(t)), "highpass", 4500)
    l = norm(nz * np.exp(-t / 0.7))
    nz2 = filt(rng.standard_normal(len(t)), "highpass", 4500)
    r = norm(nz2 * np.exp(-t / 0.7))
    return np.stack([l, r], 1)


def snare_roll(dur):
    """Trommelwirbel mit Crescendo, 32tel."""
    out = np.zeros(int(dur * SR) + SR)
    step = BEAT / 8
    k = 0
    while k * step < dur:
        g = 0.25 + 0.75 * (k * step / dur) ** 1.6
        s = snare()
        i = int(k * step * SR)
        out[i:i + len(s)] += g * s * rng.uniform(0.85, 1.0)
        k += 1
    return out[: int(dur * SR) + int(0.2 * SR)]


# --- Tonales

def bass_note(f, d):
    t = tax(d)
    x = 0.6 * saw(f, t) + 0.5 * np.sign(np.sin(2 * np.pi * f * t))
    cutoff_env = 300 + 1600 * np.exp(-t / 0.06)
    # zeitvariabler Tiefpass grob in Blöcken
    y = np.zeros_like(x)
    blk = 256
    for i in range(0, len(x), blk):
        y[i:i + blk] = filt(x[max(0, i - 512):i + blk], "lowpass", float(cutoff_env[i]))[-len(x[i:i + blk]):]
    sub = np.sin(2 * np.pi * f * t)
    return (0.7 * y + 0.6 * sub) * adsr(len(t), 0.004, 0.08, 0.7, 0.03)


def ep_chord(freqs, d):
    """E-Piano-artiger Offbeat-Akkord (FM-Sinus, kurz)."""
    t = tax(d)
    out = np.zeros(len(t))
    for f in freqs:
        mod = np.sin(2 * np.pi * f * 2 * t) * 1.3 * np.exp(-t / 0.12)
        out += np.sin(2 * np.pi * f * t + mod)
    return norm(out) * adsr(len(t), 0.003, 0.1, 0.35, 0.05)


def brass(freqs, d, fall=False):
    """Synth-Bläser: verstimmte Sägezähne, Filter öffnet beim Anschlag."""
    t = tax(d)
    out = np.zeros(len(t))
    for f in freqs:
        bend = (1 - 0.06 * np.clip((t - d * 0.55) / (d * 0.45), 0, 1) ** 2) if fall else 1.0
        for det in (-0.012, -0.004, 0.005, 0.013):
            ph = np.cumsum(f * (1 + det) * bend) / SR
            out += 2.0 * (ph % 1.0) - 1.0
    cut = 900 + 3800 * np.exp(-t / 0.09) + 900 * (1 - np.exp(-t / 0.3))
    y = np.zeros_like(out)
    blk = 256
    for i in range(0, len(out), blk):
        y[i:i + blk] = filt(out[max(0, i - 512):i + blk], "lowpass", float(min(cut[i], 9000)))[-len(out[i:i + blk]):]
    vib = 1 + 0.02 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.25) / 0.2, 0, 1)
    return norm(y) * adsr(len(t), 0.012, 0.12, 0.75, min(0.12, d * 0.4)) * vib


def pad(freqs, d):
    t = tax(d)
    out = np.zeros(len(t))
    for f in freqs:
        for det in (-0.006, 0.0, 0.007):
            out += saw(f * (1 + det), t)
    out = filt(out, "lowpass", 900)
    return norm(out) * adsr(len(t), 0.4, 0.2, 0.9, 0.5)


def trombone(notes):
    """Trauriges Posaunen-Wah-wah: Sägezahn durch Formant-Bandpass, letzter Ton mit Vibrato."""
    out = []
    for i, (n, d) in enumerate(notes):
        t = tax(d)
        f = midi(n) * (1 - 0.015 * np.clip(t / d, 0, 1))
        if i == len(notes) - 1:
            f = f * (1 + 0.035 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.25, 0, 1))
        x = 2.0 * ((np.cumsum(f) / SR) % 1.0) - 1.0
        wah = filt(x, "bandpass", [450, 1400]) + 0.4 * filt(x, "lowpass", 500)
        env = adsr(len(t), 0.03, 0.05, 0.85, 0.06 if i < len(notes) - 1 else 0.35)
        if i < len(notes) - 1:
            env *= 0.6 + 0.4 * np.sin(np.pi * np.clip(t / d, 0, 1))  # "Wah" pro Ton
        out.append(norm(wah) * env)
    return np.concatenate(out)


def riser(d):
    t = tax(d)
    f = 300 * (12 ** (t / d))
    x = filt(rng.standard_normal(len(t)), "highpass", 800)
    tone = saw(1, np.cumsum(f) / SR) * 0.15
    return norm(x * (t / d) ** 2 + tone * (t / d) ** 1.5)


def tape_stop(x, dur):
    """Band läuft aus: Abspielgeschwindigkeit fällt von 1 auf 0."""
    n = int(dur * SR)
    rate = (1 - np.linspace(0, 1, n)) ** 1.6
    pos = np.cumsum(rate)
    pos = pos[pos < len(x) - 1]
    i = pos.astype(int)
    frac = pos - i
    y = x[i] * (1 - frac[:, None]) + x[i + 1] * frac[:, None]
    fade = np.linspace(1, 0, len(y)) ** 0.5
    return y * fade[:, None]


# ---------------------------------------------------------------- Groove

C, Am, F, G = (48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62])
PROG = [C, Am, F, G]
BASS_PATTERN = [(0, 0, 0.35), (0.75, 12, 0.2), (1.5, 0, 0.2), (2, 7, 0.35), (2.75, 12, 0.2), (3.5, 10, 0.2)]


def groove(dur, dense=False):
    """Groove ab Zeit 0 (Takt-Eins), Länge dur. dense: 16tel-Hats + Bläser-Riffs."""
    buf = np.zeros((int(dur * SR) + SR, 2))
    k, sn, cl, hc, ho = kick(), snare(), clap(), hat(), hat(True)
    bars = int(np.ceil(dur / BAR))
    for b in range(bars):
        root, chord = PROG[b % 4]
        t0 = b * BAR
        for beat in range(4):
            place(buf, t0 + beat * BEAT, k, 0.9)
            if beat in (1, 3):
                place(buf, t0 + beat * BEAT, sn, 0.5, -0.05)
                place(buf, t0 + beat * BEAT + 0.004, cl, 0.4, 0.1)
            # Hats
            subs = 4 if dense else 2
            for s in range(subs):
                tt = t0 + beat * BEAT + s * BEAT / subs
                is_off = (s == subs // 2)
                place(buf, tt, ho if (is_off and beat == 3) else hc, 0.22 if is_off else 0.14, 0.35)
            # Offbeat-Akkord
            place(buf, t0 + beat * BEAT + BEAT / 2, ep_chord([midi(n) for n in chord], 0.22), 0.20, -0.3)
        for pos, iv, d in BASS_PATTERN:
            place(buf, t0 + pos * BEAT, bass_note(midi(root + iv - 12 + 12), d), 0.55)
        if dense and b % 2 == 1:
            # kurzes Bläser-Riff am Taktende: zwei Stabs
            place(buf, t0 + 3 * BEAT, brass([midi(n + 12) for n in chord], 0.16), 0.22, 0.2)
            place(buf, t0 + 3.5 * BEAT, brass([midi(n + 12) for n in chord], 0.3), 0.25, 0.2)
    return buf[: int(dur * SR)]


def fanfare(big=True):
    """Ta-ta-taaaa: Dur-Dreiklang aufwärts, letzter Ton gehalten."""
    notes = [([67, 72], 0.12), ([72, 76], 0.12), ([76, 79, 84], 0.9 if big else 0.55)]
    out = []
    for i, (ns, d) in enumerate(notes):
        out.append(brass([midi(n) for n in ns], d, fall=(i == len(notes) - 1)))
    return np.concatenate(out)


# ---------------------------------------------------------------- Zusammenbau

def build():
    mix = np.zeros((N + SR, 2))

    # Groove A: von 0 bis Bandstopp, danach leiert er aus
    ga = groove(EV["bandstopp"] + 1.0)
    pre = ga[: int(EV["bandstopp"] * SR)]
    mix[: len(pre)] += pre
    stop = tape_stop(ga[int(EV["bandstopp"] * SR):], 0.55)
    place(mix, EV["bandstopp"], stop, 1.0)
    # Bläser-Hit auf der Eins
    place(mix, 0.0, brass([midi(n) for n in [60, 64, 67, 72]], 0.45, fall=True), 0.45)
    place(mix, 0.0, crash(), 0.25)

    # Schwarzweiß-Teil: leises Moll-Pad (Am -> Dm)
    sw_dur = EV["wirbel"] - EV["bandstopp"] - 0.3
    half = sw_dur / 2
    place(mix, EV["bandstopp"] + 0.3, pad([midi(n) for n in [45, 57, 60, 64]], half + 0.4), 0.16)
    place(mix, EV["bandstopp"] + 0.3 + half, pad([midi(n) for n in [50, 57, 62, 65]], half + 0.2), 0.16)
    # Wah-wah nach "nix?"
    place(mix, EV["posaune"], trombone(POSAUNE), 0.5, 0.1)

    # Trommelwirbel auf "Darf ich vorstellen", Fanfare + Groove B ab "Oceanmin"
    roll_len = EV["fanfare"] - EV["wirbel"]
    place(mix, EV["wirbel"], snare_roll(roll_len), 0.32, -0.1)
    place(mix, EV["fanfare"], crash(), 0.4)
    place(mix, EV["fanfare"], fanfare(), 0.42)
    gb = groove(EV["stopp"] - EV["fanfare"])
    place(mix, EV["fanfare"], gb, 1.0)

    # Harter Stopp, Riser unter "Aber das ist noch nicht alles!"
    r_len = EV["einschlag"] - EV["stopp"]
    place(mix, EV["stopp"] + 0.15, riser(r_len - 0.15), 0.18)
    place(mix, EV["stopp"] + r_len * 0.45, snare_roll(r_len * 0.55), 0.22)

    # Groove C bis zur Schluss-Fanfare
    place(mix, EV["einschlag"], crash(), 0.45)
    place(mix, EV["einschlag"], brass([midi(n) for n in [60, 64, 67, 72]], 0.5, fall=True), 0.42)
    gc_ = groove(EV["schluss"] - EV["einschlag"], dense=True)
    place(mix, EV["einschlag"], gc_, 1.0)
    # Preis: Bläser-Stab
    place(mix, EV["preis"], brass([midi(n) for n in [67, 72, 76]], 0.35, fall=True), 0.3, 0.15)

    # Schluss
    place(mix, EV["schluss"], crash(), 0.45)
    place(mix, EV["schluss"], fanfare(big=True), 0.5)
    place(mix, EV["schluss"], kick(), 0.9)
    return mix[:N]


def duck(mix):
    """Musik unter der Stimme absenken: -7 dB bei Sprache, schnell runter, langsam hoch."""
    with wave.open(str(VO_WAV)) as w:
        sr = w.getframerate()
        ch = w.getnchannels()
        vo = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").reshape(-1, ch).mean(1) / 32768
    if sr != SR:
        raise SystemExit("sprecher.wav muss 44,1 kHz haben")
    vo = np.pad(vo, (0, max(0, len(mix) - len(vo))))[: len(mix)]
    win = int(0.02 * SR)
    env = np.sqrt(np.convolve(vo ** 2, np.ones(win) / win, mode="same"))
    active = np.clip(env / 0.02, 0, 1)
    # Hüllkurve: Attack 25 ms, Release 350 ms
    g = np.zeros_like(active)
    a_att, a_rel = np.exp(-1 / (0.025 * SR)), np.exp(-1 / (0.35 * SR))
    prev = 0.0
    for i, v in enumerate(active):
        coef = a_att if v > prev else a_rel
        prev = coef * prev + (1 - coef) * v
        g[i] = prev
    gain = 10 ** (-7 * g / 20)
    return mix * gain[:, None], gain


def main():
    mix = build()
    # Handy-Lautsprecher: unter 45 Hz weg, leichte Präsenz
    mix = np.stack([filt(mix[:, c], "highpass", 45) for c in range(2)], 1)
    mix = mix / np.max(np.abs(mix)) * 0.5  # Arbeitspegel
    mix, gain = duck(mix)
    # Musik insgesamt: Spitzen um -6 dBFS; unter Sprache liegt sie so ca. 15–17 dB
    # unter der Stimme (npm run check misst das), in den Lücken trägt sie
    mix = mix / np.max(np.abs(mix)) * 10 ** (-6 / 20)
    still = int(EV["stillAb"] * SR)
    fade = int(0.25 * SR)
    mix[still - fade:still] *= np.linspace(1, 0, fade)[:, None]
    mix[still:] = 0
    pcm = np.clip(np.round(mix * 32767), -32768, 32767).astype("<i2")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    toene = list(np.round(np.cumsum([0] + [d for _, d in POSAUNE[:-1]]), 3))
    EVENTS_OUT.write_text(json.dumps({"_hinweis": "Erzeugt von scripts/generate_music.py – nicht von Hand ändern.",
                                      **{k: round(v, 3) for k, v in EV.items()},
                                      "posauneToene": [float(x) for x in toene]}, indent=1) + "\n", encoding="utf-8")
    print(f"Fertig: {OUT.relative_to(ROOT)} ({DUR:.2f} s), Ereignisse: {EVENTS_OUT.relative_to(ROOT)}")
    for k, v in EV.items():
        print(f"  {k:10s} {v:7.3f} s")


if __name__ == "__main__":
    main()
