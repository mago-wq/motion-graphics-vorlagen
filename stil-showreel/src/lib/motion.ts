import {Easing, interpolate, spring} from 'remotion';
import {FPS} from '../timing';

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0..1 zwischen zwei Frames mit Easing. */
export const ramp = (f: number, a: number, b: number, ease: (t: number) => number = Easing.inOut(Easing.cubic)) =>
	interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeOutBack = Easing.out(Easing.back(1.4));

/** Federnder Einsatz ab Frame `start` (0 → 1, wenig Überschwingen). */
export const pop = (f: number, start: number, cfg: {damping?: number; stiffness?: number; mass?: number} = {}) =>
	spring({
		frame: f - start,
		fps: FPS,
		config: {damping: cfg.damping ?? 14, stiffness: cfg.stiffness ?? 260, mass: cfg.mass ?? 0.6},
	});
