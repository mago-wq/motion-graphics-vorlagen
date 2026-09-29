// Zeitplan des Films in Frames. Quelle ist film.json (Beats); der Ton liest dieselbe Datei.
import film from './film.json';

export const FPS = film.fps;
/** Frames pro Beat (120 BPM bei 30 fps = 15) */
export const FPB = (60 / film.bpm) * film.fps;
export const b = (beat: number): number => Math.round(beat * FPB);

type Mapped<T> = {[K in keyof T]: T[K] extends number ? number : T[K] extends number[] ? number[] : T[K]};
const inFrames = <T extends Record<string, unknown>>(o: T): Mapped<T> =>
	Object.fromEntries(
		Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? b(v) : Array.isArray(v) ? v.map((x) => b(x as number)) : v]),
	) as Mapped<T>;

export const Z = {
	problem: inFrames(film.problem),
	handy: inFrames(film.handy),
	tuer: inFrames(film.tuer),
	tour: inFrames(film.tour),
	studios: inFrames(film.studios),
	preis: inFrames(film.preis),
	cta: inFrames(film.cta),
	logo: inFrames(film.logo),
};

export const DAUER = b(film.totalBeats);
/** Ab hier Standbild (letzte 0,8 s), der Ton ist ab 0,3 s vor Schluss still */
export const STILL_AB = b(film.stillAb);
