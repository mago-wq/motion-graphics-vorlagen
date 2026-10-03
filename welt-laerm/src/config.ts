// Alle Inhalte des Videos. Texte, Zeiten des Sprechers, Farben – sonst nichts.
// Zeiten in Sekunden, gemessen am Originalton (Sprecher-Einsatz und -Ende je Satz).

export type Line = {
	/** Untertitel, wie er erscheint (wird in Großbuchstaben gesetzt). */
	text: string;
	/** Wörter, die nach dem Erscheinen nachglühen (ohne Satzzeichen, Groß/klein egal). */
	emphasis: string[];
	/** Sprecher beginnt / endet (s). Die Wörter erscheinen dazwischen, Wort für Wort. */
	voice: [number, number];
	/** Szene geht an / aus (s): Licht flackert auf, Figur spielt, Licht erlischt. */
	scene: [number, number];
};

export const CONFIG = {
	audio: {file: 'originalton.m4a', volume: 1},
	colors: {
		background: '#040404',
		ink: '#ffffff',
		/** Warmes Licht nur in der letzten Szene (Paradies). */
		warm: '#ffe2b0',
	},
	lines: {
		laerm: {
			text: 'Bist du nicht müde vom Lärm dieser Welt?',
			emphasis: ['Lärm'],
			voice: [1.56, 4.28],
			scene: [1.2, 4.75],
		},
		satt: {
			text: 'Hast du sie nicht satt?',
			emphasis: ['satt'],
			voice: [5.46, 7.22],
			scene: [5.1, 7.45],
		},
		muede: {
			text: 'Siehst du nicht, wie viel Müdigkeit und Unruhe in ihr steckt?',
			emphasis: ['Müdigkeit', 'Unruhe'],
			voice: [7.8, 11.66],
			scene: [7.6, 12.55],
		},
		kruemel: {
			text: 'Rennst du noch immer atemlos ihren Krümeln hinterher?',
			emphasis: ['Krümeln'],
			voice: [13.04, 16.28],
			scene: [12.75, 16.75],
		},
		paradies: {
			text: 'Reicht dir das Paradies etwa nicht?',
			emphasis: ['Paradies'],
			voice: [17.3, 19.26],
			scene: [17.0, 21.0],
		},
	} satisfies Record<string, Line>,
} as const;
