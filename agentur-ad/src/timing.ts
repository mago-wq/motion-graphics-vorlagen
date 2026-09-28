/**
 * Zeitplan in globalen Frames (30 fps). Bild UND Ton lesen von hier.
 * Szenenwechsel sind harte Schnitte auf den Einschlag (TikTok-typisch).
 */
import {framesToLand, SPRINGS} from './motion';

export const SCENE_STARTS = {hook: 0, zufall: 90, problem: 210, loesung: 390, beweis: 600, cta: 750, ende: 900} as const;

/** Ab hier steht das Bild still und es ist still. */
export const STILL_FROM = 885;

export const SLAM_LAND = framesToLand(SPRINGS.slam);
export const SNAP_LAND = framesToLand(SPRINGS.snap);

/** Szene 1: "Stopp." landet auf Frame 0, dann die drei Zeilen */
export const HOOK = {stopp: 0, lines: [30, 42, 54]};

export const ZUFALL = {lines: [96, 108], shiftUp: 146, reveal: [156, 168], barStart: 170};

/** Szene 3: je Anzeige Einflug und Wegwischen */
export const PROBLEM = {
	titleIn: 212,
	cards: [
		{in: 212, out: 256},
		{in: 256, out: 292},
		{in: 292, out: 322},
	],
	swipeFrames: 9,
	weggewischt: 336,
	keinerSchaut: 350,
};

export const LOESUNG = {titleIn: 392, rows: [412, 444, 476], fuerDich: 530};

export const BEWEIS = {labelIn: 604, zuIn: 612, vorstellen: [684, 698]};
/** Volle Sekunden im Beweis-Teil: dort tickt es */
export const BEWEIS_TICKS = [630, 660];

export const CTA = {lines: [752, 764, 776], buttonIn: 800, pulses: [836, 862], pulseLength: 16};

/** Harte Schnitte: kurzer Blitz + Whoosh */
export const CUTS = [SCENE_STARTS.zufall, SCENE_STARTS.problem, SCENE_STARTS.loesung, SCENE_STARTS.beweis, SCENE_STARTS.cta];

/** Alle Einschläge, für Bildwackler */
export const IMPACTS = [
	HOOK.stopp,
	...HOOK.lines,
	...ZUFALL.lines,
	...ZUFALL.reveal,
	PROBLEM.weggewischt,
	LOESUNG.fuerDich,
	...BEWEIS.vorstellen,
	...CTA.lines,
];
