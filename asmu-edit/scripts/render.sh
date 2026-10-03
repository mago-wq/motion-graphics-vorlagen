#!/usr/bin/env bash
# Rendert das Edit mit Ton (Nasheed + Geräusche), auf -14 LUFS gebracht.
#
#   npm run render -- --entwurf    schneller Entwurf 540×960, kleine Datei (erst den zeigen)
#   npm run render -- --1080       Endfassung 1080×1920, 2-Pass auf ≤ 28 MB (Chat-Upload endet bei ~30 MB)
#   npm run render                 Endfassung 4K: 1080 rendern, Lanczos auf 2160×3840
#   npm run render -- --echt-4k    nativ in 4K rendern (deutlich langsamer)
#
# Ton wie in barber-ad/scripts/render.sh: Remotion gibt ihn als WAV aus, ffmpeg
# kodiert ihn selbst ins MP4. Sonst fehlt die Edit-List und der Ton läuft 46 ms nach.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

[ -f public/ton/asmu-schnitt.wav ] || { echo "Fehlt: public/ton/asmu-schnitt.wav – erst npm run assets && npm run ton" >&2; exit 1; }
[ -d public/clips ] || { echo "Fehlen: public/clips – erst npm run assets" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "Bitte ffmpeg installieren (Lautheit/Mux)" >&2; exit 1; }

NAME=asmu-edit
OUT=out/$NAME-4k.mp4
SCALE=1
CONC=${CONC:-3}
ZWEIPASS=0
EXTRA=()
VF=(-vf "scale=2160:3840:flags=lanczos" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p
	-colorspace bt709 -color_primaries bt709 -color_trc bt709)
case "${1:-}" in
--entwurf)
	SCALE=0.5
	OUT=out/$NAME-entwurf.mp4
	VF=(-c:v libx264 -preset veryfast -crf 27 -pix_fmt yuv420p)
	shift ;;
--1080)
	OUT=out/$NAME-1080p.mp4
	# Zwischendatei fast verlustfrei, dann 2-Pass mit fester Zielgröße (Filmkorn bläht CRF-Dateien auf)
	ZWEIPASS=1
	EXTRA=(--crf=10)
	shift ;;
--echt-4k)
	SCALE=2
	CONC=2
	VF=(-c:v copy)
	shift ;;
esac

npx remotion render AsmuEdit out/.video-ohne-ton.mp4 --scale=$SCALE --concurrency=$CONC \
	--separate-audio-to="$PWD/out/.ton.wav" --audio-codec=pcm-16 "${EXTRA[@]}" "$@"

# Auf -14 LUFS (TikTok-üblich), Spitzen begrenzen. System-ffmpeg nötig (ebur128, alimiter).
I=$(ffmpeg -hide_banner -i out/.ton.wav -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}')
GAIN=$(python3 -c "print(round(-14 - ($I), 2))")
echo "Ton: $I LUFS -> Verstärkung $GAIN dB"

if [ "$ZWEIPASS" = 1 ]; then
	DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/.video-ohne-ton.mp4)
	# Zielgröße 28 MB, davon 192 kbit/s Ton; Spitzen auf das Doppelte begrenzt
	VBIT=$(python3 -c "print(int((28 * 8 * 1024 * 1024 / $DUR - 192000) / 1000))")
	echo "2-Pass: ${VBIT} kbit/s Video für ${DUR} s"
	X264=(-c:v libx264 -preset slow -b:v "${VBIT}k" -maxrate "$((VBIT * 2))k" -bufsize "$((VBIT * 2))k"
		-pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709)
	ffmpeg -y -loglevel error -i out/.video-ohne-ton.mp4 "${X264[@]}" -pass 1 -passlogfile out/.pass -an -f mp4 /dev/null
	VF=("${X264[@]}" -pass 2 -passlogfile out/.pass)
fi
ffmpeg -y -loglevel error \
	-i out/.video-ohne-ton.mp4 -i out/.ton.wav \
	-map 0:v:0 -map 1:a:0 "${VF[@]}" \
	-af "volume=${GAIN}dB,alimiter=limit=0.89:level=false" \
	-c:a aac -b:a 192k -ar 44100 -ac 2 \
	-movflags +faststart "$OUT"
rm -f out/.video-ohne-ton.mp4 out/.ton.wav out/.pass*
echo "Fertig: $OUT ($(du -h "$OUT" | cut -f1))"
