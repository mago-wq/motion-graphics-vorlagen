/**
 * ============================================================
 *  ANPASSBARE DATEN
 * ============================================================
 *  Das Video liest Produkte, Preise, Texte und Farben nur aus
 *  dieser Datei. Nach Änderungen: `npm run stills`, dann
 *  `npm run render`.
 *
 *  Preise und Produkttexte stammen von de.coral.club (Stand siehe
 *  `preisStand`). Vor dem Posten prüfen, ob sie noch stimmen –
 *  falsche Preise in Werbung sind abmahnfähig.
 *
 *  Keine Heil- oder Wirkversprechen eintragen ("hilft gegen …",
 *  "stärkt …"). Für Nahrungsergänzungsmittel sind in der EU nur
 *  zugelassene Health Claims erlaubt (VO (EG) 1924/2006). Sachliche
 *  Angaben wie Herkunft, Menge, Darreichungsform sind unkritisch.
 */

export type Produkt = {
	/** Produktname wie im Shop */
	name: string;
	/** Datei in public/produkte/ (freigestellt, siehe scripts/prepare_products.py) */
	bild: string;
	/** Packungsinhalt, klein unter dem Namen */
	inhalt: string;
	/** Eine sachliche Zeile zum Produkt */
	fakt: string;
	/** Normalpreis ("Dein Preis" ohne Registrierung) in Euro */
	normalpreis: number;
	/** Clubpreis nach Registrierung in Euro */
	clubpreis: number;
	/** Hintergrund der Produktszene: oben, unten (Verlauf) */
	grund: [string, string];
	/** Schriftfarbe auf diesem Hintergrund */
	schrift: string;
	/** Geräusch beim Aufsetzen des Produkts */
	geraeusch: 'wasser' | 'riss' | 'glas';
	/** Anzeigehöhe des Produktfotos in px (Boxen niedriger als Flaschen) */
	hoehe: number;
};

export type CoralConfig = {
	/** Genau drei Produkte – die Szenen sind auf drei gebaut. */
	produkte: [Produkt, Produkt, Produkt];
	/** Die fünf Farben des Streifens auf jeder Coral-Club-Packung (links → rechts) */
	streifen: [string, string, string, string, string];
	hook: {
		grund: string;
		schrift: string;
		/** Frage oben, jedes Wort schlägt einzeln ein */
		frage: string[];
		/** Welcher Preis im Hook durchgestrichen wird (Index in produkte) */
		preisVon: number;
		/** Antwort nach dem Durchstreichen */
		antwort: string;
	};
	abschluss: {
		grund: [string, string];
		schrift: string;
		/** Button-Farbe und Button-Schrift */
		button: string;
		buttonSchrift: string;
		titel: string;
		unterzeile: string;
		buttonText: string;
	};
	/** Kennzeichnung oben links, das ganze Video über sichtbar */
	werbung: string;
	/** Klein unter dem Button */
	hinweis: string;
	preisStand: string;
};

export const config: CoralConfig = {
	produkte: [
		{
			name: 'Coral-Mine',
			bild: 'produkte/coral-mine.png',
			inhalt: '30 Sachets',
			fakt: 'Mineralien aus fossilen Korallen',
			normalpreis: 26.25,
			clubpreis: 21.0,
			grund: ['#0FA3B5', '#075A6E'],
			schrift: '#FFFFFF',
			geraeusch: 'wasser',
			hoehe: 600,
		},
		{
			name: 'Oceanmin',
			bild: 'produkte/oceanmin.png',
			inhalt: '15 Sticks',
			fakt: 'Magnesium + ca. 70 Meeresmineralien',
			normalpreis: 23.75,
			clubpreis: 19.0,
			grund: ['#D9F1FC', '#8FD3F5'],
			schrift: '#12264F',
			geraeusch: 'riss',
			hoehe: 620,
		},
		{
			name: 'Promarine Collagen',
			bild: 'produkte/collagen.png',
			inhalt: '10 Trinkfläschchen à 50 ml',
			fakt: 'Hydrolysiertes Kollagen aus Fisch',
			normalpreis: 68.75,
			clubpreis: 55.0,
			grund: ['#F06BA0', '#C22D6E'],
			schrift: '#FFFFFF',
			geraeusch: 'glas',
			hoehe: 630,
		},
	],

	streifen: ['#E74D8C', '#80549E', '#1F96BD', '#87BC3A', '#F2DC25'],

	hook: {
		grund: '#F2DC25',
		schrift: '#17130F',
		frage: ['Voller', 'Preis?'],
		preisVon: 0,
		antwort: 'Nö.',
	},

	abschluss: {
		grund: ['#8D5FB0', '#4E2D72'],
		schrift: '#FFFFFF',
		button: '#F2DC25',
		buttonSchrift: '#17130F',
		titel: 'Clubpreis sichern',
		unterzeile: 'Unverbindlich registrieren & sparen',
		buttonText: 'Link in Bio',
	},

	werbung: 'Werbung',
	hinweis: 'Affiliate-Link · Preise: de.coral.club',
	preisStand: '29.09.2026',
};
