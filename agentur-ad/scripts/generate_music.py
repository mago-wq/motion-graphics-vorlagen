#!/usr/bin/env python3
"""Erzeugt die Musikspur public/musik.wav per Code (numpy + scipy), keine Samples.

120 BPM, A-Moll (Am | F | C | G), 30 s. Der Ablauf steht in src/musik-plan.json –
dieselbe Datei, aus der src/timing.ts die Szenenwechsel liest. Wer dort einen Drop
verschiebt, muss nur neu erzeugen (npm run musik) und neu rendern; Bild und Musik
bleiben auf dem Beat.

Aufbau:
  0–1 s    Riser, Einschlag auf dem Scroll-Stopp
  1–4 s    Pad + leise Plucks, Riser und Clap-Wirbel in den Drop
  4–8 s    Drop A: Four-on-the-floor, Offbeat-Bass, Sidechain-Pumpen
  8–12 s   Groove B: dunkler, ohne Plucks
  12–18 s  Drop B: alles, mit Arpeggio
  18–24 s  Breakdown: nur Pad + Herzschlag, langer Riser
  24–28 s  Finaler Drop
  28 s     Schlussschlag, Hall klingt aus, ab 29,5 s Stille
"""
import json
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
PLAN = json.loads((ROOT / "src" / "musik-plan.json").read_text())
OUT = ROOT / "public" / "musik.wav"

BEAT = 60 / PLAN["bpm"]
BAR = 4 * BEAT
DUR = PLAN["dauer"]
N = int(DUR * SR)
rng = np.random.default_rng(2026)

# Akkorde je Takt (2 s), Grundton für den Bass
A3, C4, E4, F3, G3, B3, D4 = 220.0, 261.63, 329.63, 174.61, 196.0, 246.94, 293.66
PROG = [
	{"pad": [A3, C4, E4], "bass": 110.0},  # Am
	{"pad": [F3, A3, C4], "bass": 87.31},  # F
	{"pad": [G3, C4, E4], "bass": 130.81},  # C
	{"pad": [G3, B3, D4], "bass": 98.0},  # G
]


def chord_at(t):
	return PROG[int(t // BAR) % 4]


# ---------------------------------------------------------------- Bausteine

def tax(d):
	return np.arange(int(d * SR)) / SR


def filt(x, kind, f, order=2):
	return sosfilt(butter(order, f, kind, fs=SR, output="sos"), x)


def saw(f, t, phase=0.0):
	return 2.0 * ((f * t + phase) % 1.0) - 1.0


def norm(x):
	m = np.max(np.abs(x))
	return x / m if m > 0 else x


def env(n, a=0.003, r=0.02):
	e = np.ones(n)
	na, nr = min(n, int(a * SR)), min(n, int(r * SR))
	if na:
		e[:na] = np.linspace(0, 1, na)
	if nr:
		e[-nr:] *= np.linspace(1, 0, nr)
	return e


def stereo(x, pan=0.0):
	"""pan -1 (links) .. 1 (rechts), gleiche Leistung."""
	a = (pan + 1) * np.pi / 4
	return np.stack([x * np.cos(a), x * np.sin(a)], axis=1) * np.sqrt(2)


class Bus:
	def __init__(self):
		self.x = np.zeros((N, 2))

	def add(self, sound, at, gain=1.0, pan=0.0):
		if sound.ndim == 1:
			sound = stereo(sound, pan)
		i = int(round(at * SR))
		if i >= N:
			return
		j = min(N, i + len(sound))
		self.x[i:j] += sound[: j - i] * gain


def kick(soft=False):
	t = tax(0.5)
	f = 52 + 120 * np.exp(-t / 0.03)
	body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.12 if soft else 0.2))
	click = filt(rng.standard_normal(len(t)), "highpass", 2500) * np.exp(-t / 0.0025) * (0.0 if soft else 0.35)
	x = np.tanh(2.2 * (body + click))
	if soft:
		x = filt(x, "lowpass", 180)
	return norm(x) * env(len(t), 0.0005, 0.05)


def clap():
	t = tax(0.35)
	n = rng.standard_normal(len(t))
	e = np.zeros(len(t))
	for k, off in enumerate([0.0, 0.010, 0.021]):
		i = int(off * SR)
		e[i:] += np.exp(-(t[: len(t) - i]) / (0.004 if k < 2 else 0.11))
	return norm(filt(n * e, "bandpass", [900, 4200]))


def hat(open_=False):
	t = tax(0.45 if open_ else 0.1)
	x = filt(rng.standard_normal(len(t)), "highpass", 7500) * np.exp(-t / (0.16 if open_ else 0.025))
	return norm(x) * env(len(t), 0.0005, 0.01)


def bass(f, d=0.22):
	t = tax(d)
	x = np.sin(2 * np.pi * f * t) + 0.55 * filt(saw(f, t), "lowpass", 700)
	x = np.tanh(1.6 * x)
	return norm(x) * env(len(t), 0.004, 0.05)


def pad(freqs, d, cutoff):
	t = tax(d)
	x = np.zeros(len(t))
	for f in freqs:
		for cents in (-9, 0, 8):
			ff = f * 2 ** (cents / 1200)
			x += saw(ff, t, rng.random())
	x = filt(x, "lowpass", cutoff)
	return norm(x) * env(len(t), 0.25, 0.35)


def pluck(f):
	t = tax(0.35)
	x = saw(f, t) + saw(f * 1.004, t, 0.3)
	bright = filt(x, "lowpass", 5200) * np.exp(-t / 0.035)
	warm = filt(x, "lowpass", 1400) * np.exp(-t / 0.16)
	return norm(bright + warm) * env(len(t), 0.001, 0.05)


def riser(d):
	t = tax(d)
	p = t / d
	n = rng.standard_normal(len(t))
	cuts = [400, 900, 2000, 4500, 9000]
	layers = [filt(n, "lowpass", c) for c in cuts]
	pos = p * (len(cuts) - 1)
	x = np.zeros(len(t))
	for k, layer in enumerate(layers):
		x += np.clip(1 - np.abs(pos - k), 0, 1) * norm(layer)
	tone = np.sin(2 * np.pi * np.cumsum(180 * 2 ** (p * 2.6)) / SR) * 0.35
	return norm(x + tone) * p ** 2.2 * env(len(t), 0.01, 0.004)


def impact(big=True):
	t = tax(2.2 if big else 1.2)
	f = 46 + 70 * np.exp(-t / 0.08)
	boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.7 if big else 0.35))
	noise = filt(rng.standard_normal(len(t)), "lowpass", 3500) * np.exp(-t / (0.25 if big else 0.12)) * 0.6
	return norm(np.tanh(1.5 * (boom + noise))) * env(len(t), 0.0005, 0.2)


def clap_roll(start, end, bus, gain):
	"""Wirbel in den Drop: Sechzehntel, dann Zweiunddreißigstel, lauter werdend."""
	t = start
	while t < end - 1e-6:
		p = (t - start) / (end - start)
		step = BEAT / 4 if p < 0.5 else BEAT / 8
		bus.add(clap(), t, gain * (0.25 + 0.75 * p ** 1.5))
		t += step


def reverb(x, length=1.8, decay=0.45, cutoff=6000):
	t = tax(length)
	ir = np.stack([rng.standard_normal(len(t)), rng.standard_normal(len(t))], axis=1)
	ir *= np.exp(-t / decay)[:, None]
	ir = np.stack([filt(ir[:, c], "lowpass", cutoff) for c in range(2)], axis=1)
	ir /= np.sqrt(np.sum(ir ** 2, axis=0))
	return np.stack([fftconvolve(x[:, c], ir[:, c])[:N] for c in range(2)], axis=1)


# ---------------------------------------------------------------- Arrangement

drums, bass_bus, pads, plucks, fx = Bus(), Bus(), Bus(), Bus(), Bus()
kick_times = []

d_a, d_b, d_c = PLAN["drops"]
groove_b, breakdown, end_hit = PLAN["grooveB"], PLAN["breakdown"], PLAN["endSchlag"]

# Abschnitte: (von, bis, Kick, Clap, Hats 16tel, Open Hat, Bass, Pad-Cutoff, Plucks, Pad-Pegel)
SECTIONS = [
	(1.0, d_a, False, False, False, False, False, 1100, "achtel", 1.6),
	(d_a, groove_b, True, True, True, True, True, 2800, "sechzehntel", 1.0),
	(groove_b, d_b, True, "zweiter", True, False, True, 1500, None, 1.2),
	(d_b, breakdown, True, True, True, True, True, 3200, "sechzehntel", 1.0),
	(breakdown, d_c, False, False, False, False, False, 1000, None, 2.4),
	(d_c, end_hit, True, True, True, True, True, 3400, "sechzehntel", 1.0),
]

ARP = [0, 2, 1, 3, 2, 0, 3, 1]

for start, end, k, cl, h16, oh, bs, cutoff, pl, pad_gain in SECTIONS:
	# Pad: ein Akkord pro Takt, überlappend
	t = start
	while t < end - 1e-6:
		bar_end = min(end, (np.floor(t / BAR + 1e-9) + 1) * BAR)
		pads.add(pad(chord_at(t)["pad"], bar_end - t + 0.35, cutoff), t, pad_gain)
		t = bar_end
	beat = start
	i = 0
	while beat < end - 1e-6:
		in_bar = int(round((beat % BAR) / BEAT))
		if k:
			drums.add(kick(), beat, 1.0)
			kick_times.append(beat)
		if cl and in_bar in (1, 3):
			if cl is True or (cl == "zweiter" and beat >= start + BAR):
				drums.add(clap(), beat, 0.5)
		if h16:
			for s in range(4):
				drums.add(hat(), beat + s * BEAT / 4, 0.3 if s == 2 else 0.16, pan=0.25)
		elif start < d_a and beat >= 2.0:
			drums.add(hat(), beat + BEAT / 2, 0.12, pan=0.25)
		if oh:
			drums.add(hat(True), beat + BEAT / 2, 0.2, pan=-0.2)
		if bs:
			bass_bus.add(bass(chord_at(beat)["bass"]), beat + BEAT / 2, 1.0)
		if pl:
			tones = chord_at(beat)["pad"]
			tones = [tones[0] * 2, tones[1] * 2, tones[2] * 2, tones[0] * 4]
			steps = 2 if pl == "achtel" else 4
			if pl == "achtel" and beat < 2.0:
				steps = 0
			for s in range(steps):
				n = ARP[(i * steps + s) % len(ARP)]
				plucks.add(pluck(tones[n]), beat + s * BEAT / steps, 1.0, pan=0.35 if s % 2 else -0.35)
		beat += BEAT
		i += 1

# Breakdown: Herzschlag (Ba-bumm) auf der Eins jedes Takts
t = breakdown
while t < d_c - 1e-6:
	drums.add(kick(soft=True), t, 0.7)
	drums.add(kick(soft=True), t + BEAT * 0.75, 0.5)
	t += BAR

# Riser, Wirbel, Einschläge
for a, b in PLAN["riser"]:
	fx.add(riser(b - a), a, 0.45)
clap_roll(d_a - BEAT, d_a, drums, 0.55)
clap_roll(d_b - BEAT, d_b, drums, 0.5)
clap_roll(d_c - 2 * BEAT, d_c, drums, 0.6)
fx.add(impact(big=False), PLAN["stoppSchlag"], 0.9)
for d in (d_a, d_b, d_c):
	fx.add(impact(), d, 0.75)
fx.add(impact(), end_hit, 1.0)
drums.add(kick(), end_hit, 1.0)
pads.add(pad(PROG[0]["pad"], 1.6, 2400), end_hit, 1.0)

# ---------------------------------------------------------------- Mischung

# Sidechain: Pad und Bass ducken bei jedem Kick (das Pumpen)
sc = np.ones(N)
tail = tax(0.3)
duck = 1 - 0.7 * np.exp(-tail / 0.09)
for kt in kick_times:
	i = int(kt * SR)
	j = min(N, i + len(duck))
	sc[i:j] = np.minimum(sc[i:j], duck[: j - i])
sc = sc[:, None]

bass_mix = bass_bus.x * sc
pad_mix = pads.x * sc
dry = drums.x * 0.75 + bass_mix * 0.4 + pad_mix * 0.24 + plucks.x * 0.22 + fx.x * 0.5
wet = reverb(drums.x * 0.12 + pad_mix * 0.12 + plucks.x * 0.18 + fx.x * 0.25)
mix = dry + wet * 0.5
# Handylautsprecher geben unter ~60 Hz nichts wieder: Tiefbass entschlacken, Präsenz anheben
mix = filt(mix.T, "highpass", 42).T
mix = mix + 0.35 * filt(mix.T, "highpass", 2500).T

# Weiche Sättigung, dann auf -4 dBFS Spitze
mix = np.tanh(1.3 * mix / np.max(np.abs(mix))) / np.tanh(1.3)

# Ab stillAb absolute Stille, davor 0,3 s Ausblende
still = int(PLAN["stillAb"] * SR)
fade = int(0.3 * SR)
mix[still - fade : still] *= np.linspace(1, 0, fade)[:, None]
mix[still:] = 0
mix *= 10 ** (-4 / 20)

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
	w.setnchannels(2)
	w.setsampwidth(2)
	w.setframerate(SR)
	w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
print(f"{OUT.relative_to(ROOT)}  {DUR} s, Spitze {20 * np.log10(np.max(np.abs(mix))):.1f} dBFS")
