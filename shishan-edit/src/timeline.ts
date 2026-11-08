// Zugriff auf die Zeitleiste, die scripts/build_audio.py aus der Tonspur erzeugt.
// Alle Bildzeitpunkte hängen daran – verschiebt sich der Ton, wandert das Bild mit.
import timeline from './timeline.json';
import {FPS} from './video';

export const TL = timeline;
export type WordKey = keyof typeof timeline.words;
export type HitKind = 'boom' | 'dum' | 'soft' | 'pickup';

/** Sekunden → Frame */
export const f = (seconds: number) => Math.round(seconds * FPS);
/** Frame eines Wortanfangs (Anker aus build_audio.py) */
export const W = (k: WordKey) => f(timeline.words[k]);
/** Auftakt („Shi“) und Hauptton („shan“) der sechs Rufe */
export const SHI = timeline.shi.map(f);
export const SHAN = timeline.shan.map(f);
export const SEC = Object.fromEntries(
	Object.entries(timeline.sections).map(([k, [a, b]]) => [k, {from: f(a), to: f(b)}]),
) as Record<keyof typeof timeline.sections, {from: number; to: number}>;
/** Schlag j (0 = „shan“, 1, 2) von Ruf k */
export const beat = (k: number, j: number) => {
	const b = timeline.beats.find((x) => x.call === k && x.beat === j);
	if (!b) throw new Error(`Schlag ${k}/${j} fehlt`);
	return f(b.t);
};
export const HITS = timeline.hits.map((h) => ({frame: f(h.t), kind: h.kind as HitKind}));

/** Letzter Treffer an oder vor `frame` */
export const lastHit = (frame: number, kinds: HitKind[]) => {
	let found: {frame: number; kind: HitKind} | null = null;
	for (const h of HITS) {
		if (h.frame > frame) break;
		if (kinds.includes(h.kind)) found = h;
	}
	return found;
};
