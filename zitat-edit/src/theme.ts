// Farben, abgeleitet aus config.ts.
import {config, type Akzent} from './config';

export {FONT} from './fonts';

const channels = (hex: string) => {
	const value = hex.replace('#', '');
	return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
};

/** Hex-Farbe (#RRGGBB) mit Deckkraft als rgba() */
export const withAlpha = (hex: string, alpha: number): string => {
	const [r, g, b] = channels(hex);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Mischt zwei Hex-Farben deckend (amount 0 = a, 1 = b) */
export const mix = (a: string, b: string, amount: number): string => {
	const [ca, cb] = [channels(a), channels(b)];
	return `rgb(${ca.map((v, i) => Math.round(v + (cb[i] - v) * amount)).join(', ')})`;
};

export const COLORS = {
	text: config.farben.text,
	/** Schatten unter weißer Schrift, damit sie auch vor hellen Wolken lesbar bleibt */
	textShadow: 'rgba(0, 0, 0, 0.55)',
};

export type NeonAkzent = Extract<Akzent, `neon-${string}`>;

export const NEON: Record<NeonAkzent, string> = {
	'neon-rot': config.farben.neonRot,
	'neon-gruen': config.farben.neonGruen,
	'neon-gelb': config.farben.neonGelb,
	'neon-blau': config.farben.neonBlau,
};

export const isNeon = (akzent: Akzent | null): akzent is NeonAkzent =>
	akzent !== null && akzent.startsWith('neon-');
