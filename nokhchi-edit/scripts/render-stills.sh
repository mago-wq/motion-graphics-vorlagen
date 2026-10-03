#!/usr/bin/env bash
# Kontroll-Standbilder nach out/stills/ (ohne Bildschirm prüfbar).
#   npm run stills                    Standard-Frames, halbe Auflösung (540×960)
#   FRAMES="10 20" SCALE=1 npm run stills
set -euo pipefail
cd "$(dirname "$0")/.."
FRAMES=${FRAMES:-"5 40 100 170 300 370 410 440 540 590 655 745 830 900 960 1080 1250 1340 1400 1470 1540 1600 1720"}
SCALE=${SCALE:-0.5}
mkdir -p out/stills
python3 scripts/index_assets.py >/dev/null
npx remotion bundle --out-dir=out/bundle --log=error >/dev/null
for f in $FRAMES; do
	npx remotion still out/bundle NokhchiEdit "out/stills/f$(printf '%04d' "$f").png" --frame="$f" --scale="$SCALE" --log=error
done
python3 scripts/contact_sheet.py out/stills out/stills/_sheet.png
echo "out/stills/_sheet.png"
