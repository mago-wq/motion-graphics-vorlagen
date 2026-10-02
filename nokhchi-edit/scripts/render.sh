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
	EXTRA=(--scale=1 --crf=18)
	export CRF_OUT=20
	shift
fi

npx remotion render NokhchiEdit "out/.$NAME-bild.mp4" \
	--separate-audio-to="$PWD/out/$NAME-ton.wav" --audio-codec=pcm-16 "${EXTRA[@]}" "$@"

# Filmkorn erst hier (im Browser pro Frame zu teuer): Rauschen in halber Auflösung,
# hochskaliert (Korngröße ≈ 2 px) und per Overlay nur auf die Helligkeit gelegt.
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "out/.$NAME-bild.mp4")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "out/.$NAME-bild.mp4")
ffmpeg -y -loglevel error -i "out/.$NAME-bild.mp4" -filter_complex \
	"color=c=0x808080:s=$((W / 2))x$((H / 2)):r=30,format=yuv420p,noise=c0s=70:c0f=t+u,scale=${W}:${H}:flags=bicubic[n];[0:v][n]blend=c0_mode=overlay:c0_opacity=0.13:c1_opacity=0:c2_opacity=0:shortest=1,format=yuv420p[v]" \
	-map "[v]" -c:v libx264 -preset medium -crf "${CRF_OUT:-16}" -pix_fmt yuv420p \
	-color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
	"out/.$NAME-korn.mp4"

mux() { # $1 = Ton-WAV, $2 = Ziel
	ffmpeg -y -loglevel error \
		-i "out/.$NAME-korn.mp4" -i "$1" \
		-map 0:v:0 -map 1:a:0 -c:v copy \
		-c:a aac -b:a 320k -ar 44100 -ac 2 -shortest \
		-movflags +faststart "$2"
}
mux "out/$NAME-ton.wav" "out/$NAME.mp4"
mux public/audio/mix_zitate.wav "out/$NAME-zitate.mp4"
rm -f "out/.$NAME-bild.mp4" "out/.$NAME-korn.mp4"
echo "Fertig: out/$NAME.mp4 und out/$NAME-zitate.mp4"
