#!/usr/bin/env bash
# Chat-Fassung der Endfassung: Chat-Uploads ab ~30 MB kommen nicht an. 2-Pass auf feste Größe
# (Ziel ≈ 26 MB), Ton bleibt AAC 256k. Eingabe: out/shishan-edit-1080p.mp4 → out/shishan-edit-chat.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
IN=out/shishan-edit-1080p.mp4
OUT=out/shishan-edit-chat.mp4
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
VBR=$(python3 -c "print(int((26*8*1024*1024/$DUR - 256000) / 1000))")
cd out
ffmpeg -y -loglevel error -i "../$IN" -c:v libx264 -preset slow -b:v "${VBR}k" -pass 1 -passlogfile .x264 -an -f mp4 /dev/null
ffmpeg -y -loglevel error -i "../$IN" -c:v libx264 -preset slow -b:v "${VBR}k" -pass 2 -passlogfile .x264 \
	-pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
	-c:a aac -b:a 256k -ar 44100 -movflags +faststart "../$OUT"
rm -f .x264*
cd ..
ls -la "$OUT"
