#!/usr/bin/env python3
"""Baut die Nasheed-Spur des Edits aus dem Original (scripts/fetch_assets.py lädt es).

  public/ton/asmu-schnitt.wav   Ausschnitte laut src/schnitt.json, gleitend überblendet,
                                am Ende ausgeblendet mit Nachhall (nicht im Repo)
  src/huelle.json               Lautstärke des Gesangs je Videoframe (0–1) für Effekte

Benötigt: numpy, scipy, soundfile, ffmpeg.
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
CFG = json.loads((ROOT / "src/schnitt.json").read_text())


def load_source() -> np.ndarray:
	src = sorted((ROOT / "assets-src/nasheed").glob("asmu.*"))
	if not src:
		raise SystemExit("Nasheed fehlt: erst python3 scripts/fetch_assets.py")
	raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(src[0]), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
		capture_output=True, check=True).stdout
	return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def nachhall_ir(seconds: float) -> np.ndarray:
	"""Raumantwort: abklingendes, dunkler werdendes Rauschen, links/rechts verschieden (breit)."""
	n = int(seconds * SR)
	t = np.arange(n) / SR
	rng = np.random.default_rng(7)
	ir = rng.standard_normal((n, 2)) * np.exp(-6.9 * t / seconds)[:, None]
	# Höhen klingen schneller ab: einfacher Tiefpass, der mit der Zeit stärker wird
	for c in range(2):
		y = np.empty(n)
		acc = 0.0
		for i in range(n):
			a = 0.15 + 0.8 * min(1.0, t[i] / seconds)
			acc = acc + (1 - a) * (ir[i, c] - acc)
			y[i] = acc
		ir[:, c] = y
	return ir / np.sqrt((ir ** 2).sum(axis=0))


def main() -> None:
	x = load_source()
	half = int(CFG["ueberblendung"] * SR / 2)
	parts = [x[int(a * SR) - (half if i else 0): int(b * SR) + half] for i, (a, b) in enumerate(CFG["teile"])]
	out = parts[0]
	for p in parts[1:]:
		# gleichmäßige Leistung über die Überblendung (sin/cos)
		k = np.linspace(0, np.pi / 2, 2 * half)[:, None]
		mid = out[-2 * half:] * np.cos(k) + p[:2 * half] * np.sin(k)
		out = np.concatenate([out[:-2 * half], mid, p[2 * half:]])
	out = out[:len(out) - half]  # Überhang des letzten Teils weg

	# Ende: weich ausblenden, der letzte Ton hallt nach
	fade = int(CFG["ausblenden"] * SR)
	out[-fade:] *= np.cos(np.linspace(0, np.pi / 2, fade))[:, None] ** 2
	tail_src = out[-int(1.2 * SR):]
	wet = np.stack([fftconvolve(tail_src[:, c], nachhall_ir(CFG["nachhall"])[:, c]) for c in range(2)], axis=1)
	wet *= 0.35 * np.abs(out).max() / (np.abs(wet).max() + 1e-9)
	total = np.zeros((len(out) - len(tail_src) + len(wet), 2), dtype=np.float32)
	total[:len(out)] += out
	total[len(out) - len(tail_src):] += wet
	peak = np.abs(total).max()
	if peak > 0.98:
		total *= 0.98 / peak

	ton = ROOT / "public/ton/asmu-schnitt.wav"
	ton.parent.mkdir(parents=True, exist_ok=True)
	sf.write(ton, total, SR, subtype="PCM_16")

	# Hüllkurve je Frame: RMS in dB, -30…-8 dB -> 0…1, leicht geglättet
	fps = CFG["fps"]
	hop = SR // fps
	mono = total.mean(axis=1)
	frames = len(mono) // hop
	rms = np.array([np.sqrt(np.mean(mono[i * hop:(i + 1) * hop] ** 2)) for i in range(frames)])
	db = 20 * np.log10(rms + 1e-9)
	env = np.clip((db + 30) / 22, 0, 1)
	env = np.convolve(env, np.ones(3) / 3, mode="same")
	(ROOT / "src/huelle.json").write_text(json.dumps([round(float(v), 3) for v in env]))
	print(f"{ton.relative_to(ROOT)}: {len(total) / SR:.2f} s; src/huelle.json: {frames} Frames")


if __name__ == "__main__":
	main()
