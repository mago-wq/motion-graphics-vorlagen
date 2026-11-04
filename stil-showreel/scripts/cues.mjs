// Schreibt die Ton-Einsätze aus src/timing.ts nach audio/cues.json (für scripts/mix.py und earshot timeline).
// Node lädt timing.ts direkt (Typen werden entfernt, Node ≥ 22.18).
import fs from 'node:fs';
import path from 'node:path';
import {CUES, DURATION, FPS, STILL_FROM, SHOTS} from '../src/timing.ts';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = {
	fps: FPS,
	duration_frames: DURATION,
	still_from: STILL_FROM,
	cuts: SHOTS.map((s) => s.from).filter((f) => f > 0),
	events: CUES.map((c, i) => ({f: c.f, kind: c.role, id: `${c.role}-${i}`, gain_db: c.gain ?? 0})),
};
fs.writeFileSync(path.join(root, 'audio', 'cues.json'), JSON.stringify(out, null, 1));
console.log(`audio/cues.json: ${out.events.length} Einsätze, ${out.cuts.length} Schnitte`);
