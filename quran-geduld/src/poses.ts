// Posen als Gelenkwinkel (siehe components/Body.tsx). Profil schaut nach +x.
import type {FrontPose, ProfilePose} from './components/Body';

const legStand = {h: 0, k: 0, f: 90};
const handsOnChest = {s: -4, e: 118, h: 6, fs: 0.62};

/** Stehen im Gebet, Hände auf der Brust, Blick zum Boden. */
export const QIYAM: ProfilePose = {
	lean: 0,
	tilt: 12,
	armN: handsOnChest,
	armF: {s: -6, e: 114, h: 6, fs: 0.62},
	legN: legStand,
	legF: {h: -3, k: 0, f: 90},
};

/** Verbeugung: Rücken waagrecht, Hände auf den Knien. */
export const RUKU: ProfilePose = {
	lean: 90,
	tilt: 2,
	armN: {s: 40, e: 0, h: 0},
	armF: {s: 38, e: 2, h: 0},
	legN: {h: -6, k: 0, f: 90},
	legF: {h: -8, k: 0, f: 90},
};

/** Sitzen auf den Fersen, Hände auf den Oberschenkeln. */
const kneelLegs = {legN: {h: 84, k: 172, f: 2}, legF: {h: 82, k: 170, f: 2}};
export const JALSA: ProfilePose = {
	lean: -3,
	tilt: 10,
	armN: {s: 12, e: 45, h: 0},
	armF: {s: 10, e: 48, h: 0},
	...kneelLegs,
};

/** Kniend im Bittgebet: Unterarme schräg nach oben, Hände geöffnet vor dem Gesicht. */
export const KNEEL_DUA: ProfilePose = {
	lean: -3,
	tilt: 4,
	armN: {s: 22, e: 115, h: 25},
	armF: {s: 18, e: 118, h: 25},
	...kneelLegs,
};

/** Kniend mit Gebetskette vor der Brust, Kopf gesenkt (Gedenken). */
export const KNEEL_DHIKR: ProfilePose = {
	lean: 2,
	tilt: 22,
	armN: {s: 14, e: 110, h: 10},
	armF: {s: 12, e: 50, h: 0},
	...kneelLegs,
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

/** Niederwerfung: Knie, Hände und Stirn am Boden, Hüfte oben. */
export const SUJUD: ProfilePose = {
	lean: 118,
	tilt: -24,
	armN: {s: 153, e: 65, h: 0},
	armF: {s: 150, e: 68, h: 0},
	legN: {h: 12, k: 102, f: 0},
	legF: {h: 10, k: 100, f: 0},
};

/** Gehen im Profil, `phase` in Schritten (1 = ein Schritt). Arme pendeln gegengleich. `A` = Schrittweite (Hüftwinkel). */
export const walkPose = (phase: number, base: ProfilePose, swingArms = true, A = 20): ProfilePose => {
	const a = phase * Math.PI;
	const s = Math.sin(a);
	const c = Math.cos(a);
	// Schwungbein (Oberschenkel bewegt sich nach vorn) beugt das Knie
	const knee = (dh: number) => 8 + Math.max(0, dh) * 38;
	return {
		...base,
		legN: {h: A * s, k: knee(c), f: 90},
		legF: {h: -A * s, k: knee(-c), f: 90},
		armN: swingArms ? {...base.armN, s: base.armN.s - 16 * s} : base.armN,
		armF: swingArms ? {...base.armF, s: base.armF.s + 16 * s} : base.armF,
	};
};

export const WALK_BASE: ProfilePose = {lean: 3, tilt: 0, armN: {s: 0, e: 20, h: 0}, armF: {s: 0, e: 20, h: 0}, legN: legStand, legF: legStand};

// ---------- frontal ----------
export const F_STAND: FrontPose = {armL: {a: 12, e: 0}, armR: {a: 12, e: 0}, legL: 4, legR: 4};
/** Hände in den Hüften (Hochmut im Vorbild). */
export const F_HIPS: FrontPose = {armL: {a: 48, e: -118}, armR: {a: 48, e: -118}, legL: 6, legR: 6};
/** Arme hoch geöffnet: lebendig. */
export const F_OPEN: FrontPose = {armL: {a: 135, e: 15}, armR: {a: 135, e: 15}, legL: 6, legR: 6};

/** Stehend, Kinn gehoben (Hochmut). */
export const PROUD: ProfilePose = {...WALK_BASE, lean: -4, tilt: -14, armN: {s: -8, e: 10}, armF: {s: -8, e: 10}};

/** Blinder Gang: Kopf gesenkt, vordere Hand führt den Stock, hintere hängt. */
export const BLIND_BASE: ProfilePose = {lean: 6, tilt: 18, armN: {s: 38, e: 14, h: 0}, armF: {s: 4, e: 14, h: 0}, legN: legStand, legF: legStand};
