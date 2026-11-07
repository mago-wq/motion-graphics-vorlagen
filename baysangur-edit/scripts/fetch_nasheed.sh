#!/usr/bin/env bash
# Holt das Nasheed „Нохчо Нашид – Чеченский Нашид“ (SoundCloud, 55 s), trennt zur Sicherheit
# alles Nicht-Stimmliche ab (KI, Modell Kim_Vocal_2) und misst das Taktraster.
#   Quelle: https://soundcloud.com/prosto-ded-527740432/noxcho-nashid-chechenskij
# Benötigt: yt-dlp, audio-separator[cpu], audioread, librosa.
# Die Dateien landen in assets-src/nasheed/ (nicht im Repo, siehe .gitignore).
set -euo pipefail
cd "$(dirname "$0")/.."
D=assets-src/nasheed
mkdir -p "$D"

yt-dlp -q -f bestaudio -o "$D/source.%(ext)s" "https://soundcloud.com/prosto-ded-527740432/noxcho-nashid-chechenskij"
ffmpeg -v error -y -i "$D"/source.* -ar 44100 -ac 2 "$D/original.wav"
audio-separator "$D/original.wav" -m Kim_Vocal_2.onnx --output_format WAV --output_dir "$D"
mv "$D/original_(Vocals)_Kim_Vocal_2.wav" "$D/vocals.wav"
mv "$D/original_(Instrumental)_Kim_Vocal_2.wav" "$D/rest_removed.wav"

python3 - <<'PY'
import json, librosa
sr = 22050
y, _ = librosa.load("assets-src/nasheed/original.wav", sr=sr, mono=True)
env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256)
_, beats = librosa.beat.beat_track(onset_envelope=env, sr=sr, hop_length=256)
t = librosa.frames_to_time(beats, sr=sr, hop_length=256)
json.dump({"beats": t.tolist()}, open("assets-src/nasheed/beats.json", "w"))
print(f"{len(t)} Schläge gemessen")
PY
