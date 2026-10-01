// Farben und Schrift. Teleshopping der 2000er: Königsblau mit Strahlenkranz,
// Chrom-Schrift, gelbe und rote Störer. Das Blau ist aus der Oceanmin-Packung
// abgeleitet (Verlauf Cyan -> Marine), damit Produkt und Bühne zusammengehören.

export const FONT = 'Archivo';

export const COLORS = {
	/** Bühne: Strahlenkranz hell/dunkel und Grund */
	blueDeep: '#06124A',
	blue: '#0B2C9A',
	blueRay: '#1240C4',
	blueLight: '#2E7BEA',
	cyan: '#19B4F0',
	/** Störer */
	yellow: '#FFD31A',
	red: '#E2081C',
	redDeep: '#9E0010',
	/** Schrift */
	white: '#FFFFFF',
	ink: '#0A1340',
} as const;

/** Die fünf Farben des Streifens auf jeder Coral-Club-Packung (links -> rechts) */
export const STRIPE = ['#E74D8C', '#80549E', '#1F96BD', '#87BC3A', '#F2DC25'] as const;

/** Breite der Schrift (Archivo hat eine Breiten-Achse 62–125 %) */
export const WIDE = '125%';
export const NARROW = '75%';
