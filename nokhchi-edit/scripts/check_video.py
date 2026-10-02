#!/usr/bin/env python3
"""Abnahme-Check für out/nokhchi-edit-4k.mp4.

Prüft: H.264 2160×3840 (4K hochkant) @ 30 fps, Frame-Anzahl wie die Komposition,
AAC 44,1 kHz Stereo, Länge passend zur Tonspur, Spitzenpegel ≤ -0,5 dBFS und
Synchronität der MP4-Tonspur gegenüber der verlustfreien WAV (Versatz < 5 ms).
Aufruf: npm run check   (Exit-Code 1, wenn etwas nicht passt)
"""
import json
import math
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
VIDEO = ROOT / "out" / "nokhchi-edit-4k.mp4"
WAV = ROOT / "out" / "nokhchi-edit-ton.wav"
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
FRAMES = math.ceil(TL["duration"] * 30)
ok = True


def report(passed, text):
    global ok
    ok &= bool(passed)
    print(("  OK     " if passed else "  FEHLER ") + text)


if not VIDEO.exists():
    sys.exit("out/nokhchi-edit-4k.mp4 fehlt – erst npm run render")

probe = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-show_streams", "-show_format", "-of", "json", str(VIDEO)],
                       check=True, capture_output=True, text=True).stdout
info = json.loads(probe)
v = next(s for s in info["streams"] if s["codec_type"] == "video")
a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
print("Video")
report(v["codec_name"] == "h264", f"Codec {v['codec_name']}")
report((v["width"], v["height"]) == (2160, 3840), f"Format {v['width']}×{v['height']}")
report(v["r_frame_rate"] == "30/1", f"Bildrate {v['r_frame_rate']}")
report(int(v.get("nb_read_frames", 0)) == FRAMES, f"Frames {v.get('nb_read_frames')} (soll {FRAMES})")
report(v["pix_fmt"] == "yuv420p", f"Pixelformat {v['pix_fmt']}")
print("Ton")
report(a is not None and a["codec_name"] == "aac", "AAC-Tonspur")
report(a and a["sample_rate"] == "44100" and a["channels"] == 2, "44,1 kHz Stereo")
dur = float(info["format"]["duration"])
report(abs(dur - FRAMES / 30) < 0.1, f"Länge {dur:.2f} s (soll {FRAMES / 30:.2f} s)")

ref, sr = sf.read(WAV, dtype="float32")
peak = 20 * np.log10(np.abs(ref).max() + 1e-12)
report(peak <= -0.5, f"Spitzenpegel {peak:.1f} dBFS")
with tempfile.TemporaryDirectory() as d:
    dec = Path(d) / "dec.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(VIDEO), "-ac", "2", "-ar", "44100", str(dec)], check=True)
    got, _ = sf.read(dec, dtype="float32")
n = min(len(ref), len(got), 20 * sr)
x, y = ref[:n].mean(axis=1), got[:n].mean(axis=1)
corr = np.fft.irfft(np.fft.rfft(y, 2 * n) * np.conj(np.fft.rfft(x, 2 * n)))
lag = int(np.argmax(np.concatenate([corr[-2000:], corr[:2000]]))) - 2000
report(abs(lag) / sr < 0.005, f"Ton-Versatz MP4 gegen WAV {1000 * lag / sr:+.1f} ms")
sys.exit(0 if ok else 1)
