#!/usr/bin/env bash
# Holt die Lottie-Figur für den Figuren-Vergleich nach public/figuren/ (nicht eingecheckt).
#
# "The guy walks and smiles" von konstaner, LottieFiles, Lottie Simple License:
# kommerzielle Nutzung und Bearbeitung erlaubt, ohne Namensnennung; die Datei selbst darf
# nur unter derselben Lizenz weitergegeben werden. Deshalb liegt sie nicht im Repo, sondern
# wird bei Bedarf geladen.
# Der Download-Link wird über die öffentliche LottieFiles-API zur Animations-ID gesucht;
# der Hash sichert, dass es genau die Datei ist, auf die die Maße in lottieMann.ts passen.
set -euo pipefail
cd "$(dirname "$0")/.."

ID=91725
SHA=2e0f30a38fb04e86829aa94d8e25095af73f23121e7b53bc73aac948474b74f1
FALLBACK=https://assets-v2.lottiefiles.com/a/4b6d8e50-1176-11ee-ad7a-5f4f00372328/pdwUrIfM26.json
OUT=public/figuren/lottie-mann.json

mkdir -p public/figuren
if [[ -f "$OUT" ]] && echo "$SHA  $OUT" | sha256sum -c --quiet 2>/dev/null; then
	echo "$OUT ist aktuell"
	exit 0
fi

URL=$(curl -sS --max-time 30 -X POST https://graphql.lottiefiles.com/2022-08 \
	-H 'Content-Type: application/json' \
	--data "{\"query\": \"{ publicAnimation(id: $ID) { jsonUrl } }\"}" |
	python3 -c 'import json, sys; print(json.load(sys.stdin)["data"]["publicAnimation"]["jsonUrl"])' 2>/dev/null || true)
URL=${URL:-$FALLBACK}

curl -sS --fail --max-time 60 -o "$OUT" "$URL"
if ! echo "$SHA  $OUT" | sha256sum -c --quiet; then
	echo "Achtung: $OUT weicht von der erwarteten Fassung ab (Maße in lottieMann.ts prüfen)" >&2
	exit 1
fi
echo "$OUT geladen"
