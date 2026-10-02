// Alle Inhalte und Zeitpunkte des Videos. Szenen und Text lesen nur von hier.
//
// Zeitpunkte in Sekunden, abgelesen aus dem Referenz-TikTok (@7.x2_1, Video
// 7690661372060781832) in 0,25-s-Schritten. Der Ton dort ist der Anfang von
// „Ya Hasafa“. Das fertige Video enthält diesen Ton (public/ton/nasheed.wav,
// nicht eingecheckt) plus passende Geräusche (SFX unten).

export const FPS = 30;
export const DURATION_S = 31.07;

export type Line = {
	/** Arabische Wörter in Lesereihenfolge (rechts nach links). */
	ar: string[];
	/** Deutsche Übersetzung, wird von links eingeschrieben. */
	de: string;
	/** Einblendzeit je Wort (s), gleiche Länge wie `ar`. */
	words: number[];
	/** Beginn des Ausblendens (s). */
	out: number;
};

// Text des Nasheeds „يا حسافة وين قولك“. „ـ“ (Tatweel) dehnt das Wort wie im Original.
// Zeile 2 und 3 gehören zusammen: „Wo ist dein Wort: ‚Ich erhebe dich über die Sterne‘?“
// Die Referenz übersetzt „قولك“ falsch als „your rise“; richtig ist „dein Wort/Versprechen“.
const L = {
	hasafa: {ar: ['يـــا', 'حسافة!'], de: 'Ach, wie schade!'},
	qolak: {ar: ['وين', 'قولـــك؟'], de: 'Wo ist dein Versprechen?'},
	nujoom: {ar: ['أرفعـــك', 'فوق', 'النجوم'], de: '„Ich erhebe dich über die Sterne.“'},
	ahlami: {ar: ['راحـــت', 'أحلامي', 'بليلة'], de: 'Meine Träume vergingen in einer Nacht.'},
	humoom: {ar: ['وأثقلـــت', 'قلبي', 'هموم'], de: 'Und Sorgen beschwerten mein Herz.'},
};

export const LINES: Line[] = [
	{...L.hasafa, words: [0.75, 0.95], out: 2.2},
	{...L.qolak, words: [2.5, 2.8], out: 4.0},
	{...L.nujoom, words: [4.35, 4.85, 5.1], out: 7.7},
	{...L.ahlami, words: [8.2, 8.6, 8.95], out: 11.3},
	{...L.humoom, words: [11.9, 12.2, 12.5], out: 15.4},
	{...L.hasafa, words: [15.8, 16.0], out: 16.95},
	{...L.qolak, words: [17.25, 17.5], out: 18.95},
	{...L.nujoom, words: [19.35, 19.7, 20.0], out: 22.5},
	{...L.ahlami, words: [23.0, 23.4, 23.75], out: 26.2},
	{...L.humoom, words: [26.9, 27.2, 27.5], out: 30.6},
];

export type Scene = {
	/** Datei in public/clips (Mixkit, freie Lizenz). */
	clip: string;
	/** Szenenbeginn (s). Ende = Beginn der nächsten Szene. */
	from: number;
	/** Startpunkt im Clip (s). */
	clipStart: number;
	/** Zeitraffer-Faktor, Blüten sollen sichtbar aufgehen. */
	rate: number;
	/** Bildausschnitt bei 9:16 (CSS object-position, x in %). */
	focusX: number;
	/** Zusätzlicher Zoom über `cover` hinaus. */
	zoom: number;
	/** Bild nach oben/unten schieben (px, negativ = hoch), braucht Zoom > 1 als Spielraum. */
	shiftY?: number;
	/** Leichter Glanz (Bloom) auf dem Bild, 0–1. Bewusst niedrig: Bilder sollen klar bleiben. */
	glow: number;
};

export const SCENES: Scene[] = [
	// Orchideenknospen gehen auf – „Ya Hasafa / Wo ist dein Versprechen?“
	{clip: '17817.mp4', from: 0, clipStart: 0, rate: 3, focusX: 50, zoom: 1.0, glow: 0.28},
	// „Ich erhebe dich über die Sterne“ – Milchstraße mit Sternschnuppe
	{clip: '46101.mp4', from: 4.25, clipStart: 1.5, rate: 1, focusX: 55, zoom: 1.0, glow: 0.35},
	// „Meine Träume gingen in einer Nacht“ – Mondsichel in Wolken, über den Text geschoben
	{clip: '48016.mp4', from: 8.05, clipStart: 6, rate: 1, focusX: 44, zoom: 1.45, shiftY: -390, glow: 0.30},
	// „Sorgen beschwerten mein Herz“ – dunkle Magenta-Orchidee
	{clip: '38387.mp4', from: 11.65, clipStart: 0, rate: 2.5, focusX: 50, zoom: 1.0, glow: 0.25},
	// Wiederholung: Moschee bei Nacht
	{clip: '4312.mp4', from: 15.7, clipStart: 1, rate: 1, focusX: 69, zoom: 1.0, glow: 0.33},
	// Flug durch die Wolken zum Vollmond
	{clip: '30316.mp4', from: 19.1, clipStart: 4, rate: 1, focusX: 50, zoom: 1.0, glow: 0.30},
	// Blitze am Nachthimmel
	{clip: '25081.mp4', from: 22.85, clipStart: 1, rate: 1, focusX: 50, zoom: 1.0, glow: 0.35},
	// Ende: helle Orchidee öffnet sich im Dunkeln
	{clip: '17835.mp4', from: 26.6, clipStart: 0, rate: 2.5, focusX: 60, zoom: 1.0, glow: 0.28},
];

export const STYLE = {
	/** Höchstgröße; lange Zeilen werden per fitText auf `textWidth` verkleinert. */
	arabicSize: 132,
	/** Verfügbare Breite für die arabische Zeile (px), mit Luft für Leuchten und Farbsaum. */
	textWidth: 860,
	/** Höchstgröße der Übersetzung; lange Zeilen schrumpfen auf `subWidth`. */
	subSize: 54,
	subWidth: 900,
	/** Textmitte (y in px bei 1920 Höhe). */
	textY: 860,
	textColor: '#f6f4ff',
};

/**
 * Retro-/VHS-Look, nur auf der Schrift (abgestimmt am Referenzvideo).
 * Die Bilder bekommen keinen Retro-Filter, nur den leichten Glanz aus `SCENES.glow`.
 */
export const RETRO = {
	/** Farbversatz der Schrift (px): rot nach links, blau nach rechts unten. */
	textSplit: 5,
	/** Grundunschärfe der Schrift (px), das „verschwommene“ Leuchten. */
	textSoftness: 0.9,
	/** Deckkraft des weichgezeichneten Leuchtschleiers hinter der Schrift. */
	halo: 0.85,
	/** Querzittern der Schrift (px). */
	jitter: 2.5,
	/** Zeilenstreifen in der Schrift, 0–1 (0 = aus). */
	textScanlines: 0.35,
};

// ---------- Ton ----------

/** Nasheed-Ton aus dem Referenz-TikTok, liegt nur lokal (gitignored). */
export const MUSIC = {file: 'ton/nasheed.wav', volume: 1};

export type Sfx = {
	/** Datei in public/sfx (Mixkit-Soundeffekte, freie Lizenz, auf -31 LUFS angeglichen). */
	file: string;
	/** Einsatz im Video (s). */
	at: number;
	/** Ende im Video (s). */
	until: number;
	volume: number;
	fadeIn?: number;
	fadeOut?: number;
};

// Nur Naturgeräusche, Herzschlag und Luftzüge, keine Instrumente oder Klangspiele:
// Nasheeds sind oft bewusst ohne Instrumente.
// Donnerschlag: stärkster Blitz im Clip 25081 bei Clipzeit 3,96 s = Video 25,66 s
// (Szene ab 22,7 s inkl. Überblendung, Clipstart 1 s). Knall in der Datei bei 0,75 s.
export const SFX: Sfx[] = [
	// Blüten gehen auf: leiser Wind
	{file: 'wind.wav', at: 0, until: 4.6, volume: 0.35, fadeIn: 0.8, fadeOut: 0.8},
	// Übergang zu den Sternen (Höhepunkt der Datei bei 1,0 s)
	{file: 'swoosh-windig.wav', at: 3.3, until: 6.5, volume: 0.6},
	// Mondsichel in Wolken: Nachtwind
	{file: 'wind.wav', at: 7.9, until: 12.0, volume: 0.5, fadeIn: 0.6, fadeOut: 0.8},
	// „Sorgen beschwerten mein Herz“: Herzschlag
	{file: 'herzschlag.wav', at: 11.75, until: 15.9, volume: 0.7, fadeIn: 0.3, fadeOut: 0.8},
	// Übergang zur Moschee, dort Grillen in der Nacht
	{file: 'swoosh-kurz.wav', at: 15.45, until: 17.0, volume: 0.5},
	{file: 'grillen.wav', at: 15.6, until: 19.3, volume: 0.6, fadeIn: 0.6, fadeOut: 0.6},
	// Flug durch die Wolken zum Mond
	{file: 'swoosh-windig.wav', at: 18.15, until: 21.4, volume: 0.6},
	{file: 'wind.wav', at: 19.1, until: 23.0, volume: 0.6, fadeIn: 0.5, fadeOut: 0.8},
	// Gewitter: Grollen, Regen, Donnerschlag auf den Blitz
	{file: 'donnergrollen.wav', at: 22.7, until: 27.5, volume: 0.6, fadeIn: 0.5, fadeOut: 1.2},
	{file: 'regen.wav', at: 22.6, until: 31.07, volume: 0.7, fadeIn: 1.0, fadeOut: 1.5},
	{file: 'donnerschlag.wav', at: 24.9, until: 31.07, volume: 1.0, fadeOut: 1.0},
	// Ende: „Sorgen beschwerten mein Herz“ noch einmal mit Herzschlag
	{file: 'herzschlag.wav', at: 26.7, until: 31.07, volume: 0.55, fadeIn: 0.3, fadeOut: 1.0},
];
