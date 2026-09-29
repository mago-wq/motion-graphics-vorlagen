#!/usr/bin/env bash
# Holt die Lottie-Figuren nach public/figuren/ (nicht eingecheckt).
#
# "The guy walks and smiles" und "Sad guy is walking" von konstaner, LottieFiles,
# Lottie Simple License: kommerzielle Nutzung und Bearbeitung erlaubt, ohne Namensnennung;
# die Dateien selbst dürfen nur unter derselben Lizenz weitergegeben werden. Deshalb liegen
# sie nicht im Repo, sondern werden bei Bedarf geladen.
# Der Download-Link wird über die öffentliche LottieFiles-API zur Animations-ID gesucht;
# der Hash sichert, dass es genau die Datei ist, auf die die Maße in lottieMann.ts passen.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/figuren

hole() {
	local id=$1 sha=$2 out=$3 fallback=$4 url
	if [[ -f "$out" ]] && echo "$sha  $out" | sha256sum -c --quiet 2>/dev/null; then
		echo "$out ist aktuell"
		return
	fi
	url=$(curl -sS --max-time 30 -X POST https://graphql.lottiefiles.com/2022-08 \
		-H 'Content-Type: application/json' \
		--data "{\"query\": \"{ publicAnimation(id: $id) { jsonUrl } }\"}" |
		python3 -c 'import json, sys; print(json.load(sys.stdin)["data"]["publicAnimation"]["jsonUrl"])' 2>/dev/null || true)
	curl -sS --fail --max-time 60 -o "$out" "${url:-$fallback}"
	if ! echo "$sha  $out" | sha256sum -c --quiet; then
		echo "Achtung: $out weicht von der erwarteten Fassung ab (Maße in lottieMann.ts prüfen)" >&2
		exit 1
	fi
	echo "$out geladen"
}

hole 91725 2e0f30a38fb04e86829aa94d8e25095af73f23121e7b53bc73aac948474b74f1 public/figuren/lottie-mann.json \
	https://assets-v2.lottiefiles.com/a/4b6d8e50-1176-11ee-ad7a-5f4f00372328/pdwUrIfM26.json
hole 91726 4617cc025a125c66f39247c55459fc5030f19fa5eb474f73b0f0375ef71e61e4 public/figuren/lottie-mann-traurig.json \
	https://assets-v2.lottiefiles.com/a/4b6f5b72-1176-11ee-ad7b-df8630db6777/VbhUCff6w8.json
