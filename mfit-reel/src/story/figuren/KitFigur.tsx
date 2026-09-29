// Variante 2 als animierbare Figur: Humaaans-Bauteile (Kopf, Jacke, Hände, Sneaker) mit
// eigenem Rigging. Beine: zwei Segmente mit Knie, per inverser Kinematik auf Fußpunkte
// gesetzt, die ein Gangzyklus vorgibt. Arme drehen um die Schulter (Cut-out-Technik): der
// hintere Arm ist im Original ein eigener Ärmel; beim vorderen sind Arm und Rumpf eine
// Form, deshalb ist der Rumpf an einer Rückenlinie abgeschnitten und der vordere Ärmel als
// eigenes Segment nachgebaut. Koordinaten: Humaaans-Einheiten, Ursprung Hüfte.
import {useId} from 'react';
import {interpolate} from 'remotion';
import {clamp} from '../../motion';
import {easeInOut, gangzustand} from './gang';
import {JACKE, KOPF, SNEAKER, SNEAKER_KNOECHEL, SNEAKER_SOHLE} from './humaaans';

/** Farben passend zur Lottie-Variante (helle Jacke, dunkles Shirt, goldene Sneaker) */
export const KIT_FARBEN = {
	haut: '#FFD1B7',
	/** ferne Hand etwas dunkler: sie liegt im Schatten des Körpers */
	hautFern: '#E2AF93',
	haare: '#32324C',
	jacke: '#E9E2D2',
	jackeHinten: '#C9BFA9',
	shirt: '#24262C',
	beinNah: '#3D4250',
	beinFern: '#2A2E38',
	schuh: '#D4A83D',
};

// Maße (Humaaans-Einheiten, Figur ca. 400 hoch)
const OBERSCHENKEL = 104;
const UNTERSCHENKEL = 104;
const KNOECHEL_HOEHE = SNEAKER_SOHLE - SNEAKER_KNOECHEL[1];
/** Sohle in Hüft-Koordinaten (stehend) */
export const KIT_SOHLE = 225;
/** Haaransatz oben in Hüft-Koordinaten */
export const KIT_OBEN = -173;
const KOPF_URSPRUNG = [-70, -201] as const;
/** Der Humaaans-Oberkörper ist vorgeneigt gezeichnet; so viel richten wir ihn auf (Grad) */
const AUFRICHTEN = -5;
const RUMPF_URSPRUNG = [-130, -119] as const;
const SCHULTER_HINTEN = [128, 12] as const;
/** vorderer Arm: Schultergelenk und Mitte des Ärmelsaums (Rumpf-Koordinaten, Grundpose) */
const SCHULTER_VORN = [110, 16] as const;
const SAUM_VORN = [74, 141] as const;

/** Anteil der Standphase am Zyklus */
const STAND = 0.6;
/** Phase beim Anhalten: ferner Fuß unter der Hüfte, naher Fuß schwingt gerade durch */
const HALT_PHASE = 0.8;

type Fuss = {x: number; y: number; w: number};

const smooth = (a: number, b: number, x: number) => {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};

/** Fußpunkt (Knöchel) und Fußwinkel für die lokale Phase `p` (0 = Aufsetzen vorn). */
const fussImGang = (p: number, zyklusWeg: number, hub: number): Fuss => {
	const q = ((p % 1) + 1) % 1;
	const d = (STAND * zyklusWeg) / 2;
	const yBoden = KIT_SOHLE - KNOECHEL_HOEHE;
	const ferse = (x: number) => {
		// Ferse hebt am Ende der Standphase ab, Drehung um die Fußspitze
		const w = 22 * smooth(STAND - 0.14, STAND, x);
		const r = (w * Math.PI) / 180;
		return {w, dx: 40 * (1 - Math.cos(r)), dy: -40 * Math.sin(r)};
	};
	if (q < STAND) {
		const f = ferse(q);
		return {x: d - (2 * d * q) / STAND + f.dx, y: yBoden + f.dy, w: f.w};
	}
	const u = (q - STAND) / (1 - STAND);
	const start = ferse(STAND);
	const xs = -d + start.dx;
	const ys = yBoden + start.dy;
	const x = xs + (d - xs) * easeInOut(u);
	const y = ys + (yBoden - ys) * u - hub * Math.sin(Math.PI * u);
	const w = u < 0.8 ? 22 + (-6 - 22) * (u / 0.8) : -6 + 6 * ((u - 0.8) / 0.2);
	return {x, y, w};
};

/** Knie per inverser Kinematik; das Knie zeigt nach vorn (+x). */
const knie = (hy: number, f: Fuss): [number, number] => {
	const dx = f.x;
	const dy = f.y - hy;
	const r = Math.min(Math.hypot(dx, dy), OBERSCHENKEL + UNTERSCHENKEL - 0.01);
	const a = Math.atan2(dy, dx);
	const b = Math.acos((OBERSCHENKEL ** 2 + r * r - UNTERSCHENKEL ** 2) / (2 * OBERSCHENKEL * r));
	return [OBERSCHENKEL * Math.cos(a - b), hy + OBERSCHENKEL * Math.sin(a - b)];
};

/** Viereck von a nach b mit Breiten wa → wb */
const segment = (a: readonly [number, number], b: readonly [number, number], wa: number, wb: number): string => {
	const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
	const nx = -(b[1] - a[1]) / l;
	const ny = (b[0] - a[0]) / l;
	const p = (q: readonly [number, number], w: number, s: number) => `${q[0] + (nx * w * s) / 2} ${q[1] + (ny * w * s) / 2}`;
	return `M ${p(a, wa, 1)} L ${p(b, wb, 1)} L ${p(b, wb, -1)} L ${p(a, wa, -1)} Z`;
};

const Bein: React.FC<{hy: number; fuss: Fuss; farbe: string; schuh: string}> = ({hy, fuss, farbe, schuh}) => {
	const k = knie(hy, fuss);
	const h: [number, number] = [0, hy];
	const f: [number, number] = [fuss.x, fuss.y];
	return (
		<g>
			<path d={segment(h, k, 50, 33)} fill={farbe} />
			<path d={segment(k, f, 33, 19)} fill={farbe} />
			<circle cx={k[0]} cy={k[1]} r={16.5} fill={farbe} />
			<circle cx={h[0]} cy={h[1]} r={25} fill={farbe} />
			<g transform={`translate(${fuss.x} ${fuss.y}) rotate(${fuss.w}) translate(${-SNEAKER_KNOECHEL[0]} ${-SNEAKER_KNOECHEL[1]})`}>
				<path d={SNEAKER} fill={schuh} />
			</g>
		</g>
	);
};

type Pose = {nah: Fuss; fern: Fuss; hy: number; armNah: number; armFern: number; neigung: number};

/** Arme hängen im Stand senkrecht; beim Gehen pendeln sie darum */
const ARM_STAND = {nah: -16, fern: 39};
const ARM_PENDEL = 18;

const gangPose = (phi: number, zyklusWeg: number): Pose => {
	const hub = 24;
	// naher Arm hinten, wenn das nahe Bein vorn ist (φ = 0), und umgekehrt
	const c = Math.cos(2 * Math.PI * phi);
	return {
		nah: fussImGang(phi, zyklusWeg, hub),
		fern: fussImGang(phi - 0.5, zyklusWeg, hub),
		// Hüfte am tiefsten beim Aufsetzen (Doppelstand), am höchsten in der Mitte
		hy: 11 * ((1 + Math.cos(4 * Math.PI * phi)) / 2),
		armNah: ARM_STAND.nah + ARM_PENDEL * c,
		// der ferne Arm schwingt nach hinten nur wenig: dort wäre er hinter dem Rücken zu sehen
		armFern: ARM_STAND.fern - ARM_PENDEL * (c > 0 ? c : 0.3 * c),
		neigung: 1.5,
	};
};

const mischeFuss = (a: Fuss, b: Fuss, t: number): Fuss => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t});

/** Pose der Figur im Videobild `frame`. `pxProZyklus`: Weg pro Doppelschritt in Bildpixeln, `skala`: px pro Einheit. */
export const kitPose = (frame: number, pxProZyklus: number, skala: number): Pose => {
	const zyklusWeg = pxProZyklus / skala;
	const halt = gangPose(HALT_PHASE, zyklusWeg);
	const yBoden = KIT_SOHLE - KNOECHEL_HOEHE;
	const stand: Pose = {
		nah: {x: halt.fern.x + 12, y: yBoden, w: 0},
		fern: halt.fern,
		hy: 0,
		armNah: ARM_STAND.nah,
		armFern: ARM_STAND.fern,
		neigung: 0,
	};
	const z = gangzustand(frame);
	if (z.art === 'gehen') return gangPose(HALT_PHASE + z.weg / pxProZyklus, zyklusWeg);
	if (z.art === 'schliessen') {
		// naher Fuß setzt neben dem fernen auf, Arme fallen in die Hängeposition
		const t = easeInOut(Math.min(1, z.u / 0.55));
		const a = easeInOut(z.u);
		const dip = 3 * Math.sin(Math.PI * interpolate(z.u, [0.35, 1], [0, 1], clamp));
		return {
			nah: mischeFuss(halt.nah, stand.nah, t),
			fern: halt.fern,
			hy: halt.hy + (stand.hy - halt.hy) * a + dip,
			armNah: halt.armNah + (stand.armNah - halt.armNah) * a,
			armFern: halt.armFern + (stand.armFern - halt.armFern) * a,
			neigung: halt.neigung * (1 - a),
		};
	}
	if (z.art === 'stehen') return stand;
	// Anlaufen: Zyklus läuft ab der Haltephase weiter, der nahe Fuß hebt aus dem Stand ab
	const phi = HALT_PHASE + z.weg / pxProZyklus;
	const g = gangPose(phi, zyklusWeg);
	const t = easeInOut(Math.min(1, (phi - HALT_PHASE) / 0.1));
	return {
		...g,
		nah: mischeFuss(stand.nah, g.nah, t),
		armNah: stand.armNah + (g.armNah - stand.armNah) * t,
		armFern: stand.armFern + (g.armFern - stand.armFern) * t,
		hy: stand.hy + (g.hy - stand.hy) * t,
		neigung: g.neigung * t,
	};
};

// Rückenlinie: alles links davon gehört im Original zum vorderen Arm (Rumpf-Koordinaten)
const RUMPF_CLIP = '119,-30 80,134.6 78,175 270,175 270,-30';

/** Die Figur in Hüft-Koordinaten; die Sohle liegt bei y = KIT_SOHLE. */
export const KitFigur: React.FC<{pose: Pose}> = ({pose}) => {
	const raw = useId();
	const id = raw.replace(/[^a-zA-Z0-9_-]/g, '');
	const F = KIT_FARBEN;
	const {hy} = pose;
	return (
		<g>
			<defs>
				<clipPath id={`${id}-rumpf`}>
					<polygon points={RUMPF_CLIP} />
				</clipPath>
			</defs>
			{/* Kopf (liegt hinter dem Kragen) */}
			<g transform={`translate(0 ${hy}) rotate(${AUFRICHTEN + pose.neigung} 0 0) translate(${KOPF_URSPRUNG[0]} ${KOPF_URSPRUNG[1]})`}>
				<path d={KOPF.haut} fill={F.haut} transform={`translate(${KOPF.hautVersatz[0]} ${KOPF.hautVersatz[1]})`} />
				<path d={KOPF.haare} fill={F.haare} />
			</g>
			{/* Beine: fernes zuerst */}
			<Bein hy={hy} fuss={pose.fern} farbe={F.beinFern} schuh={F.schuh} />
			<Bein hy={hy} fuss={pose.nah} farbe={F.beinNah} schuh={F.schuh} />
			{/* Oberkörper */}
			<g transform={`translate(0 ${hy}) rotate(${AUFRICHTEN + pose.neigung} 0 0) translate(${RUMPF_URSPRUNG[0]} ${RUMPF_URSPRUNG[1]})`}>
				<g transform={`rotate(${pose.armFern} ${SCHULTER_HINTEN[0]} ${SCHULTER_HINTEN[1]})`}>
					<path d={JACKE.handVorn} fill={F.hautFern} />
					<path d={JACKE.aermelHinten} fill={F.jackeHinten} transform={JACKE.aermelHintenDrehung} />
				</g>
				<path d={JACKE.shirt} fill={F.shirt} />
				<path d={JACKE.jacke} fill={F.jacke} clipPath={`url(#${id}-rumpf)`} />
				<path d={JACKE.schatten} fill="#000000" fillOpacity={0.1} />
				<polygon points={JACKE.licht} fill="#FFFFFF" fillOpacity={0.2} />
				<g transform={`rotate(${pose.armNah} ${SCHULTER_VORN[0]} ${SCHULTER_VORN[1]})`}>
					<path d={JACKE.handHinten} fill={F.haut} />
					<path d={segment(SCHULTER_VORN, SAUM_VORN, 36, 33)} fill={F.jacke} />
					<circle cx={SCHULTER_VORN[0]} cy={SCHULTER_VORN[1]} r={18} fill={F.jacke} />
				</g>
			</g>
		</g>
	);
};
