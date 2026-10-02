#!/usr/bin/env python3
"""Rechnet kleine historische Bilder mit Real-ESRGAN (x4, lokal über onnxruntime) hoch.

Viele Quellen sind nur 250–800 px breit; im 4K-Video (2160 px Breite) würden sie sonst matschig.
Modell: ~/.esrgan/real_esrgan_x4.onnx (BSD-3, Export der offiziellen RealESRGAN_x4plus-Gewichte,
https://huggingface.co/SceneWorks/real-esrgan-onnx).

Das Original bleibt in assets-src/hist-orig/ erhalten; public/img/hist/ bekommt die hochgerechnete
Fassung (längste Seite höchstens MAX_SIDE). Danach scripts/make_cutouts.py erneut laufen lassen.
"""
import shutil
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
HIST = ROOT / "public" / "img" / "hist"
ORIG = ROOT / "assets-src" / "hist-orig"
MODEL = Path.home() / ".esrgan" / "real_esrgan_x4.onnx"
MIN_SIDE = 800    # kürzere Seite darunter → hochrechnen (größere schafft Chrome per Lanczos)
MAX_SIDE = 2800
TILE, PAD = 384, 16


def upscale(im: Image.Image, sess) -> Image.Image:
    a = np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0
    h, w, _ = a.shape
    out = np.zeros((h * 4, w * 4, 3), np.float32)
    for y in range(0, h, TILE):
        for x in range(0, w, TILE):
            y0, x0 = max(0, y - PAD), max(0, x - PAD)
            y1, x1 = min(h, y + TILE + PAD), min(w, x + TILE + PAD)
            tile = a[y0:y1, x0:x1].transpose(2, 0, 1)[None]
            res = sess.run(None, {"input": tile})[0][0].transpose(1, 2, 0)
            oy, ox = (y - y0) * 4, (x - x0) * 4
            th, tw = min(TILE, h - y) * 4, min(TILE, w - x) * 4
            out[y * 4:y * 4 + th, x * 4:x * 4 + tw] = res[oy:oy + th, ox:ox + tw]
    return Image.fromarray((out.clip(0, 1) * 255 + 0.5).astype(np.uint8))


def main(names):
    ORIG.mkdir(parents=True, exist_ok=True)
    sess = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])
    files = [p for p in sorted(HIST.glob("*")) if p.suffix.lower() in (".jpg", ".jpeg", ".png")]
    if names:
        files = [p for p in files if p.stem in names]
    for p in files:
        orig = ORIG / p.name
        if orig.exists():
            continue  # schon hochgerechnet (Original liegt in assets-src/hist-orig)
        im = Image.open(p)
        if min(im.size) >= MIN_SIDE or im.mode in ("RGBA", "LA", "P"):
            continue  # groß genug – oder mit Transparenz (z. B. Unterschrift), die ESRGAN nicht kennt
        shutil.copy2(p, orig)
        big = upscale(im, sess)
        scale = min(1.0, MAX_SIDE / max(big.size))
        if scale < 1:
            big = big.resize((round(big.size[0] * scale), round(big.size[1] * scale)), Image.LANCZOS)
        if p.suffix.lower() == ".png":
            big.save(p, optimize=True)
        else:
            big.save(p, quality=92)
        print(f"{p.name}: {im.size[0]}x{im.size[1]} -> {big.size[0]}x{big.size[1]}", flush=True)


if __name__ == "__main__":
    main(set(sys.argv[1:]))
