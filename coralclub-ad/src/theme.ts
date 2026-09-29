// Farben, Schrift und Preisformat.
import {config} from './config';

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

export const STRIPE = config.streifen;

/**
 * Stärken. Die optische Größe (opsz 12–96) stellt Chrome automatisch passend
 * zur Schriftgröße ein (font-optical-sizing: auto) – auch beim Messen in fitText.
 */
export const DISPLAY_WEIGHT = 800;
export const TEXT_WEIGHT = 500;

/** Preise im deutschen Format: "21,00 €" (immer zwei Nachkommastellen, wie im Shop) */
export const formatEuro = (value: number): string =>
	new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR', minimumFractionDigits: 2}).format(value);

/** Ersparnis in ganzen Prozent */
export const savingPercent = (normal: number, club: number): number => Math.round((1 - club / normal) * 100);

/** Schmales geschütztes Leerzeichen zwischen Zahl und Einheit ("20 %") */
export const NARROW_NBSP = ' ';
