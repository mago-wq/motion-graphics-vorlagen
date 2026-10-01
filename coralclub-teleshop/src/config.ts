/**
 * ============================================================
 *  ANPASSBARE DATEN (Bild)
 * ============================================================
 *  Alle Texte, Preise und Bilder, die im Video zu SEHEN sind.
 *  Was der Sprecher SAGT, steht in src/sprechertext.json – beides
 *  muss zusammenpassen (Preise, Mengen, Claim).
 *
 *  Quelle aller Angaben: de.coral.club, Stand siehe `preisStand`.
 *  Vor dem Posten prüfen, ob Preise und Nährwerte noch stimmen –
 *  falsche Preise in Werbung sind abmahnfähig.
 *
 *  Gesundheitsbezogene Angaben: NUR der zugelassene Claim aus der
 *  EU-Liste (VO (EU) 432/2012) im exakten Wortlaut. Er gilt, weil eine
 *  Tagesportion 120 mg Magnesium = 32 % NRV liefert (Schwelle 15 %).
 *  Pflichtangaben dazu (Art. 10 Abs. 2 VO (EG) 1924/2006): Hinweis auf
 *  ausgewogene Ernährung und gesunde Lebensweise, Verzehrmenge.
 *  Keine Aussagen wie "gegen Müdigkeit", "macht wach", "Energie-Kick".
 */

export const config = {
	produkt: {
		name: 'Oceanmin',
		marke: 'Coral Club',
		bild: 'produkte/oceanmin.png',
		/** Stick, aus dem Pulver rieselt (freigestelltes Shopfoto) */
		stickBild: 'produkte/stick-pulver.png',
		/** Auf der Produktseite als Bestseller markiert */
		plakette: 'Bestseller',
		inhalt: '15 Sticks',
		magnesiumMg: 120,
		nrvProzent: 32,
		wasserMl: 750,
		normalpreis: 23.75,
		clubpreis: 19.0,
	},
	/** Für "auf alle Coral-Club-Produkte" */
	weitereProdukte: ['produkte/coral-mine.png', 'produkte/collagen.png'],
	rabattProzent: 20,

	hook: {
		zeile1: 'Meine Damen',
		zeile2: 'und Herren',
		knaller: 'Aufgepasst!',
	},
	problem: {
		frage: 'Kennen Sie das?',
		uhrzeit: '15:00',
		platt: 'Platt',
		plattZusatz: 'wie ein Pfannkuchen',
		kaffee: 'Kaffee Nr. 4',
		nix: 'Nix?',
	},
	reveal: {
		vorstellen: 'Darf ich vorstellen:',
		von: 'von Coral Club',
	},
	demo: {
		titel: "So einfach geht's",
		schritte: ['1 Stick', 'in 750 ml Wasser', 'über den Tag verteilt'],
	},
	magnesium: {
		proStick: 'pro Stick',
		element: {symbol: 'Mg', nummer: 12, name: 'Magnesium'},
	},
	claim: {
		/** Exakter Wortlaut aus VO (EU) 432/2012 – nicht umformulieren */
		text: 'Magnesium trägt zur Verringerung von Müdigkeit und Ermüdung bei.',
		pflicht:
			'Nahrungsergänzungsmittel. Kein Ersatz für eine ausgewogene, abwechslungsreiche Ernährung und eine gesunde Lebensweise. Verzehrempfehlung: 1 Stick täglich, nicht überschreiten.',
	},
	aberNoch: ['Aber das ist', 'noch nicht', 'alles!'],
	preis: {
		mitClubpreis: 'Mit Clubpreis',
		normal: 'Normalpreis',
		nur: 'Nur',
	},
	alle: {
		auf: 'auf alle',
		produkte: 'Coral-Club-Produkte',
	},
	cta: {
		titel: 'Jetzt zugreifen!',
		button: 'Link in Bio',
		schritte: ['Link antippen', 'Registrieren', '20 % sparen'],
		/** Unter dem −20-%-Störer */
		stoerer: 'Clubpreis',
	},

	/** Kennzeichnung im Kleingedruckten des Abschlusses (kein Logo im Bild, auf Wunsch;
	 *  gekennzeichnet wird beim Posten über Caption und Markeninhalt-Schalter) */
	werbung: 'Werbung',
	/** Klein im Abschluss */
	hinweis: 'Affiliate-Link · Clubpreis für registrierte Mitglieder · Preise: de.coral.club, Stand',
	preisStand: '01.10.2026',
} as const;

/** Euro im deutschen Format: 23,75 € */
export const euro = (value: number): string =>
	`${value.toFixed(2).replace('.', ',')} €`;
