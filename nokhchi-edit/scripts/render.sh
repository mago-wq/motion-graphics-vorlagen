#!/usr/bin/env bash
# Rendert das fertige Video: out/nokhchi-edit-4k.mp4 (2160×3840, H.264 + AAC 320k).
#
# Wie in barber-ad: Remotion gibt den Ton als WAV aus, ffmpeg kodiert ihn direkt ins MP4.
# Sonst fehlt die AAC-Edit-List und der Ton läuft ~46 ms hinter dem Bild – bei Schlägen,
# die exakt auf Schnitten liegen, deutlich spürbar.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
python3 scripts/index_assets.py >/dev/null

npx remotion render NokhchiEdit out/.video-ohne-ton.mp4 \
	--separate-audio-to="$PWD/out/nokhchi-edit-ton.wav" --audio-codec=pcm-16 "$@"

npx remotion ffmpeg -y -loglevel error \
	-i out/.video-ohne-ton.mp4 -i out/nokhchi-edit-ton.wav \
	-map 0:v:0 -map 1:a:0 -c:v copy \
	-c:a aac -b:a 320k -ar 44100 -ac 2 \
	-movflags +faststart out/nokhchi-edit-4k.mp4
rm -f out/.video-ohne-ton.mp4
echo "Fertig: out/nokhchi-edit-4k.mp4"
