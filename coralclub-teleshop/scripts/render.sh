#!/usr/bin/env bash
# Rendert das fertige Video: out/coralclub-teleshop.mp4 (H.264 + AAC, 44,1 kHz Stereo)
# und den Ton zusätzlich verlustfrei als out/coralclub-teleshop-ton.wav.
#
# Warum zwei Schritte statt nur "npx remotion render" (aus barber-ad übernommen):
# Remotion kodiert AAC zuerst als ADTS-Datei und kopiert sie dann ins MP4.
# Dabei geht die Angabe zum Encoder-Vorlauf verloren (Edit-List), und der
# Ton liefe im Player 46 ms hinter dem Bild – bei Lippen-losen Einschlägen
# und Wort-synchronen Einblendungen spürbar. Deshalb gibt Remotion den Ton
# hier als WAV aus, und ffmpeg kodiert ihn direkt ins MP4.
#
# NAME wählt den Dateinamen, weitere Argumente gehen an "remotion render".
# Die 4K-Fassung (npm run render:4k) ist dieselbe Komposition mit --scale=2:
# Schrift und Grafik werden in 2160x3840 gezeichnet, nicht hochskaliert.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
NAME=${NAME:-coralclub-teleshop}

npx remotion render CoralClubTeleshop "out/.$NAME-ohne-ton.mp4" \
	--separate-audio-to="$PWD/out/$NAME-ton.wav" --audio-codec=pcm-16 "$@"

# Lautheit auf ca. -14 LUFS, Spitzen bei -1 dBFS (Begründung in scripts/master.py)
python3 scripts/master.py "out/$NAME-ton.wav" "out/$NAME-ton.wav"

npx remotion ffmpeg -y -loglevel error \
	-i "out/.$NAME-ohne-ton.mp4" -i "out/$NAME-ton.wav" \
	-map 0:v:0 -map 1:a:0 -c:v copy \
	-c:a aac -b:a 256k -ar 44100 -ac 2 \
	-movflags +faststart "out/$NAME.mp4"
rm -f "out/.$NAME-ohne-ton.mp4"

echo "Fertig: out/$NAME.mp4 (+ Ton einzeln: out/$NAME-ton.wav)"
