#!/usr/bin/env bash
# Holt das Nasheed „Джохар Дудаев“ (2:18-Fassung, die auch im TikTok-Sound läuft),
# trennt die Stimme vom Beat und misst das Taktraster.
#   Quelle: https://soundcloud.com/adeev-62905730/dzhoxar-dudaev
# Benötigt: yt-dlp, audio-separator[cpu] (Modell Kim_Vocal_2), librosa.
# Die Dateien landen in assets-src/nasheed/ (nicht im Repo, siehe .gitignore).
set -euo pipefail
cd "$(dirname "$0")/.."
D=assets-src/nasheed
mkdir -p "$D"

yt-dlp -q -f bestaudio -o "$D/source.%(ext)s" "https://soundcloud.com/adeev-62905730/dzhoxar-dudaev"
ffmpeg -v error -y -i "$D"/source.* -ar 44100 -ac 2 "$D/original.wav"

# KI-Trennung: Stimme vs. Beat. Weiter verwendet wird nur die Stimme;
# der abgetrennte Beat dient allein dazu, das Taktraster zu messen.
audio-separator "$D/original.wav" -m Kim_Vocal_2.onnx --output_format WAV --output_dir "$D"
mv "$D/original_(Vocals)_Kim_Vocal_2.wav" "$D/vocals.wav"
mv "$D/original_(Instrumental)_Kim_Vocal_2.wav" "$D/beat_removed.wav"

python3 - <<'PY'
import json, librosa
sr = 22050
ins, _ = librosa.load("assets-src/nasheed/beat_removed.wav", sr=sr, mono=True)
env = librosa.onset.onset_strength(y=ins, sr=sr, hop_length=128)
_, beats = librosa.beat.beat_track(onset_envelope=env, sr=sr, hop_length=128, start_bpm=91, tightness=800)
t = librosa.frames_to_time(beats, sr=sr, hop_length=128)
json.dump({"beats": t.tolist()}, open("assets-src/nasheed/beats_orig.json", "w"))
print(f"{len(t)} Schläge gemessen")
PY
