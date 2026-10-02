#!/usr/bin/env bash
# Rendert das Bild EINMAL und legt die Tonfassungen darunter:
#   out/<name>.mp4             ohne gesprochene Zitate
#   out/<name>-zitate-de.mp4   Zitate deutsch
#   out/<name>-zitate-ru.mp4   Zitate russisch (Original)
# Endfassung 4K:            bash scripts/render.sh
# Vorschau 1080p:           bash scripts/render.sh --preview
# Schneller Entwurf 540p:   bash scripts/render.sh --draft   (erst den zeigen, dann Endrender)
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
elif [[ "${1:-}" == "--draft" ]]; then
	NAME=nokhchi-edit-entwurf
	EXTRA=(--scale=0.5 --crf=26 --jpeg-quality=80 --concurrency=4)
	export CRF_OUT=30
	shift
fi

# Rohes Bild bleibt liegen (out/<name>-roh.mp4): Korn und Ton lassen sich so ohne neuen Render
# wiederholen:  SKIP_RENDER=1 bash scripts/render.sh [--preview]
if [[ -z "${SKIP_RENDER:-}" ]]; then
npx remotion render NokhchiEdit "out/$NAME-roh.mp4" \
	--separate-audio-to="$PWD/out/$NAME-ton.wav" --audio-codec=pcm-16 "${EXTRA[@]}" "$@"
fi

# Filmkorn erst hier (im Browser pro Frame zu teuer): Rauschen in halber Auflösung,
# hochskaliert (Korngröße ≈ 2 px), per Overlay NUR auf die Helligkeit (Y-Ebene) –
# die Farbebenen bleiben unangetastet (ein blend über alle Ebenen hatte die Farbe gelöscht).
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "out/$NAME-roh.mp4")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "out/$NAME-roh.mp4")
ffmpeg -y -loglevel error -i "out/$NAME-roh.mp4" -filter_complex \
	"color=c=0x808080:s=$((W / 2))x$((H / 2)):r=30,format=gray,noise=c0s=70:c0f=t+u,scale=${W}:${H}:flags=bicubic[n];[0:v]format=yuv420p,extractplanes=y+u+v[y][u][v];[y][n]blend=all_mode=overlay:all_opacity=0.13:shortest=1[y2];[y2][u][v]mergeplanes=0x001020:yuv420p[v]" \
	-map "[v]" -c:v libx264 -preset medium -crf "${CRF_OUT:-16}" -pix_fmt yuv420p \
	-color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
	"out/.$NAME-korn.mp4"

mux() { # $1 = Ton-WAV, $2 = Ziel
	ffmpeg -y -loglevel error \
		-i "out/.$NAME-korn.mp4" -i "$1" \
		-map 0:v:0 -map 1:a:0 -c:v copy \
		-c:a aac -b:a 320k -ar 44100 -ac 2 \
		-movflags +faststart "$2"
}
mux "out/$NAME-ton.wav" "out/$NAME.mp4"
for lang in de ru; do
	[[ -f "public/audio/mix_zitate_$lang.wav" ]] && mux "public/audio/mix_zitate_$lang.wav" "out/$NAME-zitate-$lang.mp4"
done
rm -f "out/.$NAME-korn.mp4"
echo "Fertig: out/$NAME.mp4 (+ -zitate-de / -zitate-ru)"
