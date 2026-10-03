#!/usr/bin/env bash
# Rendert das Video: out/rahil-reel.mp4 mit Ton (Nasheed + Geräusche), -14 LUFS.
#
#   npm run render                 Endfassung: 1080 rendern, Lanczos auf 4K (2160×3840)
#   npm run render -- --entwurf    schneller Entwurf 540×960, kleine Datei (für Feedback)
#   npm run render -- --1080       Endfassung in 1080×1920 (passt in den Chat-Upload, < 30 MB)
#   npm run render -- --echt-4k    nativ in 4K rendern (deutlich langsamer)
#
# Ton wie in barber-ad/scripts/render.sh: Remotion gibt ihn als WAV aus, ffmpeg
# kodiert ihn direkt ins MP4. Sonst fehlt die Edit-List und der Ton läuft 46 ms nach.
# Andere Komposition: KOMP=SommerReel npm run render -- --entwurf
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

if [ ! -f public/ton/rahil.wav ]; then
	echo "Fehlt: public/ton/rahil.wav (Nasheed-Ton, wird nicht eingecheckt, siehe README)" >&2
	exit 1
fi
command -v ffmpeg >/dev/null || { echo "Bitte ffmpeg installieren (für Lautheit/Mux)" >&2; exit 1; }

KOMP=${KOMP:-RahilReel}
NAME=$( [ "$KOMP" = SommerReel ] && echo sommer-reel || echo rahil-reel )
OUT=out/$NAME.mp4
SCALE=1
VF=(-vf "scale=2160:3840:flags=lanczos" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p
	-colorspace bt709 -color_primaries bt709 -color_trc bt709)
case "${1:-}" in
--entwurf)
	SCALE=0.5
	OUT=out/$NAME-entwurf.mp4
	VF=(-c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p)
	shift ;;
--1080)
	OUT=out/$NAME-1080p.mp4
	VF=(-c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p
		-colorspace bt709 -color_primaries bt709 -color_trc bt709)
	shift ;;
--echt-4k)
	SCALE=2
	VF=(-c:v copy)
	shift ;;
esac

npx remotion render "$KOMP" out/.video-ohne-ton.mp4 --scale=$SCALE \
	--separate-audio-to="$PWD/out/.ton.wav" --audio-codec=pcm-16 "$@"

# Auf -14 LUFS (TikTok-üblich), Spitzen begrenzen. System-ffmpeg nötig (ebur128, alimiter).
I=$(ffmpeg -hide_banner -i out/.ton.wav -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}')
GAIN=$(python3 -c "print(round(-14 - ($I), 2))")
echo "Ton: $I LUFS -> Verstärkung $GAIN dB"

ffmpeg -y -loglevel error \
	-i out/.video-ohne-ton.mp4 -i out/.ton.wav \
	-map 0:v:0 -map 1:a:0 "${VF[@]}" \
	-af "volume=${GAIN}dB,alimiter=limit=0.89:level=false" \
	-c:a aac -b:a 192k -ar 44100 -ac 2 \
	-movflags +faststart "$OUT"
rm -f out/.video-ohne-ton.mp4 out/.ton.wav
echo "Fertig: $OUT"
