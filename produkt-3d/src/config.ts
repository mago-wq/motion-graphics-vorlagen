/**
 * ============================================================
 *  ANPASSBARE DATEN
 * ============================================================
 *  Das ganze Video liest Texte und Farben nur aus dieser Datei,
 *  auch das Etikett auf der 3D-Dose wird daraus gezeichnet.
 *  Die Marke ist erfunden. Für einen echten Kunden: Werte ändern,
 *  dann `npm run render -- --entwurf`.
 *
 *  Überschriften und Etikett sind in Bebas Neue gesetzt (nur Großbuchstaben).
 *  Keine Gesundheits- oder Nährwertaussagen eintragen (siehe CLAUDE.md im Hauptordner).
 */

export type ProduktConfig = {
	/** Markenname, groß auf Etikett und im Schlussbild */
	marke: string;
	/** Sorte, steht über und unter dem Markennamen */
	sorte: string;
	/** Füllmenge, unten auf dem Etikett. Muss zur Dose passen. */
	inhalt: string;
	/** Hook am Anfang, ein Eintrag pro Zeile */
	hook: [string, string];
	/** Genau drei Merkmale, erscheinen nacheinander als Leisten. Auch Rückseite des Etiketts. */
	merkmale: [string, string, string];
	slogan: string;
	aufruf: string;
	webseite: string;
	farben: {
		/** Hintergrund des Videos */
		hintergrund: string;
		/** Grundfarbe des Etiketts */
		etikett: string;
		/** Akzent: Sorte, Nordlicht-Wellen, Button */
		akzent: string;
		/** zweite Wellenfarbe auf dem Etikett */
		akzent2: string;
		text: string;
		/** Deckel und Boden der Dose */
		metall: string;
	};
};

export const config: ProduktConfig = {
	marke: 'Nordlicht',
	sorte: 'Cold Brew',
	inhalt: '330 ml',
	hook: ['Kaffee.', 'Aber kalt.'],
	merkmale: ['Kalt gebrüht', '18 Stunden gezogen', 'Aus Arabica-Bohnen'],
	slogan: 'Langsam gemacht. Schnell getrunken.',
	aufruf: 'Jetzt probieren',
	webseite: 'nordlicht-coldbrew.de',
	farben: {
		hintergrund: '#070B10',
		etikett: '#0F2A3F',
		akzent: '#E8B04B',
		akzent2: '#4FD1A5',
		text: '#F4F1EA',
		metall: '#C9CED6',
	},
};
