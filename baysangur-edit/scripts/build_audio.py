#!/usr/bin/env python3
"""Baut die Tonspur des Baysangur-Edits und die Zeitleiste für Remotion.

Eingang (nicht im Repo):
  ../nokhchi-edit/assets-src/nasheed/vocals.wav       Nasheed „Джохар Дудаев“, nur Stimme (Beat per KI entfernt)
  ../nokhchi-edit/assets-src/nasheed/beats_orig.json  Taktraster der Originalfassung
  ../nokhchi-edit/assets-src/sfx/*.mp3                natürliche Geräusche
  Wiederherstellen: bash ../nokhchi-edit/scripts/fetch_nasheed.sh

Ausgang:
  public/audio/mix.wav   fertige Tonspur (44,1 kHz, Stereo)
  src/timeline.json      Schläge und Marken in Sekunden der Ausgabe

Halal: keine Instrumente. Ton = Stimme des Nasheeds, Wärme unten = dieselbe Stimme eine
Oktave tiefer (nur < 95 Hz), dazu Wind, Wolf, Donner. Ruhiger als nokhchi-edit, wie das
Vorbild: gedämpfter Einstieg, nach ~4 s offen, keine Schlag-Effekte.
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

ROOT = Path(__file__).resolve().parent.parent
NOK = ROOT.parent / "nokhchi-edit" / "assets-src"
SR = 44100
DUR = 22.0        # Länge des Edits (Vorbild: 21,9 s)
COLD = 1.2        # nur Wind und Wolf
OPEN_BEAT = 128   # ab diesem Schlag ist die Stimme offen (Einsatz des Refrains)
OPEN_AT = 4.0     # … und zwar bei dieser Sekunde der Ausgabe
TAIL = 2.2        # Ausklang: Stimme blendet aus, Hall und Wind bleiben


def load(path: Path) -> np.ndarray:
    if path.suffix.lower() != ".wav":
        tmp = Path(tempfile.mkdtemp()) / "x.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-ar", str(SR), "-ac", "2", str(tmp)], check=True)
        path = tmp
    y, sr = sf.read(path, dtype="float32", always_2d=True)
    if sr != SR:
        y = signal.resample_poly(y, SR, sr, axis=0).astype(np.float32)
    if y.shape[1] == 1:
        y = np.repeat(y, 2, axis=1)
    return y[:, :2]


def butter(y, kind, freq, order=2):
    sos = signal.butter(order, freq, btype=kind, fs=SR, output="sos")
    return signal.sosfilt(sos, y, axis=0)


def make_ir(seconds, predelay, lp, seed):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = r.standard_normal((n, 2)) * np.exp(-6.9 * t / seconds)[:, None]
    ir = butter(ir, "low", lp, 2)
    ir = np.concatenate([np.zeros((int(predelay * SR), 2)), ir])
    return (ir / np.sqrt((ir ** 2).sum(axis=0))).astype(np.float32)


def reverb(y, ir):
    return np.stack([signal.fftconvolve(y[:, c], ir[:, c])[: len(y)] for c in range(2)], axis=1)


def env_points(points, n):
    """Hüllkurve aus (Sekunde, Wert)-Punkten, linear interpoliert."""
    t = np.arange(n) / SR
    xs, ys = zip(*points)
    return np.interp(t, xs, ys).astype(np.float32)


def sweep_lowpass(y, cut, block=512):
    """Tiefpass mit zeitlich veränderlicher Grenzfrequenz (blockweise)."""
    out = np.empty_like(y)
    zi = None
    for s in range(0, len(y), block):
        f = float(np.clip(cut[min(s + block // 2, len(cut) - 1)], 60, SR / 2 - 200))
        b, a = signal.butter(2, f, btype="low", fs=SR)
        if zi is None:
            zi = np.zeros((2, y.shape[1]))
        out[s:s + block], zi = signal.lfilter(b, a, y[s:s + block], axis=0, zi=zi)
    return out


def place(dst, src, at, gain_db=0.0):
    i = int(at * SR)
    if i >= len(dst):
        return
    n = min(len(src), len(dst) - i)
    dst[i:i + n] += src[:n] * 10 ** (gain_db / 20)


def main():
    beats = np.array(json.load(open(NOK / "nasheed" / "beats_orig.json"))["beats"])
    voc = load(NOK / "nasheed" / "vocals.wav")
    src0 = beats[OPEN_BEAT] - (OPEN_AT - COLD)          # Quellsekunde, die bei COLD einsetzt
    vlen = DUR - COLD
    v = voc[int(src0 * SR): int((src0 + vlen) * SR)].copy()
    n = int(DUR * SR)

    # Gedämpft (wie hinter einer Wand) → offen bei OPEN_AT; am Ende wieder etwas zu
    lp = env_points([(0, 420), (OPEN_AT - COLD - 0.9, 700), (OPEN_AT - COLD, 16000),
                     (vlen - TAIL, 16000), (vlen, 2500)], len(v))
    v = sweep_lowpass(v, lp)
    gain = env_points([(0, 0.0), (0.25, 0.45), (OPEN_AT - COLD - 0.2, 0.6), (OPEN_AT - COLD, 1.0),
                       (vlen - TAIL, 1.0), (vlen - 0.05, 0.0), (vlen, 0.0)], len(v))
    v *= gain[:, None]

    # Wärme unten: Stimme eine Oktave tiefer, nur < 95 Hz (kein Instrument)
    tmp = Path(tempfile.mkdtemp())
    sf.write(tmp / "v.wav", v, SR, subtype="FLOAT")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp / "v.wav"), "-af",
                    "rubberband=pitch=0.5:formant=preserved", "-ar", str(SR), "-c:a", "pcm_f32le",
                    str(tmp / "sub.wav")], check=True)
    sub, _ = sf.read(tmp / "sub.wav", dtype="float32", always_2d=True)
    sub = butter(butter(sub[: len(v)], "low", 95, 4), "high", 30, 2)
    subg = env_points([(0, 0), (OPEN_AT - COLD - 0.1, 0), (OPEN_AT - COLD + 0.3, 1.0), (vlen, 1.0)], len(sub))
    v[: len(sub)] += sub * subg[: len(sub), None] * 1.6

    # Hall: weit, kalt – passt zu den Bergen
    hall = reverb(v, make_ir(3.2, 0.04, 5000, 1))
    wet = np.concatenate([v * 0.82 + hall * 0.32, np.zeros((0, 2), np.float32)])

    mix = np.zeros((n, 2), np.float32)
    place(mix, wet, COLD)
    # Hallfahne über das Ende hinaus (Stimme ist zu, Hall klingt aus)
    tail = reverb(np.concatenate([v[-int(1.2 * SR):], np.zeros((int(2.5 * SR), 2), np.float32)]),
                  make_ir(3.2, 0.04, 5000, 1)) * 0.25
    place(mix, tail[int(1.2 * SR):], COLD + vlen - 0.02)

    # Geräusche (natürlich): Wind durchgehend, Wolf am Anfang, Donner tief bei Zitat 2 und am Ende
    sfx = NOK / "sfx"
    wind = load(sfx / "wind_a.mp3")
    wind = np.tile(wind, (int(np.ceil(n / len(wind))) + 1, 1))[:n]
    wenv = env_points([(0, 0.0), (0.4, 1.0), (COLD, 1.0), (OPEN_AT, 0.45), (DUR - TAIL, 0.45), (DUR, 0.9)], n)
    mix += butter(wind, "high", 120, 2) * wenv[:, None] * 10 ** (-17 / 20)
    wolf = butter(load(sfx / "wolf_a.mp3"), "low", 5000, 2)
    place(mix, reverb(wolf, make_ir(2.4, 0.03, 4000, 3)) * 0.6 + wolf * 0.5, 0.15, -9)

    tl = {"duration": DUR, "cold": COLD, "open": OPEN_AT, "tail": DUR - TAIL}
    # Schläge der Quelle in Sekunden der Ausgabe (für die Schnitte)
    out_beats = [round(float(b - src0 + COLD), 4) for b in beats if COLD <= b - src0 + COLD <= DUR]
    tl["beats"] = out_beats

    def beat_at(t):
        return min(out_beats, key=lambda b: abs(b - t))

    tl["quote2"] = beat_at(12.2)
    thunder = butter(load(sfx / "thunder_a.mp3"), "low", 380, 3)
    place(mix, thunder, tl["quote2"] - 0.08, -10)
    place(mix, butter(load(sfx / "thunder_b.mp3"), "low", 300, 3), DUR - TAIL - 0.1, -12)

    # Lautheit: -14 LUFS (TikTok/Instagram), Spitzen weich begrenzen
    meter = pyloudnorm.Meter(SR)
    mix = pyloudnorm.normalize.loudness(mix, meter.integrated_loudness(mix), -14.0)
    mix = np.tanh(mix * 1.05) / np.tanh(1.05)
    mix = np.clip(mix, -0.98, 0.98).astype(np.float32)
    fo = int(0.35 * SR)
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None]

    (ROOT / "public" / "audio").mkdir(parents=True, exist_ok=True)
    sf.write(ROOT / "public" / "audio" / "mix.wav", mix, SR, subtype="PCM_16")
    json.dump(tl, open(ROOT / "src" / "timeline.json", "w"), indent=1)
    print(f"mix.wav {len(mix) / SR:.2f} s, {len(out_beats)} Schläge, Quelle ab {src0:.2f} s, "
          f"LUFS {meter.integrated_loudness(mix):.1f}")


if __name__ == "__main__":
    main()
