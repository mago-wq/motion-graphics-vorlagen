#!/usr/bin/env python3
"""Abnahme-Check für out/mfit-reel.mp4 (oder eine andere Datei als Argument).

Prüft: H.264, 1080×1920 (bzw. 2160×3840 bei *-4k.mp4), 30 fps, 1056 Frames,
yuv420p/BT.709; AAC 48 kHz Stereo; Länge 35,2 s; Lautheit und True Peak der Tonspur
im MP4; Synchronität (Versatz der Tonspur im MP4 gegenüber der Quelle, per
Kreuzkorrelation); stilles, stehendes Ende.
Braucht numpy, scipy, pyloudnorm, Pillow. Nutzt ffprobe/ffmpeg aus Remotion.

Aufruf: python3 scripts/check_video.py [out/mfit-reel-4k.mp4]
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
from scipy import signal
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent.parent
VIDEO = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / 'out' / 'mfit-reel.mp4'
IS_4K = VIDEO.stem.endswith('-4k')
EXPECTED_SIZE = (2160, 3840) if IS_4K else (1080, 1920)
SOURCE = ROOT / 'public' / 'audio' / 'mfit-soundtrack.wav'
TL = json.loads((ROOT / 'src' / 'timeline.json').read_text(encoding='utf-8'))
FRAMES = int(TL['totalBeats'] * 60 / TL['bpm'] * TL['fps'])
DURATION = FRAMES / TL['fps']

ok = True


def report(passed: bool, text: str):
    global ok
    ok = ok and passed
    print(('OK    ' if passed else 'FEHLER') + '  ' + text)


def npx(*args: str) -> bytes:
    return subprocess.run(['npx', 'remotion', *args], cwd=ROOT, capture_output=True, check=True).stdout


probe = json.loads(npx('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-count_frames', '-of', 'json', str(VIDEO)))
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
report(v['codec_name'] == 'h264', f"Video-Codec {v['codec_name']}")
report((v['width'], v['height']) == EXPECTED_SIZE, f"Auflösung {v['width']}×{v['height']} (soll {EXPECTED_SIZE[0]}×{EXPECTED_SIZE[1]})")
report(v['r_frame_rate'] == f"{TL['fps']}/1", f"Bildrate {v['r_frame_rate']}")
report(int(v['nb_read_frames']) == FRAMES, f"Frames {v['nb_read_frames']} (soll {FRAMES})")
report(v['pix_fmt'] == 'yuv420p', f"Pixelformat {v['pix_fmt']}")
report(v.get('color_primaries') == 'bt709', f"Farbraum {v.get('color_primaries')}")
report(a['codec_name'] == 'aac' and a['sample_rate'] == '48000' and a['channels'] == 2,
       f"Ton {a['codec_name']} {a['sample_rate']} Hz, {a['channels']} Kanäle")
dur = float(probe['format']['duration'])
report(abs(dur - DURATION) < 0.03, f"Länge {dur:.3f} s (soll {DURATION:.3f} s)")

# Tonspur aus dem MP4 dekodieren (mit Edit-List, so wie ein Player sie abspielt)
tmp = ROOT / 'out' / '.check-ton.wav'
npx('ffmpeg', '-y', '-loglevel', 'error', '-i', str(VIDEO), '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', str(tmp))
sr, dec = wavfile.read(tmp)
tmp.unlink()
dec = dec.astype(np.float64) / 32768
sr2, src = wavfile.read(SOURCE)
src = src.astype(np.float64) / 32768

meter = pyln.Meter(sr)
loud = meter.integrated_loudness(dec)
tp = 20 * np.log10(np.max(np.abs(signal.resample_poly(dec, 4, 1, axis=0))))
report(-14.5 < loud < -10.5, f'Lautheit {loud:.1f} LUFS (Ziel ≈ −12)')
report(tp <= -0.5, f'True Peak {tp:.2f} dBTP im MP4 (Grenze −0,5 nach AAC-Kodierung)')

# Versatz: Kreuzkorrelation der ersten 8 s (Einschläge, Klicks)
seg = int(8 * sr)
x, y = dec[:seg].mean(axis=1), src[:seg].mean(axis=1)
corr = signal.correlate(x, y, mode='full', method='fft')
lag = (np.argmax(corr) - (len(y) - 1)) / sr * 1000
report(abs(lag) < 2.0, f'Ton-Versatz im MP4 {lag:+.2f} ms (soll ±2 ms)')

# Ende: letzte 0,3 s leise, letzte Frames stehen still
tail = dec[-int(0.3 * sr):]
tail_db = 20 * np.log10(np.max(np.abs(tail)) + 1e-12)
report(tail_db < -40, f'Ton in den letzten 0,3 s: Spitze {tail_db:.1f} dBFS')
still_from = int(TL['ende']['still'] * 60 / TL['bpm'] * TL['fps'])
# Remotions ffmpeg kennt kein rawvideo, also die letzten Frames als PNG ausgeben
frame_dir = ROOT / 'out' / '.check-frames'
frame_dir.mkdir(parents=True, exist_ok=True)
for old in frame_dir.glob('*.png'):
    old.unlink()
npx('ffmpeg', '-v', 'error', '-ss', f'{still_from / TL["fps"]:.3f}', '-i', str(VIDEO), '-vf', 'scale=270:480', str(frame_dir / '%04d.png'))
from PIL import Image
frames = np.array([np.asarray(Image.open(f).convert('L'), dtype=np.int16) for f in sorted(frame_dir.glob('*.png'))])
for old in frame_dir.glob('*.png'):
    old.unlink()
frame_dir.rmdir()
# Filmkorn steht still, übrig bleibt nur Kompressionsrauschen: mittlere Änderung fast null
diffs = np.abs(np.diff(frames, axis=0)) if len(frames) > 1 else np.zeros((1, 1, 1))
mean_diff = float(diffs.mean())
p999 = float(np.percentile(diffs, 99.9))
report(len(frames) >= 20 and mean_diff < 0.3 and p999 <= 4,
       f'Standbild am Ende: {len(frames)} Frames, mittlere Änderung {mean_diff:.2f}, 99,9-%-Wert {p999:.0f} (von 255)')

print('\nAbnahme bestanden.' if ok else '\nAbnahme NICHT bestanden.')
sys.exit(0 if ok else 1)
