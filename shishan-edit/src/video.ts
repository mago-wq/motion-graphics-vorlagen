// Eckdaten des Formats: 1080×1920 (9:16), 30 fps. Länge kommt aus der Tonspur (timeline.json).
import timeline from './timeline.json';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = Math.ceil(timeline.duration * FPS);
