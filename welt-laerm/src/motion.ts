// Gemeinsame Bewegungs-Bausteine: Licht-Hüllkurve, Easing, deterministisches Zittern.
import {Easing, interpolate, random} from 'remotion';
import {FLICKER_OFF, FLICKER_ON} from './timing';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** Ausdruckshelfer: interpolate mit Klammern und Easing. */
export const tween = (f: number, from: number, to: number, a: number, b: number, easing = easeOut) =>
	interpolate(f, [from, to], [a, b], {...clamp, easing});

// Wie eine Leuchtstoffröhre: an, kurz aus, halb, voll.
const ON_STEPS = [0, 0.55, 0.08, 0.35, 0.9, 0.25, 0.75, 1, 1];
const OFF_STEPS = [1, 0.7, 1, 0.3, 0.55, 0.06, 0];

/** Lichtpegel 0..1 einer Szene: flackert bei `from` an, bei `to` aus. */
export const lightLevel = (frame: number, from: number, to: number) => {
	if (frame < from || frame >= to + FLICKER_OFF) return 0;
	const sinceOn = frame - from;
	if (sinceOn < FLICKER_ON) return ON_STEPS[Math.min(sinceOn, ON_STEPS.length - 1)];
	const sinceOff = frame - to;
	if (sinceOff >= 0) return OFF_STEPS[Math.min(sinceOff, OFF_STEPS.length - 1)];
	return 1;
};

/** Zittern, das sich nur alle `hold` Frames ändert (wirkt nervöser als glattes Rauschen). */
export const jitter = (seed: string, frame: number, amount: number, hold = 2) =>
	(random(`${seed}-${Math.floor(frame / hold)}`) * 2 - 1) * amount;
