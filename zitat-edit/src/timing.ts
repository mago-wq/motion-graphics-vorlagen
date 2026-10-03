/**
 * Zeitplan des Videos in globalen Frames (30 fps).
 * Bild UND Ton lesen ihre Zeitpunkte von hier. Die Wort-Zeiten stammen aus
 * src/stimme/woerter.json, gemessen von `npm run stimme` an der fertigen
 * Stimm-Datei. Deshalb erscheint jedes Wort genau dann, wenn es gesprochen
 * wird, und die Länge des Videos richtet sich nach der Stimme.
 */
import {config, type Akzent} from './config';
import woerter from './stimme/woerter.json';
import {FPS, HEIGHT, WIDTH} from './video';

export type GesprochenesWort = {wort: string; start: number; ende: number; abschnitt: number};
export const STIMME = woerter as {dauer: number; sprechEnde: number; woerter: GesprochenesWort[]};

const sec = (s: number) => Math.round(s * FPS);

// ---------------------------------------------------------------- Intro

export const INTRO = {
	/** Aufblende aus Schwarz */
	fadeIn: 14,
	/** Spitze des weißen Blitzes. Davor fliegen die Tauben, danach beginnt die Stimme. */
	flash: 84,
};

/** Frame, an dem die Stimm-Datei beginnt: kurz nach dem Blitz, wenn der Einschlag abklingt */
export const VOICE_START = INTRO.flash + 8;

/** Wörter erscheinen so viele Frames vor ihrem Ton. Bild minimal vor Ton wirkt synchron. */
const LEAD = 2;

const wordFrame = (i: number) => VOICE_START + sec(STIMME.woerter[i].start) - LEAD;
const wordEndFrame = (i: number) => VOICE_START + sec(STIMME.woerter[i].ende);

// ---------------------------------------------------------------- Tafeln

export type TafelWort = {
	text: string;
	akzent: Akzent | null;
	/** Laufende Nummer im gesprochenen Text */
	index: number;
	/** Frame, in dem das Wort erscheint */
	frame: number;
};

export type Tafel = {
	woerter: TafelWort[];
	inFrame: number;
	/** Ab hier blendet die Tafel aus (5 Frames). Bei der letzten Tafel: Videoende. */
	outFrame: number;
};

/** Länger als so lange nach dem letzten Wort bleibt eine Tafel nicht stehen. */
const HOLD = sec(0.7);
/** So viele Frames sieht man das letzte Wort einer Tafel mindestens */
const MIN_SICHTBAR = 8;
export const TAFEL_OUT_FRAMES = 4;

const TOKEN = /\{([^|}]+)\|([^}]+)\}|(\S+)/g;

const buildTafeln = (): Tafel[] => {
	let index = 0;
	const parsed = config.tafeln.map((tafel) =>
		[...tafel.matchAll(TOKEN)].map((m) => {
			const word: TafelWort = {
				text: m[1] ?? m[3],
				akzent: (m[2] as Akzent | undefined) ?? null,
				index,
				frame: 0,
			};
			index++;
			return word;
		}),
	);
	if (index !== STIMME.woerter.length) {
		throw new Error(
			`Die Tafeln haben ${index} Wörter, die Stimme ${STIMME.woerter.length}. ` +
				'Tafeln und gesprochener Text in config.ts angleichen, dann npm run stimme.',
		);
	}
	return parsed.map((ws, t) => {
		for (const w of ws) w.frame = wordFrame(w.index);
		const next = parsed[t + 1];
		const lastIndex = ws[ws.length - 1].index;
		// Ausblenden ist fertig, wenn das nächste Wort erscheint (keine Überlagerung),
		// in langen Pausen schon vorher (leerer Himmel wie im Vorbild)
		const outFrame = next
			? Math.max(
					wordFrame(lastIndex) + MIN_SICHTBAR,
					Math.min(wordFrame(next[0].index) - TAFEL_OUT_FRAMES, wordEndFrame(lastIndex) + HOLD),
				)
			: Number.POSITIVE_INFINITY;
		return {woerter: ws, inFrame: ws[0].frame, outFrame};
	});
};

export const TAFELN = buildTafeln();
export const ALLE_WOERTER = TAFELN.flatMap((t) => t.woerter);

// ---------------------------------------------------------------- Ende

/** Letztes Wort ist gesprochen */
export const SPEECH_END = VOICE_START + Math.ceil(STIMME.sprechEnde * FPS);
/** Quellenangabe blendet ein */
export const QUELLE_IN = SPEECH_END + 10;
/** Ausklang: Hall, Vögel, wegfliegende Tauben */
export const DURATION = SPEECH_END + sec(3);
/** Abblende nach Schwarz: Video läuft auf TikTok in Schleife und beginnt wieder aus Schwarz */
export const FADE_OUT = DURATION - 18;

for (const t of TAFELN) if (!Number.isFinite(t.outFrame)) t.outFrame = DURATION;

// ---------------------------------------------------------------- Tauben

export type Flug = {
	start: number;
	dauer: number;
	/** Start und Ziel: x, y in Pixeln, z = Nähe (1 = normal, 2 = doppelt so groß und unscharf) */
	von: [number, number, number];
	nach: [number, number, number];
	/** Flügelschläge pro Sekunde */
	schlag: number;
	/** Zufallswert für Phase und kleine Abweichungen */
	seed: number;
};

/** Frame, in dem die Taube am nächsten ist (dort liegt ihr Flügelschlag-Geräusch) */
export const nahFrame = (f: Flug): number =>
	f.von[2] >= f.nach[2] ? f.start + Math.round(f.dauer * 0.15) : f.start + Math.round(f.dauer * 0.85);

const W = WIDTH;
const H = HEIGHT;

const himmelWort = ALLE_WOERTER.find((w) => w.akzent === 'neon-blau') ?? ALLE_WOERTER[Math.floor(ALLE_WOERTER.length / 3)];

export const FLUEGE: Flug[] = [
	// Intro: Schwarm fliegt durchs Bild, einige ganz nah an der Kamera
	{start: 2, dauer: 40, von: [-180, H * 0.7, 1.7], nach: [W + 220, H * 0.28, 2.0], schlag: 4.2, seed: 1},
	{start: 8, dauer: 58, von: [W + 120, H * 0.6, 0.75], nach: [-140, H * 0.2, 0.6], schlag: 5.0, seed: 2},
	{start: 14, dauer: 62, von: [W * 0.3, H + 120, 1.0], nach: [W * 0.62, -160, 0.75], schlag: 4.6, seed: 3},
	{start: 20, dauer: 52, von: [-120, H * 0.38, 0.5], nach: [W + 140, H * 0.14, 0.45], schlag: 5.4, seed: 4},
	{start: 28, dauer: 30, von: [W + 260, H * 0.82, 2.6], nach: [-320, H * 0.46, 3.0], schlag: 3.8, seed: 5},
	{start: 36, dauer: 62, von: [W * 0.55, H + 140, 1.1], nach: [W * 0.86, -140, 0.5], schlag: 4.8, seed: 6},
	{start: 48, dauer: 46, von: [-160, H * 0.52, 1.25], nach: [W + 180, H * 0.3, 1.05], schlag: 4.4, seed: 7},
	// Während des Textes: eine Taube steigt in den Himmel
	{start: himmelWort.frame - 6, dauer: 75, von: [W * 0.18, H * 0.9, 1.3], nach: [W * 0.7, -120, 0.35], schlag: 4.5, seed: 8},
	// Ausklang: drei Tauben fliegen von der Kamera weg in den Himmel
	{start: SPEECH_END + 4, dauer: 70, von: [W * 0.2, H + 160, 2.2], nach: [W * 0.42, H * 0.12, 0.3], schlag: 4.0, seed: 9},
	{start: SPEECH_END + 12, dauer: 66, von: [W * 0.85, H + 200, 2.4], nach: [W * 0.6, H * 0.08, 0.28], schlag: 4.3, seed: 10},
	{start: SPEECH_END + 20, dauer: 60, von: [W * 0.5, H + 220, 2.0], nach: [W * 0.32, H * 0.18, 0.3], schlag: 4.6, seed: 11},
];

// ---------------------------------------------------------------- Licht

/** Farbige Lichtlecks im Intro: Warm beim Aufblenden, dann Lila, Türkis, weißer Blitz */
export const LEAKS = {
	warm: {frames: [0, 6, 22, 44], opacity: [0, 0.55, 0.28, 0]},
	lila: {frames: [56, 68, 80], opacity: [0, 0.6, 0]},
	tuerkis: {frames: [64, 76, 88], opacity: [0, 0.55, 0]},
	blitz: {frames: [76, INTRO.flash, INTRO.flash + 8, INTRO.flash + 22], opacity: [0, 1, 0.2, 0]},
};

/** Wörter mit Akzent: Licht und Ton reagieren darauf */
export const AKZENT_WOERTER = ALLE_WOERTER.filter((w) => w.akzent !== null);

const vergleich = (s: string) => s.toLocaleLowerCase('de').replace(/[^\p{L}\p{N}]/gu, '');
const wendeWort = ALLE_WOERTER.find((w) => vergleich(w.text) === vergleich(config.wendeWort));
if (!wendeWort) {
	throw new Error(`wendeWort "${config.wendeWort}" kommt in keiner Tafel vor (config.ts).`);
}

/** Ab hier legt sich der Sturm (config.wendeWort): Regen leiser, Vögel, wärmeres Licht */
export const RUHE_AB = wendeWort.frame;
