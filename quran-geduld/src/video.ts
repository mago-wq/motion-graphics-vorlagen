// Feste Eckdaten des Formats (9:16, Länge = Rezitation).
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
/** 58,13 s Rezitation → 1744 Frames. */
export const DURATION = 1744;

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
} as const;

/** Boden, auf dem die Figuren stehen (Kamm der vorderen Düne). */
export const GROUND = 1470;

export const sec = (s: number) => Math.round(s * FPS);
