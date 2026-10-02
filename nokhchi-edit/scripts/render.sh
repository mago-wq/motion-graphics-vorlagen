#!/usr/bin/env bash
# Rendert das Bild EINMAL und legt beide Tonfassungen darunter:
#   out/nokhchi-edit-4k.mp4          ohne gesprochene Zitate
#   out/nokhchi-edit-4k-zitate.mp4   mit gesprochenen Zitaten
# Vorschau in 1080p (≈ 4× schneller):  bash scripts/render.sh --preview
#
# Ton wie in barber-ad: Remotion gibt WAV aus, ffmpeg kodiert AAC selbst ins MP4 –
# sonst fehlt die Edit-List und der Ton läuft ~46 ms hinter dem Bild.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
python3 scripts/index_assets.py >/dev/null

NAME=nokhchi-edit-4k
EXTRA=()
if [[ "${1:-}" == "--preview" ]]; then
	NAME=nokhchi-edit-vorschau-1080p
	EXTRA=(--scale=1 --crf=20)
	shift
fi

npx remotion render NokhchiEdit "out/.$NAME-bild.mp4" \
	--separate-audio-to="$PWD/out/$NAME-ton.wav" --audio-codec=pcm-16 "${EXTRA[@]}" "$@"

mux() { # $1 = Ton-WAV, $2 = Ziel
	npx remotion ffmpeg -y -loglevel error \
		-i "out/.$NAME-bild.mp4" -i "$1" \
		-map 0:v:0 -map 1:a:0 -c:v copy \
		-c:a aac -b:a 320k -ar 44100 -ac 2 -shortest \
		-movflags +faststart "$2"
}
mux "out/$NAME-ton.wav" "out/$NAME.mp4"
mux public/audio/mix_zitate.wav "out/$NAME-zitate.mp4"
rm -f "out/.$NAME-bild.mp4"
echo "Fertig: out/$NAME.mp4 und out/$NAME-zitate.mp4"
