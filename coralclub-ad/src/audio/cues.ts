/**
 * Ton-Drehbuch: welcher Effekt auf welchem Frame liegt.
 * Alle Zeitpunkte kommen aus timing.ts – dieselben Werte, mit denen
 * auch die Animationen laufen. Die Effekte selbst erzeugt
 * scripts/generate_sfx.py (nur Geräusche, keine Musik).
 */
import {config} from '../config';
import {HOOK, OUTRO, PRODUCTS, WIPE} from '../timing';
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

const LAND_SOUND: Record<(typeof config.produkte)[number]['geraeusch'], SoundName> = {
	wasser: 'wasser',
	riss: 'riss',
	glas: 'glas',
};

export const buildCues = (): Cue[] => {
	const cues: Cue[] = [];

	// Streifen-Wischer: Spitze des Luftzugs, wenn die Bänder das Bild bedecken
	for (const center of WIPE.centers) cues.push({sound: 'wisch', frame: center - 1});

	// Hook: Einschlag je Wort, kräftiger Einschlag für den Preis,
	// Strich beim Durchstreichen, Fallen, Münze beim Clubpreis, Stempel
	HOOK.wordImpacts.forEach((frame) => cues.push({sound: 'einschlag', frame}));
	cues.push({sound: 'einschlag_stark', frame: HOOK.priceImpact});
	cues.push({sound: 'strich', frame: HOOK.strikeStart});
	cues.push({sound: 'fall', frame: HOOK.fallStart});
	cues.push({sound: 'kaching', frame: HOOK.clubLand});
	cues.push({sound: 'stempel', frame: HOOK.stampLand});

	// Produkte: eigenes Geräusch beim Aufsetzen, Stempel für "Bestseller",
	// kleiner Strich beim Durchstreichen, Plopp für Clubpreis und Plakette
	PRODUCTS.forEach((t, i) => {
		cues.push({sound: LAND_SOUND[config.produkte[i].geraeusch], frame: t.dropLand});
		cues.push({sound: 'stempel', frame: t.badgeLand, volume: 0.55});
		cues.push({sound: 'strich_klein', frame: t.strikeStart});
		cues.push({sound: 'blubb', frame: t.clubLand});
		cues.push({sound: 'plakette', frame: t.savingLand});
	});

	// Abschluss: Klack je Packung, Ticks beim Hochzählen, Schlag am Ziel,
	// Plopp für den Button, sehr leises Pop je Puls
	OUTRO.packLands.forEach((frame) => cues.push({sound: 'klack', frame}));
	for (const frame of OUTRO.ticks) cues.push({sound: 'tick', frame});
	cues.push({sound: 'abschluss_schlag', frame: OUTRO.finalHit});
	cues.push({sound: 'blubb', frame: OUTRO.buttonLand});
	for (const start of OUTRO.pulses) cues.push({sound: 'pop', frame: start + 1});

	return cues;
};
