#!/usr/bin/env bash
# Lädt die Rezitation Vers für Vers von everyayah.com und legt sie normalisiert
# (-16 LUFS, WAV 44,1 kHz Stereo) nach public/rezitation/SSSAAA.wav.
#
# Aufruf:  bash scripts/fetch_recitation.sh <Rezitator-Ordner> <Sure> <Vers> [<Vers> ...]
# Beispiel: bash scripts/fetch_recitation.sh Alafasy_128kbps 94 5 6
#
# Rezitator-Ordner = Ordnername auf https://everyayah.com/data/ (z. B.
# Alafasy_128kbps, Yasser_Ad-Dussary_128kbps, Minshawy_Mujawwad_192kbps).
# Die Dateien sind eine echte Aufnahme, keine KI. Rezitator in config.ts nennen.
set -euo pipefail
cd "$(dirname "$0")/.."
reciter=$1; surah=$2; shift 2
mkdir -p public/rezitation
tmp=$(mktemp -d)
for ayah in "$@"; do
	id=$(printf '%03d%03d' "$surah" "$ayah")
	curl -sS -f -o "$tmp/$id.mp3" "https://everyayah.com/data/$reciter/$id.mp3"
	npx remotion ffmpeg -y -loglevel error -i "$tmp/$id.mp3" \
		-af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 44100 -ac 2 "public/rezitation/$id.wav"
	echo "public/rezitation/$id.wav"
done
rm -rf "$tmp"
