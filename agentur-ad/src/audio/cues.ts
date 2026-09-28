/** Ton-Drehbuch: alle Zeitpunkte aus timing.ts, dieselben wie im Bild. Nur Geräusche, keine Musik. */
import {BEWEIS, BEWEIS_TICKS, CTA, CUTS, HOOK, LOESUNG, PROBLEM, SNAP_LAND, ZUFALL} from '../timing';
import manifest from './sfx-manifest.json';

export const SFX = manifest;
export type SoundName = keyof typeof manifest;
export type Cue = {sound: SoundName; frame: number; volume?: number};

export const buildCues = (): Cue[] => {
	const c: Cue[] = [];
	CUTS.forEach((frame, i) => c.push({sound: i % 2 ? 'whoosh_uebergang_hoch' : 'whoosh_uebergang_seite', frame}));

	c.push({sound: 'einschlag_stark', frame: HOOK.stopp});
	HOOK.lines.forEach((frame) => c.push({sound: 'einschlag', frame}));
	ZUFALL.lines.forEach((frame) => c.push({sound: 'einschlag', frame}));
	c.push({sound: 'einschlag', frame: ZUFALL.reveal[0]});
	c.push({sound: 'einschlag_stark', frame: ZUFALL.reveal[1]});
	c.push({sound: 'swish', frame: ZUFALL.barStart});

	PROBLEM.cards.forEach((card, i) => {
		if (i > 0) c.push({sound: 'klack', frame: card.in + SNAP_LAND, volume: 0.7});
		c.push({sound: 'whoosh_karte_rechts', frame: card.out + 3});
	});
	c.push({sound: 'abschluss_schlag', frame: PROBLEM.weggewischt});

	LOESUNG.rows.forEach((start, i) => {
		c.push({sound: i % 2 ? 'whoosh_karte_rechts' : 'whoosh_karte_links', frame: start + 2});
		c.push({sound: 'klack', frame: start + SNAP_LAND});
	});
	c.push({sound: 'einschlag_stark', frame: LOESUNG.fuerDich});

	BEWEIS_TICKS.forEach((frame) => c.push({sound: 'tick', frame, volume: 1.4}));
	BEWEIS.vorstellen.forEach((frame, i) => c.push({sound: i ? 'einschlag_stark' : 'einschlag', frame}));

	CTA.lines.forEach((frame, i) => c.push({sound: i === 1 ? 'einschlag_stark' : 'einschlag', frame}));
	c.push({sound: 'klack', frame: CTA.buttonIn + SNAP_LAND});
	CTA.pulses.forEach((p) => c.push({sound: 'pop', frame: p + 1}));
	return c;
};
