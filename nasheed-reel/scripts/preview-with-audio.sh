#!/usr/bin/env bash
# Legt eine Tonspur unter das stumme Video, nur zum Prüfen der Synchronität.
# Ton direkt mit ffmpeg nach AAC ins MP4 (Edit-List für den Encoder-Vorlauf),
# siehe barber-ad/CLAUDE.md „Ton 46 ms zu spät“.
set -euo pipefail
cd "$(dirname "$0")/.."

AUDIO="${1:?Pfad zur Tonspur (wav/mp3/mp4) angeben}"
VIDEO="out/nasheed-reel-stumm.mp4"
OUT="out/nasheed-reel-vorschau-mit-ton.mp4"

ffmpeg -v error -y -i "$VIDEO" -i "$AUDIO" -map 0:v:0 -map 1:a:0 \
	-c:v copy -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart "$OUT"
echo "-> $OUT"
