#!/usr/bin/env bash
# Kontroll-Standbilder nach out/stills/ rendern (ohne Bildschirm prüfbar).
#   npm run stills                Standard-Frames (je Szene eins + Ende)
#   FRAMES="10 20" npm run stills
set -euo pipefail
cd "$(dirname "$0")/.."

FRAMES=${FRAMES:-"110 205 262 330 450 590 622 645"}
mkdir -p out/stills
# Einmal bündeln, dann alle Frames aus demselben Bundle rendern.
npx remotion bundle --out-dir=out/bundle --log=error >/dev/null
for f in $FRAMES; do
	npx remotion still out/bundle WeltLaerm "out/stills/frame-$(printf '%03d' "$f").png" --frame="$f" --log=error
	echo "out/stills/frame-$(printf '%03d' "$f").png"
done
