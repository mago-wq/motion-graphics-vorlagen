#!/usr/bin/env bash
# Kodiert ein fertiges Video so neu, dass es unter eine Größe passt (Standard 95 MB,
# GitHub nimmt höchstens 100 MB pro Datei). Zwei Durchgänge mit x264 (preset slow),
# Ton wird unverändert übernommen. Braucht ein ffmpeg mit libx264 (System-ffmpeg;
# Remotions eingebautes ffmpeg ist dafür zu abgespeckt).
#   bash scripts/fit-size.sh out/coralclub-teleshop-4k.mp4 [MB]
set -euo pipefail
cd "$(dirname "$0")/.."
IN=$1
MB=${2:-95}
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
SIZE=$(stat -c %s "$IN")
if (( SIZE <= MB * 1000 * 1000 )); then
	echo "$IN ist schon $(( SIZE / 1000000 )) MB, nichts zu tun"
	exit 0
fi
# Videobitrate = Zielgröße minus Ton (256 kbit/s) minus 3 % Puffer für den Container
KBPS=$(python3 -c "print(int($MB * 8000 / $DUR * 0.97 - 256))")
TMP=$(mktemp -d)
ffmpeg -v error -y -i "$IN" -c:v libx264 -preset slow -b:v "${KBPS}k" -pass 1 -passlogfile "$TMP/pass" \
	-pix_fmt yuv420p -an -f mp4 /dev/null
ffmpeg -v error -y -i "$IN" -c:v libx264 -preset slow -b:v "${KBPS}k" -pass 2 -passlogfile "$TMP/pass" \
	-pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
	-c:a copy -movflags +faststart "$TMP/out.mp4"
mv "$TMP/out.mp4" "$IN"
rm -rf "$TMP"
echo "$IN: $(( $(stat -c %s "$IN") / 1000000 )) MB (Video ${KBPS} kbit/s)"
