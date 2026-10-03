#!/usr/bin/env bash
# Rendert das fertige Video: out/zitat-edit.mp4 (H.264 + AAC, 44,1 kHz Stereo)
# und den Ton zusätzlich verlustfrei als out/zitat-edit-ton.wav.
#
# Drei Schritte statt nur "npx remotion render":
# 1. Remotion rendert Bild und Ton getrennt (Ton als WAV).
# 2. scripts/lautheit.py bringt den Ton auf -14 LUFS (übliche Lautheit für
#    TikTok/Reels) und begrenzt Spitzen auf -2 dBFS (AAC schwingt etwas über).
# 3. ffmpeg kodiert den Ton direkt ins MP4. Remotion selbst kopiert AAC als
#    ADTS ins MP4, dabei geht die Angabe zum Encoder-Vorlauf verloren und der
#    Ton liefe 46 ms hinter dem Bild (siehe barber-ad/CLAUDE.md).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

npx remotion render ZitatEdit out/.video-ohne-ton.mp4 \
	--separate-audio-to="$PWD/out/.ton-roh.wav" --audio-codec=pcm-16 "$@"

python3 scripts/lautheit.py out/.ton-roh.wav out/zitat-edit-ton.wav

npx remotion ffmpeg -y -loglevel error \
	-i out/.video-ohne-ton.mp4 -i out/zitat-edit-ton.wav \
	-map 0:v:0 -map 1:a:0 -c:v copy \
	-c:a aac -b:a 192k -ar 44100 -ac 2 \
	-movflags +faststart out/zitat-edit.mp4
rm -f out/.video-ohne-ton.mp4 out/.ton-roh.wav

echo "Fertig: out/zitat-edit.mp4 (+ Ton einzeln: out/zitat-edit-ton.wav)"
