// Zugriff auf die Zeitleiste, die scripts/build_audio.py aus der Tonspur erzeugt.
// Alle Bildzeitpunkte werden daraus abgeleitet – verschiebt sich der Ton, wandert das Bild mit.
import timeline from './timeline.json';
import {FPS} from './video';

export type SectionName = keyof typeof timeline.sections;
export type MarkName = keyof typeof timeline.marks;
export type HitKind = 'dum' | 'boom' | 'stutter' | 'eighth';

export const TL = timeline;

/** Sekunden → Frame (gerundet auf den nächsten Frame) */
export const f = (seconds: number) => Math.round(seconds * FPS);

/** Frame eines benannten Ereignisses (z. B. 'drop1') */
export const mark = (name: MarkName) => f(timeline.marks[name]);

export const section = (name: SectionName) => {
	const [a, b] = timeline.sections[name];
	return {from: f(a), to: f(b), dur: f(b) - f(a)};
};

/** Frames aller Schläge eines Abschnitts */
export const beatsOf = (name: SectionName) => timeline.beats.filter((b) => b.sec === name).map((b) => f(b.t));

/** Länge eines Schlags im normalen (beschleunigten) Tempo, in Frames (≈ 16,6) */
export const BEAT = timeline.beatLen * FPS;

export const hits = timeline.hits.map((h) => ({frame: f(h.t), kind: h.kind as HitKind}));

/** Letzter Treffer an oder vor `frame` (für Blitze und Wackler) */
export const lastHit = (frame: number, kinds: HitKind[]) => {
	let found: {frame: number; kind: HitKind} | null = null;
	for (const h of hits) {
		if (h.frame > frame) break;
		if (kinds.includes(h.kind)) found = h;
	}
	return found;
};
