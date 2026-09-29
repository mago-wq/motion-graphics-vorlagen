// Federn und Hilfsfunktionen für alle Animationen.
import {spring, type SpringConfig} from 'remotion';
import {FPS} from './video';

export const SPRINGS = {
	/** Einschlag: schnell, leicht überschwingend (ca. 4 %) */
	slam: {damping: 20, stiffness: 320, mass: 0.6},
	/** Karte/Packung rastet ein: leicht überschwingend */
	snap: {damping: 15, stiffness: 170, mass: 0.8},
	/** Preis springt auf: deutlich federnd, aber ohne Nachzittern */
	pop: {damping: 11, stiffness: 260, mass: 0.55},
	/** Stempel: sehr schnell, hart, kaum Überschwingen */
	stamp: {damping: 24, stiffness: 520, mass: 0.5},
	/** Produkt fällt ins Bild und setzt auf: schwer, einmal nachfedernd */
	drop: {damping: 14, stiffness: 150, mass: 0.9},
	/** Weiche Einblendung ohne Überschwingen (immer mit Dauer benutzen) */
	soft: {damping: 200},
} satisfies Record<string, Partial<SpringConfig>>;

/** Feder, die bei `start` (globaler Frame) losläuft. Vor dem Start: 0. */
export const springFrom = (
	frame: number,
	start: number,
	config: Partial<SpringConfig>,
	durationInFrames?: number,
): number => spring({frame: frame - start, fps: FPS, config, durationInFrames});

/** Weiche Einblendung von 0 auf 1 über `duration` Frames. */
export const softIn = (frame: number, start: number, duration = 18): number =>
	springFrom(frame, start, SPRINGS.soft, duration);

/**
 * Frames, bis eine Feder ihr Ziel zum ersten Mal erreicht –
 * das ist der sichtbare "Einschlag" und damit der Zeitpunkt für den Ton.
 */
export const framesToLand = (config: Partial<SpringConfig>, durationInFrames?: number): number => {
	for (let f = 0; f < 240; f++) {
		if (spring({frame: f, fps: FPS, config, durationInFrames}) >= 0.995) {
			return f;
		}
	}
	throw new Error('Feder erreicht ihr Ziel nicht – Konfiguration prüfen.');
};
