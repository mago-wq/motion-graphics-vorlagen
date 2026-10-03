// Piktogramm-Figur als massive Silhouette (wie im Vorbild): breiter Rumpf, kräftige,
// sich verjüngende Gliedmaßen, schwebender Kopf, dunkle Trennfugen um die vorderen Glieder.
//
// Vorwärtskinematik: Eine Pose ist eine Reihe von Gelenkwinkeln, keine Zielpunkte.
// Dadurch laufen Übergänge auf Bögen, und kein Ellbogen kann umklappen.
// Winkel in Grad, Richtung dir(a) = (sin a, cos a): 0 = nach unten, +90 = nach vorn (+x).
// Profilfiguren schauen nach +x; gespiegelt wird über `flip` beim Zeichnen.

export type Pt = [number, number];

const dir = (a: number, len: number): Pt => [Math.sin((a * Math.PI) / 180) * len, Math.cos((a * Math.PI) / 180) * len];
const add = (p: Pt, q: Pt): Pt => [p[0] + q[0], p[1] + q[1]];

/** Maße in Figur-Einheiten (stehend ~355 hoch). */
export const DIM = {
	torso: 108,
	shoulderDrop: 14,
	headGap: 47,
	headR: 30,
	upperArm: 56,
	foreArm: 50,
	hand: 18,
	thigh: 86,
	shin: 84,
	foot: 24,
};

/** Arm im Profil: s = Schulter relativ zum hängenden Arm entlang des Rumpfs (+ = nach vorn),
 *  e = Ellbogenbeugung (+ = Unterarm nach vorn/oben), h = Handwinkel relativ zum Unterarm,
 *  fs = Verkürzung von Unterarm+Hand (Unterarm zeigt quer zum Körper, z. B. Hände auf der Brust). */
export type Arm = {s: number; e: number; h?: number; fs?: number};
/** Bein: h = Oberschenkel absolut (0 = senkrecht nach unten, + = nach vorn),
 *  k = Kniebeugung (+ = Unterschenkel nach hinten), f = Fuß relativ zum Unterschenkel (90 = nach vorn). */
export type Leg = {h: number; k: number; f?: number};

export type ProfilePose = {
	/** Rumpfneigung: 0 = aufrecht, 90 = waagrecht nach vorn. */
	lean: number;
	/** Kopfneigung zusätzlich zum Rumpf (+ = Kopf gesenkt). */
	tilt: number;
	armN: Arm;
	armF: Arm;
	legN: Leg;
	legF: Leg;
};

export type ProfileJoints = {
	pelvis: Pt;
	neck: Pt;
	head: Pt;
	shoulder: Pt;
	arm: {N: Pt[]; F: Pt[]};
	leg: {N: Pt[]; F: Pt[]};
};

/** Gelenkpunkte relativ zur Hüfte (0,0). */
export const solveProfile = (p: ProfilePose): ProfileJoints => {
	const P: Pt = [0, 0];
	const N = add(P, dir(180 - p.lean, DIM.torso));
	const head = add(N, dir(180 - p.lean - p.tilt, DIM.headGap));
	const S = add(N, dir(-p.lean, DIM.shoulderDrop));
	const arm = (a: Arm): Pt[] => {
		const up = -p.lean + a.s;
		const fo = up + a.e;
		const E = add(S, dir(up, DIM.upperArm));
		const k = a.fs ?? 1;
		const W = add(E, dir(fo, DIM.foreArm * k));
		const H = add(W, dir(fo + (a.h ?? 0), DIM.hand * k));
		return [S, E, W, H];
	};
	const leg = (l: Leg): Pt[] => {
		const K = add(P, dir(l.h, DIM.thigh));
		const shinA = l.h - l.k;
		const A = add(K, dir(shinA, DIM.shin));
		const T = add(A, dir(shinA + (l.f ?? 90), DIM.foot));
		return [P, K, A, T];
	};
	return {pelvis: P, neck: N, head, shoulder: S, arm: {N: arm(p.armN), F: arm(p.armF)}, leg: {N: leg(p.legN), F: leg(p.legF)}};
};

/** Tiefster Punkt der Silhouette (für den Bodenkontakt), relativ zur Hüfte. */
export const lowestProfile = (j: ProfileJoints) => {
	const pts = [...j.leg.N.slice(1), ...j.leg.F.slice(1), ...j.arm.N.slice(2), ...j.arm.F.slice(2)];
	let y = j.head[1] + DIM.headR;
	for (const p of pts) y = Math.max(y, p[1] + 13);
	return y;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixArm = (a: Arm, b: Arm, t: number): Arm => ({s: lerp(a.s, b.s, t), e: lerp(a.e, b.e, t), h: lerp(a.h ?? 0, b.h ?? 0, t), fs: lerp(a.fs ?? 1, b.fs ?? 1, t)});
const mixLeg = (a: Leg, b: Leg, t: number): Leg => ({h: lerp(a.h, b.h, t), k: lerp(a.k, b.k, t), f: lerp(a.f ?? 90, b.f ?? 90, t)});

/**
 * Winkel-Überblendung mit Versatz: Rumpf führt, Kopf und Arme folgen etwas später
 * (t in 0..1, bereits geglättet; `lag` verschiebt Arme/Kopf).
 */
export const mixProfile = (a: ProfilePose, b: ProfilePose, t: number, lag = 0.12): ProfilePose => {
	const late = Math.min(1, Math.max(0, (t - lag) / (1 - lag)));
	const early = Math.min(1, t / (1 - lag));
	return {
		lean: lerp(a.lean, b.lean, early),
		tilt: lerp(a.tilt, b.tilt, late),
		armN: mixArm(a.armN, b.armN, late),
		armF: mixArm(a.armF, b.armF, late),
		legN: mixLeg(a.legN, b.legN, early),
		legF: mixLeg(a.legF, b.legF, early),
	};
};

// ---------- Zeichnen ----------

/** Gefüllte Kapsel von a nach b mit Breiten wa → wb (runde Enden). */
const capsule = (a: Pt, b: Pt, wa: number, wb: number) => {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const len = Math.hypot(dx, dy) || 0.001;
	const nx = -dy / len;
	const ny = dx / len;
	const ra = wa / 2;
	const rb = wb / 2;
	const p1 = [a[0] + nx * ra, a[1] + ny * ra];
	const p2 = [b[0] + nx * rb, b[1] + ny * rb];
	const p3 = [b[0] - nx * rb, b[1] - ny * rb];
	const p4 = [a[0] - nx * ra, a[1] - ny * ra];
	return `M${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} A${rb} ${rb} 0 0 0 ${p3[0]} ${p3[1]} L${p4[0]} ${p4[1]} A${ra} ${ra} 0 0 0 ${p1[0]} ${p1[1]} Z`;
};

const W = {upperArm: [27, 23], foreArm: [23, 20], hand: [21, 15], thigh: [40, 31], shin: [30, 24], foot: [20, 16]} as const;

const limbPaths = (pts: Pt[], widths: readonly (readonly [number, number])[]) =>
	widths.map((w, i) => capsule(pts[i], pts[i + 1], w[0], w[1]));

export const ProfileBody: React.FC<{
	pose: ProfilePose;
	color: string;
	far?: string;
	gap?: string;
	/** Füße zeichnen (stehend ja, kniend ebenfalls – liegen dann hinten auf). */
	feet?: boolean;
	/** Zusätzliches Bild an der vorderen Hand (z. B. Gebetskette, Stock), in Figur-Koordinaten. */
	handProp?: (hand: Pt[]) => React.ReactNode;
}> = ({pose, color, far = color, gap = '#05070d', feet = true, handProp}) => {
	const j = solveProfile(pose);
	const legW = feet ? [W.thigh, W.shin, W.foot] : [W.thigh, W.shin];
	const armW = [W.upperArm, W.foreArm, W.hand];
	const farLeg = limbPaths(j.leg.F, legW);
	const nearLeg = limbPaths(j.leg.N, legW);
	const farArm = limbPaths(j.arm.F, armW);
	const nearArm = limbPaths(j.arm.N, armW);
	// Rumpf: vorn etwas voller (Brust), hinten gerade
	const torso = capsule(j.pelvis, j.neck, 50, 58);
	const G = 7;
	const draw = (ds: string[], fill: string, outline: boolean) => (
		<g>
			{outline && ds.map((d, i) => <path key={`o${i}`} d={d} fill={gap} stroke={gap} strokeWidth={G * 2} strokeLinejoin="round" />)}
			{ds.map((d, i) => (
				<path key={i} d={d} fill={fill} />
			))}
		</g>
	);
	return (
		<g>
			{draw(farArm, far, false)}
			{draw(farLeg, far, false)}
			{draw([torso], color, true)}
			{draw(nearLeg, color, true)}
			<circle cx={j.head[0]} cy={j.head[1]} r={DIM.headR + G} fill={gap} />
			<circle cx={j.head[0]} cy={j.head[1]} r={DIM.headR} fill={color} />
			{draw(nearArm, color, true)}
			{handProp?.(j.arm.N)}
		</g>
	);
};

// ---------- Frontalansicht ----------

/** Arm frontal: a = Oberarm nach außen (0 = hängt, 90 = waagrecht, 180 = hoch),
 *  e = Unterarm zusätzlich nach außen (negativ = nach innen zum Körper). */
export type FArm = {a: number; e: number};
export type FrontPose = {armL: FArm; armR: FArm; legL: number; legR: number; tilt?: number};

export const solveFront = (p: FrontPose) => {
	const P: Pt = [0, 0];
	const N: Pt = [0, -DIM.torso];
	const head: Pt = [p.tilt ?? 0, -DIM.torso - DIM.headGap];
	const arm = (side: 1 | -1, a: FArm): Pt[] => {
		const S: Pt = [side * 31, -DIM.torso + 14];
		const E = add(S, [side * Math.sin((a.a * Math.PI) / 180) * DIM.upperArm, Math.cos((a.a * Math.PI) / 180) * DIM.upperArm]);
		const fa = a.a + a.e;
		const Wr = add(E, [side * Math.sin((fa * Math.PI) / 180) * DIM.foreArm, Math.cos((fa * Math.PI) / 180) * DIM.foreArm]);
		const H = add(Wr, [side * Math.sin((fa * Math.PI) / 180) * DIM.hand, Math.cos((fa * Math.PI) / 180) * DIM.hand]);
		return [S, E, Wr, H];
	};
	const leg = (side: 1 | -1, a: number): Pt[] => {
		const Hp: Pt = [side * 17, 0];
		const K = add(Hp, [side * Math.sin((a * Math.PI) / 180) * DIM.thigh, Math.cos((a * Math.PI) / 180) * DIM.thigh]);
		const A = add(K, [side * Math.sin((a * Math.PI) / 180) * DIM.shin, Math.cos((a * Math.PI) / 180) * DIM.shin]);
		return [Hp, K, A];
	};
	return {pelvis: P, neck: N, head, armL: arm(-1, p.armL), armR: arm(1, p.armR), legL: leg(-1, p.legL), legR: leg(1, p.legR)};
};

export const mixFront = (a: FrontPose, b: FrontPose, t: number): FrontPose => {
	const m = (x: FArm, y: FArm): FArm => ({a: lerp(x.a, y.a, t), e: lerp(x.e, y.e, t)});
	return {armL: m(a.armL, b.armL), armR: m(a.armR, b.armR), legL: lerp(a.legL, b.legL, t), legR: lerp(a.legR, b.legR, t), tilt: lerp(a.tilt ?? 0, b.tilt ?? 0, t)};
};

/** Frontalfigur: Höhe der Füße unter der Hüfte. */
export const FRONT_LIFT = DIM.thigh + DIM.shin + 13;

export const FrontBody: React.FC<{pose: FrontPose; color: string; gap?: string}> = ({pose, color, gap = '#05070d'}) => {
	const j = solveFront(pose);
	const armW = [W.upperArm, W.foreArm, W.hand];
	const legW = [[42, 34], [34, 27]] as const;
	// Rumpf als Trapez mit runden Ecken: Schultern breit, Hüfte schmaler
	const torso = `M${-38} ${-DIM.torso + 6} Q 0 ${-DIM.torso - 8} 38 ${-DIM.torso + 6} L 30 12 Q 0 20 -30 12 Z`;
	const G = 7;
	const part = (ds: string[], outline: boolean) => (
		<g>
			{outline && ds.map((d, i) => <path key={`o${i}`} d={d} fill={gap} stroke={gap} strokeWidth={G * 2} strokeLinejoin="round" />)}
			{ds.map((d, i) => (
				<path key={i} d={d} fill={color} />
			))}
		</g>
	);
	return (
		<g>
			{part([...limbPaths(j.legL, legW), ...limbPaths(j.legR, legW)], false)}
			<path d={torso} fill={color} stroke={color} strokeWidth={14} strokeLinejoin="round" />
			<circle cx={j.head[0]} cy={j.head[1]} r={DIM.headR} fill={color} />
			{part(limbPaths(j.armL, armW), true)}
			{part(limbPaths(j.armR, armW), true)}
		</g>
	);
};
