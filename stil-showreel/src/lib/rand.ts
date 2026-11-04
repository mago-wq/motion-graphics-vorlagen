// Deterministischer Zufall: Remotion rendert Frames parallel und in beliebiger Reihenfolge,
// deshalb nie Math.random(). Alles hängt nur von Seed und Frame ab.

export const mulberry = (seed: number) => {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

/** Hash zweier Ganzzahlen auf 0..1. */
export const hash2 = (x: number, y: number) => {
	let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Wertrauschen 2D, 0..1. */
export const noise2 = (x: number, y: number) => {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const xf = x - xi;
	const yf = y - yi;
	const u = smooth(xf);
	const v = smooth(yf);
	const a = hash2(xi, yi);
	const b = hash2(xi + 1, yi);
	const c = hash2(xi, yi + 1);
	const d = hash2(xi + 1, yi + 1);
	return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

export const fbm2 = (x: number, y: number, oct = 4) => {
	let s = 0;
	let amp = 0.5;
	let f = 1;
	for (let i = 0; i < oct; i++) {
		s += amp * noise2(x * f, y * f);
		f *= 2.03;
		amp *= 0.5;
	}
	return s;
};
