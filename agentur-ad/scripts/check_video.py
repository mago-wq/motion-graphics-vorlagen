#!/usr/bin/env python3
"""Abnahme-Check für out/agentur-ad.mp4 (braucht numpy).

Prüft: H.264 1080x1920 @ 30 fps, 900 Frames, AAC-Tonspur 44,1 kHz Stereo,
Länge 30 s, Spitzenpegel um -3 dBFS, letzte halbe Sekunde still und
Synchronität der MP4-Tonspur gegenüber der verlustfreien WAV.
Aufruf: npm run check   (Exit-Code 1, wenn etwas nicht passt)
"""
import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
VIDEO = ROOT / "out" / "agentur-ad.mp4"
WAV = ROOT / "out" / "agentur-ad-ton.wav"
ok = True


def report(passed, text):
    global ok
    ok &= passed
    print(("  OK    " if passed else "  FEHLER ") + text)


def remotion(tool, *args):
    return subprocess.run(["npx", "remotion", tool, *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout


def read_wav(path):
    with wave.open(str(path)) as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2")
        return data.reshape(-1, w.getnchannels()).astype(float) / 32768, w.getframerate()


if not VIDEO.exists():
    sys.exit(f"{VIDEO.relative_to(ROOT)} fehlt – erst npm run render")

info = json.loads(remotion("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(VIDEO)))
video = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
audio = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)

print("Video")
report(video is not None and video["codec_name"] == "h264", f"Codec {video and video['codec_name']}")
report(video["width"] == 1080 and video["height"] == 1920, f"Format {video['width']}x{video['height']}")
report(video["r_frame_rate"] == "30/1", f"Bildrate {video['r_frame_rate']}")
report(int(video.get("nb_frames", 0)) == 900, f"Frames {video.get('nb_frames')}")
report(video["pix_fmt"] == "yuv420p", f"Pixelformat {video['pix_fmt']}")

print("Ton")
report(audio is not None, "Tonspur vorhanden")
if audio is None:
    sys.exit(1)
report(audio["codec_name"] == "aac", f"Codec {audio['codec_name']}")
report(audio["sample_rate"] == "44100" and audio["channels"] == 2, f"{audio['sample_rate']} Hz, {audio['channels']} Kanäle")
duration = float(audio["duration"])
report(abs(duration - 30) < 0.03, f"Länge Tonspur {duration:.3f} s")
report(abs(float(info["format"]["duration"]) - 30) < 0.03, f"Länge Datei {float(info['format']['duration']):.3f} s")

with tempfile.TemporaryDirectory() as tmp:
    decoded = Path(tmp) / "ton.wav"
    remotion("ffmpeg", "-y", "-loglevel", "error", "-i", str(VIDEO), "-vn", "-acodec", "pcm_s16le", str(decoded))
    mix, sr = read_wav(decoded)

peak_db = 20 * np.log10(np.max(np.abs(mix)))
report(-4.5 <= peak_db <= -2.0, f"Spitzenpegel {peak_db:.2f} dBFS (Ziel ca. -3)")
tail = mix[int(29.5 * sr):]
tail_db = 20 * np.log10(max(np.max(np.abs(tail)), 1e-9))
report(tail_db < -60, f"Letzte halbe Sekunde still ({tail_db:.0f} dBFS)")
report(np.std(mix[:, 0] - mix[:, 1]) > 1e-4, "Stereo (linker und rechter Kanal unterscheiden sich)")

if WAV.exists():
    ref, _ = read_wav(WAV)
    a, b = mix.mean(axis=1)[: 3 * sr], ref.mean(axis=1)[: 2 * sr]
    corr = np.correlate(np.pad(a, (4000, 4000))[: len(b) + 8000], b, mode="valid")
    offset_ms = (np.argmax(corr) - 4000) / sr * 1000
    report(abs(offset_ms) < 5, f"Synchronität MP4-Ton zu Bild: {offset_ms:+.1f} ms")

print("\nAlles in Ordnung." if ok else "\nEs gibt Fehler (siehe oben).")
sys.exit(0 if ok else 1)
