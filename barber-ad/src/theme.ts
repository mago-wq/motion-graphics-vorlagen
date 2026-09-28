// Farben und Schriften, abgeleitet aus config.ts.
import {config} from './config';

export {HEADLINE_FONT, BODY_FONT} from './fonts';

const channels = (hex: string) => {
	const value = hex.replace('#', '');
	return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
};

/** Mischt zwei Hex-Farben deckend (amount 0 = a, 1 = b) */
export const mix = (a: string, b: string, amount: number): string => {
	const [ca, cb] = [channels(a), channels(b)];
	return `rgb(${ca.map((v, i) => Math.round(v + (cb[i] - v) * amount)).join(', ')})`;
};

/** Hex-Farbe (#RRGGBB) mit Deckkraft als rgba() */
export const withAlpha = (hex: string, alpha: number): string => {
	const [r, g, b] = channels(hex);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const COLORS = {
	bg: config.hauptfarbe,
	text: config.textfarbe,
	accent: config.akzentfarbe,
	/** Nebentext: Off-White mit 70 % Deckkraft, auf Schwarz Kontrast > 8:1 */
	textMuted: withAlpha(config.textfarbe, 0.7),
	/** Kartenfläche: deckend, kaum heller als der Grund */
	surface: mix(config.hauptfarbe, config.textfarbe, 0.05),
	hairline: withAlpha(config.textfarbe, 0.1),
};

/** Preise im deutschen Format: "28 €", "27,50 €" */
export const formatEuro = (value: number): string =>
	new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
		maximumFractionDigits: 2,
	}).format(value);

/** Schmales geschütztes Leerzeichen zwischen Zahl und Einheit ("20 %") */
export const NARROW_NBSP = ' ';
