// Format und Länge. Die Länge kommt aus der Tonspur (scripts/build_audio.py → timeline.json).
import timeline from './timeline.json';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = Math.round(timeline.duration * FPS);

// Filmstreifen wie im Vorbild: 4:3-Bild mittig, schwarze Balken oben und unten
export const BAND = {x: 0, y: 555, w: 1080, h: 810} as const;

export const TL = timeline;
/** Sekunde → Frame */
export const f = (s: number) => Math.round(s * FPS);
