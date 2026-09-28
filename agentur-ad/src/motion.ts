// Federn nach Apples Modell: Dämpfungsverhältnis + Response (Sekunden) statt
// Masse/Steifigkeit/Dämpfung. 1,0 = kritisch gedämpft, kein Überschwingen.
import {spring, type SpringConfig} from 'remotion';
import {FPS} from './video';

const apple = (response: number, dampingRatio: number): Partial<SpringConfig> => ({
	mass: 1,
	stiffness: (2 * Math.PI / response) ** 2,
	damping: (4 * Math.PI * dampingRatio) / response,
});

export const SPRINGS = {
	/** Wörter blenden ein: ruhig, ohne Überschwingen */
	text: apple(0.55, 1),
	/** Buchstaben laufen zusammen */
	letters: apple(0.7, 1),
	/** Große Flächen (Karte, Block verschieben) */
	move: apple(0.8, 1),
	/** Ziffern rollen */
	digit: apple(0.35, 1),
	/** Landung mit Schwung: nur wo vorher Bewegung war (Punkt, Button) */
	land: apple(0.45, 0.78),
} satisfies Record<string, Partial<SpringConfig>>;

/** Feder, die bei `start` (globaler Frame) losläuft. Vor dem Start: 0. */
export const springFrom = (frame: number, start: number, config: Partial<SpringConfig>): number =>
	frame < start ? 0 : spring({frame: frame - start, fps: FPS, config});

/** Frames, bis eine Feder ihr Ziel zum ersten Mal erreicht (für Ton-Anker). */
export const framesToLand = (config: Partial<SpringConfig>): number => {
	for (let f = 0; f < 240; f++) {
		if (spring({frame: f, fps: FPS, config}) >= 0.995) return f;
	}
	throw new Error('Feder erreicht ihr Ziel nicht – Konfiguration prüfen.');
};
