// Gangpläne für die Figuren: wohin und wann eine Figur geht, anhält und weitergeht.
// Der Schrittzyklus hängt am zurückgelegten Weg, nicht an der Zeit – so bleibt der
// Standfuß auf dem Boden stehen (kein Rutschen), auch beim Abbremsen und Anlaufen.
// Ein Plan ohne Halt ist ein Dauerlauf (z. B. vor mitscrollendem Hintergrund).
import {Easing} from 'remotion';

export type GangPlan = {
	/** Länge der Szene in Frames (für das Backen der Lottie-Choreografie) */
	frames: number;
	start: {frame: number; x: number};
	/** Anhalten bei x zum Frame; ohne Angabe läuft die Figur mit `tempo` durch */
	halt?: {frame: number; x: number};
	/** Abbremsen über die letzten Frames vor dem Halt */
	bremsen?: number;
	/** Beiziehschritt nach dem Halt */
	schliessen?: number;
	/** Losgehen nach dem Halt, mit Anlauf über `anlauf` Frames */
	weiter?: {frame: number; anlauf: number};
	/** Gehgeschwindigkeit in px/Frame, nur ohne Halt nötig (sonst aus Weg und Zeit) */
	tempo?: number;
	/** Die Figur bleibt hier stehen (außerhalb des Bildes) */
	ende?: number;
};

export type Gangzustand =
	| {art: 'gehen'; weg: number}
	| {art: 'schliessen'; u: number}
	| {art: 'stehen'}
	| {art: 'anlaufen'; weg: number};

export type Gang = {
	plan: GangPlan;
	tempo: number;
	/** Hüft-x (Welt) im Frame f */
	hueftX: (f: number) => number;
	/**
	 * Zustand im Frame f. `weg`: zurückgelegter Weg relativ zum Haltepunkt (bzw. Start,
	 * wenn es keinen Halt gibt). Daraus rechnet jede Figur ihre eigene Zyklusphase.
	 */
	zustand: (f: number) => Gangzustand;
};

export const macheGang = (plan: GangPlan): Gang => {
	const {start, halt, weiter} = plan;
	const bremsen = plan.bremsen ?? 20;
	const schliessen = plan.schliessen ?? 16;
	const ende = plan.ende ?? Infinity;
	const v = halt ? (halt.x - start.x) / (halt.frame - start.frame - bremsen / 2) : (plan.tempo ?? 12);
	const hueftX = (f: number): number => {
		if (f <= start.frame) return start.x;
		if (!halt) return Math.min(ende, start.x + v * (f - start.frame));
		const f1 = halt.frame - bremsen;
		if (f <= f1) return start.x + v * (f - start.frame);
		if (f <= halt.frame) {
			// gleichmäßig bremsen: Geschwindigkeit fällt linear auf 0
			const u = (f - f1) / bremsen;
			return start.x + v * (f1 - start.frame) + v * bremsen * (u - (u * u) / 2);
		}
		if (!weiter || f <= weiter.frame) return halt.x;
		const g = f - weiter.frame;
		const a = weiter.anlauf;
		if (g <= a) return halt.x + (v * g * g) / (2 * a);
		return Math.min(ende, halt.x + (v * a) / 2 + v * (g - a));
	};
	const zustand = (f: number): Gangzustand => {
		if (!halt) return {art: 'gehen', weg: hueftX(f) - start.x};
		if (f < halt.frame) return {art: 'gehen', weg: hueftX(f) - halt.x};
		if (f < halt.frame + schliessen) return {art: 'schliessen', u: (f - halt.frame) / schliessen};
		if (!weiter || f < weiter.frame) return {art: 'stehen'};
		return {art: 'anlaufen', weg: hueftX(f) - halt.x};
	};
	return {plan, tempo: v, hueftX, zustand};
};

export const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

// ------------------------------------------------------------ Figuren-Vergleich

export const VERGLEICH = {
	frames: 270,
	/** Bodenlinie der Füße (vor der Fassade, die bei y 1700 endet) */
	boden: 1760,
	/** Figurenhöhe in px (Haar bis Sohle) */
	hoehe: 856,
	scan: {start: 100, ende: 140},
	tuer: {auf: 144, offen: 170, zu: 248, geschlossen: 270},
} as const;

export const VERGLEICH_GANG = macheGang({
	frames: VERGLEICH.frames,
	start: {frame: 6, x: -270},
	halt: {frame: 80, x: 492},
	bremsen: 20,
	schliessen: 16,
	weiter: {frame: 166, anlauf: 16},
	ende: 1320,
});
