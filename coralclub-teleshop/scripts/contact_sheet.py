#!/usr/bin/env python3
"""Fügt Kontroll-Standbilder zu einem Kontaktbogen zusammen (braucht Pillow).
Aufruf: python3 scripts/contact_sheet.py [muster] -> out/stills/sheet.png"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
pattern = sys.argv[1] if len(sys.argv) > 1 else "frame-*.png"
files = sorted((f for f in (root / "out" / "stills").glob(pattern) if "-safe" not in f.name or "safe" in pattern),
               key=lambda f: int("".join(c for c in f.stem.split("-")[1] if c.isdigit())))
w, h, cols = 360, 640, 4
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + 30)), "white")
draw = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    x, y = (i % cols) * w, (i // cols) * (h + 30)
    sheet.paste(Image.open(f).convert("RGB").resize((w, h)), (x, y + 30))
    draw.text((x + 8, y + 8), f.stem, fill="black")
out = root / "out" / "stills" / "sheet.png"
sheet.save(out)
print(out.relative_to(root))
