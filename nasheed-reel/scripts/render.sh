#!/usr/bin/env bash
# Rendert das fertige Video: out/nasheed-reel.mp4, 4K (2160×3840), mit Ton
# (Nasheed aus public/ton/nasheed.wav + Geräusche), Lautheit -14 LUFS.
#
# Ton wie in barber-ad/scripts/render.sh: Remotion gibt ihn als WAV aus, ffmpeg
# kodiert ihn direkt ins MP4. Sonst fehlt die Edit-List und der Ton läuft 46 ms nach.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

if [ ! -f public/ton/nasheed.wav ]; then
	echo "Fehlt: public/ton/nasheed.wav (Nasheed-Ton, wird nicht eingecheckt)" >&2
	exit 1
fi

# --scale=2: Komposition ist 1080×1920 gesetzt, gerendert wird in doppelter Auflösung
npx remotion render NasheedReel out/.video-ohne-ton.mp4 --scale=2 \
	--separate-audio-to="$PWD/out/.ton.wav" --audio-codec=pcm-16 "$@"

# Auf -14 LUFS (TikTok-üblich) anheben, Spitzen begrenzen
I=$(npx remotion ffmpeg -i out/.ton.wav -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}')
GAIN=$(python3 -c "print(round(-14 - ($I), 2))")
echo "Ton: $I LUFS -> Verstärkung $GAIN dB"

npx remotion ffmpeg -y -loglevel error \
	-i out/.video-ohne-ton.mp4 -i out/.ton.wav \
	-map 0:v:0 -map 1:a:0 -c:v copy \
	-af "volume=${GAIN}dB,alimiter=limit=0.89:level=false" \
	-c:a aac -b:a 256k -ar 44100 -ac 2 \
	-movflags +faststart out/nasheed-reel.mp4
rm -f out/.video-ohne-ton.mp4 out/.ton.wav

echo "Fertig: out/nasheed-reel.mp4"
