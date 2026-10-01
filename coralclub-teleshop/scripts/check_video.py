#!/usr/bin/env python3
"""Abnahme-Check für out/coralclub-teleshop.mp4 (braucht numpy).

Prüft: H.264 1080x1920 @ 30 fps, Länge laut src/musik-ereignisse.json (folgt
dem Sprecher), AAC-Tonspur 44,1 kHz Stereo, Spitzenpegel um -1 dBFS,
Gesamtlautheit grob um -14 LUFS (TikTok/Reels), Sprache hörbar über der
Musik, letzte halbe Sekunde still und Synchronität der MP4-Tonspur gegenüber
der verlustfreien WAV.
Aufruf: npm run check   bzw. npm run check:4k   (Exit-Code 1, wenn etwas nicht passt)
"""
import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
NAME = sys.argv[1] if len(sys.argv) > 1 else "coralclub-teleshop"
VIDEO = ROOT / "out" / f"{NAME}.mp4"
WAV = ROOT / "out" / f"{NAME}-ton.wav"
SCALE = 2 if NAME.endswith("-4k") else 1
EV = json.loads((ROOT / "src" / "musik-ereignisse.json").read_text())
FRAMES = round(EV["dauer"] * 30)
LENGTH = FRAMES / 30
STILL = round(EV["stillAb"] * 30) / 30
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
report(video["width"] == 1080 * SCALE and video["height"] == 1920 * SCALE, f"Format {video['width']}x{video['height']}")
report(video["r_frame_rate"] == "30/1", f"Bildrate {video['r_frame_rate']}")
report(int(video.get("nb_frames", 0)) == FRAMES, f"Frames {video.get('nb_frames')} (Soll {FRAMES})")
report(video["pix_fmt"] == "yuv420p", f"Pixelformat {video['pix_fmt']}")

print("Ton")
report(audio is not None, "Tonspur vorhanden")
if audio is None:
    sys.exit(1)
report(audio["codec_name"] == "aac", f"Codec {audio['codec_name']}")
report(audio["sample_rate"] == "44100" and audio["channels"] == 2, f"{audio['sample_rate']} Hz, {audio['channels']} Kanäle")
duration = float(audio["duration"])
report(abs(duration - LENGTH) < 0.05, f"Länge Tonspur {duration:.3f} s (Soll {LENGTH:.3f})")
report(abs(float(info["format"]["duration"]) - LENGTH) < 0.05, f"Länge Datei {float(info['format']['duration']):.3f} s")

with tempfile.TemporaryDirectory() as tmp:
    decoded = Path(tmp) / "ton.wav"
    remotion("ffmpeg", "-y", "-loglevel", "error", "-i", str(VIDEO), "-vn", "-acodec", "pcm_s16le", str(decoded))
    mix, sr = read_wav(decoded)

peak_db = 20 * np.log10(np.max(np.abs(mix)))
report(-3.0 <= peak_db <= -0.3, f"Spitzenpegel {peak_db:.2f} dBFS (Ziel ca. -1)")
# Lautheit grob nach ITU-R BS.1770 (K-Filter vereinfacht: nur Hochpass 60 Hz + Shelf ab 1,5 kHz)
def lufs(x, rate):
    from scipy.signal import lfilter
    b0 = [1.53512485958697, -2.69169618940638, 1.19839281085285]
    a0 = [1.0, -1.69065929318241, 0.73248077421585]
    b1 = [1.0, -2.0, 1.0]
    a1 = [1.0, -1.99004745483398, 0.99007225036621]
    y = lfilter(b1, a1, lfilter(b0, a0, x, axis=0), axis=0)
    blk, hop = int(0.4 * rate), int(0.1 * rate)
    ms = np.array([np.mean(y[i:i + blk] ** 2, axis=0).sum() for i in range(0, len(y) - blk, hop)])
    lk = -0.691 + 10 * np.log10(ms + 1e-12)
    g = ms[lk > -70]
    rel = -0.691 + 10 * np.log10(g.mean()) - 10
    g = ms[(lk > -70) & (lk > rel)]
    return -0.691 + 10 * np.log10(g.mean())
loud = lufs(mix, sr)
report(-16.5 <= loud <= -11.5, f"Lautheit {loud:.1f} LUFS (Ziel ca. -14)")

# Sprache über der Musik: in jedem 50-ms-Fenster mit Sprache soll die Musik
# im Mittel mindestens 8 dB leiser sein (Pegel der Einzelspuren in public/ton/).
vo, vsr = read_wav(ROOT / "public" / "ton" / "sprecher.wav")
mu, _ = read_wav(ROOT / "public" / "ton" / "musik.wav")
vo, mu = vo.mean(axis=1), mu.mean(axis=1)
n = min(len(vo), len(mu))
win = int(0.05 * vsr)
v_rms = np.sqrt(np.mean(vo[: n // win * win].reshape(-1, win) ** 2, axis=1))
m_rms = np.sqrt(np.mean(mu[: n // win * win].reshape(-1, win) ** 2, axis=1))
speech = v_rms > v_rms.max() * 0.1
gap = 20 * np.log10(v_rms[speech].mean() / max(m_rms[speech].mean(), 1e-9))
report(gap >= 8, f"Sprache {gap:.1f} dB über der Musik (Ziel ≥ 8)")
tail = mix[int(STILL * sr):]
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
