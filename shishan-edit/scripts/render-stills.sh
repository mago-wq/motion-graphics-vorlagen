#!/usr/bin/env bash
# Kontroll-Standbilder nach out/stills/ (ohne Bildschirm prüfbar) + Kontaktbogen.
#   npm run stills                      Standard-Frames, halbe Auflösung (540×960)
#   FRAMES="10 20" SCALE=1 npm run stills
set -euo pipefail
cd "$(dirname "$0")/.."
FRAMES=${FRAMES:-"6 22 45 76 96 114 126 156 172 214 246 264 299 312 352 371 391 408 446 466 522 546 566 606 626 646 686 706 724 764 792 840"}
SCALE=${SCALE:-0.5}
rm -rf out/stills && mkdir -p out/stills
npx remotion bundle --out-dir=out/bundle --log=error >/dev/null
for f in $FRAMES; do
	npx remotion still out/bundle ShishanEdit "out/stills/f$(printf '%04d' "$f").png" --frame="$f" --scale="$SCALE" --log=error
done
python3 scripts/contact_sheet.py out/stills out/stills/_sheet.png 8
echo "out/stills/_sheet.png"
