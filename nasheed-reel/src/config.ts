// Alle Inhalte und Zeitpunkte des Videos. Szenen und Text lesen nur von hier.
//
// Zeitpunkte in Sekunden, abgelesen aus dem Referenz-TikTok (@7.x2_1, Video
// 7690661372060781832) in 0,25-s-Schritten. Der Ton dort ist der Anfang von
// „Ya Hasafa“; wer denselben Ton in TikTok wählt, bekommt dieselbe Synchronität.

export const FPS = 30;
export const DURATION_S = 31.07;

export type Line = {
	/** Arabische Wörter in Lesereihenfolge (rechts nach links). */
	ar: string[];
	/** Englische Übersetzung, wird von links eingeschrieben. */
	en: string;
	/** Einblendzeit je Wort (s), gleiche Länge wie `ar`. */
	words: number[];
	/** Beginn des Ausblendens (s). */
	out: number;
};

// Text des Nasheeds „يا حسافة وين قولك“. „ـ“ (Tatweel) dehnt das Wort wie im Original.
// Zeile 2 und 3 gehören zusammen: „Wo ist dein Wort: ‚Ich erhebe dich über die Sterne‘?“
// Die Referenz übersetzt „قولك“ falsch als „your rise“; richtig ist „dein Wort/Versprechen“.
const L = {
	hasafa: {ar: ['يـــا', 'حسافة!'], en: 'Oh, what a pity!'},
	qolak: {ar: ['وين', 'قولـــك؟'], en: 'Where is your promise?'},
	nujoom: {ar: ['أرفعـــك', 'فوق', 'النجوم'], en: '“I’ll raise you above the stars.”'},
	ahlami: {ar: ['راحـــت', 'أحلامي', 'بليلة'], en: 'My dreams vanished in a single night.'},
	humoom: {ar: ['وأثقلـــت', 'قلبي', 'هموم'], en: 'And worries weighed down my heart.'},
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
	/** Glanzstärke (Bloom), 0–1. */
	glow: number;
};

export const SCENES: Scene[] = [
	// Orchideenknospen gehen auf – „Ya Hasafa / Wo ist dein Versprechen?“
	{clip: '17817.mp4', from: 0, clipStart: 0, rate: 3, focusX: 50, zoom: 1.0, glow: 0.55},
	// „Ich erhebe dich über die Sterne“ – Milchstraße mit Sternschnuppe
	{clip: '46101.mp4', from: 4.25, clipStart: 1.5, rate: 1, focusX: 55, zoom: 1.0, glow: 0.7},
	// „Meine Träume gingen in einer Nacht“ – Mondsichel in Wolken, über den Text geschoben
	{clip: '48016.mp4', from: 8.05, clipStart: 6, rate: 1, focusX: 44, zoom: 1.45, shiftY: -390, glow: 0.6},
	// „Sorgen beschwerten mein Herz“ – dunkle Magenta-Orchidee
	{clip: '38387.mp4', from: 11.65, clipStart: 0, rate: 2.5, focusX: 50, zoom: 1.0, glow: 0.5},
	// Wiederholung: Moschee bei Nacht
	{clip: '4312.mp4', from: 15.7, clipStart: 1, rate: 1, focusX: 69, zoom: 1.0, glow: 0.65},
	// Flug durch die Wolken zum Vollmond
	{clip: '30316.mp4', from: 19.1, clipStart: 4, rate: 1, focusX: 50, zoom: 1.0, glow: 0.6},
	// Blitze am Nachthimmel
	{clip: '25081.mp4', from: 22.85, clipStart: 1, rate: 1, focusX: 50, zoom: 1.0, glow: 0.7},
	// Ende: helle Orchidee öffnet sich im Dunkeln
	{clip: '17835.mp4', from: 26.6, clipStart: 0, rate: 2.5, focusX: 60, zoom: 1.0, glow: 0.55},
];

export const STYLE = {
	/** Höchstgröße; lange Zeilen werden per fitText auf `textWidth` verkleinert. */
	arabicSize: 132,
	/** Verfügbare Breite für die arabische Zeile (px), mit Luft für Leuchten und Farbsaum. */
	textWidth: 860,
	englishSize: 52,
	/** Textmitte (y in px bei 1920 Höhe). */
	textY: 860,
	textColor: '#f6f4ff',
};

/** Retro-/VHS-Look, abgestimmt am Referenzvideo. */
export const RETRO = {
	/** Farbversatz der Schrift (px): rot nach links, blau nach rechts unten. */
	textSplit: 5,
	/** Grundunschärfe der Schrift (px), das „verschwommene“ Leuchten. */
	textSoftness: 0.9,
	/** Deckkraft des weichgezeichneten Leuchtschleiers hinter der Schrift. */
	halo: 0.85,
	/** Querzittern der Schrift (px). */
	jitter: 2.5,
	/** Farbversatz im Bild (px). */
	imageSplit: 5,
	/** Farbstufen pro Kanal im Bild (weniger = stärkere Bänder). */
	levels: 14,
	/** Stärke der Zeilen (Scanlines), 0–1. */
	scanlines: 0.22,
};
