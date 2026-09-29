// Feste Eckdaten des Formats: Instagram Reel, 9:16, 30 fps.
import timeline from './timeline.json';

export const FPS = timeline.fps;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/**
 * Sicherheitszone für Reels-Anzeigen (Meta, Stand 2026): oben 14 %,
 * unten 35 %, seitlich 6 % bleiben frei, dort liegen App-Leiste,
 * Beschreibung, Buttons und der Anzeigen-Button. Wichtiger Text nur hier.
 */
export const SAFE = {
	top: 270,
	bottom: 1250,
	left: 65,
	right: WIDTH - 65,
} as const;

/** Innerer Satzspiegel: etwas Luft zur Sicherheitszone, alle Zeilen passen hier hinein. */
export const TYPE_WIDTH = 900;
export const CENTER_X = WIDTH / 2;
