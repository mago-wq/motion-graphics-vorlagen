// Posen-Abläufe: Schlüsselposen mit Haltezeiten, Überblendung über Gelenkwinkel.
import {mixProfile, solveProfile, type ProfilePose} from './components/Body';
import {easeInOut, tween} from './motion';

/** Schlüsselposen [Frame, Pose]; zwischen zwei Keys wird weich übergeblendet. Gleiche Pose zweimal = Halten. */
export const sequence = (f: number, keys: [number, ProfilePose][], lag = 0.14): ProfilePose => {
	if (f <= keys[0][0]) return keys[0][1];
	for (let i = 0; i < keys.length - 1; i++) {
		const [a, pa] = keys[i];
		const [b, pb] = keys[i + 1];
		if (f < b) return pa === pb ? pa : mixProfile(pa, pb, tween(f, a, b, 0, 1, easeInOut), lag);
	}
	return keys[keys.length - 1][1];
};

/**
 * Wie weit die Hüfte nach `phase` Schritten gekommen ist (Figur-Einheiten), so dass der
 * jeweils tiefere Fuß (Standfuß) am Boden stehen bleibt – kein Rutschen.
 */
export const walkTravel = (phase: number, poseAt: (p: number) => ProfilePose) => {
	const STEPS = 30;
	const n = Math.max(0, Math.floor(phase * STEPS));
	let x = 0;
	const ankles = (p: number) => {
		const j = solveProfile(poseAt(p));
		return [j.leg.N[2], j.leg.F[2]];
	};
	let prev = ankles(0);
	const advance = (p: number) => {
		const cur = ankles(p);
		const stance = prev[0][1] >= prev[1][1] ? 0 : 1;
		x += prev[stance][0] - cur[stance][0];
		prev = cur;
	};
	for (let i = 1; i <= n; i++) advance(i / STEPS);
	if (phase * STEPS > n) advance(phase);
	return x;
};
