// Posen der Figur. Koordinaten relativ zur Hüfte (0,0), y nach unten, Profil schaut nach +x.
// `lift` = Höhe der Hüfte über dem Boden (in Figur-Einheiten), damit Knien und Niederwerfen
// auf demselben Boden stehen wie das Stehen.
import {mixPose, type Pose} from './components/Figure';

export type Stance = {pose: Pose; lift: number};

const s = (pose: Pose, lift = 164): Stance => ({pose, lift});

// ---------- frontal ----------
export const STAND = s({
	neck: [0, -115],
	head: [0, -163],
	lHand: [-36, 4],
	rHand: [36, 4],
	lFoot: [-30, 164],
	rFoot: [30, 164],
	bend: {lArm: 1, rArm: -1},
});
/** Rechte Hand aufs Herz, Kopf leicht gesenkt: Gedenken. */
export const CHEST = s({...STAND.pose, head: [0, -158], rHand: [-4, -72], bend: {lArm: 1, rArm: -1}});
/** Beide Hände neben dem Kopf erhoben, Ellbogen nach unten: Bittgebet / Dank. */
export const DUA = s({...STAND.pose, head: [0, -166], lHand: [-96, -150], rHand: [96, -150], bend: {lArm: -1, rArm: 1}});
/** Hände in die Hüften, Kopf gehoben, leicht zurückgelehnt: Hochmut. */
export const PROUD = s({...STAND.pose, neck: [-6, -114], head: [-10, -166], lHand: [-30, -14], rHand: [26, -16], bend: {lArm: 1, rArm: -1}});
/** Arme weit geöffnet nach oben: lebendig. */
export const OPEN = s({...STAND.pose, head: [0, -168], lHand: [-112, -160], rHand: [112, -160], bend: {lArm: 1, rArm: -1}});

// ---------- Profil (Blick nach rechts) ----------
/** Stehen im Gebet, Hände auf der Brust. */
export const QIYAM = s({
	neck: [4, -115],
	head: [10, -162],
	lHand: [30, -66],
	rHand: [36, -70],
	lFoot: [-6, 164],
	rFoot: [6, 164],
	bend: {lArm: -1, rArm: -1, lLeg: 1, rLeg: 1},
});
/** Verbeugung, Hände auf den Knien. */
export const RUKU = s({
	neck: [112, -26],
	head: [160, -16],
	lHand: [20, 72],
	rHand: [28, 74],
	lFoot: [-6, 164],
	rFoot: [6, 164],
	bend: {lArm: -1, rArm: -1, lLeg: 1, rLeg: 1},
});
/** Kniend auf den Fersen, Hände auf den Oberschenkeln. */
export const JALSA = s(
	{
		neck: [6, -115],
		head: [12, -162],
		lHand: [54, 14],
		rHand: [62, 12],
		lFoot: [-8, 42],
		rFoot: [-2, 42],
		bend: {lArm: -1, rArm: -1, lLeg: 1, rLeg: 1},
	},
	48,
);
/** Kniend, Hände vor der Brust geöffnet: Bittgebet. */
export const KNEEL_DUA = s({...JALSA.pose, head: [14, -166], lHand: [56, -64], rHand: [64, -70]}, 48);
/** Niederwerfung: Stirn und Hände am Boden. */
export const SUJUD = s(
	{
		neck: [92, 50],
		head: [132, 44],
		lHand: [112, 80],
		rHand: [120, 80],
		lFoot: [-74, 80],
		rFoot: [-68, 80],
		bend: {lArm: -1, rArm: -1, lLeg: -1, rLeg: -1},
	},
	86,
);

export const mixStance = (a: Stance, b: Stance, t: number): Stance => ({
	pose: mixPose(a.pose, b.pose, t),
	lift: a.lift + (b.lift - a.lift) * t,
});

/**
 * Langsames Gehen im Profil (Blick nach rechts). `phase` in Schritten (1 = ein Schritt).
 * Der Standfuß gleitet nach hinten, der Schwungfuß hebt ab und schwingt nach vorn.
 */
export const walk = (phase: number, base: Pose = QIYAM.pose): Stance => {
	const a = phase * Math.PI;
	const stride = 44;
	const lx = Math.cos(a) * stride;
	const sin = Math.sin(a);
	const step = 20;
	return {
		pose: {
			...base,
			lFoot: [lx, 160 - Math.max(0, -sin) * step],
			rFoot: [-lx, 160 - Math.max(0, sin) * step],
			bend: {...base.bend, lLeg: 1, rLeg: 1},
		},
		// Hüfte am höchsten, wenn die Füße beieinander sind
		lift: 156 + Math.abs(sin) * 5,
	};
};
