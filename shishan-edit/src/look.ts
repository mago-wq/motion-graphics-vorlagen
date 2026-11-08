// Farbwelt und Bild-Looks nach Referenz 1: harte Schwarz-Weiß-Bilder, Rot als einzige Farbe,
// dazu eisblaue Negativ-Blitze. Schrift flackert zwischen Rot, Weiß und Eisblau.
export const C = {
	black: '#050405',
	white: '#f4f1ea',
	red: '#e3161f',
	redDeep: '#8a0710',
	ice: '#bdf0f6',
	iceDeep: '#5fc4d6',
} as const;

export type Look = 'ink' | 'crush' | 'inv' | 'hard' | 'bright' | 'ice' | 'neg' | 'red' | 'blood' | 'color' | 'half' | 'raw';

/**
 * CSS-Filter je Look. „red“ und „half“ sind vorab gerechnet (public/img/red, public/img/half),
 * hier nur noch Feinschliff. Helligkeits-Flackern kommt pro Frame dazu (siehe Media.tsx).
 */
export const FILTER: Record<Look, string> = {
	ink: 'grayscale(1) contrast(2.0) brightness(0.92)',
	/** Referenz-Drop: Schwarz zugedrückt, nur Lichter bleiben (alles unter ~30 % Grau wird Schwarz) */
	crush: 'grayscale(1) contrast(2.6) brightness(0.8)',
	/** Umgekehrt: helles Museumsfoto → weißes Motiv auf Schwarz (Dolche, Waffen) */
	inv: 'grayscale(1) invert(1) contrast(2.2) brightness(0.9)',
	hard: 'grayscale(1) contrast(3.3) brightness(1.1)',
	bright: 'grayscale(1) contrast(1.7) brightness(1.55)',
	ice: 'grayscale(1) contrast(1.75) sepia(0.55) hue-rotate(152deg) saturate(1.8) brightness(1.06)',
	neg: 'grayscale(1) invert(1) contrast(1.45) sepia(0.6) hue-rotate(150deg) saturate(2.3) brightness(1.1)',
	red: 'contrast(1.18)',
	blood: 'grayscale(1) contrast(2.1) sepia(1) hue-rotate(-42deg) saturate(5.5) brightness(0.92)',
	color: 'contrast(1.4) saturate(1.2) brightness(0.96)',
	half: 'contrast(1.15)',
	raw: 'none',
};
