// SommerReel: derselbe Nasheed-Ton, andere Aussage. „يا راحلًا“ („Du, der du gegangen bist“)
// meint hier den Sommer. Der Text ist eine Feststellung auf Deutsch; erst am Ende steht die
// gesungene Zeile auf Arabisch – dann versteht man, an wen das Lied sich richtet.
//
// Bilder: romantischer Sommer (Rosen, Schloss im Abendlicht, Sonnenuntergang am Meer, Paris bei
// Nacht, Lavendel), aber durchgehend nostalgisch-düster abgestimmt (LOOK): tiefe, leicht
// angehobene braune Schwärzen, Petrol in den Schatten, Bernstein in den Lichtern, rote
// Film-Halation, Korn, Flackern, Staub. Wunsch des Nutzers: „Dark Fantasy“, wie Vergangenheit,
// ähnlich „Ya Hasafa“ (nasheed-reel), aber nicht gleich.
//
// Zeiten in Sekunden ab Tonbeginn; Schnitte und Einblendungen liegen auf gesungenen Einsätzen
// (dieselben wie LINES in ../config.ts).

export const FPS = 30;
export const DURATION_S = 15.7;

export type Phrase = {
	text: string;
	/** Einblendzeit (s), auf einen gesungenen Einsatz gelegt. */
	at: number;
	italic?: boolean;
	/** Schriftgröße (px bei 1080 Breite). */
	size: number;
};

export type Block = {
	phrases: Phrase[];
	/** Beginn des Ausblendens (s). */
	out: number;
};

export const BLOCKS: Block[] = [
	{
		phrases: [
			{text: 'und schon', at: 0.05, size: 94},
			{text: 'sind die Sommertage', at: 1.6, size: 94},
			{text: 'Vergangenheit.', at: 3.7, italic: true, size: 156},
		],
		out: 5.75,
	},
	{
		phrases: [
			{text: 'die langen Abende,', at: 6.4, size: 94},
			{text: 'das warme Licht,', at: 8.1, size: 94},
			{text: 'die Leichtigkeit.', at: 10.05, italic: true, size: 140},
		],
		out: 11.95,
	},
];

/** Schluss: die gesungene Zeile, jetzt an den Sommer gerichtet. Löst sich wie Rauch auf. */
export const FINALE = {
	ar: ['يا', 'راحلًا…'],
	words: [12.3, 14.02],
	de: 'Du, der du gegangen bist …',
	out: 14.75,
};

/**
 * „Vergangenheit“: ab dem Wort läuft die Farbe aus (Sepia, stärkeres Flackern),
 * während die Sonne im Meer versinkt. [Beginn, voll, hält bis, wieder normal] in s.
 */
export const MEMORY = {at: 3.7, full: 4.3, hold: 5.6, gone: 6.6};

export type Scene = {
	clip: string;
	from: number;
	clipStart: number;
	rate: number;
	/** Bildausschnitt bei 9:16 (object-position x in %). */
	focusX: number;
	zoom: number;
	/** Zoom am Szenenende relativ zu `zoom` (langsame Kamerafahrt). */
	push: number;
	/** Grundkorrektur des Clips, vor dem gemeinsamen LOOK. */
	filter: string;
};

export const SCENES: Scene[] = [
	// „und schon“ – Rosen gehen auf
	{clip: '38365.mp4', from: 0, clipStart: 3, rate: 1.4, focusX: 50, zoom: 1.0, push: 1.1,
		filter: 'brightness(0.9) contrast(1.1) saturate(0.95)'},
	// „sind die Sommertage“ – Schloss im Abendlicht, Spiegelung im Wasser
	{clip: '15977.mp4', from: 1.6, clipStart: 7, rate: 1, focusX: 30, zoom: 1.0, push: 1.08,
		filter: 'brightness(0.95) contrast(1.1) saturate(0.9)'},
	// „Vergangenheit.“ – die Sonne versinkt im Meer
	{clip: '4119.mp4', from: 3.7, clipStart: 2.2, rate: 1.15, focusX: 50, zoom: 1.0, push: 1.1,
		filter: 'brightness(0.95) contrast(1.12) saturate(0.95)'},
	// „die langen Abende,“ – Paris bei Nacht
	{clip: '4353.mp4', from: 6.35, clipStart: 3, rate: 1, focusX: 69, zoom: 1.0, push: 1.1,
		filter: 'brightness(1.05) contrast(1.1) saturate(0.95)'},
	// „das warme Licht,“ – Lavendel im Sonnenuntergang
	{clip: '17848.mp4', from: 8.1, clipStart: 0.5, rate: 1, focusX: 8, zoom: 1.0, push: 1.1,
		filter: 'brightness(0.78) contrast(1.15) saturate(0.7)'},
	// „die Leichtigkeit.“ – weiße Pfingstrose öffnet sich im Dunkeln
	{clip: '34515.mp4', from: 10.05, clipStart: 4, rate: 1.3, focusX: 45, zoom: 1.0, push: 1.08,
		filter: 'brightness(0.55) contrast(1.2) saturate(0.8)'},
	// „يا راحلًا…“ – eine Rose fällt ins Dunkel; Aufprall (Clip 5,7 s) genau auf „راحلًا“ (14,02 s)
	{clip: '29420.mp4', from: 12.2, clipStart: 3.88, rate: 1, focusX: 62, zoom: 1.0, push: 1.06,
		filter: 'brightness(0.85) contrast(1.15) saturate(0.85)'},
];

/** Aufprall der Rose (s): Kamerastoß. */
export const IMPACT = 14.02;

/** Gemeinsamer Bildlook über allen Szenen. */
export const LOOK = {
	/** Schwarz auf dunkles Braun anheben (nostalgisch), als rgb. */
	blackLift: 'rgb(16,10,9)',
	/** Petrol/Indigo in den Schatten (soft-light, Deckkraft). */
	shadowTint: 0.55,
	/** Bernstein in den Lichtern (soft-light, Deckkraft). */
	highlightTint: 0.35,
	/** Rote Film-Halation um helle Stellen. */
	halation: 0.4,
	/** Allgemeiner weicher Glanz. */
	bloom: 0.3,
	/** Korn (overlay-Deckkraft). */
	grain: 0.11,
	/** Helligkeitsflackern (Anteil). */
	flicker: 0.035,
	/** Bildstand-Wackeln (px). */
	weave: 1.6,
};

export const STYLE = {
	/** Mitte des Textblocks (y bei 1920 Höhe). */
	textY: 930,
	textColor: '#fff6e8',
	arabicSize: 150,
	subSize: 58,
};

/** Effekte an der Stimme, wie FX in ../config.ts (px bei 1080 Breite). */
export const FX = {
	tremorBase: 0.8,
	tremor: 5,
	punchShake: 7,
	punchScale: 0.02,
	split: 6,
	camDrift: 4,
	camShake: 14,
};

export type Sfx = {file: string; at: number; until: number; volume: number; fadeIn?: number; fadeOut?: number};

// Nasheed bei -10,9 LUFS, Geräusche bei -31: nur Atmosphäre darunter.
export const SFX: Sfx[] = [
	// Sommerabend: Grillen, verklingen mit „Vergangenheit“
	{file: 'grillen.wav', at: 0, until: 5.6, volume: 0.9, fadeIn: 0.1, fadeOut: 1.6},
	// Abendwind
	{file: 'wind.wav', at: 5.0, until: 15.7, volume: 0.6, fadeIn: 1.2, fadeOut: 1.5},
	// Luftzug, als die Rose fällt
	{file: 'swoosh-windig.wav', at: 12.9, until: 15.0, volume: 0.5},
];
