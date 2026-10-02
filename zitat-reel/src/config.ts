// Einzige Stelle mit Inhalten. Für ein neues Video nur diese Datei ändern
// (Zeitpunkte der Zeilen stehen in timing.ts).
//
// Regel: nur Texte mit echter, überprüfbarer Quelle. Vers + Stellenangabe, oder
// Zitat + Buch/Band/Seite. Keine erfundenen oder "sinngemäßen" Zuschreibungen.

export type Line = {
	/** Originaltext (Arabisch), mit Vokalzeichen. */
	original: string;
	/** Übersetzung darunter. */
	translation: string;
	/**
	 * Optional: ein Wort, das warm aufleuchtet – einmal im Original, einmal in der
	 * Übersetzung. Muss als ganzes Wort genau so im Text vorkommen.
	 */
	highlight?: {original: string; translation: string};
};

export const CONFIG = {
	lines: [
		{
			original: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
			translation: 'For indeed, with hardship will be ease.',
		},
		{
			original: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
			translation: 'Indeed, with hardship will be ease.',
			highlight: {original: 'يُسْرًا', translation: 'ease.'},
		},
	] satisfies Line[],

	/** Quelle, erscheint zum Schluss klein. */
	source: 'Qur’an · ash-Sharḥ 94:5–6',

	/** Kürzel unten links im Bild (Schutz gegen Reposts, wie in allen Referenzen). */
	handle: '@deinkanal',

	/** Regenbett mitrendern. Für TikTok mit eigenem Sound: an lassen, App-Sound drüberlegen. */
	ambience: true,
	ambienceVolume: 1,
} as const;
