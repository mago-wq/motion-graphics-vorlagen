#!/usr/bin/env bash
# Holt das Nasheed „ملحمة الشيشان“ („Epos Tschetschenien“, Tarek Jaber, 7:38) von SoundCloud.
# Es ist ein reiner Chor ohne Instrumente – eine KI-Trennung ist nicht nötig (geprüft: der
# abgetrennte „Rest“ war nur Hall der Stimmen, kein Schlagwerk). Die Aufnahme ist alt und
# endet bei ~4 kHz; build_audio.py ergänzt Obertöne aus der Stimme selbst.
#   Quelle: https://soundcloud.com/tarek-jaber (Track 145750436)
# Benötigt: yt-dlp, ffmpeg. Die Dateien landen in assets-src/nasheed/ (nicht im Repo, siehe .gitignore).
set -euo pipefail
cd "$(dirname "$0")/.."
D=assets-src/nasheed
mkdir -p "$D"
yt-dlp -q --no-warnings -f bestaudio -o "$D/source.%(ext)s" "https://api.soundcloud.com/tracks/soundcloud%3Atracks%3A145750436"
ffmpeg -v error -y -i "$D"/source.* -ar 44100 -ac 2 "$D/original.wav"
echo "assets-src/nasheed/original.wav"
