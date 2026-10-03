#!/usr/bin/env bash
# Rendert das Video mit Ton: out/quran-geduld.mp4 (H.264 + AAC, 44,1 kHz Stereo).
#   npm run render              Endfassung 1080×1920
#   npm run render -- --entwurf schneller Entwurf 540×960, hohe CRF (zum Abstimmen)
#
# Ton als WAV aus Remotion, dann ffmpeg → AAC (wie in barber-ad/welt-laerm):
# Remotions eigener AAC-Weg verliert den Encoder-Vorlauf, der Ton läge ~46 ms zu spät.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

ARGS=()
OUT=out/quran-geduld.mp4
if [[ "${1:-}" == "--entwurf" ]]; then
	shift
	ARGS=(--scale=0.5 --crf=30)
	OUT=out/quran-geduld-entwurf.mp4
fi

npx remotion render QuranGeduld out/.video-ohne-ton.mp4 \
	--separate-audio-to="$PWD/out/ton.wav" --audio-codec=pcm-16 "${ARGS[@]}" "$@"

npx remotion ffmpeg -y -loglevel error \
	-i out/.video-ohne-ton.mp4 -i out/ton.wav \
	-map 0:v:0 -map 1:a:0 -c:v copy \
	-c:a aac -b:a 160k -ar 44100 -ac 2 \
	-movflags +faststart "$OUT"
rm -f out/.video-ohne-ton.mp4

echo "Fertig: $OUT"
