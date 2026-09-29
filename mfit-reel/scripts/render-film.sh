#!/usr/bin/env bash
# Rendert den Film (Komposition MfitFilm) mit Ton:
#   bash scripts/render-film.sh        → out/mfit-film.mp4     1080×1920
#   bash scripts/render-film.sh --4k   → out/mfit-film-4k.mp4  2160×3840 (Master)
# Wie beim Reel (siehe render.sh): Remotion rendert nur das Bild, ffmpeg kodiert die
# Tonspur direkt ins MP4 (sonst 46 ms Versatz), AAC ohne PNS (sonst Übersteuerung).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
bash scripts/figuren.sh

OUT=out/mfit-film.mp4
PROPS='{"mitTon":false,"hd":false,"sicherheitszone":false}'
QUALITY=()
ARGS=()
for arg in "$@"; do
	if [ "$arg" = "--4k" ]; then
		OUT=out/mfit-film-4k.mp4
		PROPS='{"mitTon":false,"hd":true,"sicherheitszone":false}'
		QUALITY=(--scale=2 --image-format=png --crf=14 --x264-preset=slow)
	else
		ARGS+=("$arg")
	fi
done

if [ ! -f public/audio/mfit-film.wav ] || [ src/story/film/film.json -nt public/audio/mfit-film.wav ] || [ scripts/make_film_sound.py -nt public/audio/mfit-film.wav ]; then
	echo "Film-Tonspur fehlt oder ist älter als Zeitplan/Generator – wird neu erzeugt …"
	python3 scripts/make_film_sound.py
fi

TMP=out/.film-ohne-ton.mp4
npx remotion render MfitFilm "$TMP" --muted --props="$PROPS" ${QUALITY[@]+"${QUALITY[@]}"} ${ARGS[@]+"${ARGS[@]}"}

npx remotion ffmpeg -y -loglevel error \
	-i "$TMP" -i public/audio/mfit-film.wav \
	-map 0:v:0 -map 1:a:0 -c:v copy \
	-c:a aac -aac_pns 0 -b:a 320k -ar 48000 -ac 2 \
	-movflags +faststart "$OUT"
rm -f "$TMP"
echo "Fertig: $OUT"
