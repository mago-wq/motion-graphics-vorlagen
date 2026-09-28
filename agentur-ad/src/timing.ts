/**
 * Zeitplan in globalen Frames (30 fps). Bild UND Ton lesen von hier.
 * Szenenwechsel und Drops kommen aus musik-plan.json, das auch die Musik erzeugt:
 * bei 120 BPM ist ein Beat genau 15 Frames, ein Takt 60 Frames. Harte Schnitte
 * liegen auf den Drops. Einblendungen starten 2–3 Frames vor einem Schnitt, damit
 * die neue Szene im ersten Bild schon Inhalt hat.
 */
import plan from './musik-plan.json';
import {FPS} from './video';

export const f = (sec: number) => Math.round(sec * FPS);
export const BEAT = f(60 / plan.bpm);

const [S0, S1, S2, S3, S4, S5] = plan.szenen.map(f);
export const SCENE = {hook: S0, reveal: S1, problem: S2, beispiel: S3, beweis: S4, cta: S5, ende: f(plan.dauer)};

/** Ab hier steht das Bild still und es ist still. */
export const STILL_FROM = f(plan.stillAb);

export const HOOK = {
	/** Der Feed rauscht bis hierher und bleibt auf dem Satz stehen (Einschlag in der Musik) */
	stop: f(plan.stoppSchlag),
	rushFrom: 2400,
	targetUp: f(plan.stoppSchlag) + 6,
	keinZufall: [S0 + 4 * BEAT, S0 + 5 * BEAT],
};

export const REVEAL = {
	dasIst: S1 - 3,
	motion: S1 + BEAT,
	design: S1 + 2 * BEAT,
	dotLand: S1 + 3 * BEAT,
	/** Der Punkt wächst über das ganze Bild – Übergang auf den nächsten Schnitt */
	dotGrow: [S2 - BEAT + 3, S2] as const,
};

export const PROBLEM = {
	lines: [S2 - 3, S2 + BEAT - 3],
	/** Der Satz wird selbst weggewischt */
	flick: S2 + 4 * BEAT,
	flickFrames: 11,
	grund: [S2 + 4 * BEAT + 9, S2 + 5 * BEAT + 7],
};

export const BEISPIEL = {
	title: S3 - 3,
	card: S3 + 4,
	video: S3 + 4,
};

export const BEWEIS = {
	label: S4 - 3,
	/** Ziffern wechseln auf jeder vollen Sekunde (echte Zuschauzeit) */
	secondChanges: Array.from({length: 6}, (_, i) => S4 + i * FPS).slice(1),
	nach: S4 + 12,
	blockUp: S4 + 6 * BEAT - 2,
	vorstellen: [S4 + 6 * BEAT + 6, S4 + 7 * BEAT, S4 + 7 * BEAT + 9],
};

export const CTA = {
	lines: [S5 - 3, S5 + 7, S5 + BEAT + 2],
	pillIn: S5 + 3 * BEAT,
	pillExpand: S5 + 3 * BEAT + 5,
	pillText: S5 + 4 * BEAT - 2,
	unter: S5 + 4 * BEAT + 8,
	sheen: [S5 + 6 * BEAT, S5 + 8 * BEAT] as const,
};
