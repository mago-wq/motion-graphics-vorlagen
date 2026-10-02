// Alle Zeitpunkte werden aus dem Beat-Raster des Nasheeds berechnet (src/audio.json).
// Wer Schnitte verschiebt, verschiebt sie in Beats – nie in Frames raten.
import audio from './audio.json';
import {SHOTS, END_BEATS} from './config';
import {FPS} from './video';

export const BEAT_SECONDS = 60 / audio.bpm;

/** Zeitpunkt (s) eines Beats in der Tonspur. Bruchteile erlaubt. */
export const beatTime = (beat: number): number => audio.firstBeat + beat * BEAT_SECONDS;

/** Frame eines Beats. Beat 0 beginnt bei Frame 0, damit das erste Bild sofort steht. */
export const beatFrame = (beat: number): number => (beat === 0 ? 0 : Math.round(beatTime(beat) * FPS));

export type TimedShot = (typeof SHOTS)[number] & {index: number; startBeat: number; from: number; duration: number};

export const TIMED_SHOTS: TimedShot[] = (() => {
	let beat = 0;
	return SHOTS.map((shot, index) => {
		const from = beatFrame(beat);
		const to = beatFrame(beat + shot.beats);
		const timed = {...shot, index, startBeat: beat, from, duration: to - from};
		beat += shot.beats;
		return timed;
	});
})();

export const TOTAL_BEATS = SHOTS.reduce((sum, s) => sum + s.beats, 0);
export const SHOTS_END = beatFrame(TOTAL_BEATS);
/** Abspann (schwarz, Quellen) nach dem letzten Bild. */
export const END_FROM = SHOTS_END;
export const DURATION = beatFrame(TOTAL_BEATS + END_BEATS);

/** Ab hier volle Wucht: Beat-Pulse, Wackeln, Blitze. */
export const DROP_FRAME = beatFrame(audio.dynamics.quietUntilBeat);
export const INTRO_END_FRAME = beatFrame(audio.dynamics.loudIntroUntilBeat);
