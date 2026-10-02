#!/usr/bin/env bash
# Kontroll-Standbilder nach out/stills/ rendern (ohne Bildschirm prüfbar).
#   npm run stills                  ein Bild pro Schnitt (Mitte des Bildes)
#   FRAMES="10 20" npm run stills   bestimmte Frames
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p out/stills
npx remotion bundle --out-dir=out/bundle --log=error >/dev/null
if [[ -z "${FRAMES:-}" ]]; then
	# Standard: je Schnitt der Frame kurz nach dem Titel-Einschlag
	FRAMES=$(node -e '
		const a=require("./src/audio.json");const c=require("fs").readFileSync("src/config.ts","utf8");
		const s=c.slice(c.indexOf("export const SHOTS"));const b=[...s.slice(0,s.indexOf("];")).matchAll(/beats:\s*(\d+)/g)].map(m=>+m[1]);
		const fr=x=>x===0?0:Math.round((a.firstBeat+x*60/a.bpm)*30);let k=0;const out=[];
		for(const n of b){out.push(Math.min(fr(k)+12,fr(k+n)-1));k+=n;}out.push(fr(k)+20);console.log(out.join(" "));')
fi
for f in $FRAMES; do
	npx remotion still out/bundle TschetschenienEdit "out/stills/frame-$(printf '%03d' "$f").png" --frame="$f" --log=error
	echo "out/stills/frame-$(printf '%03d' "$f").png"
done
