// Farben aus config.ts und Hilfsfunktionen.
import {config} from './config';

export {FONT} from './fonts';

export const C = config.farben;

export const withAlpha = (hex: string, alpha: number): string => {
	const v = hex.replace('#', '');
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Laufweite nach Größe (Apple: große Schrift enger, kleine fast neutral) */
export const tracking = (fontSize: number): number => (fontSize >= 200 ? -0.055 : fontSize >= 100 ? -0.04 : fontSize >= 60 ? -0.025 : -0.01);
