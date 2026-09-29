// Farben, Verläufe, Schriften und Zahlenformat. Werte kommen aus config.ts.
import {config} from './config';

export {DISPLAY_FONT, TEXT_FONT} from './fonts';

const channels = (hex: string) => {
	const value = hex.replace('#', '');
	return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
};

/** Hex-Farbe mit Deckkraft als rgba() */
export const withAlpha = (hex: string, alpha: number): string => {
	const [r, g, b] = channels(hex);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const COLORS = {
	bg: config.farben.grund,
	text: config.farben.text,
	/** Nebentext: 72 % Deckkraft auf Schwarz, Kontrast > 9:1 */
	textMuted: withAlpha(config.farben.text, 0.72),
	/** Fußnoten: 60 %, Kontrast > 7:1 */
	textFaint: withAlpha(config.farben.text, 0.6),
	gold: config.farben.gold,
	goldLight: config.farben.goldHell,
	goldDeep: config.farben.goldTief,
};

/**
 * Metallic-Gold wie auf mfit-smart.de (dort als Textverlauf im CSS).
 * Nur für Logo, Preis und die goldenen Schlüsselwörter.
 */
export const GOLD_GRADIENT =
	'linear-gradient(100deg, #9a7426 0%, #d4a83d 16%, #f8e39c 33%, #c69837 50%, #e2b94f 66%, #f3d98a 83%, #b08530 100%)';

/** Zahl im deutschen Format ohne Währung: 17,9 -> "17,90" */
export const formatAmount = (value: number): string =>
	new Intl.NumberFormat('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);

/** Geschütztes Leerzeichen zwischen Zahl und Einheit ("17,90 €", "100 %") */
export const NBSP = ' ';
