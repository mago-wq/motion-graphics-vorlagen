/**
 * ============================================================
 *  INHALTE DES REELS
 * ============================================================
 *  Alle Texte, Preise, Studios und Farben stehen nur hier.
 *  Stand der Angaben: mfit-smart.de am 29.09.2026. Vor jeder
 *  Veröffentlichung Preis und Studioliste mit MFit abgleichen.
 *
 *  Überschriften sind in Rubik One gesetzt und werden in
 *  Großbuchstaben angezeigt. Zu lange Zeilen werden automatisch
 *  kleiner, damit sie in der Sicherheitszone bleiben.
 *
 *  Die Anzahl der Häkchen (7) und der Studios (6) ist fest mit
 *  Zeitplan und Musik verzahnt (src/timeline.json). Texte dürfen
 *  sich ändern, die Anzahl nicht.
 */

export type Piktogramm = 'kette' | 'null-euro' | 'uhr' | 'gesicht' | 'becher' | 'parken' | 'netz';

export type Haekchen = {
	/** Große Überschrift, zwei Zeilen. Die zweite Zeile ist golden. */
	zeilen: [string, string];
	/** Kleine Zeile darunter. Leerer Text blendet sie aus. */
	unterzeile: string;
	/** Fußnote (z. B. Einschränkung zu einer Aussage). Leerer Text blendet sie aus. */
	fussnote: string;
	/** Kurzform für die Zusammenfassung vor dem Preis */
	kurz: string;
	bild: Piktogramm;
};

export type Studio = {name: string; neu: boolean};

export const config = {
	marke: 'MFit Smart',
	website: 'mfit-smart.de',
	instagram: '@mfit_smart',

	preis: {
		/** Monatsbeitrag im Angebot */
		aktuell: 17.9,
		/** Regulärer Preis, wird durchgestrichen */
		statt: 29.9,
	},

	hook: {
		zeile: 'Premium-Gym',
		vorPreis: 'für',
		unterPreis: 'im Monat',
	},

	haken: {
		frage: ['Wo ist der', 'Haken?'] as [string, string],
		ehrlich: 'Ganz ehrlich?',
		/** Die Zahl dahinter ist die Anzahl der Häkchen */
		esGibt: 'Es gibt',
	},

	/** Genau sieben, in dieser Reihenfolge. Erst die Sorgen, dann die Extras. */
	haekchen: [
		{
			zeilen: ['Monatlich', 'kündbar'],
			unterzeile: 'Ohne Bindung.',
			fussnote: '',
			kurz: 'Monatlich kündbar',
			bild: 'kette',
		},
		{
			zeilen: ['Keine', 'Anmeldegebühr'],
			unterzeile: 'Keine extra Kosten.',
			fussnote: '',
			kurz: 'Keine Anmeldegebühr',
			bild: 'null-euro',
		},
		{
			zeilen: ['Rund um', 'die Uhr*'],
			unterzeile: '',
			fussnote: '*an den meisten Standorten',
			kurz: '24/7 geöffnet*',
			bild: 'uhr',
		},
		{
			zeilen: ['Nur dein', 'Gesicht.'],
			unterzeile: 'Zugang per Face-ID.',
			fussnote: '',
			kurz: 'Zugang per Face-ID',
			bild: 'gesicht',
		},
		{
			zeilen: ['Kostenlose', 'Getränke'],
			unterzeile: '',
			fussnote: '',
			kurz: 'Kostenlose Getränke',
			bild: 'becher',
		},
		{
			zeilen: ['Kostenlose', 'Parkplätze'],
			unterzeile: '',
			fussnote: '',
			kurz: 'Kostenlose Parkplätze',
			bild: 'parken',
		},
		{
			zeilen: ['Eine Mitgliedschaft.', 'Alle Studios.'],
			unterzeile: '',
			fussnote: '',
			kurz: 'Alle Studios inklusive',
			bild: 'netz',
		},
	] satisfies Haekchen[] as Haekchen[],

	/** Beim Face-ID-Häkchen: was man NICHT braucht, einzeln auf den Beats */
	ohneKarte: ['Keine Karte.', 'Kein Armband.', 'Kein QR-Code.'] as [string, string, string],

	/** Genau sechs. Neueröffnungen bekommen ein NEU-Schild. */
	studios: [
		{name: 'Stolzenau', neu: false},
		{name: 'Ritterhude', neu: false},
		{name: 'Bremen-Gröpelingen', neu: false},
		{name: 'Bremen-Hemelingen', neu: true},
		{name: 'Bremen-Weserpark', neu: true},
		{name: 'Grasberg', neu: true},
	] satisfies Studio[] as Studio[],
	neuSchild: 'Neu',

	recap: ['Kein Haken.', 'Nur Häkchen.'] as [string, string],
	anker: ['Und das alles', 'für'] as [string, string],

	preisScene: {
		vor: 'Nur',
		/** Unter dem Preis, durch · getrennt */
		details: ['Monatlich kündbar', 'Keine extra Kosten'] as [string, string],
		stattText: 'statt',
	},

	probetraining: {
		frage: 'Noch unsicher?',
		antwort: "Probier's einfach.",
		titel: ['Kostenloses', 'Probetraining'] as [string, string],
		punkte: ['100 % kostenlos', 'Unverbindlich', 'Nutze das komplette Studio'] as [string, string, string],
		aufruf: 'Jetzt anfragen auf',
	},

	partner: {
		text: 'Auch mit Wellpass & Hansefit*',
		fussnote: '*in ausgewählten Studios',
	},

	claim: ['Richtig gutes Training.', 'Günstig & Flexibel.'] as [string, string],

	farben: {
		/** Grund: fast Schwarz wie auf mfit-smart.de */
		grund: '#0A0A0A',
		/** Schrift: warmes Weiß */
		text: '#F4F1EA',
		/** Markengold (mfit-smart.de) */
		gold: '#D4A83D',
		goldHell: '#F8E39C',
		goldTief: '#9A7426',
	},
};
