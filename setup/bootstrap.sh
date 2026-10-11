#!/usr/bin/env bash
# Run once at the start of a new cloud session:  bash setup/bootstrap.sh
# Installs what the toolkit needs that isn't already in the workspace. Safe to re-run.
set -e
TK="$(cd "$(dirname "$0")/.." && pwd)"
pip install -q --break-system-packages librosa soundfile pretty_midi faster-whisper piper-tts 2>/dev/null || true
python3 -c "import bpy" 2>/dev/null || pip install -q --break-system-packages bpy     # Blender as a Python module (~400 MB, 3D only)
which fluidsynth >/dev/null || (apt-get install -y -q fluidsynth fluid-soundfont-gm >/dev/null 2>&1 || true)
NODE_PATH=$(npm root -g); [ -d "$NODE_PATH/playwright" ] || npm i -g playwright >/dev/null 2>&1
echo "export TK=$TK" > "$TK/.env"; echo "toolkit ready at $TK  (node scripts: NODE_PATH=\$(npm root -g))"
