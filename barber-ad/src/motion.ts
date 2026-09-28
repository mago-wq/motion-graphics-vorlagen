// Federn und Hilfsfunktionen für alle Animationen.
import {spring, type SpringConfig} from 'remotion';
import {FPS} from './video';

export const SPRINGS = {
	/** Einschlag: schnell, leicht überschwingend (ca. 4 %) */
	slam: {damping: 20, stiffness: 320, mass: 0.6},
	/** Karte rastet ein: leicht überschwingend */
	snap: {damping: 15, stiffness: 170, mass: 0.8},
	/** Schere schließt: sehr schnell, kaum Nachschwingen */
	snipClose: {damping: 22, stiffness: 700, mass: 0.35},
	/** Schere öffnet wieder: schnell, federnd */
	snipOpen: {damping: 12, stiffness: 320, mass: 0.4},
	/** Kurzer Stoß (Zahl beim Abschluss-Schlag) */
	punch: {damping: 8, stiffness: 220, mass: 0.5},
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
