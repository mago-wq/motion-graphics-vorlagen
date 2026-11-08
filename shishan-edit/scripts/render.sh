#!/usr/bin/env bash
# Rendert das Edit:
#   bash scripts/render.sh            Endfassung 1080×1920 (TikTok/Reels-Maximum)  → out/shishan-edit-1080p.mp4
#   bash scripts/render.sh --draft    schneller Entwurf 540×960 (erst den zeigen)    → out/shishan-edit-entwurf.mp4
#   bash scripts/render.sh --4k       2160×3840 (nur auf Wunsch, dauert lange)       → out/shishan-edit-4k.mp4
# Ton wie in barber-ad/nokhchi-edit: Remotion gibt WAV aus, ffmpeg kodiert AAC selbst ins MP4 –
# sonst fehlt die Edit-List und der Ton läuft ~46 ms hinter dem Bild.
# Filmkorn kommt hier dazu (im Browser pro Frame zu teuer), nur auf die Helligkeit.
# Rohbild bleibt liegen (out/<name>-roh.mp4): Korn/Ton ohne neuen Render: SKIP_RENDER=1 bash scripts/render.sh …
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
NAME=shishan-edit-1080p
EXTRA=(--scale=1 --crf=14 --jpeg-quality=95)
CRF_OUT=17
if [[ "${1:-}" == "--draft" ]]; then
	NAME=shishan-edit-entwurf; EXTRA=(--scale=0.5 --crf=26 --jpeg-quality=80); CRF_OUT=28; shift
elif [[ "${1:-}" == "--4k" ]]; then
	NAME=shishan-edit-4k; EXTRA=(--scale=2 --crf=16); CRF_OUT=17; shift
fi
if [[ -z "${SKIP_RENDER:-}" ]]; then
	npx remotion render ShishanEdit "out/$NAME-roh.mp4" \
		--separate-audio-to="$PWD/out/$NAME-ton.wav" --audio-codec=pcm-16 "${EXTRA[@]}" "$@"
fi
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "out/$NAME-roh.mp4")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "out/$NAME-roh.mp4")
ffmpeg -y -loglevel error -i "out/$NAME-roh.mp4" -filter_complex \
	"color=c=0x808080:s=$((W / 2))x$((H / 2)):r=30,format=gray,noise=c0s=80:c0f=t+u,scale=${W}:${H}:flags=bicubic[n];[0:v]format=yuv420p,extractplanes=y+u+v[y][u][v];[y][n]blend=all_mode=overlay:all_opacity=0.17:shortest=1[y2];[y2][u][v]mergeplanes=0x001020:yuv420p[v]" \
	-map "[v]" -c:v libx264 -preset slow -crf "$CRF_OUT" -pix_fmt yuv420p \
	-color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
	"out/.$NAME-korn.mp4"
ffmpeg -y -loglevel error -i "out/.$NAME-korn.mp4" -i "out/$NAME-ton.wav" \
	-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 44100 -ac 2 -movflags +faststart "out/$NAME.mp4"
rm -f "out/.$NAME-korn.mp4"
ls -la "out/$NAME.mp4"
