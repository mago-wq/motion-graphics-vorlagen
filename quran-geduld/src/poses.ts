// Posen als Gelenkwinkel (siehe components/Body.tsx). Profil schaut nach +x.
// Wo eine Hand etwas berühren muss (Knie, Oberschenkel, Boden), rechnet `armTo` die
// Winkel einmal beim Laden aus – animiert wird trotzdem nur über Winkel.
import {armTo, DIM, type FrontPose, type ProfilePose} from './components/Body';

const legStand = {h: 0, k: 0, f: 90};
const rad = (a: number) => (a * Math.PI) / 180;
/** Knie-Position eines Beins relativ zur Hüfte. */
const knee = (h: number): [number, number] => [Math.sin(rad(h)) * DIM.thigh, Math.cos(rad(h)) * DIM.thigh];

/** Stehen im Gebet, Hände übereinander auf der Brust, Blick zum Boden. */
export const QIYAM: ProfilePose = {
	lean: 0,
	tilt: 12,
	armN: {s: -8, e: 112, h: 6, fs: 0.82},
	armF: {s: -10, e: 108, h: 6, fs: 0.82},
	legN: legStand,
	legF: {h: -3, k: 0, f: 90},
};

/** Verbeugung: Rücken waagrecht, Arme gestreckt, Hände auf den Knien. */
const ruku0: ProfilePose = {...QIYAM, lean: 88, tilt: 4, legN: {h: -7, k: 0, f: 90}, legF: {h: -9, k: 0, f: 90}};
const kR = knee(-7);
export const RUKU: ProfilePose = {
	...ruku0,
	armN: armTo(ruku0, [kR[0] + 14, kR[1] - 10], {up: true, handWorld: 0}),
	armF: armTo(ruku0, [kR[0] + 10, kR[1] - 12], {up: true, handWorld: 0}),
};

/** Kniend, auf den Fersen sitzend. */
const kneelLegs = {legN: {h: 84, k: 172, f: 2}, legF: {h: 82, k: 170, f: 2}};
const sit0: ProfilePose = {lean: -3, tilt: 10, armN: QIYAM.armN, armF: QIYAM.armF, ...kneelLegs};
/** Sitzen auf den Fersen, Hände flach auf den Oberschenkeln. */
export const JALSA: ProfilePose = {
	...sit0,
	armN: armTo(sit0, [50, -18], {up: false, handWorld: 92}),
	armF: armTo(sit0, [44, -20], {up: false, handWorld: 92}),
};

/** Kniend im Bittgebet: Unterarme schräg nach oben, Hände geöffnet vor der Brust. */
export const KNEEL_DUA: ProfilePose = {
	...sit0,
	tilt: 6,
	armN: armTo(sit0, [82, -70], {up: false, handWorld: 150}),
	armF: armTo(sit0, [76, -74], {up: false, handWorld: 150}),
};

/** Kniend mit Gebetskette in der Hand vor dem Bauch, Kopf gesenkt (Gedenken). */
export const KNEEL_DHIKR: ProfilePose = {
	...sit0,
	lean: 2,
	tilt: 22,
	armN: armTo({...sit0, lean: 2}, [46, -52], {up: false, handWorld: 120}),
	armF: armTo({...sit0, lean: 2}, [48, -18], {up: false, handWorld: 92}),
};

/** In die Knie gehen: Füße flach am Boden, Knie nach vorn, Hüfte nach hinten-unten. */
export const BEND_DOWN: ProfilePose = {
	lean: 34,
	tilt: 12,
	armN: {s: 30, e: 14, h: 0},
	armF: {s: 28, e: 16, h: 0},
	legN: {h: 62, k: 104, f: 132},
	legF: {h: 60, k: 102, f: 132},
};

/** Aufrecht kniend (Zwischenschritt vom Stehen in die Niederwerfung). */
export const KNEEL_UP: ProfilePose = {
	lean: 24,
	tilt: 14,
	armN: {s: 22, e: 12, h: 0},
	armF: {s: 20, e: 14, h: 0},
	legN: {h: 6, k: 96, f: 0},
	legF: {h: 4, k: 94, f: 0},
};

/**
 * Niederwerfung: Knie, Stirn und nur die Hände am Boden; die Ellbogen bleiben oben
 * (sie zeigen zur Seite, daher im Profil verkürzt: k).
 */
const sujud0: ProfilePose = {lean: 110, tilt: 34, armN: QIYAM.armN, armF: QIYAM.armF, legN: {h: 12, k: 102, f: 0}, legF: {h: 10, k: 100, f: 0}};
const SUJUD_GROUND = knee(12)[1] + 13;
export const SUJUD: ProfilePose = {
	...sujud0,
	armN: armTo(sujud0, [88, SUJUD_GROUND - 11], {up: true, k: 0.66, handWorld: 90}),
	armF: armTo(sujud0, [82, SUJUD_GROUND - 11], {up: true, k: 0.66, handWorld: 90}),
};

export const WALK_BASE: ProfilePose = {lean: 3, tilt: 0, armN: {s: 0, e: 18, h: 0}, armF: {s: 0, e: 18, h: 0}, legN: legStand, legF: legStand};

/** Gehen im Profil, `phase` in Schritten (1 = ein Schritt). Arme pendeln gegengleich. `A` = Schrittweite (Hüftwinkel). */
export const walkPose = (phase: number, base: ProfilePose, swingArms = true, A = 20): ProfilePose => {
	const a = phase * Math.PI;
	const s = Math.sin(a);
	const c = Math.cos(a);
	// Schwungbein (Oberschenkel bewegt sich nach vorn) beugt das Knie
	const kneeBend = (dh: number) => 8 + Math.max(0, dh) * 38;
	return {
		...base,
		legN: {h: A * s, k: kneeBend(c), f: 90},
		legF: {h: -A * s, k: kneeBend(-c), f: 90},
		armN: swingArms ? {...base.armN, s: base.armN.s - 16 * s} : base.armN,
		armF: swingArms ? {...base.armF, s: base.armF.s + 16 * s} : base.armF,
	};
};

/** Weggehen: Oberkörper deutlich nach vorn geneigt (Nutzer: vorher „fast nach hinten geneigt“). */
export const LEAVE: ProfilePose = {...WALK_BASE, lean: 16, tilt: 4, armN: {s: -4, e: 22}, armF: {s: -4, e: 22}};

/** Blinder Gang: Kopf gesenkt, vordere Hand führt den Stock, hintere hängt. */
export const BLIND_BASE: ProfilePose = {lean: 6, tilt: 18, armN: {s: 34, e: 16, h: 0}, armF: {s: 4, e: 14, h: 0}, legN: legStand, legF: legStand};

// ---------- frontal ----------
export const F_STAND: FrontPose = {armL: {a: 10, e: 0}, armR: {a: 10, e: 0}, legL: 4, legR: 4};
/** Hände in den Hüften. */
export const F_HIPS: FrontPose = {armL: {a: 46, e: -112}, armR: {a: 46, e: -112}, legL: 6, legR: 6};
/** Arme hoch geöffnet: lebendig. */
export const F_OPEN: FrontPose = {armL: {a: 135, e: 15}, armR: {a: 135, e: 15}, legL: 6, legR: 6};
