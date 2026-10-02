#!/usr/bin/env bash
# Rendert out/zitat-reel.mp4 (H.264 + AAC, 44,1 kHz Stereo).
# Zwei Schritte wie bei barber-ad: Remotion gibt den Ton als WAV aus, ffmpeg kodiert
# ihn direkt ins MP4. Sonst fehlt die Edit-List und der Ton liegt 46 ms zu spät –
# hier unkritisch (Regen), aber der Loop-Übergang bleibt so sample-genau.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
[ -f public/regen.wav ] || python3 scripts/generate_rain.py

npx remotion render ZitatReel out/.video-ohne-ton.mp4 \
	--separate-audio-to="$PWD/out/.ton.wav" --audio-codec=pcm-16 "$@"

npx remotion ffmpeg -y -loglevel error \
	-i out/.video-ohne-ton.mp4 -i out/.ton.wav \
	-map 0:v:0 -map 1:a:0 -c:v copy \
	-c:a aac -b:a 192k -ar 44100 -ac 2 \
	-movflags +faststart out/zitat-reel.mp4
rm -f out/.video-ohne-ton.mp4 out/.ton.wav

echo "Fertig: out/zitat-reel.mp4"
