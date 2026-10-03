#!/usr/bin/env bash
# Kontroll-Standbilder nach out/stills/ rendern (ohne Bildschirm prüfbar).
#   npm run stills                Standard-Frames (je Szene eins)
#   FRAMES="10 20" npm run stills
set -euo pipefail
cd "$(dirname "$0")/.."

FRAMES=${FRAMES:-"40 150 300 420 640 860 900 1000 1150 1300 1500 1650"}
mkdir -p out/stills
# Einmal bündeln, dann alle Frames aus demselben Bundle rendern.
npx remotion bundle --out-dir=out/bundle --log=error >/dev/null
for f in $FRAMES; do
	npx remotion still out/bundle QuranGeduld "out/stills/frame-$(printf '%04d' "$f").png" --frame="$f" --log=error ${SCALE:+--scale=$SCALE}
	echo "out/stills/frame-$(printf '%04d' "$f").png"
done
