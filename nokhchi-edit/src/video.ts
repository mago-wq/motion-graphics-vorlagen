// Eckdaten des Formats. Gebaut wird in 1080×1920 (CSS-Pixel), gerendert mit --scale=2
// → 2160×3840 (4K hochkant). Text und Effekte bleiben dadurch gestochen scharf.
import timeline from './timeline.json';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = Math.ceil(timeline.duration * FPS);

/**
 * Sicherheitszone für TikTok/Reels: wichtiger Text nur hier.
 * Oben App-Leiste, rechts die Buttons, unten Caption und Profil.
 */
export const SAFE = {
	top: 260,
	bottom: 1440,
	left: 80,
	right: WIDTH - 130,
	width: WIDTH - 210,
	height: 1440 - 260,
} as const;
