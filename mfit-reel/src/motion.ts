// Bewegungs-Werkzeuge: Easing-Kurven, Einblendungen, Einschläge.
// Grundsatz: Eintritte mit ease-out, nichts linear, Schlüsselposen landen auf dem Beat.
import {Easing, interpolate, spring, type SpringConfig} from 'remotion';
import {FPS} from './video';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const EASE = {
	/** Schneller Eintritt, weiches Ankommen */
	out: Easing.bezier(0.16, 1, 0.3, 1),
	/** Kräftiger Eintritt mit kurzem Nachdruck am Ende */
	snap: Easing.bezier(0.2, 0.9, 0.1, 1),
	/** Abgang: beschleunigt aus dem Bild */
	exit: Easing.bezier(0.7, 0, 0.84, 0),
	inOut: Easing.bezier(0.65, 0, 0.35, 1),
};

/** 0 → 1 zwischen `start` und `start + duration`, mit Easing. */
export const progress = (frame: number, start: number, duration: number, easing = EASE.out): number =>
	interpolate(frame, [start, start + duration], [0, 1], {...clamp, easing});

/** Wie `progress`, aber für Abgänge: 0 bis `end - duration`, dann → 1 bei `end`. */
export const exitProgress = (frame: number, end: number, duration: number, easing = EASE.exit): number =>
	interpolate(frame, [end - duration, end], [0, 1], {...clamp, easing});

export const SPRINGS = {
	/** Einschlag: schnell, ca. 3 % Überschwingen */
	slam: {damping: 18, stiffness: 260, mass: 0.7},
	/** Pendel für den hängenden Haken */
	pendulum: {damping: 5, stiffness: 60, mass: 1},
	/** Kleiner Pop (Häkchen, Schilder) */
	pop: {damping: 11, stiffness: 240, mass: 0.6},
} satisfies Record<string, Partial<SpringConfig>>;

export const springFrom = (frame: number, start: number, config: Partial<SpringConfig>, durationInFrames?: number): number =>
	spring({frame: frame - start, fps: FPS, config, durationInFrames});

/**
 * Stoß zum Zeitpunkt `at`: springt sofort auf 1 und klingt in `decay` Frames ab.
 * Für Kamera-Punch und Leuchten auf dem Beat.
 */
export const impulse = (frame: number, at: number, decay = 10): number => {
	if (frame < at) return 0;
	return Math.exp(-(frame - at) / (decay / 3));
};

/** Gedämpftes Zittern nach einem Einschlag, deterministisch (kein Zufall). */
export const shake = (frame: number, at: number, strength: number, decay = 8): {x: number; y: number} => {
	const k = impulse(frame, at, decay);
	if (k < 0.01) return {x: 0, y: 0};
	const t = frame - at;
	return {x: Math.sin(t * 2.7 + 1.3) * strength * k, y: Math.cos(t * 3.1) * strength * 0.7 * k};
};

/** Richtungs-Unschärfe für schnelle Bewegungen: Pixel Unschärfe aus Geschwindigkeit. */
export const blurFromSpeed = (pxPerFrame: number, max = 18): number => Math.min(max, Math.abs(pxPerFrame) * 0.35);
