#!/usr/bin/env python3
"""Kontaktbogen aus PNGs eines Ordners (Pillow, weil Remotions ffmpeg kein xstack hat)."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

src, dest = Path(sys.argv[1]), Path(sys.argv[2])
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
files = sorted(p for p in src.glob("*.png") if not p.name.startswith("_"))
w = 270
ims = [Image.open(p).convert("RGB") for p in files]
h = int(ims[0].size[1] * w / ims[0].size[0])
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + 22)), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for i, (p, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    sheet.paste(im.resize((w, h)), (x, y))
    d.text((x + 4, y + h + 4), p.stem, fill=(255, 220, 0))
sheet.save(dest)
