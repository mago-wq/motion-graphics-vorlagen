// Gemeinsame Effekt-Helfer: Rauschen, Treffer-Hüllkurven, Easing.
import {Easing, random} from 'remotion';
import {TREFFER} from './config';
import {FPS} from './timing';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** schnell raus, weich rein: für Einblendungen */
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
/** weich beschleunigend: für Ausblendungen */
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

/** Weiches Zufallsrauschen (-1…1) zwischen zufälligen Stützwerten, kein hartes Flackern. */
export const noise = (seed: string, x: number) => {
	const i = Math.floor(x);
	const t = x - i;
	const k = t * t * (3 - 2 * t);
	return (random(`${seed}${i}`) * 2 - 1) * (1 - k) + (random(`${seed}${i + 1}`) * 2 - 1) * k;
};

/** Abklingender Stoß nach einem Treffer: 1 im Trefferframe, nach ~`decay` Frames auf 1/e. */
const pulse = (frame: number, at: number, decay: number) => {
	const d = frame - at * FPS;
	return d >= 0 && d < decay * 6 ? Math.exp(-d / decay) : 0;
};

/** Summe aller Treffer an einem Frame, getrennt nach Wirkung. */
export const hits = (frame: number) => {
	let flash = 0;
	let shake = 0;
	let punch = 0;
	let farbe = '#ffffff';
	for (const h of TREFFER) {
		const f = h.flash ? h.flash * pulse(frame, h.at, 3.2) : 0;
		if (f > flash) {
			flash = f;
			farbe = h.farbe ?? '#ffffff';
		}
		shake = Math.max(shake, (h.shake ?? 0) * pulse(frame, h.at, 4));
		punch = Math.max(punch, (h.punch ?? 0) * pulse(frame, h.at, 5));
	}
	return {flash, farbe, shake, punch};
};
