/**
 * ============================================================
 *  ANPASSBARE DATEN
 * ============================================================
 *  Eigenwerbung der Motion-Graphics-Agentur. Texte, Handle und Farben stehen
 *  nur hier. Lange Zeilen werden automatisch kleiner gesetzt (FitText).
 *  Zeitpunkte: src/timing.ts, Musik-Ablauf: src/musik-plan.json.
 */
export const config = {
	/** Instagram-/TikTok-Handle inklusive @ */
	handle: '@deinhandle',
	/** Stichwort, das Interessenten per DM schicken */
	stichwort: 'VIDEO',
	/** Arbeitsbeispiel im Video (liegt in public/), 9:16 */
	beispielVideo: 'beispiel-barber.mp4',

	farben: {
		dunkel: '#0B0B0C',
		hell: '#EDEDEA',
		/** Einzige Akzentfarbe: Punkt, "deine Kunden.", Stichwort */
		akzent: '#FF5B2E',
		/** Nebentext: Kontrast > 4,5:1 auf dem jeweiligen Grund */
		grauAufDunkel: '#8B8B91',
		grauAufHell: '#66666C',
		/** Vorbeirauschende Standard-Werbesprüche */
		feed: '#55555B',
		feedLeise: '#1D1D20',
	},

	texte: {
		/** Typische austauschbare Werbesätze, die im Feed vorbeirauschen */
		feed: [
			'Jetzt 20 % sparen',
			'Ihr Partner in der Region',
			'Qualität seit 1998',
			'Neu bei uns',
			'Link in Bio',
			'Angebot der Woche',
			'Wir sind für Sie da',
			'Nur für kurze Zeit',
			'Besuchen Sie uns',
			'Kompetent und zuverlässig',
			'Jetzt Termin buchen',
			'Alles aus einer Hand',
		],
		stopp: 'Du hast angehalten.',
		keinZufall: ['Das war', 'kein Zufall.'],
		dasIst: 'Das ist',
		/** Der Punkt hinter "Design" ist ein Akzent-Kreis, der am Ende das Bild füllt */
		motionDesign: ['Motion', 'Design'],
		problem: ['Die meisten Anzeigen', 'werden weggewischt.'],
		grund: ['Weil sie aussehen', 'wie alle anderen.'],
		beispielTitel: ['So könnte deine', 'Werbung aussehen.'],
		beweisVor: 'Du schaust seit',
		beweisNach: 'Sekunden zu.',
		vorstellen: ['Stell dir vor,', 'das wären', 'deine Kunden.'],
		cta: ['Willst du', 'so ein Video', 'für deine Firma?'],
		button: 'Schreib mir',
		unterButton: 'per DM an',
	},
};
