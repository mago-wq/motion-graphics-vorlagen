/**
 * Zeitplan des Videos in globalen Frames (30 fps).
 * Animationen UND Toneffekte lesen ihre Zeitpunkte von hier –
 * wer eine Animation verschiebt, verschiebt den Ton automatisch mit.
 */
import {Easing, interpolate} from 'remotion';
import {config} from './config';
import {SPRINGS, framesToLand} from './motion';
import {savingPercent} from './theme';

// ---------------------------------------------------------------- Szenen

/** Szenengrenzen: Hook | Produkt 1 | Produkt 2 | Produkt 3 | Abschluss */
const BOUNDS = [0, 70, 160, 250, 340, 450] as const;

export const SCENES = {
	hook: {from: BOUNDS[0], durationInFrames: BOUNDS[1] - BOUNDS[0]},
	produkte: [0, 1, 2].map((i) => ({from: BOUNDS[i + 1], durationInFrames: BOUNDS[i + 2] - BOUNDS[i + 1]})),
	abschluss: {from: BOUNDS[4], durationInFrames: BOUNDS[5] - BOUNDS[4]},
};

/**
 * Streifen-Wischer zwischen den Szenen: fünf Bänder in den Farben des
 * Packungsstreifens fahren durchs Bild. Genau auf der Szenengrenze ist das
 * Bild ganz bedeckt, dort liegt der harte Schnitt.
 */
export const WIPE = {
	centers: [BOUNDS[1], BOUNDS[2], BOUNDS[3], BOUNDS[4]],
	/** Band i fährt von (center - inLead + i·stagger) bis (center - inLead + inLength + i·stagger) herein */
	inLead: 11,
	inLength: 6,
	/** und von (center + 1 + i·stagger) über outLength Frames wieder hinaus */
	outLength: 7,
	stagger: 1.2,
};

/** Ab hier steht das Bild still und es ist still (letzte halbe Sekunde). */
export const STILL_FROM = 435;

// ---------------------------------------------------------------- Szene 1: Hook

const SLAM_LAND = framesToLand(SPRINGS.slam);
const POP_LAND = framesToLand(SPRINGS.pop);
const STAMP_LAND = framesToLand(SPRINGS.stamp);

export const HOOK_WORDS = config.hook.frage.flatMap((line) => line.split(' ').filter(Boolean));

export const HOOK = {
	slamLand: SLAM_LAND,
	/** Einschlag je Wort der Frage; das erste landet auf Frame 0 (erstes Bild zeigt schon Text) */
	wordImpacts: HOOK_WORDS.map((_, i) => i * 5),
	/** Normalpreis knallt darunter */
	priceImpact: HOOK_WORDS.length * 5 + 2,
	/** Streifen streicht den Preis durch: Band i von strikeStart + i·strikeStagger, je strikeLength Frames */
	strikeStart: 22,
	strikeStagger: 1.5,
	strikeLength: 6,
	/** Durchgestrichener Preis kippt weg und fällt */
	fallStart: 35,
	/** Clubpreis springt auf */
	clubStart: 37,
	clubLand: 37 + POP_LAND,
	/** "Nö."-Stempel */
	stampStart: 47,
	stampLand: 47 + STAMP_LAND,
	captionIn: 50,
};

// ---------------------------------------------------------------- Szenen 2–4: Produkte

const DROP_LAND = framesToLand(SPRINGS.drop);

/** Zeitpunkte einer Produktszene, relativ zu ihrem Start als globale Frames */
const productTiming = (i: number) => {
	const b = BOUNDS[i + 1];
	return {
		start: b,
		/** Produkt fällt schon während des Wischers herein, damit die Szene nie leer ist */
		dropStart: b - 3,
		dropLand: b - 3 + DROP_LAND,
		badgeStart: b + 5,
		badgeLand: b + 5 + STAMP_LAND,
		nameIn: b + 9,
		stripeIn: b + 13,
		factIn: b + 16,
		priceIn: b + 24,
		strikeStart: b + 32,
		clubStart: b + 40,
		clubLand: b + 40 + POP_LAND,
		savingStart: b + 48,
		savingLand: b + 48 + POP_LAND,
	};
};

export const PRODUCTS = [0, 1, 2].map(productTiming);
export type ProductTiming = (typeof PRODUCTS)[number];

/** Durchstreichen in den Produktszenen: gleiche Bänder wie im Hook, kürzer */
export const PRODUCT_STRIKE = {stagger: 1, length: 5};

// ---------------------------------------------------------------- Szene 5: Abschluss

const A = BOUNDS[4];
const SNAP_LAND = framesToLand(SPRINGS.snap);
const PACK_STARTS = [A - 2, A + 3, A + 8];

/** Ersparnis, die im Abschluss hochzählt: gleich für alle drei → genau diese Zahl */
export const SAVING = Math.min(...config.produkte.map((p) => savingPercent(p.normalpreis, p.clubpreis)));
export const SAVING_IS_UNIFORM = config.produkte.every((p) => savingPercent(p.normalpreis, p.clubpreis) === SAVING);

const COUNT_START = A + 20;
const COUNT_DURATION = 30;

/** Angezeigte Prozentzahl zum globalen Frame (zählt schnell hoch, bremst am Ende). */
export const savingAt = (frame: number): number => {
	const progress = interpolate(frame, [COUNT_START, COUNT_START + COUNT_DURATION], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});
	return Math.min(SAVING, Math.round(progress * SAVING));
};

const countEnd = (): number => {
	let f = COUNT_START;
	while (savingAt(f) < SAVING) f++;
	return f;
};

/** Ein Tick pro Frame, in dem sich die Zahl ändert – außer beim Ziel, dort kommt der Schlag. */
const countTicks = (): number[] => {
	const ticks: number[] = [];
	for (let f = COUNT_START + 1; f < countEnd(); f++) {
		if (savingAt(f) !== savingAt(f - 1)) ticks.push(f);
	}
	return ticks;
};

export const OUTRO = {
	start: A,
	packStarts: PACK_STARTS,
	packLands: PACK_STARTS.map((s) => s + SNAP_LAND),
	countStart: COUNT_START,
	ticks: countTicks(),
	finalHit: countEnd(),
	titleIn: A + 30,
	sublineIn: A + 36,
	buttonIn: A + 50,
	buttonLand: A + 50 + POP_LAND,
	/** Pfeil zeigt nach oben Richtung Profil (Link in Bio) */
	arrowIn: A + 58,
	noteIn: A + 56,
	/** Button-Pulse, beide vor STILL_FROM abgeschlossen */
	pulses: [A + 68, A + 82],
	pulseLength: 13,
};
