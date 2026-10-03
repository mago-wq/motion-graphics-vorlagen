#!/usr/bin/env python3
"""Abnahme-Check für out/zitat-edit.mp4 (braucht numpy und pyloudnorm).

Prüft: H.264 1080x1920 @ 30 fps, Frame-Zahl wie in Remotion, AAC 44,1 kHz Stereo,
Ton so lang wie das Bild, Lautheit -14 LUFS, Spitzen höchstens -1 dBFS, Ende
ausgeblendet, echte Wort-Zeiten (kein Platzhalter) und Synchronität der
MP4-Tonspur gegenüber der verlustfreien WAV.
Aufruf: npm run check   (Exit-Code 1, wenn etwas nicht passt)
"""
import json
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np
import pyloudnorm

ROOT = Path(__file__).resolve().parent.parent
VIDEO = ROOT / "out" / "zitat-edit.mp4"
WAV = ROOT / "out" / "zitat-edit-ton.wav"
WOERTER = ROOT / "src" / "stimme" / "woerter.json"
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

listing = remotion("compositions", "src/index.ts")
m = re.search(r"ZitatEdit\s+(\d+)\s+(\d+)x(\d+)\s+(\d+)", listing)
expected_frames = int(m.group(4)) if m else None

info = json.loads(remotion("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(VIDEO)))
video = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
audio = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)

print("Video")
report(video is not None and video["codec_name"] == "h264", f"Codec {video and video['codec_name']}")
report(video["width"] == 1080 and video["height"] == 1920, f"Format {video['width']}x{video['height']}")
report(video["r_frame_rate"] == "30/1", f"Bildrate {video['r_frame_rate']}")
report(expected_frames is not None and int(video.get("nb_frames", 0)) == expected_frames,
       f"Frames {video.get('nb_frames')} (Remotion: {expected_frames})")
report(video["pix_fmt"] == "yuv420p", f"Pixelformat {video['pix_fmt']}")

print("Ton")
report(audio is not None, "Tonspur vorhanden")
if audio is None:
    sys.exit(1)
report(audio["codec_name"] == "aac", f"Codec {audio['codec_name']}")
report(audio["sample_rate"] == "44100" and audio["channels"] == 2, f"{audio['sample_rate']} Hz, {audio['channels']} Kanäle")
seconds = int(video.get("nb_frames", 0)) / 30
report(abs(float(audio["duration"]) - seconds) < 0.03, f"Länge Tonspur {float(audio['duration']):.3f} s (Bild {seconds:.3f} s)")

with tempfile.TemporaryDirectory() as tmp:
    decoded = Path(tmp) / "ton.wav"
    remotion("ffmpeg", "-y", "-loglevel", "error", "-i", str(VIDEO), "-vn", "-acodec", "pcm_s16le", str(decoded))
    mix, sr = read_wav(decoded)

loudness = pyloudnorm.Meter(sr).integrated_loudness(mix)
report(abs(loudness + 14) <= 1.0, f"Lautheit {loudness:.1f} LUFS (Ziel -14)")
peak_db = 20 * np.log10(np.max(np.abs(mix)))
report(peak_db <= -1.0, f"Spitzenpegel {peak_db:.2f} dBFS (höchstens -1)")
tail_db = 20 * np.log10(max(np.max(np.abs(mix[-int(0.1 * sr):])), 1e-9))
report(tail_db < -40, f"Ende ausgeblendet ({tail_db:.0f} dBFS in den letzten 0,1 s)")
report(np.std(mix[:, 0] - mix[:, 1]) > 1e-4, "Stereo (linker und rechter Kanal unterscheiden sich)")

woerter = json.loads(WOERTER.read_text())
report(not woerter.get("platzhalter"), f"Wort-Zeiten gemessen ({len(woerter['woerter'])} Wörter, nicht geschätzt)")

if WAV.exists():
    ref, _ = read_wav(WAV)
    a, b = mix.mean(axis=1)[: 4 * sr], ref.mean(axis=1)[: 3 * sr]
    corr = np.correlate(np.pad(a, (4000, 4000))[: len(b) + 8000], b, mode="valid")
    offset_ms = (np.argmax(corr) - 4000) / sr * 1000
    report(abs(offset_ms) < 5, f"Synchronität MP4-Ton zu Bild: {offset_ms:+.1f} ms")

print("\nAlles in Ordnung." if ok else "\nEs gibt Fehler (siehe oben).")
sys.exit(0 if ok else 1)
