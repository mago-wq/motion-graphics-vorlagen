/**
 * Zeitplan des Videos in globalen Frames (30 fps).
 * Animationen UND Toneffekte lesen ihre Zeitpunkte von hier –
 * dadurch bleibt der Ton immer bildgenau, auch wenn sich z. B.
 * die Zahl der Hook-Wörter oder der Rabatt ändert.
 */
import {Easing, interpolate} from 'remotion';
import {config} from './config';
import {SPRINGS, framesToLand} from './motion';

// ---------------------------------------------------------------- Szenen

/** Nominelle Szenengrenzen laut Storyboard: 0 | 1,5 s | 4 s | 8,5 s | 12 s | 15 s */
const BOUNDS = [0, 45, 120, 255, 360, 450] as const;

/** Übergänge dauern 10 Frames und liegen mittig auf den Grenzen. */
export const TRANSITION_FRAMES = 10;
const HALF = TRANSITION_FRAMES / 2;

const scene = (i: number) => {
	const from = i === 0 ? BOUNDS[0] : BOUNDS[i] - HALF;
	const to = i === BOUNDS.length - 2 ? BOUNDS[i + 1] : BOUNDS[i + 1] + HALF;
	return {from, durationInFrames: to - from};
};

export const SCENES = {
	hook: scene(0),
	schere: scene(1),
	leistungen: scene(2),
	angebot: scene(3),
	abschluss: scene(4),
};

export type SlideDirection = 'from-right' | 'from-bottom';

/** Szenenwechsel: Mitte des Übergangs (dort liegt die Spitze des Whooshs) und Richtung. */
export const TRANSITIONS: {center: number; direction: SlideDirection}[] = [
	{center: BOUNDS[1], direction: 'from-right'},
	{center: BOUNDS[2], direction: 'from-bottom'},
	{center: BOUNDS[3], direction: 'from-right'},
	{center: BOUNDS[4], direction: 'from-bottom'},
];

/** Ab hier steht das Bild still und es ist still (letzte halbe Sekunde). */
export const STILL_FROM = 435;

// ---------------------------------------------------------------- Szene 1: Hook

export const HOOK_WORDS = config.texte.hook.flatMap((line) => line.split(' ').filter(Boolean));

const SLAM_LAND = framesToLand(SPRINGS.slam);
const LAST_IMPACT = 27;

/**
 * Einschläge gleichmäßig verteilt, das letzte Wort mit etwas Pause davor.
 * Das erste Wort landet genau auf Frame 0 – das erste Bild zeigt also schon Text.
 */
const hookImpacts = (): number[] => {
	const n = HOOK_WORDS.length;
	if (n === 1) return [0];
	const step = (LAST_IMPACT - 3) / (n - 1);
	return HOOK_WORDS.map((_, i) => (i === n - 1 ? LAST_IMPACT : Math.round(i * step)));
};

export const HOOK = {
	impacts: hookImpacts(),
	/** Flugzeit bis zum Einschlag: Wort i startet bei impacts[i] - slamLand */
	slamLand: SLAM_LAND,
};

// ---------------------------------------------------------------- Szene 2: Schere

export const SCISSORS = {
	/** Beginnt schon während des Übergangs, damit die hereinfahrende Szene nicht leer ist */
	drawStart: 43,
	drawEnd: 66,
	/** Frames, in denen die Klingen zuschnappen (Schnipp-Ton) */
	snips: [70, 79],
	snipCloseFrames: framesToLand(SPRINGS.snipClose),
	answerIn: 83,
	nameIn: 92,
	taglineIn: 98,
};

// ---------------------------------------------------------------- Szene 3: Leistungen

const SNAP_LAND = framesToLand(SPRINGS.snap);
const CARD_STARTS = [124, 136, 148]; // 12 Frames = 0,4 s Versatz

export const SERVICES = {
	cardStarts: CARD_STARTS,
	/** Karte erreicht ihre Position zum ersten Mal: Klack */
	cardLands: CARD_STARTS.map((s) => s + SNAP_LAND),
	/** Karte 0 und 2 kommen von links, Karte 1 von rechts */
	cardSide: (i: number): -1 | 1 => (i % 2 === 0 ? -1 : 1),
	dividersIn: CARD_STARTS[2] + SNAP_LAND + 3,
};

// ---------------------------------------------------------------- Szene 4: Angebot

const FRAME_START = 262;
const FRAME_DURATION = 30;
const COUNT_START = 264;
// Mit ease-out erreicht die gerundete Zahl ihr Ziel nach ~70 % der Dauer –
// so landet sie genau dann, wenn sich der Rahmen schließt.
const COUNT_DURATION = 40;

/** Angezeigter Rabatt-Wert zum globalen Frame (zählt schnell hoch, bremst am Ende). */
export const discountAt = (frame: number): number => {
	const target = config.neukundenrabatt.wert;
	const progress = interpolate(frame, [COUNT_START, COUNT_START + COUNT_DURATION], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});
	return Math.min(target, Math.round(progress * target));
};

/** Frame, in dem die Zahl ihr Ziel erreicht: dort sitzt der Abschluss-Schlag. */
const countEnd = (): number => {
	let f = COUNT_START;
	while (discountAt(f) < config.neukundenrabatt.wert) f++;
	return f;
};

/** Ein Tick pro Frame, in dem sich die angezeigte Zahl ändert (außer beim Ziel – dort kommt der Schlag). */
const countTicks = (): number[] => {
	const ticks: number[] = [];
	for (let f = COUNT_START + 1; f < countEnd(); f++) {
		if (discountAt(f) !== discountAt(f - 1)) ticks.push(f);
	}
	return ticks;
};

export const OFFER = {
	/** Liegt vor dem Szenenstart: die Karte ist beim Hereinschieben schon fast ganz da */
	cardIn: 242,
	frameStart: FRAME_START,
	frameDuration: FRAME_DURATION,
	countStart: COUNT_START,
	ticks: countTicks(),
	finalHit: countEnd(),
};

// ---------------------------------------------------------------- Szene 5: Abschluss

export const OUTRO = {
	iconIn: 350,
	nameIn: 355,
	ruleIn: 362,
	addressIn: 366,
	instaIn: 371,
	buttonIn: 379,
	/** Button-Pulse: Beginn je Puls, beide vor STILL_FROM abgeschlossen */
	pulses: [398, 415],
	pulseLength: 16,
};
