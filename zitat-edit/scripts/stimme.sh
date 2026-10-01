#!/usr/bin/env bash
# Stimme erzeugen und für das Video fertig machen.
#   npm run stimme                    kostenlose Stimme (lokal) + bearbeiten
#   npm run stimme -- --versuche 8    mehr Versuche, falls ein Wort nicht sauber ist
#   npm run stimme:elevenlabs         ElevenLabs (ELEVENLABS_API_KEY) + bearbeiten
#   npm run stimme:bearbeiten         nur bearbeiten, z. B. nach Änderung von Pausen,
#                                     Tempo, Tonhöhe oder Hall in config.ts, oder
#                                     nach einer eigenen Aufnahme als stimme/roh.wav
# Läuft in der Stimm-Umgebung (README: "Stimm-Umgebung einrichten").
set -euo pipefail
cd "$(dirname "$0")/.."
PY=${STIMME_PYTHON:-$HOME/.venvs/tts/bin/python}
if [[ ! -x "$PY" ]]; then
	echo "Stimm-Umgebung fehlt ($PY). Siehe README, Abschnitt Stimm-Umgebung." >&2
	exit 1
fi
modus=${1:-kostenlos}
shift || true
case "$modus" in
	kostenlos) "$PY" scripts/stimme_kostenlos.py "$@" ;;
	elevenlabs) "$PY" scripts/stimme_elevenlabs.py "$@" ;;
	bearbeiten) ;;
	*) echo "Unbekannt: $modus (kostenlos | elevenlabs | bearbeiten)" >&2; exit 1 ;;
esac
"$PY" scripts/stimme_bearbeiten.py
