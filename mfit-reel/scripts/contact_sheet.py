#!/usr/bin/env python3
"""Setzt Standbilder zu einem Kontaktbogen zusammen (braucht Pillow).

Aufruf: python3 scripts/contact_sheet.py out/stills out/kontaktbogen.png [Spalten] [Breite je Bild]
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

src = Path(sys.argv[1] if len(sys.argv) > 1 else 'out/stills')
dst = Path(sys.argv[2] if len(sys.argv) > 2 else 'out/kontaktbogen.png')
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
width = int(sys.argv[4]) if len(sys.argv) > 4 else 270

files = sorted(src.glob('*.png'))
if not files:
    sys.exit(f'Keine Bilder in {src}')
first = Image.open(files[0])
height = round(width * first.height / first.width)
label = 22
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * width, rows * (height + label)), (40, 40, 40))
draw = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    img = Image.open(f).convert('RGB').resize((width, height), Image.LANCZOS)
    x, y = (i % cols) * width, (i // cols) * (height + label)
    sheet.paste(img, (x, y + label))
    draw.text((x + 6, y + 4), f.stem, fill=(255, 255, 255))
dst.parent.mkdir(parents=True, exist_ok=True)
sheet.save(dst)
print(f'Kontaktbogen: {dst} ({len(files)} Bilder)')
