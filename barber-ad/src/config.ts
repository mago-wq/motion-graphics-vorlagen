/**
 * ============================================================
 *  ANPASSBARE DATEN
 * ============================================================
 *  Das gesamte Video liest Namen, Adresse, Preise, Texte und Farben
 *  nur aus dieser Datei. Für einen echten Betrieb: Werte ändern,
 *  dann `npm run stills` (Kontrollbilder) und `npm run render`.
 *
 *  Überschriften sind in Bebas Neue gesetzt, das nur Großbuchstaben
 *  kennt – Groß-/Kleinschreibung spielt dort also keine Rolle.
 *  Lange Namen und Texte werden automatisch kleiner gesetzt, damit
 *  sie in die Sicherheitszone passen.
 */

export type IconName = 'schere' | 'rasierer' | 'kamm';

export type Leistung = {
	/** Name der Leistung, z. B. "Fade Cut" */
	name: string;
	/** Preis in Euro, z. B. 28 oder 27.5 */
	preis: number;
	/** Kurze Zeile unter dem Namen. Leerer Text blendet sie aus. */
	kurztext: string;
	/** Icon neben der Leistung */
	icon: IconName;
};

export type BarberConfig = {
	name: string;
	/** Erscheint klein unter dem Namen: "<branche> · <stadt>" */
	branche: string;
	stadt: string;
	/** Komplette Anschrift in einer Zeile */
	adresse: string;
	/** Instagram-Handle inklusive @ */
	instagram: string;
	/** Genau drei Leistungen – die Szene ist auf drei Karten gebaut. */
	leistungen: [Leistung, Leistung, Leistung];
	/** Neukundenrabatt. Die Zahl zählt im Video von 0 hoch. */
	neukundenrabatt: {wert: number; einheit: '%' | '€'};
	/** Grundton: Hintergrund des ganzen Videos */
	hauptfarbe: string;
	/** Akzent: Preise, Rahmen, Button, "Nicht bei uns." */
	akzentfarbe: string;
	/** Schriftfarbe auf dem Grundton */
	textfarbe: string;
	texte: {
		/** Hook, eine Zeile pro Eintrag. Jedes Wort schlägt einzeln ein. */
		hook: string[];
		antwort: string;
		leistungenTitel: string;
		/** Angebot: "<vorRabatt> <Rabatt> <nachRabatt>" */
		vorRabatt: string;
		nachRabatt: string;
		button: string;
	};
};

export const config: BarberConfig = {
	name: 'Cutline Barber',
	branche: 'Barbershop',
	stadt: 'Leipzig',
	adresse: 'Musterstraße 12, 04109 Leipzig',
	instagram: '@cutline.barber',

	leistungen: [
		{name: 'Fade Cut', preis: 28, kurztext: 'Sauberer Übergang', icon: 'kamm'},
		{name: 'Bartpflege', preis: 18, kurztext: 'Kontur & heißes Tuch', icon: 'rasierer'},
		{name: 'Cut + Bart', preis: 42, kurztext: 'Das volle Programm', icon: 'schere'},
	],

	neukundenrabatt: {wert: 20, einheit: '%'},

	hauptfarbe: '#0E0E0E',
	akzentfarbe: '#D4A24C',
	textfarbe: '#F5F1E8',

	texte: {
		hook: ['Schon', 'wieder ein', 'schlechter', 'Haarschnitt?'],
		antwort: 'Nicht bei uns.',
		leistungenTitel: 'Leistungen & Preise',
		vorRabatt: 'Neukunden:',
		nachRabatt: 'auf den ersten Schnitt',
		button: 'Jetzt Termin sichern',
	},
};
