#!/usr/bin/env bash
# Rendert das Showreel mit Ton.
#   bash scripts/render.sh --entwurf   → out/stil-showreel-entwurf.mp4 (540×960, schnell, für Rückmeldungen)
#   bash scripts/render.sh             → out/stil-showreel.mp4 (1080×1920)
#   bash scripts/render.sh --4k        → out/stil-showreel-4k.mp4 (2160×3840)
#
# Ablauf: Einsätze aus src/timing.ts → audio/cues.json, Geräusche aus audio/kit.json mit earshot
# rendern, mit scripts/mix.py mischen (public/ton/mix.wav), Bild ohne Ton rendern, dann ffmpeg
# kodiert den Ton direkt als AAC ins MP4 (sonst läuft der Ton 46 ms hinterher, siehe barber-ad).
# Braucht earshot (bash <Youtube-Repo>/werkzeuge/ton/earshot_einrichten.sh).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

MODE=voll
for a in "$@"; do
	case "$a" in
		--entwurf) MODE=entwurf ;;
		--4k) MODE=4k ;;
	esac
done
case "$MODE" in
	entwurf) SCALE=0.5; CRF=26; NAME=stil-showreel-entwurf ;;
	voll) SCALE=1; CRF=18; NAME=stil-showreel ;;
	4k) SCALE=2; CRF=18; NAME=stil-showreel-4k ;;
esac
PY=${EARSHOT_PY:-/opt/earshot/.venv/bin/python}

node --no-warnings scripts/cues.mjs
earshot kit render audio/kit.json --out audio/kit | tail -1
"$PY" scripts/mix.py

npx remotion render StilShowreel out/.bild.mp4 --muted --concurrency=4 \
	--scale="$SCALE" --props="{\"res\":$SCALE}" --crf="$CRF"

npx remotion ffmpeg -y -loglevel error \
	-i out/.bild.mp4 -i public/ton/mix.wav \
	-map 0:v:0 -map 1:a:0 -c:v copy \
	-c:a aac -b:a 192k -ar 48000 -ac 2 \
	-movflags +faststart "out/$NAME.mp4"
rm -f out/.bild.mp4
echo "Fertig: out/$NAME.mp4"
