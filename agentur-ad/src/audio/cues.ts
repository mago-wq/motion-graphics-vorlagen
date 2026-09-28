/**
 * Toneffekte über der Musik: nur wo sie etwas bedeuten (apple-design §13).
 * Zeitpunkte aus timing.ts, dieselben wie im Bild.
 */
import {framesToLand, SPRINGS} from '../motion';
import {BEWEIS, CTA, PROBLEM, REVEAL, SCENE} from '../timing';
import manifest from './sfx-manifest.json';

export const SFX = manifest;
export type SoundName = keyof typeof manifest;
export type Cue = {sound: SoundName; frame: number; volume?: number};

const LAND = framesToLand(SPRINGS.land);

export const buildCues = (): Cue[] => [
	// Punkt landet, später wächst er über das Bild
	{sound: 'klack', frame: REVEAL.dotLand + LAND, volume: 0.5},
	{sound: 'whoosh_uebergang_seite', frame: REVEAL.dotGrow[1] - 2, volume: 0.45},
	// Der Satz wird weggewischt: Spitze bei höchster Geschwindigkeit
	{sound: 'whoosh_uebergang_hoch', frame: PROBLEM.flick + PROBLEM.flickFrames - 2, volume: 0.7},
	// Die Uhr tickt auf jeder vollen Sekunde
	...[SCENE.beweis, ...BEWEIS.secondChanges].map((frame) => ({sound: 'tick' as const, frame, volume: 0.9})),
	// Button rastet ein
	{sound: 'pop', frame: CTA.pillExpand + LAND, volume: 0.9},
];
