// Federn und Hilfen für alle Bewegungen. Nichts linear außer Ken-Burns-Drift.
import {Easing, interpolate, spring, type SpringConfig} from 'remotion';
import {FPS} from './video';

export const SPRINGS = {
	/** Bild schlägt ein: schnell, ~3 % Überschwingen */
	slam: {damping: 22, stiffness: 380, mass: 0.55},
	/** Buchstaben: knackig */
	letter: {damping: 18, stiffness: 420, mass: 0.5},
	soft: {damping: 200},
} satisfies Record<string, Partial<SpringConfig>>;

export const springAt = (frame: number, config: Partial<SpringConfig>, durationInFrames?: number) =>
	spring({frame, fps: FPS, config, durationInFrames});

/** Abklingende Hüllkurve: 1 bei f=0, 0 nach `len` Frames (ease-out). */
export const decay = (f: number, len: number) =>
	f < 0 ? 0 : interpolate(f, [0, len], [1, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

/** Deterministisches Rauschen −1..1 (für Wackeln), gleich bei jedem Render. */
export const noise = (seed: number) => {
	const x = Math.sin(seed * 12.9898) * 43758.5453;
	return (x - Math.floor(x)) * 2 - 1;
};
