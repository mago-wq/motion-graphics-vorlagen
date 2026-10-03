// Vers 153: „O ihr, die ihr glaubt, sucht Hilfe in der Geduld und im Gebet.
// Gewiss, Allah ist mit den Geduldigen.“
import {CONFIG} from '../config';
import {Emblem, Fig, Hourglass, Motes, Rays} from '../components/Props';
import {Halo, Layer, SceneShell, useScene, type SceneProps} from '../components/Scene';
import {breathe, easeInOut, tween} from '../motion';
import {JALSA, KNEEL_DUA, mixStance, QIYAM, RUKU, SUJUD, type Stance} from '../poses';
import {GROUND} from '../video';

const {ink, warm} = CONFIG.colors;

/** Kniende Figur im Bittgebet, daneben eine Sanduhr, die rieselt und sich umdreht (Geduld). */
export const Geduld: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const CYCLE = 100;
	const FLIP = 16;
	const k = Math.floor(f / CYCLE);
	const c = f % CYCLE;
	const t = tween(c, 0, CYCLE - FLIP, 0, 1, (x) => x);
	const rot = k * 180 + tween(c, CYCLE - FLIP, CYCLE, 0, 180, easeInOut);
	const hands = breathe(f, 80, 4);
	const stance: Stance = {
		...KNEEL_DUA,
		pose: {...KNEEL_DUA.pose, lHand: [56, -64 + hands], rHand: [64, -70 + hands]},
	};
	return (
		<SceneShell level={level} {...props}>
			<Layer glow={ink}>
				<Fig x={400} stance={stance} />
				<Hourglass x={760} y={1250} h={300} t={t} rot={rot} f={f} />
				<Motes f={f} n={10} x={430} w={200} y0={1300} y1={900} color={ink} seed="g" opacity={0.6} />
			</Layer>
		</SceneShell>
	);
};

/** Gebetsablauf vor einer Gebetsnische: Stehen, Verbeugen, Aufrichten, Niederwerfen, Sitzen, Niederwerfen. */
const PRAYER: [number, Stance][] = [
	[0, QIYAM],
	[26, QIYAM],
	[44, RUKU],
	[72, RUKU],
	[90, QIYAM],
	[108, QIYAM],
	[124, JALSA],
	[140, SUJUD],
	[172, SUJUD],
	[190, JALSA],
	[208, JALSA],
	[226, SUJUD],
];

const prayerAt = (f: number): Stance => {
	for (let i = 0; i < PRAYER.length - 1; i++) {
		const [a, sa] = PRAYER[i];
		const [b, sb] = PRAYER[i + 1];
		if (f < b) return mixStance(sa, sb, tween(f, a, b, 0, 1, easeInOut));
	}
	return PRAYER[PRAYER.length - 1][1];
};

export const Gebet: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const W = 440;
	const top = 880;
	const L = 540 - W / 2;
	const arch = `M${L} ${GROUND} L${L} ${top + 200} Q ${L} ${top + 40} 540 ${top} Q ${L + W} ${top + 40} ${L + W} ${top + 200} L${L + W} ${GROUND}`;
	return (
		<SceneShell level={level} {...props}>
			<Layer glow={warm} strength={0.7} opacity={0.55}>
				<path d={arch} fill="none" stroke={warm} strokeWidth={6} strokeLinejoin="round" />
				<path d={arch} fill="none" stroke={warm} strokeWidth={2} transform="translate(540 1470) scale(0.86) translate(-540 -1470)" />
				<line x1={L - 40} x2={L + W + 40} y1={GROUND + 4} y2={GROUND + 4} stroke={warm} strokeWidth={5} />
			</Layer>
			<Layer glow={ink}>
				<Fig x={440} stance={prayerAt(f)} />
			</Layer>
		</SceneShell>
	);
};

/** Warmes Licht vom Emblem hüllt die kniende Figur ein: Allah ist mit den Geduldigen. */
export const MitAllah: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const warmth = tween(f, 6, 46, 0, 1, easeInOut);
	const ring = (f % 45) / 45;
	return (
		<SceneShell level={level} {...props}>
			<Halo x={430} y={1250} r={360} color={warm} opacity={warmth} />
			<Layer glow={warm} strength={0.9}>
				<Rays cx={760} cy={960} f={f} n={12} len={560} color={warm} strength={warmth} id="ma" />
				<circle cx={760} cy={960} r={90 + ring * 300} fill="none" stroke={warm} strokeWidth={3} opacity={(1 - ring) * 0.5 * warmth} />
				<Emblem x={760} y={960} size={150} rot={f * 0.5} />
				<Motes f={f} n={14} x={480} w={300} y0={1000} y1={1440} color={warm} seed="m" opacity={warmth} />
			</Layer>
			<Layer glow={ink}>
				<Fig x={400} stance={KNEEL_DUA} rise={breathe(f, 80, 2)} />
			</Layer>
		</SceneShell>
	);
};
