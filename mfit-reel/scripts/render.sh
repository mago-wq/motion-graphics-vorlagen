#!/usr/bin/env bash
# Rendert das fertige Reel: out/mfit-reel.mp4 (H.264 + AAC, 48 kHz Stereo).
#
# Zwei Schritte statt nur "npx remotion render":
# Remotion kodiert AAC zuerst als ADTS-Datei und kopiert sie dann ins MP4. Dabei
# geht die Angabe zum Encoder-Vorlauf (Edit-List) verloren und der Ton läuft im
# Player rund 46 ms hinter dem Bild. Deshalb rendert Remotion hier nur das Bild,
# und ffmpeg kodiert die fertige Tonspur direkt ins MP4. Dann sitzt jeder Effekt
# auf seinem Frame. (Gleiche Lösung wie in barber-ad, dort gemessen.)
#
# -aac_pns 0: Der native AAC-Encoder ersetzt sonst rauschartige Anteile (Claps,
# Hi-Hats) durch synthetisches Rauschen, dessen Spitzen bis +2,6 dBFS übersteuerten.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

if [ ! -f public/audio/mfit-soundtrack.wav ] || [ src/timeline.json -nt public/audio/mfit-soundtrack.wav ] || [ scripts/make_soundtrack.py -nt public/audio/mfit-soundtrack.wav ]; then
	echo "Tonspur fehlt oder ist älter als Zeitplan/Generator – wird neu erzeugt …"
	python3 scripts/make_soundtrack.py
fi

npx remotion render MfitReel out/.bild-ohne-ton.mp4 --muted \
	--props='{"showSafeZone":false,"withAudio":false}' "$@"

npx remotion ffmpeg -y -loglevel error \
	-i out/.bild-ohne-ton.mp4 -i public/audio/mfit-soundtrack.wav \
	-map 0:v:0 -map 1:a:0 -c:v copy \
	-c:a aac -aac_pns 0 -b:a 320k -ar 48000 -ac 2 \
	-movflags +faststart out/mfit-reel.mp4
rm -f out/.bild-ohne-ton.mp4

echo "Fertig: out/mfit-reel.mp4"
