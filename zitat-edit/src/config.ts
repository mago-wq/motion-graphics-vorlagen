/**
 * ============================================================
 *  ANPASSBARE DATEN
 * ============================================================
 *  Gesprochener Text, Einblendungen, Stimme, Bild und Farben stehen
 *  nur in dieser Datei.
 *
 *  Gesprochenen Text oder Pausen geändert -> npm run stimme
 *  (neu sprechen lassen, bearbeiten, Wort-Zeiten neu messen).
 *  Nur Tafeln, Akzente oder Farben geändert -> npm run stills / npm run render.
 *
 *  Die Python-Skripte lesen diese Datei über Node ein. Deshalb hier
 *  keine imports, nur Typen und Daten.
 */

/** Hervorhebung einzelner Wörter. In den Tafeln als {WORT|akzent} schreiben. */
export type Akzent = 'neon-rot' | 'neon-gruen' | 'neon-gelb' | 'neon-blau' | 'glitch' | 'umriss';

export type Abschnitt = {
	/** Gesprochener Text. Satzzeichen steuern die Betonung. */
	text: string;
	/** Stille nach dem Abschnitt in Sekunden. Wird beim Bearbeiten exakt gesetzt. */
	pauseDanach: number;
	/** Leiser und weicher gesprochen, wie der Schluss im Original */
	leiser?: boolean;
	/** Eigenes Tempo für diesen Abschnitt, zusätzlich zu stimme.tempo (0.8 = 20 % langsamer) */
	tempo?: number;
};

export type ZitatConfig = {
	/** Was gesprochen wird, in Abschnitten. Zusammen ergeben sie den ganzen Text. */
	abschnitte: Abschnitt[];
	/**
	 * Was eingeblendet wird. Jede Tafel steht allein im Bild, ein Wort pro Zeile.
	 * Jedes Wort erscheint genau dann, wenn es gesprochen wird.
	 * Die Wörter aller Tafeln ergeben zusammen genau den gesprochenen Text
	 * (ohne Satzzeichen, Groß-/Kleinschreibung egal). npm run stimme prüft das.
	 */
	tafeln: string[];
	/**
	 * Bei diesem Wort legt sich der Sturm: Regen und Wind werden leiser,
	 * Vögel setzen ein, das Licht wird wärmer. Muss in den Tafeln vorkommen.
	 */
	wendeWort: string;
	/**
	 * Schräglage der Schrift in Grad wie im Original (0 = gerade). Die Tafeln stehen
	 * dann wie schräg in den Raum gedreht, rechts näher. Jede Tafel weicht leicht
	 * ab und schwenkt beim Erscheinen ein.
	 */
	textWinkel: number;
	/** Kleine Quellenangabe am Ende */
	quelle: string;
	stimme: {
		/** Halbtöne tiefer als die erzeugte Stimme (0 = unverändert) */
		tiefer: number;
		/** Sprechtempo: 1 = unverändert, 0.9 = 10 % langsamer */
		tempo: number;
		/** Hall-Anteil von 0 (trocken) bis 1 (sehr verhallt) */
		hall: number;
		/** Um wie viel dB "leiser"-Abschnitte zurückgenommen werden */
		leiserUm: number;
		/** Für npm run stimme:elevenlabs (Schlüssel als ELEVENLABS_API_KEY in der Umgebung) */
		elevenlabs: {stimmeId: string; modell: string};
	};
	bild: {
		/** Hintergrundbild in public/ (Hochformat 1080x1920 oder größer) */
		hintergrund: string;
		/** Optional: Hintergrundvideo in public/. Leer = Foto mit langsamer Kamerafahrt. */
		hintergrundVideo: string;
	};
	farben: {
		text: string;
		neonRot: string;
		neonGruen: string;
		neonGelb: string;
		neonBlau: string;
	};
};

export const config: ZitatConfig = {
	abschnitte: [
		{text: 'O Sohn Adams,', pauseDanach: 0.7},
		{text: 'wenn deine Sünden bis zu den Wolken des Himmels reichen würden', pauseDanach: 0.2},
		{text: 'und du Mich dann um Vergebung bittest,', pauseDanach: 0.55},
		{text: 'würde Ich dir vergeben.', pauseDanach: 1.0, tempo: 0.78},
		{text: 'Und es kümmert Mich nicht.', pauseDanach: 0, leiser: true, tempo: 0.9},
	],

	tafeln: [
		'O SOHN ADAMS',
		'WENN DEINE {SÜNDEN|neon-rot}',
		'BIS ZU DEN {WOLKEN|umriss}',
		'DES {HIMMELS|neon-blau}',
		'REICHEN WÜRDEN',
		'UND DU MICH DANN',
		'UM {VERGEBUNG|neon-gelb} BITTEST',
		'WÜRDE ICH DIR {VERGEBEN|neon-gruen}',
		'UND ES {KÜMMERT|glitch}',
		'MICH {NICHT|umriss}',
	],

	wendeWort: 'VERGEBEN',

	textWinkel: 9,

	quelle: 'Hadith Qudsi · at-Tirmidhi 3540',

	stimme: {
		tiefer: 1,
		tempo: 0.95,
		hall: 0.35,
		leiserUm: 3,
		elevenlabs: {stimmeId: 'nPczCjzI2devNBz1zQrb', modell: 'eleven_multilingual_v2'},
	},

	bild: {
		hintergrund: 'bilder/hintergrund.jpg',
		hintergrundVideo: '',
	},

	farben: {
		text: '#F4F1EA',
		neonRot: '#FF2D55',
		neonGruen: '#3DFF7A',
		neonGelb: '#FFE14D',
		neonBlau: '#59D8FF',
	},
};
