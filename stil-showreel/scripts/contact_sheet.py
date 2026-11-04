"""Kontaktbogen aus PNG-Dateien: python3 scripts/contact_sheet.py out/sheet.png out/stills/*.png [--cols 5] [--w 270]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

args = sys.argv[1:]
cols = int(args[args.index('--cols') + 1]) if '--cols' in args else 5
w = int(args[args.index('--w') + 1]) if '--w' in args else 270
files = [a for a in args[1:] if a.endswith('.png') and not a.startswith('--')]
ims = [Image.open(f).convert('RGB') for f in files]
h = round(w * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 22)), 'white')
d = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    sheet.paste(im.resize((w, h)), (x, y + 22))
    d.text((x + 4, y + 4), Path(f).stem, fill='black')
sheet.save(args[0])
print(args[0], sheet.size)
