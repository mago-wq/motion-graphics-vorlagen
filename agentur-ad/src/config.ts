/**
 * ============================================================
 *  ANPASSBARE DATEN
 * ============================================================
 *  Eigenwerbung der Motion-Graphics-Agentur. Alle Texte, der Handle und
 *  die Farben stehen nur hier. Überschriften sind in Bebas Neue gesetzt
 *  (nur Großbuchstaben). Lange Texte werden automatisch kleiner gesetzt.
 */
export const config = {
	/** Instagram-/TikTok-Handle inklusive @ */
	handle: '@deinhandle',
	/** Stichwort, das Interessenten per DM schicken sollen */
	stichwort: 'VIDEO',

	hauptfarbe: '#0A0A0B',
	akzentfarbe: '#D7FF3A',
	textfarbe: '#F4F4F0',
	/** Farbe für "Weggewischt." */
	warnfarbe: '#FF4D3A',

	texte: {
		/** Szene 1: das erste Wort schlägt auf Frame 0 ein */
		stopp: 'Stopp.',
		hook: ['Du hast gerade', 'aufgehört', 'zu scrollen.'],
		/** Szene 2 */
		keinZufall: ['Das war', 'kein Zufall.'],
		aufloesung: ['Das ist', 'Motion Design.'],
		/** Szene 3: langweilige Werbeanzeigen, die weggewischt werden */
		problemTitel: 'Deine Werbung heute:',
		langweiligeAnzeigen: [
			{titel: 'Ihr zuverlässiger Partner', zeile: 'Qualität · Service · Erfahrung'},
			{titel: 'Wir freuen uns auf Sie!', zeile: 'Besuchen Sie unsere Website'},
			{titel: 'Seit über 20 Jahren', zeile: 'Kompetent in Ihrer Region'},
		],
		weggewischt: 'Weggewischt.',
		keinerSchaut: 'Keiner schaut hin.',
		/** Szene 4 */
		loesungTitel: 'Was ich für dich baue:',
		punkte: ['Ein Hook, der stoppt', 'Jeder Schnitt sitzt auf Ton', 'Gemacht für TikTok & Reels'],
		fuerDich: 'Für deine Firma.',
		/** Szene 5: der Zähler zeigt die echte Zuschauzeit */
		beweisVor: 'Du schaust seit',
		beweisNach: 'zu.',
		vorstellen: ['Stell dir vor,', 'das wären deine Kunden.'],
		/** Szene 6 */
		cta: ['Willst du', 'so ein Video', 'für deine Firma?'],
		buttonVor: 'Schreib mir',
		buttonUnter: 'per DM',
		hudLabel: 'Du schaust seit',
	},
};
