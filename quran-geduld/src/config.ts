// Alle Inhalte des Videos: Koranverse, deutsche Übersetzung, Zeiten, Farben.
// Zeiten in Sekunden, abgelesen am Referenz-TikTok (Ein-/Ausblenden der Textblöcke)
// und an Whisper-Wortzeiten der Rezitation (siehe CLAUDE.md).

export type Part = {
	/** Arabische Wörter in Lesereihenfolge (Uthmani, Tanzil/alquran.cloud, nicht abgetippt). */
	ar: string[];
	/** Deutsche Übersetzung dieses Teils. */
	de: string;
	/** Arabisch erscheint ab hier (s). */
	at: number;
	/** Deutsch erscheint Wort für Wort zwischen diesen Zeiten (s). */
	deSpan: [number, number];
};

export type TextBlock = {
	/** Block flackert an / aus (s). */
	on: number;
	off: number;
	parts: Part[];
	/** Versende-Zeichen mit Nummer (arabisch-indische Ziffern), falls der Block einen Vers abschließt. */
	ayah?: string;
};

export type SceneId =
	| 'gedenken'
	| 'danken'
	| 'undank'
	| 'geduld'
	| 'gebet'
	| 'mitAllah'
	| 'grab'
	| 'grabLicht'
	| 'lebendig'
	| 'blind';

export const CONFIG = {
	audio: {file: 'ton/rezitation.wav', volume: 1},
	colors: {
		ink: '#ffffff',
		/** Warmes Licht nur dort, wo Allahs Nähe bzw. das Leben gemeint ist. */
		warm: '#ffd796',
		red: '#ff3b3b',
	},
	texts: [
		{
			on: 0.0,
			off: 6.45,
			parts: [
				{ar: ['فَٱذْكُرُونِىٓ', 'أَذْكُرْكُمْ'], de: 'Gedenkt Meiner, so gedenke Ich euer.', at: 0.0, deSpan: [0.1, 2.0]},
				{ar: ['وَٱشْكُرُوا۟', 'لِى'], de: 'Und dankt Mir …', at: 2.6, deSpan: [2.7, 3.6]},
			],
		},
		{
			on: 7.0,
			off: 11.05,
			ayah: '١٥٢',
			parts: [
				{ar: ['وَٱشْكُرُوا۟', 'لِى', 'وَلَا', 'تَكْفُرُونِ'], de: 'Und dankt Mir und seid Mir nicht undankbar.', at: 7.0, deSpan: [7.1, 9.6]},
			],
		},
		{
			on: 11.3,
			off: 27.05,
			parts: [
				{
					ar: ['يَٰٓأَيُّهَا', 'ٱلَّذِينَ', 'ءَامَنُوا۟', 'ٱسْتَعِينُوا۟', 'بِٱلصَّبْرِ', 'وَٱلصَّلَوٰةِ', 'ۚ'],
					de: 'O ihr, die ihr glaubt, sucht Hilfe in der Geduld und im Gebet.',
					at: 11.3,
					deSpan: [11.4, 16.4],
				},
			],
		},
		{
			on: 27.4,
			off: 31.1,
			ayah: '١٥٣',
			parts: [{ar: ['إِنَّ', 'ٱللَّهَ', 'مَعَ', 'ٱلصَّٰبِرِينَ'], de: 'Gewiss, Allah ist mit den Geduldigen.', at: 27.4, deSpan: [27.5, 29.6]}],
		},
		{
			on: 31.4,
			off: 46.85,
			parts: [
				{
					ar: ['وَلَا', 'تَقُولُوا۟', 'لِمَن', 'يُقْتَلُ', 'فِى', 'سَبِيلِ', 'ٱللَّهِ', 'أَمْوَٰتٌۢ', 'ۚ'],
					de: 'Und sagt nicht von denen, die auf Allahs Weg getötet werden, sie seien tot.',
					at: 31.4,
					deSpan: [31.6, 36.8],
				},
			],
		},
		{
			on: 47.3,
			off: 57.7,
			ayah: '١٥٤',
			parts: [
				{ar: ['بَلْ', 'أَحْيَآءٌۭ'], de: 'Nein, sie sind lebendig,', at: 47.3, deSpan: [47.4, 48.6]},
				{ar: ['وَلَٰكِن', 'لَّا', 'تَشْعُرُونَ'], de: 'doch ihr nehmt es nicht wahr.', at: 51.2, deSpan: [51.3, 53.2]},
			],
		},
	] satisfies TextBlock[],
	/** Bildszenen: flackern an/aus wie im Vorbild. `mark` = szeneneigener Zeitpunkt (s), z. B. rotes Kreuz. */
	scenes: [
		{id: 'gedenken', on: 0.0, off: 2.35},
		{id: 'danken', on: 2.6, off: 6.45},
		{id: 'undank', on: 7.0, off: 11.05, mark: 8.6},
		{id: 'geduld', on: 11.3, off: 18.45},
		{id: 'gebet', on: 18.6, off: 27.05},
		{id: 'mitAllah', on: 27.4, off: 31.1},
		{id: 'grab', on: 31.4, off: 40.1, mark: 36.5},
		{id: 'grabLicht', on: 40.4, off: 46.85},
		{id: 'lebendig', on: 47.3, off: 50.85},
		{id: 'blind', on: 51.2, off: 57.7},
	] satisfies {id: SceneId; on: number; off: number; mark?: number}[],
} as const;
