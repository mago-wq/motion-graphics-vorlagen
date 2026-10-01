#!/usr/bin/env python3
"""Bereitet alle Geräusche des Videos vor -> public/sfx/ + src/audio/toene.json

Keine Musik, keine Instrumente: nur Naturgeräusche und Effekte.

Quellen:
- Mixkit (https://mixkit.co/free-sound-effects/), Mixkit Sound Effects Free
  License: frei für private und kommerzielle Projekte, ohne Namensnennung.
  Geladen wird direkt von assets.mixkit.co, die IDs stehen unten in MIXKIT.
- Zwei kurze Effekte (Neon-Flackern, Glitch) werden hier per Code erzeugt.

Jeder Effekt bekommt einen "Anker": den Moment in der Datei, der auf das
Bild-Ereignis fallen soll (z. B. der Einschlag im Boom). src/audio/cues.ts
legt die Effekte damit framegenau an.

Aufruf: npm run toene   (braucht numpy, scipy, soundfile, librosa, pyloudnorm)
"""
import json
import subprocess
from pathlib import Path

import librosa
import numpy as np
import pyloudnorm
import soundfile as sf

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "sfx"
MANIFEST = ROOT / "src" / "audio" / "toene.json"
CACHE = ROOT / "out" / ".mixkit"

# name: Mixkit-ID, Ausschnitt (Start, Länge in s), Art, Anker
#   atmo:   Fläche, auf -23 LUFS gebracht, weich ein- und ausgeblendet
#   effekt: auf -3 dBFS Spitze, Anker = lautester Moment (oder fest)
MIXKIT = {
    "regen": {"id": 1253, "von": 2.0, "laenge": 26.0, "art": "atmo"},          # Light rain loop
    "wind": {"id": 1237, "von": 0.0, "laenge": 25.0, "art": "atmo"},           # Wind in the forest
    "voegel": {"id": 2467, "von": 1.0, "laenge": 26.0, "art": "atmo"},         # Morning birds singing
    "donner": {"id": 1296, "von": 0.0, "laenge": 12.0, "art": "atmo"},         # Thunder deep rumble
    "fluegel": {"id": 2697, "von": 0.05, "laenge": 1.5, "art": "effekt", "anker": 0.18},  # Fly wings movement
    "whoosh_blitz": {"id": 2919, "von": 1.9, "laenge": 2.6, "art": "effekt"},  # Movie trailer whoosh hit
    "boom_blitz": {"id": 1286, "von": 0.35, "laenge": 4.8, "art": "effekt"},   # Cinematic impact thunder
    "swoosh": {"id": 1468, "von": 0.1, "laenge": 1.15, "art": "effekt"},       # Cinematic transition wind swoosh
    "swoosh_tief": {"id": 1471, "von": 0.1, "laenge": 1.3, "art": "effekt"},   # Cinematic wind swoosh
}


def download(mixkit_id):
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"{mixkit_id}.wav"
    if not path.exists():
        url = f"https://assets.mixkit.co/active_storage/sfx/{mixkit_id}/{mixkit_id}.wav"
        subprocess.run(["curl", "-sfL", "-m", "120", "-o", str(path), url], check=True)
    return path


def fades(x, fade_in, fade_out):
    n_in, n_out = int(fade_in * SR), int(fade_out * SR)
    if n_in:
        x[:, :n_in] *= np.sin(np.linspace(0, np.pi / 2, n_in)) ** 2
    if n_out:
        x[:, -n_out:] *= np.cos(np.linspace(0, np.pi / 2, n_out)) ** 2
    return x


def stereo(y):
    return np.stack([y, y]) if y.ndim == 1 else y


rng = np.random.default_rng(2026)


def neon_zap():
    """Neonröhre zündet: knisternde Rauschstöße im Takt des Bild-Flackerns, dazu ein tiefer Puls."""
    dur = 0.42
    t = np.arange(int(dur * SR)) / SR
    gate = np.zeros_like(t)
    for on, off, lvl in [(0.0, 0.03, 1.0), (0.066, 0.1, 0.7), (0.133, 0.2, 1.0), (0.233, 0.42, 0.5)]:
        gate[(t >= on) & (t < off)] = lvl
    gate = np.convolve(gate, np.ones(80) / 80, mode="same")
    crackle = librosa.effects.preemphasis(rng.standard_normal(len(t))) * gate
    crackle *= (rng.random(len(t)) > 0.6)  # körnig, wie Funken
    pulse = np.sin(2 * np.pi * np.cumsum(np.linspace(90, 45, len(t))) / SR) * np.exp(-t / 0.08)
    y = 0.6 * crackle / np.max(np.abs(crackle)) + 0.5 * pulse
    return fades(stereo(y), 0.002, 0.12) * np.array([[1.0], [0.92]])


def glitch():
    """Digitaler Glitch: vier zerhackte, grob abgetastete Rauschkörner."""
    parts = []
    for i, n in enumerate([0.035, 0.02, 0.05, 0.03]):
        grain = rng.standard_normal(int(n * SR))
        step = [6, 12, 4, 9][i]
        grain = np.repeat(grain[::step], step)[: int(n * SR)]
        grain = np.round(grain * 3) / 3  # Bit-Reduktion
        parts += [grain * [1.0, 0.6, 0.9, 0.5][i], np.zeros(int(0.018 * SR))]
    y = np.concatenate(parts)
    left, right = y, np.roll(y, 90)
    return fades(np.stack([left, right]), 0.001, 0.03)


def normalize(x, art):
    if art == "atmo":
        loud = pyloudnorm.Meter(SR).integrated_loudness(x.T)
        x = x * 10 ** ((-23 - loud) / 20)
    else:
        x = x / np.max(np.abs(x)) * 10 ** (-3 / 20)
    return x


def write(name, x, anchor):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"{name}.flac"
    sf.write(path, np.clip(x, -1, 1).T, SR, subtype="PCM_16")
    return {"file": f"sfx/{name}.flac", "duration": round(x.shape[1] / SR, 3), "anchor": round(anchor, 3)}


def main():
    manifest = {}
    for name, s in MIXKIT.items():
        y, _ = librosa.load(download(s["id"]), sr=SR, mono=False, offset=s["von"], duration=s["laenge"])
        x = stereo(y).astype(np.float64)
        if s["art"] == "atmo":
            x = fades(x, 0.6, 0.8)
        else:
            x = fades(x, 0.005, 0.15)
        x = normalize(x, s["art"])
        if "anker" in s:
            anchor = s["anker"]
        elif s["art"] == "effekt":
            env = np.convolve(np.abs(x).mean(axis=0), np.ones(441) / 441, mode="same")
            anchor = float(np.argmax(env)) / SR
        else:
            anchor = 0.0
        manifest[name] = write(name, x, anchor)
        print(f"{name:13s} Mixkit {s['id']:5d}  {manifest[name]['duration']:5.2f} s  Anker {manifest[name]['anchor']:.3f} s")

    for name, fn, anchor in [("neon", neon_zap, 0.0), ("glitch", glitch, 0.0)]:
        manifest[name] = write(name, normalize(fn(), "effekt"), anchor)
        print(f"{name:13s} erzeugt       {manifest[name]['duration']:5.2f} s")

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"-> {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
