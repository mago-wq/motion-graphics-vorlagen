// Werkzeuge für Lottie-Daten (Bodymovin-JSON): Eigenschaften zu beliebigen Zeiten
// auswerten, Farben ersetzen und eine Choreografie "backen". Beim Backen bekommt jede
// animierte Eigenschaft pro Videobild einen Halte-Keyframe; so lassen sich Ebenengruppen
// (z. B. ein Bein) zu einer anderen Phase des Zyklus zeigen als der Rest der Figur.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;

export type LottieData = {
	v: string;
	fr: number;
	ip: number;
	op: number;
	w: number;
	h: number;
	layers: Json[];
	assets?: Json[];
	[key: string]: unknown;
};

// ------------------------------------------------------------ Auswerten

/** Kubische Bézierkurve wie CSS cubic-bezier(x1, y1, x2, y2): x → y */
const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
	const cx = 3 * x1;
	const bx = 3 * (x2 - x1) - cx;
	const ax = 1 - cx - bx;
	const cy = 3 * y1;
	const by = 3 * (y2 - y1) - cy;
	const ay = 1 - cy - by;
	const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
	const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
	const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
	return (x: number): number => {
		if (x <= 0) return 0;
		if (x >= 1) return 1;
		let t = x;
		for (let i = 0; i < 8; i++) {
			const err = sampleX(t) - x;
			if (Math.abs(err) < 1e-6) break;
			const d = slopeX(t);
			if (Math.abs(d) < 1e-6) break;
			t -= err / d;
		}
		// Absicherung per Bisektion, falls Newton aus dem Intervall läuft
		if (t < 0 || t > 1 || Math.abs(sampleX(t) - x) > 1e-4) {
			let lo = 0;
			let hi = 1;
			t = x;
			for (let i = 0; i < 30; i++) {
				if (sampleX(t) < x) lo = t;
				else hi = t;
				t = (lo + hi) / 2;
			}
		}
		return sampleY(t);
	};
};

const pick = (v: number | number[] | undefined, i: number, fallback: number): number => {
	if (v === undefined) return fallback;
	if (Array.isArray(v)) return v[Math.min(i, v.length - 1)] ?? fallback;
	return v;
};

/** Mischt zwei gleich aufgebaute Werte (Zahlen, Arrays, Pfad-Objekte) linear. */
export const mix = (a: Json, b: Json, t: number): Json => {
	if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
	if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => (i < b.length ? mix(v, b[i], t) : v));
	if (a && b && typeof a === 'object' && typeof b === 'object') {
		const out: Json = {};
		for (const k of Object.keys(a)) out[k] = k in b ? mix(a[k], b[k], t) : a[k];
		return out;
	}
	return t < 0.5 ? a : b;
};

const isAnimated = (prop: Json): boolean =>
	Boolean(prop && typeof prop === 'object' && prop.a === 1 && Array.isArray(prop.k) && prop.k.length > 0 && typeof prop.k[0] === 'object' && 't' in prop.k[0]);

/** Wert einer (animierten) Eigenschaft zur Ebenenzeit `t`, mit Keyframe-Easing. */
export const evalProp = (prop: Json, t: number): Json => {
	if (!isAnimated(prop)) return prop.k;
	const kfs: Json[] = prop.k;
	const first = kfs[0];
	if (t <= first.t) return first.s;
	for (let i = 0; i < kfs.length - 1; i++) {
		const a = kfs[i];
		const b = kfs[i + 1];
		if (t >= b.t) continue;
		const from = a.s;
		const to = a.e ?? b.s;
		if (a.h === 1 || to === undefined) return from;
		const u = (t - a.t) / (b.t - a.t);
		if (typeof from[0] === 'number') {
			// Easing je Dimension (Position, Skalierung, Farbe …)
			return from.map((v: number, d: number) => {
				const ease = cubicBezier(pick(a.o?.x, d, 0), pick(a.o?.y, d, 0), pick(a.i?.x, d, 1), pick(a.i?.y, d, 1));
				return v + ((to[d] ?? v) - v) * ease(u);
			});
		}
		// Pfade und andere Objekte: eine Kurve für alles
		const ease = cubicBezier(pick(a.o?.x, 0, 0), pick(a.o?.y, 0, 0), pick(a.i?.x, 0, 1), pick(a.i?.y, 0, 1));
		return mix(from, to, ease(u));
	}
	const last = kfs[kfs.length - 1];
	return last.s ?? kfs[kfs.length - 2]?.e;
};

// ------------------------------------------------------------ Farben

export type Hex = `#${string}`;

const toRgb = (hex: Hex): [number, number, number] => {
	const v = hex.replace('#', '');
	return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255) as [number, number, number];
};

const sameColor = (k: number[], hex: Hex): boolean => {
	const scale = Math.max(k[0], k[1], k[2]) > 1 ? 255 : 1;
	const [r, g, b] = toRgb(hex);
	return Math.abs(k[0] / scale - r) < 0.006 && Math.abs(k[1] / scale - g) < 0.006 && Math.abs(k[2] / scale - b) < 0.006;
};

export type ColorRule = {
	/** Originalfarbe in der Lottie-Datei */
	from: Hex;
	to: Hex;
	/** nur in diesen Ebenen (Name) oder deren Kindern; ohne Angabe: überall */
	layers?: string[];
	/** Deckkraft der Füllung in Prozent (optional) */
	opacity?: number;
};

/** Ersetzt Füll- und Konturfarben nach Regeln. Die erste passende Regel gewinnt. */
export const recolor = (data: LottieData, rules: ColorRule[]): LottieData => {
	const out: LottieData = structuredClone(data);
	const byInd = new Map<number, Json>(out.layers.map((l: Json) => [l.ind, l]));
	const chain = (layer: Json): string[] => {
		const names: string[] = [];
		let cur = layer;
		while (cur) {
			names.push(cur.nm);
			cur = cur.parent !== undefined ? byInd.get(cur.parent) : undefined;
		}
		return names;
	};
	const walk = (node: Json, names: string[]) => {
		if (Array.isArray(node)) {
			node.forEach((n) => walk(n, names));
			return;
		}
		if (!node || typeof node !== 'object') return;
		if ((node.ty === 'fl' || node.ty === 'st') && node.c && node.c.a === 0 && Array.isArray(node.c.k)) {
			const rule = rules.find((r) => sameColor(node.c.k, r.from) && (!r.layers || r.layers.some((n) => names.includes(n))));
			if (rule) {
				const [r, g, b] = toRgb(rule.to);
				node.c.k = [r, g, b, 1];
				if (rule.opacity !== undefined && node.ty === 'fl') node.o = {a: 0, k: rule.opacity};
			}
		}
		for (const v of Object.values(node)) walk(v, names);
	};
	for (const layer of out.layers) walk(layer.shapes ?? [], chain(layer));
	return out;
};

// ------------------------------------------------------------ Choreografie backen

/**
 * Pose einer Ebenengruppe in einem Videobild: eine Phase des Originalzyklus
 * (in Lottie-Frames) oder eine Mischung aus zwei Phasen.
 */
export type GroupPose = number | {a: number; b: number; t: number};

/** Für Videobild `frame`: Pose je Gruppe (Schlüssel wie in `groups`), `rest` für alle übrigen Ebenen. */
export type Choreography = (frame: number) => Record<string, GroupPose> & {rest: GroupPose};

const poseValue = (prop: Json, pose: GroupPose, st: number): Json => {
	if (typeof pose === 'number') return evalProp(prop, pose - st);
	const a = evalProp(prop, pose.a - st);
	const b = evalProp(prop, pose.b - st);
	return mix(a, b, pose.t);
};

/**
 * Baut aus einem Lottie-Zyklus eine neue Animation mit `frames` Bildern, in der jede
 * Ebenengruppe der Choreografie folgt. `groups`: Gruppenname → Ebenennamen.
 * Ebenen ohne eigene Animation erben die Bewegung ihrer Eltern wie gehabt.
 */
export const bake = (data: LottieData, groups: Record<string, string[]>, frames: number, choreography: Choreography, fps: number): LottieData => {
	const out: LottieData = structuredClone(data);
	const groupOf = new Map<string, string>();
	for (const [g, names] of Object.entries(groups)) for (const n of names) groupOf.set(n, g);
	const poses = Array.from({length: frames}, (_, f) => choreography(f));

	const bakeProp = (prop: Json, group: string, st: number) => {
		const k = poses.map((p, f) => {
			const v = poseValue(prop, (p as Record<string, GroupPose>)[group] ?? p.rest, st);
			return {t: f, s: Array.isArray(v) ? v : [v], h: 1};
		});
		prop.k = k;
		prop.a = 1;
	};
	const walk = (node: Json, group: string, st: number) => {
		if (Array.isArray(node)) {
			node.forEach((n) => walk(n, group, st));
			return;
		}
		if (!node || typeof node !== 'object') return;
		for (const [key, v] of Object.entries(node)) {
			if (isAnimated(v)) bakeProp(v, group, st);
			else if (key === 'p' && v && typeof v === 'object' && (v as Json).s === true) {
				// getrennte x/y-Position
				for (const axis of ['x', 'y']) if (isAnimated((v as Json)[axis])) bakeProp((v as Json)[axis], group, st);
			} else walk(v, group, st);
		}
	};
	for (const layer of out.layers) {
		const group = groupOf.get(layer.nm) ?? 'rest';
		const st = layer.st ?? 0;
		walk(layer.ks, group, st);
		walk(layer.shapes ?? [], group, st);
		layer.ip = 0;
		layer.op = frames;
		layer.st = 0;
	}
	out.ip = 0;
	out.op = frames;
	out.fr = fps;
	return out;
};
