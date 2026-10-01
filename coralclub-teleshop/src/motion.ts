// Federn und Hilfsfunktionen für alle Animationen (aus coralclub-ad übernommen,
// um zwei Federn für den Teleshopping-Stil ergänzt).
import {Easing, interpolate, random, spring, type SpringConfig} from 'remotion';
import {FPS} from './video';

export const SPRINGS = {
	/** Einschlag: schnell, leicht überschwingend (ca. 4 %) */
	slam: {damping: 20, stiffness: 320, mass: 0.6},
	/** Packung rastet ein: leicht überschwingend */
	snap: {damping: 15, stiffness: 170, mass: 0.8},
	/** Preis springt auf: deutlich federnd, aber ohne Nachzittern */
	pop: {damping: 11, stiffness: 260, mass: 0.55},
	/** Stempel: sehr schnell, hart, kaum Überschwingen */
	stamp: {damping: 24, stiffness: 520, mass: 0.5},
	/** Wackeliger Auftritt, typisch Teleshopping-Störer */
	wobble: {damping: 8, stiffness: 180, mass: 0.6},
	/** Weiche Einblendung ohne Überschwingen (immer mit Dauer benutzen) */
	soft: {damping: 200},
} satisfies Record<string, Partial<SpringConfig>>;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Feder, die bei `start` (globaler Frame) losläuft. Vor dem Start: 0. */
export const springFrom = (
	frame: number,
	start: number,
	config: Partial<SpringConfig>,
	durationInFrames?: number,
): number => spring({frame: frame - start, fps: FPS, config, durationInFrames});

/** Weiche Einblendung von 0 auf 1 über `duration` Frames. */
export const softIn = (frame: number, start: number, duration = 12): number =>
	springFrom(frame, start, SPRINGS.soft, duration);

/** Linear geklemmt, mit Easing (Standard: ease-out) */
export const ramp = (
	frame: number,
	from: number,
	to: number,
	easing: (t: number) => number = Easing.out(Easing.cubic),
): number => interpolate(frame, [from, to], [0, 1], {...clamp, easing});

/** Frames, bis eine Feder ihr Ziel zum ersten Mal erreicht (= sichtbarer Einschlag). */
export const framesToLand = (config: Partial<SpringConfig>, durationInFrames?: number): number => {
	for (let f = 0; f < 240; f++) {
		if (spring({frame: f, fps: FPS, config, durationInFrames}) >= 0.995) {
			return f;
		}
	}
	throw new Error('Feder erreicht ihr Ziel nicht – Konfiguration prüfen.');
};

export type Impact = {frame: number; strength: number};

/** Kurzer Screenshake nach Einschlägen: klingt in ~8 Frames ab. */
export const shakeAt = (frame: number, impacts: Impact[], seed: string) => {
	let x = 0;
	let y = 0;
	let rotate = 0;
	impacts.forEach(({frame: at, strength}, i) => {
		const t = frame - at;
		if (t < 0 || t > 8) return;
		const decay = Math.exp(-t / 2.2);
		const angle = random(`${seed}-${i}-${t}`) * Math.PI * 2;
		x += Math.cos(angle) * strength * decay;
		y += Math.sin(angle) * strength * decay;
		rotate += (random(`${seed}-r-${i}-${t}`) - 0.5) * 0.06 * strength * decay;
	});
	return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rotate.toFixed(3)}deg)`;
};
