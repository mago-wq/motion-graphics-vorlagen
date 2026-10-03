// Zeitrampen für Clips: welche Sekunde des Clips in Sekunde t einer Einstellung läuft.
import {Shot} from './config';

/** Monotone kubische Interpolation (Fritsch–Carlson): weiche Tempowechsel ohne Stillstand an den Stützpunkten. */
const monotone = (xs: number[], ys: number[], x: number) => {
	const n = xs.length;
	if (x <= xs[0]) return ys[0];
	if (x >= xs[n - 1]) return ys[n - 1];
	const d = xs.slice(1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
	const m = xs.map((_, i) => {
		if (i === 0) return d[0];
		if (i === n - 1) return d[n - 2];
		return d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
	});
	let i = 0;
	while (x > xs[i + 1]) i++;
	const h = xs[i + 1] - xs[i];
	const t = (x - xs[i]) / h;
	const t2 = t * t;
	const t3 = t2 * t;
	return (
		(2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]
	);
};

/** Sekunde im Clip für Sekunde t im Shot. */
export const sourceTime = (shot: Shot, t: number) =>
	shot.ramp
		? monotone(
				shot.ramp.map((r) => r[0]),
				shot.ramp.map((r) => r[1]),
				t,
			)
		: (shot.start ?? 0) + t * (shot.rate ?? 1);
