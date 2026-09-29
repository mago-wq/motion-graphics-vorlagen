#!/usr/bin/env bash
# Rendert das fertige Reel (H.264 + AAC, 48 kHz Stereo):
#   bash scripts/render.sh        → out/mfit-reel.mp4     1080×1920 (Instagram-Upload)
#   bash scripts/render.sh --4k   → out/mfit-reel-4k.mp4  2160×3840 (Master in hoher Qualität)
# Weitere Argumente gehen an "npx remotion render" (z. B. --concurrency=4).
#
# 4K: Remotion rendert dieselbe Komposition mit doppelter Pixeldichte (--scale=2).
# Schrift, Linien und Verläufe sind Vektoren und bleiben scharf; Logo und Filmkorn
# liegen in doppelter Auflösung vor (scripts/prepare_assets.py). Einzelbilder als PNG
# (verlustfrei, keine JPEG-Artefakte in den dunklen Verläufen), x264 "slow" mit CRF 14.
#
# Zwei Schritte statt nur "npx remotion render":
# Remotion kodiert AAC zuerst als ADTS-Datei und kopiert sie dann ins MP4. Dabei
# geht die Angabe zum Encoder-Vorlauf (Edit-List) verloren und der Ton läuft im
# Player rund 46 ms hinter dem Bild. Deshalb rendert Remotion hier nur das Bild,
# und ffmpeg kodiert die fertige Tonspur direkt ins MP4. Dann sitzt jeder Effekt
# auf seinem Frame. (Gleiche Lösung wie in barber-ad, dort gemessen.)
#
# -aac_pns 0: Der native AAC-Encoder ersetzt sonst rauschartige Anteile (Claps,
# Hi-Hats) durch synthetisches Rauschen, dessen Spitzen bis +2,6 dBFS übersteuerten.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

OUT=out/mfit-reel.mp4
PROPS='{"showSafeZone":false,"withAudio":false,"hd":false}'
QUALITY=()
ARGS=()
for arg in "$@"; do
	if [ "$arg" = "--4k" ]; then
		OUT=out/mfit-reel-4k.mp4
		PROPS='{"showSafeZone":false,"withAudio":false,"hd":true}'
		QUALITY=(--scale=2 --image-format=png --crf=14 --x264-preset=slow)
	else
		ARGS+=("$arg")
	fi
done

if [ ! -f public/audio/mfit-soundtrack.wav ] || [ src/timeline.json -nt public/audio/mfit-soundtrack.wav ] || [ scripts/make_soundtrack.py -nt public/audio/mfit-soundtrack.wav ]; then
	echo "Tonspur fehlt oder ist älter als Zeitplan/Generator – wird neu erzeugt …"
	python3 scripts/make_soundtrack.py
fi

TMP=out/.bild-ohne-ton.mp4
npx remotion render MfitReel "$TMP" --muted --props="$PROPS" ${QUALITY[@]+"${QUALITY[@]}"} ${ARGS[@]+"${ARGS[@]}"}

npx remotion ffmpeg -y -loglevel error \
	-i "$TMP" -i public/audio/mfit-soundtrack.wav \
	-map 0:v:0 -map 1:a:0 -c:v copy \
	-c:a aac -aac_pns 0 -b:a 320k -ar 48000 -ac 2 \
	-movflags +faststart "$OUT"
rm -f "$TMP"

echo "Fertig: $OUT"
