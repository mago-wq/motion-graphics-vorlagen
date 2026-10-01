// Federn und Hilfsfunktionen für alle Animationen.
import {Easing, interpolate, spring, type SpringConfig} from 'remotion';
import {FPS} from './video';

export const SPRINGS = {
	/** Wort taucht auf: schnell, kaum Überschwingen */
	wort: {damping: 18, stiffness: 190, mass: 0.7},
	/** Gedehntes Wort zieht sich zusammen: kräftig, leicht federnd */
	stauchen: {damping: 14, stiffness: 260, mass: 0.6},
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

/** Kurve über Stützstellen, an den Rändern festgehalten, mit sanftem Ein-/Ausschwingen. */
export const curve = (frame: number, input: number[], output: number[]): number =>
	interpolate(frame, input, output, {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.sin),
	});

/** Deterministischer Zufall 0..1 aus einer Zahl (gleiches Bild bei jedem Rendern). */
export const hash = (n: number): number => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

/**
 * Hüllkurve aus Stützpunkten [frame, wert], linear verbunden, an den Rändern gehalten.
 * Stützpunkte, die durch eine kurze Stimme zusammenrücken, werden auseinandergeschoben,
 * damit die Reihenfolge immer stimmt.
 */
export const envelope = (frame: number, points: [number, number][]): number => {
	const frames: number[] = [];
	for (const [f] of points) frames.push(frames.length ? Math.max(f, frames[frames.length - 1] + 1) : f);
	return interpolate(
		frame,
		frames,
		points.map(([, v]) => v),
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
	);
};
