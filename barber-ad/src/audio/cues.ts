/**
 * Ton-Drehbuch: welcher Effekt auf welchem Frame liegt.
 * Alle Zeitpunkte kommen aus timing.ts – dieselben Werte, mit denen
 * auch die Animationen laufen. Die Effekte selbst erzeugt
 * scripts/generate_sfx.py (nur Geräusche, keine Musik).
 */
import {HOOK, OFFER, OUTRO, SCISSORS, SERVICES, TRANSITIONS} from '../timing';
import manifest from './sfx-manifest.json';

export const SFX = manifest;
export type SoundName = keyof typeof manifest;

export type Cue = {
	sound: SoundName;
	/** Globaler Frame, auf den der Anker des Effekts fällt */
	frame: number;
	/** Lautstärke-Faktor (Pegel sind in den Dateien schon abgestimmt) */
	volume?: number;
};

export const buildCues = (): Cue[] => {
	const cues: Cue[] = [];

	// Szenenwechsel: kurzer Whoosh, Spitze in der Mitte des Übergangs
	for (const t of TRANSITIONS) {
		cues.push({sound: t.direction === 'from-right' ? 'whoosh_uebergang_seite' : 'whoosh_uebergang_hoch', frame: t.center});
	}

	// Szene 1: tiefer Einschlag pro Wort, der letzte kräftiger
	HOOK.impacts.forEach((frame, i) => {
		const last = i === HOOK.impacts.length - 1;
		cues.push({sound: last ? 'einschlag_stark' : 'einschlag', frame});
	});

	// Szene 2: leises Kratzen beim Zeichnen, zwei Schnipp-Geräusche
	cues.push({sound: 'kratzen', frame: SCISSORS.drawStart});
	SCISSORS.snips.forEach((frame, i) => cues.push({sound: i % 2 === 0 ? 'schnipp_1' : 'schnipp_2', frame}));

	// Szene 3: Whoosh beim Reinfliegen (Spitze bei höchster Geschwindigkeit), Klack beim Einrasten
	SERVICES.cardStarts.forEach((start, i) => {
		const fromLeft = SERVICES.cardSide(i) === -1;
		cues.push({sound: fromLeft ? 'whoosh_karte_links' : 'whoosh_karte_rechts', frame: start + 2});
		cues.push({sound: 'klack', frame: SERVICES.cardLands[i]});
	});
	cues.push({sound: 'swish', frame: SERVICES.dividersIn});

	// Szene 4: Swipe für den Rahmen, Ticks beim Hochzählen, Abschluss-Schlag
	cues.push({sound: 'swipe_rahmen', frame: OFFER.frameStart});
	for (const frame of OFFER.ticks) cues.push({sound: 'tick', frame});
	cues.push({sound: 'abschluss_schlag', frame: OFFER.finalHit});

	// Szene 5: sehr leises Pop pro Button-Puls
	for (const start of OUTRO.pulses) cues.push({sound: 'pop', frame: start + 1});

	return cues;
};
