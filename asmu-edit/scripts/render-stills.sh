#!/usr/bin/env bash
# Kontrollbilder in halber Auflösung + Kontaktbogen out/stills/_bogen.jpg.
#   npm run stills                    Standardauswahl (je Einstellung ein Bild)
#   FRAMES="40 41 42" npm run stills  beliebige Frames
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/stills
FRAMES=${FRAMES:-"20 50 75 115 140 160 195 230 260 290 320 355 380 405 440 470 482 492 515 560 590 625 660 700 745 770 800 845 880 930 960 1000 1040 1070 1100 1140 1200"}
rm -f out/stills/f*.jpg
# shellcheck disable=SC2086
node scripts/stills.mjs $FRAMES
python3 - <<'PY'
from pathlib import Path
from PIL import Image, ImageDraw
files = sorted(Path("out/stills").glob("f*.jpg"))
w, h = 270, 480
cols = 8
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + 22)), "black")
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
	im = Image.open(f).convert("RGB").resize((w, h))
	x, y = (i % cols) * w, (i // cols) * (h + 22)
	sheet.paste(im, (x, y + 22))
	n = int(f.stem[1:])
	d.text((x + 4, y + 4), f"{n}  ({n / 30:.2f} s)", fill=(255, 220, 120))
sheet.save("out/stills/_bogen.jpg", quality=85)
print("out/stills/_bogen.jpg", sheet.size)
PY
