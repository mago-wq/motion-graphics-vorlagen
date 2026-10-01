#!/usr/bin/env bash
# Kontroll-Standbilder nach out/stills/ rendern (ohne Bildschirm prüfbar).
#   npm run stills             Standard-Frames
#   npm run stills -- --safe   mit eingeblendeter Sicherheitszone
#   FRAMES="10 20" npm run stills
set -euo pipefail
cd "$(dirname "$0")/.."

FRAMES=${FRAMES:-"0 12 30 45 60 100 130 190 220 280 310 360 400 449"}
PROPS='{"showSafeZone":false}'
SUFFIX=""
if [[ "${1:-}" == "--safe" ]]; then
	PROPS='{"showSafeZone":true}'
	SUFFIX="-safe"
fi

mkdir -p out/stills
# Einmal bündeln, dann alle Frames aus demselben Bundle rendern (spart pro Bild ~10 s).
npx remotion bundle --out-dir=out/bundle --log=error >/dev/null
for f in $FRAMES; do
	npx remotion still out/bundle CoralClubTeleshop "out/stills/frame-$(printf '%03d' "$f")${SUFFIX}.png" \
		--frame="$f" --props="$PROPS" --log=error
	echo "out/stills/frame-$(printf '%03d' "$f")${SUFFIX}.png"
done
