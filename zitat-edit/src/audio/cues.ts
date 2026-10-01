/**
 * Ton-Drehbuch: welche Fläche und welcher Effekt wann und wie laut.
 * Alle Zeitpunkte kommen aus timing.ts – dieselben Werte, mit denen auch die
 * Animationen laufen. Die Dateien bereitet scripts/toene_vorbereiten.py vor
 * (nur Geräusche, keine Musik, keine Instrumente).
 *
 * Die Stimme hat Vorrang: Solange gesprochen wird, gehen alle Flächen um
 * etwa 5 dB zurück ("Ducking"). Geprüft wird das mit Spracherkennung auf
 * dem fertigen Mix (README, Abschnitt Prüfen).
 */
import {envelope} from '../motion';
import {
	AKZENT_WOERTER,
	DURATION,
	FADE_OUT,
	FLUEGE,
	INTRO,
	nahFrame,
	RUHE_AB,
	SPEECH_END,
	STIMME,
	VOICE_START,
} from '../timing';
import {FPS} from '../video';
import manifest from './toene.json';

export const TOENE = manifest;
export type ToenName = keyof typeof manifest;

export type Cue = {
	sound: ToenName;
	/** Globaler Frame, auf den der Anker des Effekts fällt */
	frame: number;
	volume?: number;
	/** Nach so vielen Frames ab dem Anker weich ausblenden (z. B. Donner-Nachhall kürzen) */
	kuerzen?: number;
};

// ---------------------------------------------------------------- Ducking

const aktiv = new Float32Array(DURATION + 1);
for (const w of STIMME.woerter) {
	const a = VOICE_START + Math.floor(w.start * FPS) - 3;
	const b = VOICE_START + Math.ceil(w.ende * FPS) + 6;
	for (let f = Math.max(0, a); f <= Math.min(DURATION, b); f++) aktiv[f] = 1;
}
// Weich: 5 Frames Anlauf und Abklang
const geglaettet = aktiv.map((_, f) => {
	let sum = 0;
	for (let k = -5; k <= 5; k++) sum += aktiv[Math.max(0, Math.min(DURATION, f + k))];
	return sum / 11;
});

/** 0 = Stille, 1 = es wird gesprochen */
const sprache = (f: number): number => geglaettet[Math.max(0, Math.min(DURATION, Math.round(f)))];
const duck = (f: number) => 1 - 0.45 * sprache(f);

// ---------------------------------------------------------------- Flächen

/** Lautstärke-Verläufe der Flächen (Frame -> 0..1). Ab RUHE_AB Vögel statt Sturm. */
export const ATMO: {sound: ToenName; volume: (f: number) => number}[] = [
	{
		sound: 'regen',
		volume: (f) =>
			duck(f) *
			envelope(f, [[0, 0], [20, 0.45], [VOICE_START, 0.45], [VOICE_START + 20, 0.24], [RUHE_AB, 0.24], [RUHE_AB + 90, 0.1], [FADE_OUT, 0.1], [DURATION, 0]]),
	},
	{
		sound: 'wind',
		volume: (f) =>
			duck(f) *
			envelope(f, [[0, 0], [20, 0.4], [INTRO.flash, 0.4], [INTRO.flash + 30, 0.16], [RUHE_AB, 0.16], [RUHE_AB + 60, 0.06], [DURATION, 0]]),
	},
	{
		sound: 'donner',
		volume: (f) => envelope(f, [[0, 0], [10, 0.4], [INTRO.flash - 10, 0.3], [VOICE_START, 0.14], [INTRO.flash + 90, 0]]),
	},
	{
		// Erst leise unter den letzten Worten, nach dem letzten Wort voll
		sound: 'voegel',
		volume: (f) =>
			duck(f) *
			envelope(f, [[RUHE_AB - 10, 0], [RUHE_AB + 45, 0.22], [SPEECH_END, 0.22], [SPEECH_END + 30, 0.4], [FADE_OUT, 0.4], [DURATION, 0]]),
	},
];

// ---------------------------------------------------------------- Effekte

export const buildCues = (): Cue[] => {
	const cues: Cue[] = [];

	// Tauben: Flügelschlag, wenn sie der Kamera am nächsten sind (nahe Tauben lauter)
	for (const flug of FLUEGE) {
		const near = Math.max(flug.von[2], flug.nach[2]);
		const unterStimme = sprache(nahFrame(flug)) > 0.5 ? 0.5 : 1;
		cues.push({sound: 'fluegel', frame: nahFrame(flug), volume: Math.min(1, 0.25 + near * 0.28) * unterStimme});
	}

	// Blitz: Whoosh läuft auf den Blitz zu, tiefer Einschlag genau darauf.
	// Der Donner-Nachhall des Einschlags wird gekürzt, damit das erste Wort frei steht.
	cues.push({sound: 'whoosh_blitz', frame: INTRO.flash, volume: 0.75});
	cues.push({sound: 'boom_blitz', frame: INTRO.flash, volume: 0.75, kuerzen: VOICE_START - INTRO.flash});

	// Akzent-Wörter: eigener Klang je Stil, deutlich unter der Stimme
	for (const w of AKZENT_WOERTER) {
		if (w.akzent === 'glitch') cues.push({sound: 'glitch', frame: w.frame, volume: 0.22});
		else if (w.akzent === 'umriss') cues.push({sound: 'swoosh', frame: w.frame - 4, volume: 0.18});
		else {
			cues.push({sound: 'neon', frame: w.frame, volume: 0.2});
			cues.push({sound: 'swoosh_tief', frame: w.frame - 3, volume: 0.14});
		}
	}

	return cues;
};
