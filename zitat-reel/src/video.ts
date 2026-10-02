// Feste Eckdaten des Formats.
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
/** 15 s – kurz genug, dass die meisten zu Ende schauen und der Loop zählt. */
export const DURATION = 450;

/**
 * Das Bild läuft als Kinoband (4:5) in der Mitte, oben und unten Schwarz.
 * Alle Referenzen sind Querformat-Clips mit Balken. Das wirkt wie Film statt
 * wie Handyvideo, und TikToks Bedienelemente liegen auf Schwarz statt auf dem Bild.
 */
export const BAND = {
	top: 285,
	height: 1350,
	width: WIDTH,
} as const;
