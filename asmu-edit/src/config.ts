// Alle Inhalte des Edits: Bilder, Texte, Liedzeilen, Treffer, Geräusche, Farben.
// Zeiten in Sekunden Videozeit; Liedzeiten werden mit vt(Originalzeit) umgerechnet.
// Schnitte liegen auf den Pulsschlägen des Gesangs (BEATS in timing.ts).
import {vt} from './timing';

// ---------- Farben und Look ----------

export const COLORS = {
	gold: '#E2B85C',
	goldHell: '#F6DC97',
	knochen: '#F4EFE4',
	glut: '#E8763A',
	nacht: '#07070A',
};

/** Grundlook aller Filmaufnahmen: dunkle Tiefen, weniger Farbe, warme Lichter. */
export const GRADE = 'contrast(1.18) saturate(0.78) brightness(0.92) sepia(0.12)';

/** Sicherheitszone für Text (TikTok-Bedienelemente): x 80–1000, y 250–1500. */
export const SAFE = {left: 80, right: 1000, top: 250, bottom: 1500};

// ---------- Bilder ----------

/** Zeitumrechnung im Clip: Stützpunkte [Sekunde im Shot, Sekunde im Clip], dazwischen weich. */
export type Ramp = [number, number][];

export type Shot = {
	from: number;
	to: number;
	/** clips/<id>.mp4, bilder/<name>.jpg, 'karte' (Ibn-Battuta-Route) oder 'strobe' (Rückblick) */
	src: string;
	/** nur Clips: Zeitumrechnung; ohne Angabe ab `start` mit `rate` */
	ramp?: Ramp;
	start?: number;
	rate?: number;
	/** Bildausschnitt (object-position in %) und Kamera: Zoom von→bis, Drehung von→bis, Verschiebung in % */
	focus?: [number, number];
	zoom?: [number, number];
	turn?: [number, number];
	drift?: [number, number];
	grade?: string;
	/** Einstieg: 'zoom' = kommt groß und unscharf herein, 'whip' = Wischunschärfe */
	enter?: 'zoom' | 'whip';
	name: string;
};

const PERSON = 'brightness(0.82) contrast(1.12) saturate(0.8) sepia(0.18)';

/**
 * Einstieg: Büste von Ibn Battuta (gedachte Skizze, Kairo 1961; ein echtes Porträt gibt es
 * nicht), freigestellt und 4× hochgerechnet von scripts/prepare_portrait.py.
 * breite = Bildbreite in px, unten = so viele px ragen unten aus dem Bild.
 */
export const PORTRAET = {
	name: 'ابن بطوطة',
	breite: 1150,
	unten: 130,
	dauer: 3.5,
	/** ab hier wird es hinter ihm hell („أسمو“) */
	licht: vt(1.35),
	/** Hintergrund 4357: Nacht, auf „أسمو“ rast der Zeitraffer in die Dämmerung */
	ramp: [[0, 0.5], [1.35, 1.6], [2.6, 4.5], [3.5, 5.0]] as Ramp,
};

/**
 * Augenbalken, relativ zum Bild (0–1). VORGABE: Bei jedem Gesicht sind die Augen immer
 * abgedeckt. Augen im Original (500×643): x 125–160 und 205–255, y 248–275 – der Balken
 * deckt x 65–330, y 226–294 ab (mit Rand, auch gedreht). mitteX = Gesichtsmitte.
 */
export const AUGEN = {x: 0.13, y: 0.352, w: 0.53, h: 0.105, drehung: -3, mitteX: 0.38};

export const SHOTS: Shot[] = [
	// Haken: Ibn Battuta steigt ins Bild, hinter ihm bricht auf „أسمو“ der Morgen an
	{name: 'Ibn Battuta', src: 'portraet', from: 0, to: 3.5},
	// Ibn Battuta
	{name: 'Sahara', src: 'clips/4149.mp4', from: 3.5, to: 4.96, start: 2, focus: [58, 50], zoom: [1.12, 1.24], enter: 'zoom'},
	{name: 'Wüste, Mond', src: 'clips/40047.mp4', from: 4.96, to: 5.9, start: 3, focus: [52, 50], zoom: [1.25, 1.32],
		grade: 'contrast(1.25) saturate(0.6) brightness(1.15) sepia(0.2)'},
	{name: 'Karte', src: 'karte', from: 5.9, to: 7.8},
	// Mimar Sinan
	{name: 'Süleymaniye', src: 'bilder/suleymaniye.jpg', from: 7.8, to: 9.8, focus: [33, 42], zoom: [1.0, 1.16],
		grade: PERSON, enter: 'whip'},
	{name: 'Selimiye-Kuppel', src: 'bilder/selimiye.jpg', from: 9.8, to: 11.65, focus: [50, 50], zoom: [1.32, 1.5],
		turn: [0, 14], grade: PERSON, enter: 'zoom'},
	// al-Chwarizmi
	{name: 'al-Dschabr', src: 'bilder/aljabr.jpg', from: 11.65, to: 15.42, focus: [73, 40], zoom: [1.08, 1.5],
		drift: [0, -4], grade: 'brightness(0.6) contrast(1.25) saturate(0.85) sepia(0.3)', enter: 'whip'},
	// Rückblick im Stroboskop, Sog in den Schnitt
	{name: 'Rückblick', src: 'strobe', from: 15.42, to: 16.25},
	// „لا تسأل المقدام عن سبل العلا“
	{name: 'Gewitter', src: 'clips/4423.mp4', from: 16.25, to: 18.34, start: 2.25, rate: 1.55, focus: [40, 50], zoom: [1.18, 1.3],
		grade: 'brightness(0.82) contrast(1.45) saturate(0.7) hue-rotate(-12deg)'},
	{name: 'Flammen', src: 'clips/52304.mp4', from: 18.34, to: 19.27, start: 2.2, rate: 1.4, focus: [50, 60], zoom: [1.1, 1.2],
		grade: 'contrast(1.15) saturate(0.95) brightness(0.95)', enter: 'zoom'},
	{name: 'Nebel über Gipfeln', src: 'clips/4396.mp4', from: 19.27, to: 21.37, start: 4, rate: 1.5, focus: [42, 50], zoom: [1.05, 1.16]},
	// „ستراه طيرا بالعزيمة جالا“
	{name: 'Wolkenmeer', src: 'clips/4695.mp4', from: 21.37, to: 23.13, start: 0.4, focus: [55, 50], zoom: [1.08, 1.18], enter: 'whip'},
	{name: 'Adler', src: 'clips/1706.mp4', from: 23.13, to: 25.55, start: 3.0, rate: 0.85, focus: [34, 48], zoom: [1.55, 1.7],
		grade: 'contrast(1.3) saturate(0.55) brightness(0.8) sepia(0.15)'},
	{name: 'Felsgipfel', src: 'clips/51689.mp4', from: 25.55, to: 27.27, start: 3, rate: 1.5, focus: [56, 50], zoom: [1.1, 1.28],
		grade: 'contrast(1.25) saturate(0.6) brightness(0.85) sepia(0.15)'},
	// Refrain „أسمو وأجتاز السماء جلالا“
	{name: 'Matterhorn, Zeitraffer', src: 'clips/4281.mp4', from: 27.27, to: 30.31,
		ramp: [[0, 0.2], [0.9, 0.9], [2.1, 3.7], [3.04, 4.3]], focus: [50, 50], zoom: [1.22, 1.06], enter: 'zoom'},
	{name: 'Plateaus, Sonne', src: 'clips/26070.mp4', from: 30.31, to: 33.13, start: 2, focus: [24, 50], zoom: [1.05, 1.15]},
	// Schluss
	{name: 'Glut', src: 'clips/3459.mp4', from: 33.13, to: 34.94, start: 3, rate: 0.8, focus: [50, 50], zoom: [1.15, 1.25],
		grade: 'contrast(1.2) saturate(0.9) brightness(0.85)'},
	{name: 'Tag bricht an', src: 'clips/4357.mp4', from: 34.94, to: 35.88, ramp: [[0, 4.55], [0.94, 5.2]], focus: [50, 50],
		zoom: [1.1, 1.18], enter: 'zoom', grade: 'brightness(0.5) contrast(1.4) saturate(0.55) sepia(0.4)'},
	{name: 'Schlusstafel', src: 'schwarz', from: 35.88, to: 99},
];

/** Rückblick 15,42–16,25 s: je 3 Frames ein früheres Motiv, im Wechsel mit Blitzen. */
export const STROBE = [
	'bilder/aljabr.jpg', 'portraet', 'bilder/suleymaniye.jpg', 'karte', 'bilder/selimiye.jpg',
	'clips/40047.mp4', 'portraet', 'clips/4149.mp4',
];

/** Funken-Ebene (Clip 3463, hochkant, schwarzer Grund, aufgehellt eingerechnet): [von, bis, Stärke] */
export const SPARKS: [number, number, number][] = [
	[4.96, 5.9, 0.7],
	[18.2, 19.4, 0.9],
	[27.2, 28.6, 0.8],
	[33.1, 34.94, 0.9],
];

/** Gezeichneter Blitzstrahl über dem Bild: [Zeit, Startpunkt x in %, Zufallswert] */
export const STRAHLEN: [number, number, string][] = [
	[16.25, 62, 'a'],
	[16.42, 30, 'b'],
	[vt(227.69), 74, 'd'],
	[27.27, 70, 'c'],
];

// ---------- Text ----------

/** Eine Zeile einer Texttafel: erscheint bei `at` mit einem Ruck. */
export type Zeile = {text: string; at: number; gold?: boolean; size?: number};

export type Tafel = {
	/** 'aussage' = große Versalien, 'name' = Namensbalken, 'titel' = أسمو groß + deutsche Zeile */
	kind: 'aussage' | 'name' | 'titel';
	out: number;
	y: number;
	zeilen: Zeile[];
	/** nur name: Unterzeile */
	unter?: string;
	/** Zähler: Zahl läuft von 0 hoch (in der Zeile steht {n}) */
	zaehler?: {bis: number; von: number; dauer: number};
};

export const TAFELN: Tafel[] = [
	// „travelled more than any other explorer in pre-modern history“ (Wikipedia EN „Ibn Battuta“)
	{kind: 'aussage', out: 1.28, y: 1400, zeilen: [
		{text: 'ER REISTE WEITER', at: 0.12, size: 110},
		{text: 'ALS JEDER VOR IHM.', at: 0.55, gold: true, size: 110},
	]},
	{kind: 'titel', out: 3.4, y: 350, zeilen: [
		{text: 'أسمو', at: vt(1.35), gold: true, size: 200},
		{text: 'ICH STEIGE AUF', at: 1.95},
	]},
	// Ibn Battuta (Wikipedia: brach am 14.6.1325 mit 21 allein von Tanger auf; ~117.000 km in 30 Jahren)
	{kind: 'aussage', out: 4.9, y: 880, zeilen: [
		{text: 'MIT 21', at: 3.56, gold: true, size: 190},
		{text: 'BRACH ER AUF.', at: 3.98, size: 120},
	]},
	{kind: 'aussage', out: 5.86, y: 900, zeilen: [{text: 'ALLEIN.', at: 4.96, size: 210}]},
	{kind: 'name', out: 7.75, y: 420, zeilen: [{text: 'IBN BATTUTA', at: 5.98}], unter: '1325 – 1354 · 30 JAHRE UNTERWEGS'},
	{kind: 'aussage', out: 7.75, y: 1330, zeilen: [{text: '{n} KM', at: 6.1, gold: true, size: 130}],
		zaehler: {von: 0, bis: 117000, dauer: 1.5}},
	// Mimar Sinan (mehr als 300 große Bauwerke; Meisterwerk Selimiye, vollendet mit über 80)
	{kind: 'aussage', out: 9.74, y: 860, zeilen: [
		{text: 'MEHR ALS', at: 7.85, size: 110},
		{text: '{n}', at: 7.85, gold: true, size: 260},
		{text: 'BAUWERKE.', at: 8.77, size: 110},
	], zaehler: {von: 0, bis: 300, dauer: 0.85}},
	{kind: 'name', out: 11.6, y: 1360, zeilen: [{text: 'MIMAR SINAN', at: 8.3}], unter: 'BAUMEISTER · UM 1490 – 1588'},
	{kind: 'aussage', out: 11.6, y: 880, zeilen: [
		{text: 'SEIN MEISTERWERK', at: 9.84, size: 110},
		{text: 'VOLLENDETE ER', at: 10.78, size: 96},
		{text: 'MIT ÜBER 80.', at: 10.78, gold: true, size: 150},
	]},
	// al-Chwarizmi (latinisiert „Algoritmi“ -> Algorithmus; Haus der Weisheit, Bagdad, um 820)
	{kind: 'aussage', out: 15.36, y: 860, zeilen: [
		{text: 'DER ALGORITHMUS,', at: 11.7, size: 104},
		{text: 'DER DIR DAS HIER ZEIGT,', at: 12.53, size: 84},
		{text: 'TRÄGT SEINEN NAMEN.', at: 13.49, gold: true, size: 104},
	]},
	{kind: 'name', out: 15.36, y: 1360, zeilen: [{text: 'AL-CHWARIZMI', at: 14.5}], unter: 'BAGDAD · UM 820'},
	// Schluss
	{kind: 'aussage', out: 34.88, y: 900, zeilen: [{text: 'ERST DICH SELBST.', at: 33.13, size: 128}]},
	{kind: 'aussage', out: 35.84, y: 900, zeilen: [{text: 'DANN DIE WELT.', at: 34.94, gold: true, size: 150}]},
];

/** Gesungene Zeile: arabische Wörter in Lesereihenfolge mit Einsatzzeit, deutsche Übersetzung darunter. */
export type Liedzeile = {ar: string[]; t: number[]; de: string; out: number};

export const LIED: Liedzeile[] = [
	{
		ar: ['لا', 'تسأل', 'المقدام', 'عن', 'سبل', 'العلا'],
		t: [226.8, 227.2, 227.69, 229.54, 229.84, 230.96].map(vt),
		de: 'Frag den Furchtlosen nicht nach dem Weg nach oben –',
		out: vt(231.45),
	},
	{
		ar: ['ستراه', 'طيرا', 'بالعزيمة', 'جالا'],
		t: [231.65, 233.43, 234.18, 236.27].map(vt),
		de: 'du siehst ihn: ein Vogel, der voller Entschlossenheit kreist.',
		out: vt(237.3),
	},
	{
		ar: ['أسمو', 'وأجتاز', 'السماء', 'جلالا'],
		t: [237.57, 238.78, 240.35, 241.53].map(vt),
		de: 'Ich steige auf und durchquere den Himmel – voller Erhabenheit.',
		out: vt(243.25),
	},
];

/** Schlusstafel: Koran 13:11 (Ausschnitt), eigene Übersetzung nah an Bubenheim/Elyas. */
export const VERS = {
	at: 35.95,
	ar: 'إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ',
	de: 'Gewiss, Allah ändert nicht den Zustand eines Volkes, bis sie ändern, was in ihnen selbst ist.',
	quelle: 'KORAN 13:11',
};

// ---------- Treffer (Blitz, Ruck, Kamerastoß) ----------

export type Treffer = {at: number; flash?: number; farbe?: string; shake?: number; punch?: number};

export const TREFFER: Treffer[] = [
	{at: vt(1.35), flash: 0.35, farbe: COLORS.goldHell, punch: 0.6, shake: 6},
	{at: 2.15, flash: 0.25, farbe: COLORS.goldHell},
	{at: 3.5, punch: 0.4},
	{at: 3.98, punch: 0.35, shake: 5},
	{at: 4.96, flash: 0.55, shake: 18, punch: 1},
	{at: 5.9, flash: 0.3, farbe: COLORS.goldHell, punch: 0.4},
	{at: 7.8, flash: 0.35, shake: 10, punch: 0.7},
	{at: 8.77, punch: 0.5, shake: 6},
	{at: 9.8, flash: 0.25, farbe: COLORS.goldHell, punch: 0.4},
	{at: 10.78, punch: 0.7, shake: 10},
	{at: 11.65, flash: 0.3, punch: 0.5},
	{at: 12.53, punch: 0.4, shake: 5},
	{at: 13.49, punch: 0.7, shake: 10},
	{at: 14.5, punch: 0.4},
	// der Schnitt im Nasheed: Donnerschlag
	{at: 16.25, flash: 0.75, shake: 34, punch: 1.2},
	{at: vt(227.69), punch: 0.5, shake: 8},
	{at: 18.34, flash: 0.6, farbe: COLORS.glut, shake: 22, punch: 1},
	{at: 19.27, punch: 0.4},
	{at: 21.37, flash: 0.2, punch: 0.3},
	{at: 23.13, flash: 0.35, farbe: COLORS.goldHell, punch: 0.6, shake: 8},
	{at: 25.55, punch: 0.5, shake: 8},
	{at: 27.27, flash: 0.9, farbe: COLORS.goldHell, shake: 26, punch: 1.1},
	{at: 30.31, punch: 0.4},
	{at: 33.13, flash: 0.5, farbe: COLORS.glut, shake: 20, punch: 1},
	{at: 34.94, flash: 0.6, farbe: COLORS.goldHell, shake: 16, punch: 0.9},
	{at: 35.88, flash: 0.25, punch: 0.3},
];

// ---------- Geräusche (nur Natur und Luft, keine Instrumente) ----------

/**
 * at = Zeitpunkt des Höhepunkts im Video; peak = wo der Höhepunkt in der Datei liegt
 * (gemessen), die Datei startet also bei at - peak. len = höchstens so lange spielen.
 */
export type Sfx = {file: string; at: number; peak?: number; vol: number; len?: number; fadeIn?: number; fadeOut?: number};

export const SFX: Sfx[] = [
	{file: 'wind_berg', at: 0, vol: 0.5, len: 3.6, fadeIn: 0.3, fadeOut: 0.5},
	{file: 'swoosh_wind', at: 0.45, peak: 0.43, vol: 0.45},
	{file: 'donner_tief', at: vt(1.35), peak: 0.53, vol: 0.45, len: 4, fadeOut: 1.5},
	{file: 'whoosh_luft', at: 3.5, peak: 0.71, vol: 0.4},
	{file: 'wueste', at: 3.4, vol: 0.9, len: 4.5, fadeIn: 0.2, fadeOut: 0.6},
	{file: 'donner_hit', at: 4.96, peak: 0.49, vol: 0.55, len: 2.6, fadeOut: 1},
	{file: 'whoosh_sweep', at: 5.9, peak: 0.44, vol: 0.4},
	{file: 'swoosh_wind', at: 7.8, peak: 0.43, vol: 0.5},
	{file: 'steine', at: 7.9, peak: 0.66, vol: 0.5, len: 1.6, fadeOut: 0.6},
	{file: 'swoosh_wind', at: 9.8, peak: 0.43, vol: 0.4},
	{file: 'donner_schnell', at: 10.78, peak: 0.96, vol: 0.35, len: 2, fadeOut: 0.8},
	{file: 'seite', at: 11.65, peak: 0.32, vol: 0.9},
	{file: 'herz', at: 13.49, peak: 0.08, vol: 0.6},
	{file: 'herz', at: 14.5, peak: 0.08, vol: 0.6},
	{file: 'sturm_kommt', at: 16.22, peak: 3.54, vol: 0.55, len: 3.6},
	{file: 'donner_nah', at: 16.27, peak: 1.16, vol: 0.85, len: 5.5, fadeOut: 2},
	{file: 'sturmwind', at: 17.6, peak: 1.6, vol: 0.35, len: 2.5, fadeOut: 0.8},
	{file: 'feuer_whoosh', at: 18.34, peak: 1.06, vol: 0.6, len: 2, fadeOut: 0.5},
	{file: 'whoosh_luft', at: 19.27, peak: 0.71, vol: 0.3},
	{file: 'wind_berg', at: 19.3, vol: 0.35, len: 8, fadeIn: 0.8, fadeOut: 1.5},
	{file: 'whoosh_sweep', at: 21.37, peak: 0.44, vol: 0.35},
	{file: 'adler', at: 23.3, peak: 0.44, vol: 0.5},
	{file: 'whoosh_schnell', at: 25.55, peak: 0.72, vol: 0.5},
	{file: 'herz', at: 26.64, peak: 0.08, vol: 0.55},
	{file: 'sturm_kommt', at: 27.25, peak: 3.54, vol: 0.4, len: 3.6},
	{file: 'donner_hit', at: 27.27, peak: 0.49, vol: 0.7, len: 4, fadeOut: 1.5},
	{file: 'whoosh_luft', at: 30.31, peak: 0.71, vol: 0.3},
	{file: 'donner_schnell', at: 33.13, peak: 0.96, vol: 0.55, len: 1.8, fadeOut: 0.6},
	{file: 'feuer_whoosh', at: 33.2, peak: 1.06, vol: 0.4, len: 1.8},
	{file: 'donner_hit', at: 34.94, peak: 0.49, vol: 0.6, len: 3.5, fadeOut: 1.2},
	{file: 'donner_tief', at: 35.95, peak: 0.53, vol: 0.4, len: 5, fadeOut: 2.5},
	{file: 'wind_berg', at: 35.9, vol: 0.45, len: 5.3, fadeIn: 0.5, fadeOut: 1.5},
];
