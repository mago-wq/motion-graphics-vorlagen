// Feste Eckdaten des Formats (9:16, 30 fps). Die Länge ergibt sich aus der
// Sprecherspur (siehe timing.ts), nicht aus einer festen Zahl.
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/**
 * Sicherheitszone für TikTok und Reels: wichtiger Text nur hier.
 * Oben liegt die App-Leiste, unten Caption, Buttons und Profil.
 */
export const SAFE = {
	top: 250,
	bottom: 1500,
	left: 80,
	right: WIDTH - 80,
	width: WIDTH - 160,
	height: 1500 - 250,
} as const;
