// Alle Inhalte und Zeitpunkte des Videos. Szenen und Text lesen nur von hier.
//
// Ton: Nasheed-Ausschnitt „يا راحلًا والله لن أنساك“ aus einer Bildschirmaufnahme
// (TikTok) des Nutzers. Die Aufnahme beginnt mit dem Ende einer Wiederholung; der
// eigentliche Ton startet dort bei 2,228 s (nach 0,36 s Stille) und endet bei 17,93 s.
// Zugeschnitten liegt er als public/ton/rahil.wav (nicht eingecheckt).
//
// Wortzeiten: Whisper large-v3 (Wortzeitstempel) plus Einsatzerkennung (librosa),
// Zeiten in Sekunden ab Tonbeginn.

export const FPS = 30;
export const DURATION_S = 15.7;

export type Line = {
	/** Arabische Wörter in Lesereihenfolge (rechts nach links). */
	ar: string[];
	/** Deutsche Übersetzung. */
	de: string;
	/** Einblendzeit je Wort (s), gleiche Länge wie `ar`. */
	words: number[];
	/** Beginn des Ausblendens (s). */
	out: number;
	/** Ausblenden als aufsteigender Rauch statt einfachem Abblenden. */
	smoke?: boolean;
};

// Zeile 2: Whisper hört ohne Vorgabe „في حرفي سكناك“ (0,61), mit Vorgabe „في قلبي“
// (0,54, beste Gesamtwahrscheinlichkeit). „قلبي“ ergibt den Sinn des Verses
// („dessen Wohnort in meinem Herzen ist“) – vor dem Veröffentlichen anhören lassen.
export const LINES: Line[] = [
	{
		ar: ['يا', 'راحلًا', 'والله', 'لن', 'أنساك'],
		de: 'Du, der gegangen ist – bei Gott, ich vergesse dich nie.',
		words: [0.05, 0.36, 1.6, 2.7, 3.7],
		out: 5.6,
	},
	{
		ar: ['أنت', 'الذي', 'في', 'قلبي', 'سُكناك'],
		de: 'Du bist es, dessen Zuhause mein Herz ist.',
		words: [6.4, 7.7, 8.1, 8.95, 10.05],
		out: 11.95,
	},
	{
		ar: ['يا', 'راحلًا…'],
		de: 'Du, der gegangen ist …',
		words: [12.3, 14.02],
		out: 14.75,
		smoke: true,
	},
];

/** Effekte, an die Lautstärke des Gesangs gekoppelt (src/envelope.ts). Werte in px bei 1080 Breite. */
export const FX = {
	/** Feines Dauerzittern der Schrift. */
	tremorBase: 0.8,
	/** Zusätzliches Zittern bei voller Stimme. */
	tremor: 5,
	/** Ruck der Schrift bei jedem Worteinsatz. */
	punchShake: 7,
	/** Kurzes Anwachsen der Zeile bei jedem Worteinsatz (Anteil). */
	punchScale: 0.025,
	/** Rot/Cyan-Farbversatz der Schrift auf Höhepunkten (px). */
	split: 6,
	/** Ruhiges Schweben der Kamera. */
	camDrift: 4,
	/** Kamerawackeln bei lauten Stellen. */
	camShake: 16,
};

export type Scene = {
	/** Datei in public/clips (Mixkit, freie Lizenz). */
	clip: string;
	/** Szenenbeginn (s). Ende = Beginn der nächsten Szene. */
	from: number;
	/** Startpunkt im Clip (s). */
	clipStart: number;
	rate: number;
	/** Bildausschnitt bei 9:16 (object-position x in %). */
	focusX: number;
	zoom: number;
	/** Zoom am Szenenende relativ zu `zoom` (langsame Kamerafahrt). */
	push: number;
	/** Farbe pro Szene: kalt (Abwesenheit) → warm (Erinnerung) → silbern (Abschied). */
	filter: string;
	glow: number;
};

export const SCENES: Scene[] = [
	// „Du, der gegangen ist …“ – Regen an der Scheibe, ein Licht dahinter, nachtblau
	{
		clip: '2846.mp4', from: 0, clipStart: 3, rate: 1, focusX: 36, zoom: 1.05, push: 1.1,
		filter: 'brightness(0.62) contrast(1.25) saturate(0.85) hue-rotate(-8deg)', glow: 0.45,
	},
	// Nachhall: Rauch steigt auf
	{
		clip: '50956.mp4', from: 4.9, clipStart: 6.5, rate: 1, focusX: 66, zoom: 1.0, push: 1.08,
		filter: 'brightness(1.1) contrast(1.3) saturate(0.6)', glow: 0.35,
	},
	// „… dessen Zuhause mein Herz ist“ – eine Flamme im Dunkeln, warm
	{
		clip: '48919.mp4', from: 6.35, clipStart: 0.5, rate: 1, focusX: 69, zoom: 1.0, push: 1.1,
		filter: 'brightness(0.9) contrast(1.2) saturate(1.1)', glow: 0.4,
	},
	// „Du, der gegangen ist …“ – der Mond verschwindet in den Wolken
	{
		clip: '45585.mp4', from: 12.2, clipStart: 14.2, rate: 1.1, focusX: 62, zoom: 1.0, push: 1.12,
		filter: 'brightness(1.0) contrast(1.2) saturate(0.4)', glow: 0.55,
	},
];

/** Farbstich je Szene (soft-light-Verlauf), gleiche Reihenfolge wie SCENES. */
export const TINTS = [
	'linear-gradient(180deg, #0d2a6b 0%, #1a1440 100%)',
	'linear-gradient(180deg, #1b2a55 0%, #3a2a20 100%)',
	'linear-gradient(180deg, #3a1800 0%, #8a3a00 100%)',
	'linear-gradient(180deg, #1a2238 0%, #0c0f1c 100%)',
];

export const STYLE = {
	arabicSize: 150,
	/** Verfügbare Breite der arabischen Zeile (px); längere Zeilen schrumpfen. */
	textWidth: 900,
	subSize: 46,
	subWidth: 900,
	/** Textmitte (y in px bei 1920 Höhe), unter der Bildmitte, über der TikTok-Leiste. */
	textY: 1080,
	textColor: '#fff7ec',
	/** Warmes Kerzenlicht-Leuchten um die Schrift. */
	glow: 'rgba(255,190,120,',
};

// ---------- Ton ----------

/** Nasheed-Ton, zugeschnitten aus der Aufnahme des Nutzers, nur lokal (gitignored). */
export const MUSIC = {file: 'ton/rahil.wav', volume: 1};

export type Sfx = {
	file: string;
	at: number;
	until: number;
	volume: number;
	fadeIn?: number;
	fadeOut?: number;
};

// Nasheed liegt bei -10,9 LUFS, die Geräusche bei -31: bewusst nur Atmosphäre darunter.
export const SFX: Sfx[] = [
	// Regen an der Scheibe
	{file: 'regen.wav', at: 0, until: 6.0, volume: 0.9, fadeIn: 0.15, fadeOut: 1.2},
	// Luftzug in den Rauch
	{file: 'swoosh-windig.wav', at: 4.1, until: 6.6, volume: 0.45},
	// Nachtwind beim Mond
	{file: 'wind.wav', at: 11.9, until: 15.7, volume: 0.7, fadeIn: 0.8, fadeOut: 1.2},
];
