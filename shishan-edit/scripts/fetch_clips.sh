#!/usr/bin/env bash
# Lädt die Stock-Clips von Mixkit (Mixkit-Lizenz: frei, auch kommerziell, ohne Namensnennung –
# aber nicht als Rohmaterial weitergeben, deshalb nicht im Repo). 1080p ist ohne Login gesperrt,
# 720p geht und wird beim Backen (bake_looks.py) auf 9:16 zugeschnitten.
set -euo pipefail
cd "$(dirname "$0")/.."
D=assets-src/clips
mkdir -p "$D"
declare -A CLIPS=(
	[horses_mountain]=37033   # Wildpferde laufen einen grünen Berghang hinab, Schneegipfel
	[hooves]=14899            # Hufe im Galopp auf staubigem Weg
	[horses_herd]=48634       # Herde im Galopp, Gegenlicht
	[mist_vertical]=3308      # Nebel am Fuß eines Schneebergs (hochkant)
	[storm_peaks]=4423        # Gewitter über Bergkämmen, Nacht
	[sparks_fall]=30798       # Funkenregen
	[sparks_black]=3463       # Funken auf Schwarz
	[forge_blade]=36383       # Schmied schlägt eine glühende Klinge
	[eagle_stare]=48820       # Steinadler, Blick in die Kamera
)
for key in "${!CLIPS[@]}"; do
	id=${CLIPS[$key]}
	[[ -s "$D/$key.mp4" ]] && continue
	curl -sSf -m 300 -o "$D/$key.mp4" "https://assets.mixkit.co/videos/$id/$id-720.mp4"
	echo "$key ($id)"
done

# Geräusche von Mixkit (gleiche Lizenz: frei, aber nicht als Rohmaterial weitergeben → nicht im Repo)
S=assets-src/sfx
declare -A SFX=(
	[mk_hufe_dreck]=1762      # einzelnes Pferd, schneller Galopp auf Erde (wird verlangsamt und tiefer)
	[mk_hengst_wiehern]=78    # Hengst wiehert
	[mk_pferd_schnauben]=30   # Pferd schnaubt
	[mk_wolf_knurren]=1774    # Knurren
	[mk_wolf_angriff]=3015    # Wolfsangriff (Fauchen)
	[mk_donner_einzel]=1291   # einzelner Donnerschlag
)
for key in "${!SFX[@]}"; do
	id=${SFX[$key]}
	[[ -s "$S/$key.mp3" ]] && continue
	curl -sSf -m 120 -o "$S/$key.mp3" "https://assets.mixkit.co/active_storage/sfx/$id/$id-preview.mp3"
	echo "$key ($id)"
done
