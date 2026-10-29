#!/usr/bin/env bash
# Rendert den 3D-Produktspot.
#
#   npm run render -- --entwurf    schneller Entwurf 540×960, kleine Datei (für Feedback)
#   npm run render                 Endfassung 1080×1920
#   npm run render -- --4k         nativ 2160×3840 (deutlich langsamer, 3D in Software)
#
# Noch ohne Ton. Kommen Geräusche dazu, den Ton-Weg aus barber-ad/scripts/render.sh
# übernehmen (WAV aus Remotion, AAC per ffmpeg), sonst läuft er 46 ms nach.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

OUT=out/produkt-3d.mp4
ARGS=()
case "${1:-}" in
--entwurf)
	OUT=out/produkt-3d-entwurf.mp4
	ARGS=(--scale=0.5 --crf=26)
	shift ;;
--4k)
	OUT=out/produkt-3d-4k.mp4
	ARGS=(--scale=2)
	shift ;;
esac

npx remotion render Produkt3D "$OUT" "${ARGS[@]}" "$@"
echo "Fertig: $OUT"
