// Gemeinsamer Ablauf für den Figuren-Vergleich: Beide Varianten gehen denselben Weg zur
// selben Zeit. Der Schrittzyklus hängt am zurückgelegten Weg, nicht an der Zeit – so bleibt
// der Standfuß auf dem Boden stehen (kein Rutschen), auch beim Abbremsen und Anlaufen.
import {Easing} from 'remotion';

export const VERGLEICH = {
	frames: 270,
	/** Bodenlinie der Füße (vor der Fassade, die bei y 1700 endet) */
	boden: 1760,
	/** Figurenhöhe in px (Haar bis Sohle) */
	hoehe: 856,
	start: {frame: 6, x: -270},
	halt: {frame: 80, x: 492},
	/** Abbremsen über die letzten Frames vor dem Halt */
	bremsen: 20,
	/** Beiziehschritt nach dem Halt */
	schliessen: 16,
	scan: {start: 100, ende: 140},
	tuer: {auf: 144, offen: 170, zu: 248, geschlossen: 270},
	/** Losgehen und Anlaufen */
	weiter: {frame: 166, anlauf: 16},
	ende: {x: 1320},
} as const;

const V = VERGLEICH;

/** Gehgeschwindigkeit (px/Frame), aus Weg und Zeit bis zum Halt */
export const TEMPO = (V.halt.x - V.start.x) / (V.halt.frame - V.start.frame - V.bremsen / 2);

/** Hüft-x der Figur in Videobild `f` */
export const hueftX = (f: number): number => {
	const v = TEMPO;
	if (f <= V.start.frame) return V.start.x;
	const f1 = V.halt.frame - V.bremsen;
	if (f <= f1) return V.start.x + v * (f - V.start.frame);
	if (f <= V.halt.frame) {
		// gleichmäßig bremsen: Geschwindigkeit fällt linear auf 0
		const u = (f - f1) / V.bremsen;
		return V.start.x + v * (f1 - V.start.frame) + v * V.bremsen * (u - (u * u) / 2);
	}
	if (f <= V.weiter.frame) return V.halt.x;
	const g = f - V.weiter.frame;
	const a = V.weiter.anlauf;
	if (g <= a) return V.halt.x + (v * g * g) / (2 * a);
	return Math.min(V.ende.x, V.halt.x + (v * a) / 2 + v * (g - a));
};

/** Zustand des Gangs in Videobild `f` */
export type Gangzustand =
	| {art: 'gehen'; weg: number}
	| {art: 'schliessen'; u: number}
	| {art: 'stehen'}
	| {art: 'anlaufen'; weg: number};

/**
 * `weg`: zurückgelegter Weg relativ zum Haltepunkt (vorher negativ, danach positiv).
 * Daraus rechnet jede Figur ihre eigene Zyklusphase.
 */
export const gangzustand = (f: number): Gangzustand => {
	if (f < V.halt.frame) return {art: 'gehen', weg: hueftX(f) - V.halt.x};
	if (f < V.halt.frame + V.schliessen) return {art: 'schliessen', u: (f - V.halt.frame) / V.schliessen};
	if (f < V.weiter.frame) return {art: 'stehen'};
	return {art: 'anlaufen', weg: hueftX(f) - V.halt.x};
};

export const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);
