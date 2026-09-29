#!/usr/bin/env bash
# Rendert das fertige Video: out/coralclub-ad.mp4 (H.264 + AAC, 44,1 kHz Stereo)
# und den Ton zusätzlich verlustfrei als out/coralclub-ad-ton.wav.
#
# Warum zwei Schritte statt nur "npx remotion render":
# Remotion kodiert AAC zuerst als ADTS-Datei und kopiert sie dann ins MP4.
# Dabei geht die Angabe zum Encoder-Vorlauf verloren (Edit-List), und der
# Ton liefe im Player 46 ms hinter dem Bild – bei Einschlägen und Schnipsern
# gerade spürbar. Deshalb gibt Remotion den Ton hier als WAV aus, und ffmpeg
# kodiert ihn direkt ins MP4. Dann stimmt die Synchronität auf die Millisekunde.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

npx remotion render CoralClubAd out/.video-ohne-ton.mp4 \
	--separate-audio-to="$PWD/out/coralclub-ad-ton.wav" --audio-codec=pcm-16 "$@"

npx remotion ffmpeg -y -loglevel error \
	-i out/.video-ohne-ton.mp4 -i out/coralclub-ad-ton.wav \
	-map 0:v:0 -map 1:a:0 -c:v copy \
	-c:a aac -b:a 192k -ar 44100 -ac 2 \
	-movflags +faststart out/coralclub-ad.mp4
rm -f out/.video-ohne-ton.mp4

echo "Fertig: out/coralclub-ad.mp4 (+ Ton einzeln: out/coralclub-ad-ton.wav)"
