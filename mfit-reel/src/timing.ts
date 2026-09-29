/**
 * Zeitplan in Frames, abgeleitet aus src/timeline.json (Beats).
 * Die Tonspur (scripts/make_soundtrack.py) liest dieselbe Datei,
 * dadurch sitzt jeder Effekt auf dem Frame seiner Animation.
 */
import {config} from './config';
import timeline from './timeline.json';

/** 150 BPM bei 30 fps: 12 Frames pro Beat, 3 Frames pro Sechzehntel. */
export const FRAMES_PER_BEAT = (60 / timeline.bpm) * timeline.fps;
if (!Number.isInteger(FRAMES_PER_BEAT)) {
	throw new Error(`Tempo ${timeline.bpm} BPM ergibt keine ganzen Frames pro Beat bei ${timeline.fps} fps.`);
}
export const FRAMES_PER_BAR = FRAMES_PER_BEAT * timeline.beatsPerBar;

/** Beat (auch Bruchteile wie 1.25) in Frame umrechnen. */
export const f = (beat: number): number => Math.round(beat * FRAMES_PER_BEAT);

export const DURATION = f(timeline.totalBeats);

const mapFrames = <T extends Record<string, number | number[]>>(obj: T) =>
	Object.fromEntries(
		Object.entries(obj).map(([k, v]) => [k, Array.isArray(v) ? v.map(f) : f(v)]),
	) as {[K in keyof T]: T[K] extends number[] ? number[] : number};

export const HOOK = mapFrames(timeline.hook);
export const HAKEN = mapFrames(timeline.haken);
export const RECAP = mapFrames(timeline.recap);
export const ANKER = mapFrames(timeline.anker);
export const PREIS = mapFrames(timeline.preis);
export const CTA = mapFrames(timeline.cta);
export const ENDE = mapFrames(timeline.ende);

export const ITEMS = timeline.items.map((item) => ({start: f(item.start), tick: f(item.tick), end: f(item.end)}));

// Ereignisse innerhalb der Häkchen (Kette reißt, Null rastet ein, …), fest typisiert
const itemEvents = timeline.items.map((item) => item.events as unknown as Record<string, number | number[] | undefined>);
const num = (i: number, key: string): number => {
	const v = itemEvents[i][key];
	if (typeof v !== 'number') throw new Error(`timeline.json: items[${i}].events.${key} fehlt oder ist keine Zahl.`);
	return f(v);
};
const list = (i: number, key: string): number[] => {
	const v = itemEvents[i][key];
	if (!Array.isArray(v)) throw new Error(`timeline.json: items[${i}].events.${key} fehlt oder ist keine Liste.`);
	return v.map(f);
};

export const EV = {
	kette: {bruch: num(0, 'bruch')},
	gebuehr: {null: num(1, 'null')},
	uhr: {umlauf: list(2, 'umlauf')},
	gesicht: {scan: num(3, 'scan'), nein: list(3, 'nein'), entsperrt: num(3, 'entsperrt')},
	getraenke: {fuellen: num(4, 'fuellen')},
	parken: {schild: num(5, 'schild')},
	studios: {linie: num(6, 'linie'), stationen: list(6, 'stationen'), neu: list(6, 'neu')},
};

/** Szenen als [von, bis) in Frames, für die Sequenzen im Hauptvideo. */
export const SCENES = {
	hook: [HOOK.start, HAKEN.start],
	haken: [HAKEN.start, ITEMS[0].start],
	items: [ITEMS[0].start, RECAP.start],
	recap: [RECAP.start, ANKER.start],
	anker: [ANKER.start, PREIS.start],
	preis: [PREIS.start, CTA.start],
	cta: [CTA.start, ENDE.start],
	ende: [ENDE.start, DURATION],
} as const;

/** Ab hier steht das Bild still (Ende sauber für die Schleife auf Instagram). */
export const STILL_FROM = ENDE.still;

/** Kopfzeile (kleines Logo) ist ab dem Drop zu sehen, die Häkchen-Leiste bis zum Recap. */
export const HEADER_IN = ITEMS[0].start - 6;

// ---- Prüfungen: Inhalte und Zeitplan müssen zusammenpassen
if (config.haekchen.length !== ITEMS.length) {
	throw new Error(`config.haekchen hat ${config.haekchen.length} Einträge, der Zeitplan ${ITEMS.length}.`);
}
if (config.studios.length !== EV.studios.stationen.length) {
	throw new Error(`config.studios hat ${config.studios.length} Einträge, der Zeitplan ${EV.studios.stationen.length}.`);
}
if (HAKEN.vermehren.length + 1 !== ITEMS.length) {
	throw new Error('Pro Häkchen braucht es einen Haken (1 + vermehren).');
}
