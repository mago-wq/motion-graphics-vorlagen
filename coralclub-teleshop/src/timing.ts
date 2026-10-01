/**
 * Zeitplan des Videos in globalen Frames (30 fps).
 *
 * Alles richtet sich nach dem Sprecher: src/sprecher.json (Zeilen und Wörter
 * mit Zeitstempeln, erzeugt von scripts/generate_voice.py) und
 * src/musik-ereignisse.json (Bandstopp, Fanfare, Schluss …, erzeugt von
 * scripts/generate_music.py aus denselben Zeilen). Animationen und
 * Toneffekte lesen ihre Zeitpunkte nur von hier. Neue Sprecherspur ->
 * Bild, Musik und Effekte wandern automatisch mit.
 */
import ev from './musik-ereignisse.json';
import vo from './sprecher.json';
import {FPS} from './video';

export const toFrame = (seconds: number): number => Math.round(seconds * FPS);

export type LineId =
	| 'hook'
	| 'kennen'
	| 'kaffee'
	| 'reveal'
	| 'demo'
	| 'magnesium'
	| 'claim'
	| 'abernoch'
	| 'preis'
	| 'alle'
	| 'cta';

type VoLine = {id: string; start: number; ende: number; woerter: {w: string; s: number; e: number}[]};
const LINES = new Map((vo.zeilen as VoLine[]).map((l) => [l.id, l]));

const getLine = (id: LineId): VoLine => {
	const l = LINES.get(id);
	if (!l) throw new Error(`Zeile "${id}" fehlt in sprecher.json`);
	return l;
};

const clean = (w: string) => w.toLowerCase().replace(/[.,!?:;–-]/g, '');

/** Start/Ende einer Sprecherzeile in Frames */
export const line = (id: LineId) => {
	const l = getLine(id);
	return {start: toFrame(l.start), end: toFrame(l.ende)};
};

/**
 * Start/Ende eines Worts in Frames. `prefix` wird mit dem Wortanfang
 * verglichen (ohne Groß/klein, ohne Satzzeichen), `nth` zählt Treffer.
 */
export const word = (id: LineId, prefix: string, nth = 0) => {
	const hits = getLine(id).woerter.filter((w) => clean(w.w).startsWith(clean(prefix)));
	const w = hits[nth];
	if (!w) throw new Error(`Wort "${prefix}" (#${nth}) fehlt in Zeile "${id}" – Sprecherspur prüfen`);
	return {start: toFrame(w.s), end: toFrame(w.e)};
};

/** Musik-Ereignisse in Frames */
export const EV = {
	bandstopp: toFrame(ev.bandstopp),
	posaune: toFrame(ev.posaune),
	wirbel: toFrame(ev.wirbel),
	fanfare: toFrame(ev.fanfare),
	stopp: toFrame(ev.stopp),
	einschlag: toFrame(ev.einschlag),
	preis: toFrame(ev.preis),
	schluss: toFrame(ev.schluss),
} as const;

/** Gesamtlänge; ab STILL_FROM steht das Bild und es ist still. */
export const DURATION = toFrame(ev.dauer);
export const STILL_FROM = toFrame(ev.stillAb);

/** Die Töne der traurigen Posaune (Versatz in Sekunden aus generate_music.py) */
export const POSAUNE_NOTES = ev.posauneToene.map((s) => EV.posaune + toFrame(s));

// ---------------------------------------------------------------- Szenen

/**
 * Szenengrenzen. Eine Szene beginnt mit der Sprecherzeile, die sie trägt.
 * `in` ist der Übergang, mit dem sie die vorige Szene ablöst.
 */
export type Transition = 'tvAn' | 'zapp' | 'cut' | 'stern' | 'wisch' | 'blitz';

const S = {
	hook: 0,
	problem: EV.bandstopp,
	reveal: line('reveal').start,
	demo: line('demo').start,
	magnesium: line('magnesium').start,
	claim: line('claim').start,
	aberNoch: EV.stopp,
	preis: line('preis').start,
	alle: line('alle').start,
	cta: line('cta').start,
};

export const SCENES = [
	{id: 'hook', from: S.hook, to: S.problem, in: 'tvAn'},
	{id: 'problem', from: S.problem, to: S.reveal, in: 'zapp'},
	{id: 'reveal', from: S.reveal, to: S.demo, in: 'cut'},
	{id: 'demo', from: S.demo, to: S.magnesium, in: 'stern'},
	{id: 'magnesium', from: S.magnesium, to: S.claim, in: 'wisch'},
	{id: 'claim', from: S.claim, to: S.aberNoch, in: 'wisch'},
	{id: 'aberNoch', from: S.aberNoch, to: S.preis, in: 'cut'},
	{id: 'preis', from: S.preis, to: S.alle, in: 'blitz'},
	{id: 'alle', from: S.alle, to: S.cta, in: 'wisch'},
	{id: 'cta', from: S.cta, to: DURATION, in: 'stern'},
] as const satisfies readonly {id: string; from: number; to: number; in: Transition}[];

export type SceneId = (typeof SCENES)[number]['id'];

/** Dauer der Übergänge in Frames */
export const TRANSITION_FRAMES: Record<Transition, number> = {
	tvAn: 7,
	zapp: 6,
	cut: 0,
	stern: 12,
	wisch: 9,
	blitz: 6,
};
