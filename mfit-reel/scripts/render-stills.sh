#!/usr/bin/env bash
# Kontrollbilder: Standbilder nach out/stills/ und ein Kontaktbogen out/kontaktbogen.png.
#   npm run stills                 Schlüsselmomente
#   npm run stills -- --safe       mit rot markierter Sicherheitszone
#   npm run stills -- 0 192 672    beliebige Frames
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf out/stills
node scripts/stills.mjs "$@"
python3 scripts/contact_sheet.py out/stills out/kontaktbogen.png 6 270
