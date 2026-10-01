/**
 * Ton-Drehbuch: welche Effekte an welchem Frame. Die Zeitpunkte kommen aus
 * den Szenen (…_IMPACTS), die sie wiederum aus timing.ts berechnen – Bild und
 * Ton verschieben sich immer gemeinsam. Sprecher und Musik laufen getrennt
 * (SoundTrack.tsx); Effekte setzen nur Akzente und liegen leiser.
 */
import {ABERNOCH_IMPACTS} from '../scenes/AberNochScene';
import {ALLE_IMPACTS} from '../scenes/AlleScene';
import {CTA_IMPACTS} from '../scenes/CtaScene';
import {DEMO_IMPACTS} from '../scenes/DemoScene';
import {HOOK_IMPACTS} from '../scenes/HookScene';
import {MG_IMPACTS} from '../scenes/MagnesiumScene';
import {PREIS_IMPACTS} from '../scenes/PreisScene';
import {PROBLEM_IMPACTS, PROBLEM_T} from '../scenes/ProblemScene';
import {REVEAL_IMPACTS} from '../scenes/RevealScene';
import {EV, SCENES, STILL_FROM, TRANSITION_FRAMES} from '../timing';
import manifest from './sfx-manifest.json';

export const SFX = manifest;
export type SoundName = keyof typeof manifest;
export type Cue = {frame: number; sound: SoundName; volume?: number};

const sceneStart = (id: (typeof SCENES)[number]['id']) => SCENES.find((s) => s.id === id)?.from ?? 0;

export const buildCues = (): Cue[] => {
	const cues: Cue[] = [
		// Hook
		{frame: 0, sound: 'tv_an', volume: 0.9},
		{frame: HOOK_IMPACTS.zeile1, sound: 'einschlag', volume: 0.7},
		{frame: HOOK_IMPACTS.zeile2, sound: 'einschlag', volume: 0.7},
		{frame: HOOK_IMPACTS.knaller, sound: 'einschlag_stark', volume: 0.9},
		{frame: HOOK_IMPACTS.knaller, sound: 'glitzer'},

		// Schwarzweiß
		{frame: sceneStart('problem'), sound: 'zapp'},
		{frame: PROBLEM_IMPACTS.uhr, sound: 'pop'},
		// Uhr tickt viermal, solange die Zeiger laufen
		...[0, 6, 12, 18].map((d) => ({frame: PROBLEM_T.uhr + 4 + d, sound: 'tick' as const, volume: 0.9})),
		{frame: PROBLEM_IMPACTS.platt, sound: 'stempel'},
		...PROBLEM_IMPACTS.tassen.map((f) => ({frame: f, sound: 'klack' as const})),
		{frame: PROBLEM_IMPACTS.nix, sound: 'einschlag', volume: 0.6},

		// Produkt
		{frame: REVEAL_IMPACTS.produkt, sound: 'einschlag_stark'},
		{frame: REVEAL_IMPACTS.produkt + 1, sound: 'glitzer'},

		// Demo
		{frame: sceneStart('demo'), sound: 'wisch', volume: 0.8},
		{frame: DEMO_IMPACTS.riss, sound: 'riss'},
		{frame: DEMO_IMPACTS.wasser, sound: 'wasser'},
		...DEMO_IMPACTS.schritte.map((f) => ({frame: f, sound: 'pop' as const, volume: 0.9})),

		// Magnesium
		{frame: sceneStart('magnesium'), sound: 'wisch', volume: 0.8},
		...MG_IMPACTS.ticks.map((f) => ({frame: f, sound: 'tick' as const, volume: 0.7})),
		{frame: MG_IMPACTS.zahl, sound: 'stempel'},
		{frame: MG_IMPACTS.kachel, sound: 'wisch', volume: 0.6},
		{frame: MG_IMPACTS.proStick, sound: 'einschlag', volume: 0.6},

		// Claim: nur der Übergang, sonst Ruhe für den Wortlaut
		{frame: sceneStart('claim'), sound: 'wisch', volume: 0.7},

		// Aber das ist noch nicht alles
		{frame: EV.stopp, sound: 'kratzer'},
		...ABERNOCH_IMPACTS.zeilen.slice(0, 2).map((f) => ({frame: f, sound: 'einschlag' as const, volume: 0.65})),
		{frame: ABERNOCH_IMPACTS.zeilen[2], sound: 'zoom', volume: 0.8},
		{frame: ABERNOCH_IMPACTS.schlag, sound: 'einschlag_stark'},

		// Preis
		{frame: PREIS_IMPACTS.alt, sound: 'pop'},
		{frame: PREIS_IMPACTS.strich, sound: 'strich'},
		{frame: PREIS_IMPACTS.neu, sound: 'ding'},
		{frame: PREIS_IMPACTS.neu + 2, sound: 'kaching'},
		{frame: PREIS_IMPACTS.neu, sound: 'glitzer'},

		// Alle Produkte
		{frame: sceneStart('alle'), sound: 'wisch', volume: 0.8},
		...ALLE_IMPACTS.ticks.map((f) => ({frame: f, sound: 'tick' as const, volume: 0.7})),
		{frame: ALLE_IMPACTS.zahl, sound: 'stempel'},
		...ALLE_IMPACTS.packungen.map((f) => ({frame: f, sound: 'klack' as const})),

		// Abschluss
		{frame: CTA_IMPACTS.banner, sound: 'einschlag', volume: 0.7},
		...CTA_IMPACTS.schritte.map((f) => ({frame: f, sound: 'pop' as const})),
		{frame: CTA_IMPACTS.greifen, sound: 'einschlag', volume: 0.6},
		{frame: CTA_IMPACTS.schluss, sound: 'abschluss_schlag'},
		{frame: CTA_IMPACTS.schluss, sound: 'glitzer'},
	];
	// Stern-Wischer bekommen ihren Luftzug
	// (Anker des Zoom-Whoosh ist sein Höhepunkt -> Mitte des Wischers)
	SCENES.filter((s) => s.in === 'stern').forEach((s) => cues.push({frame: s.from + Math.round(TRANSITION_FRAMES.stern / 2), sound: 'zoom', volume: 0.55}));
	return cues.filter((c) => c.frame < STILL_FROM).sort((a, b) => a.frame - b.frame);
};
