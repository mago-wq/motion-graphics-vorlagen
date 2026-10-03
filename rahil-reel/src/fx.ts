// Gemeinsame Effekt-Helfer beider Kompositionen (RahilReel, SommerReel).
import {random} from 'remotion';
import {ENVELOPE} from './envelope';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Lautstärke des Gesangs an Frame f, 0–1 (vorberechnet, siehe envelope.ts). */
export const env = (f: number) => ENVELOPE[Math.max(0, Math.min(ENVELOPE.length - 1, Math.round(f)))] ?? 0;

/** Weiches Zufallsrauschen (-1…1): zwischen zufälligen Stützwerten interpoliert, kein hartes Flackern. */
export const noise = (seed: string, x: number) => {
	const i = Math.floor(x);
	const t = x - i;
	const k = t * t * (3 - 2 * t);
	return (random(`${seed}${i}`) * 2 - 1) * (1 - k) + (random(`${seed}${i + 1}`) * 2 - 1) * k;
};

/** Stoß bei jedem Einsatz (Zeiten in s): schnell an, gedämpft abklingend (0–1). */
export const punchAt = (frame: number, fps: number, times: number[]) => {
	let v = 0;
	for (const w of times) {
		const d = frame - w * fps;
		if (d >= 0 && d < 20) v = Math.max(v, Math.exp(-d / 5));
	}
	return v;
};
