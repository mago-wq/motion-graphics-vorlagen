#!/usr/bin/env bash
# Richtet die Stimm-Umgebung ein: ~/.venvs/tts (anderer Ort: STIMME_VENV=/pfad).
# Lädt beim ersten Gebrauch zusätzlich die Modelle (zusammen etwa 5 GB):
# Chatterbox Multilingual, Whisper large-v3-turbo, wav2vec2-large-xlsr-53-german.
set -euo pipefail
cd "$(dirname "$0")/.."
VENV=${STIMME_VENV:-$HOME/.venvs/tts}
python3 -m venv "$VENV"
"$VENV/bin/pip" install -q --upgrade pip
# torch 2.6 als CPU-Version (chatterbox-tts verlangt genau diese Version)
"$VENV/bin/pip" install -q torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
# ohne Abhängigkeiten: chatterbox-tts zieht sonst gradio und eine GPU-Version von torch nach
"$VENV/bin/pip" install -q --no-deps chatterbox-tts==0.1.7
"$VENV/bin/pip" install -q -r scripts/requirements-stimme.txt
"$VENV/bin/python" -c "import torch, chatterbox, faster_whisper, pedalboard; print('Stimm-Umgebung bereit:', '$VENV')"
