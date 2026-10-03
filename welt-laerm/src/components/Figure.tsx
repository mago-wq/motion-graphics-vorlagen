// Piktogramm-Figur mit Gelenken: Hände und Füße werden als Zielpunkte angegeben,
// Ellbogen und Knie rechnet eine Zwei-Knochen-Kinematik aus. So lassen sich
// Posen wie „Hände an die Ohren“ oder ein Laufzyklus direkt beschreiben.
// Koordinaten relativ zur Hüfte (0,0), y nach unten.
export type Pt = [number, number];

export type Pose = {
	neck: Pt;
	head: Pt;
	lHand: Pt;
	rHand: Pt;
	lFoot: Pt;
	rFoot: Pt;
	/** Beugerichtung je Gelenk: +1 / -1 (Ellbogen bzw. Knie auf die eine oder andere Seite). */
	bend?: {lArm?: number; rArm?: number; lLeg?: number; rLeg?: number};
};

export type Face = 'none' | 'squint' | 'down' | 'up';

const ARM: [number, number] = [62, 58];
const LEG: [number, number] = [84, 82];

/** Zwei-Knochen-IK: liefert das Mittelgelenk zwischen a und b. */
export const solveJoint = (a: Pt, b: Pt, [l1, l2]: [number, number], bend: number): Pt => {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.001);
	const base = Math.atan2(dy, dx);
	const cos = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * Math.max(d, 0.001));
	const alpha = Math.acos(Math.max(-1, Math.min(1, cos)));
	const ang = base + bend * alpha;
	return [a[0] + l1 * Math.cos(ang), a[1] + l1 * Math.sin(ang)];
};

/** Reicht ein Ziel nicht, wird die Gliedmaße gestreckt in seine Richtung gelegt. */
const reach = (a: Pt, b: Pt, [l1, l2]: [number, number]): Pt => {
	const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
	const max = l1 + l2 - 0.5;
	if (d <= max) return b;
	return [a[0] + ((b[0] - a[0]) / d) * max, a[1] + ((b[1] - a[1]) / d) * max];
};

const limb = (a: Pt, target: Pt, lens: [number, number], bend: number) => {
	const b = reach(a, target, lens);
	const j = solveJoint(a, b, lens, bend);
	return `M${a[0]} ${a[1]} L${j[0]} ${j[1]} L${b[0]} ${b[1]}`;
};

const HEAD_R = 37;

export const Figure: React.FC<{
	pose: Pose;
	color: string;
	/** Farbe der hinteren Gliedmaßen (linker Arm/linkes Bein), für Tiefe. */
	far?: string;
	face?: Face;
	faceColor?: string;
	stroke?: number;
	/** Schwarze Trennfuge um jedes Teil, wie bei Piktogrammen. Aus bei Silhouetten. */
	outline?: boolean;
}> = ({pose, color, far = color, face = 'none', faceColor = '#000', stroke = 27, outline = true}) => {
	const b = {lArm: 1, rArm: -1, lLeg: -1, rLeg: -1, ...pose.bend};
	const [hx, hy] = pose.head;
	const gap = 10;
	const part = (d: string, c: string, w = stroke) => (
		<g>
			{outline && <path d={d} stroke="#000" strokeWidth={w + gap} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
			<path d={d} stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
		</g>
	);
	return (
		<g>
			{part(limb(pose.neck, pose.lHand, ARM, b.lArm), far)}
			{part(limb([0, 0], pose.lFoot, LEG, b.lLeg), far)}
			{part(limb([0, 0], pose.rFoot, LEG, b.rLeg), color)}
			{part(`M0 0 L${pose.neck[0]} ${pose.neck[1]}`, color, stroke * 1.25)}
			{outline && <circle cx={hx} cy={hy} r={HEAD_R + gap / 2} fill="#000" />}
			<circle cx={hx} cy={hy} r={HEAD_R} fill={color} />
			{part(limb(pose.neck, pose.rHand, ARM, b.rArm), color)}
			{face === 'squint' && (
				<g stroke={faceColor} strokeWidth={5} strokeLinecap="round" fill="none">
					<path d={`M${hx - 20} ${hy - 9} l11 6 l-11 6`} />
					<path d={`M${hx + 20} ${hy - 9} l-11 6 l11 6`} />
					<path d={`M${hx - 9} ${hy + 18} q9 -6 18 0`} />
				</g>
			)}
			{face === 'down' && (
				<g stroke={faceColor} strokeWidth={5} strokeLinecap="round" fill="none">
					<path d={`M${hx - 4} ${hy + 4} h12`} />
					<path d={`M${hx + 18} ${hy + 4} h12`} />
				</g>
			)}
			{face === 'up' && (
				<g fill={faceColor}>
					<circle cx={hx + 2} cy={hy - 10} r={5} />
					<circle cx={hx + 22} cy={hy - 10} r={5} />
				</g>
			)}
		</g>
	);
};

/** Lineare Mischung zweier Posen (t = 0..1), für weiche Posenwechsel. */
export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
	const m = (p: Pt, q: Pt): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
	return {
		neck: m(a.neck, b.neck),
		head: m(a.head, b.head),
		lHand: m(a.lHand, b.lHand),
		rHand: m(a.rHand, b.rHand),
		lFoot: m(a.lFoot, b.lFoot),
		rFoot: m(a.rFoot, b.rFoot),
		bend: t < 0.5 ? a.bend : b.bend,
	};
};
