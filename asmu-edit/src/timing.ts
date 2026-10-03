// Zeitachse: Das Video folgt dem geschnittenen Nasheed (src/schnitt.json).
// Zeiten im Original (Sekunden des 4:25-Nasheeds) werden mit vt() in Videozeit umgerechnet,
// damit Liedzeilen und Schläge nach einer Änderung am Schnitt automatisch mitwandern.
import HUELLE from './huelle.json';
import SCHNITT from './schnitt.json';

export const FPS = SCHNITT.fps;

/** Videolänge = Länge der Tonspur (Schnitt + Nachhall), siehe scripts/prepare_audio.py. */
export const DURATION_FRAMES = HUELLE.length;

const PART_START: number[] = [];
SCHNITT.teile.reduce((acc, [a, b]) => {
	PART_START.push(acc);
	return acc + (b - a);
}, 0);

/** Original-Nasheedzeit -> Videozeit (s). */
export const vt = (songTime: number): number => {
	const i = SCHNITT.teile.findIndex(([a, b]) => songTime >= a - 0.5 && songTime <= b + 0.5);
	if (i < 0) throw new Error(`Zeit ${songTime}s liegt in keinem Ausschnitt (src/schnitt.json)`);
	return PART_START[i] + songTime - SCHNITT.teile[i][0];
};

/** Videozeit (s) -> Frame. */
export const fr = (seconds: number) => Math.round(seconds * FPS);

/** Lautstärke des Gesangs an Frame f (0–1). */
export const env = (f: number) => HUELLE[Math.max(0, Math.min(HUELLE.length - 1, Math.round(f)))] ?? 0;

// Pulsschläge des Gesangs (librosa beat_track, ~65 BPM), Originalzeit. Schnitte und
// Einblendungen sitzen auf diesen Schlägen.
const BEATS_ORIG = [
	1.39, 2.2, 3.06, 3.98, 4.96, 5.9, 6.95, 7.8, 8.77, 9.8, 10.78, 11.65, 12.53, 13.49, 14.5, 15.42,
	226.85, 227.71, 228.64, 229.57, 230.47, 231.67, 232.57, 233.47, 234.2, 234.95, 235.85, 236.94, 237.89,
	238.8, 239.7, 240.61, 241.56, 242.53, 243.43, 244.33, 245.24, 246.18, 247.35, 248.28,
];
export const BEATS = BEATS_ORIG.map(vt);
