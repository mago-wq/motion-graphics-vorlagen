// Vers 153: „O ihr, die ihr glaubt, sucht Hilfe in der Geduld und im Gebet.
// Gewiss, Allah ist mit den Geduldigen.“
import type {ProfilePose} from '../components/Body';
import {Profile} from '../components/Person';
import {Emblem, Hourglass, Motes, Rays} from '../components/Props';
import {Halo, Layer, SceneShell, useScene, type SceneProps} from '../components/Scene';
import {CONFIG} from '../config';
import {breathe, easeInOut, tween} from '../motion';
import {sequence} from '../motion2';
import {BEND_DOWN, JALSA, KNEEL_DUA, KNEEL_UP, QIYAM, RUKU, SUJUD} from '../poses';
import {GROUND} from '../video';

const {ink, warm} = CONFIG.colors;
const SCALE = 1.65;

/** Bittgebet mit ruhigem Atmen: Hände heben und senken sich kaum merklich. */
const duaBreath = (f: number, up = 0): ProfilePose => ({
	...KNEEL_DUA,
	tilt: KNEEL_DUA.tilt - up,
	armN: {...KNEEL_DUA.armN, s: KNEEL_DUA.armN.s + breathe(f, 75, 3), e: KNEEL_DUA.armN.e + up * 0.6},
	armF: {...KNEEL_DUA.armF, s: KNEEL_DUA.armF.s + breathe(f, 75, 3), e: KNEEL_DUA.armF.e + up * 0.6},
});

/** Kniende Figur im Bittgebet, daneben eine Sanduhr, die rieselt und sich umdreht (Geduld). */
export const Geduld: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const CYCLE = 100;
	const FLIP = 16;
	const c = f % CYCLE;
	const t = tween(c, 0, CYCLE - FLIP, 0, 1, (x) => x);
	// Nur während des Umdrehens rotieren; danach wieder 0°, denn die Uhr ist symmetrisch:
	// die volle Kammer liegt nach dem Drehen oben, der Sand fließt nach unten.
	const rot = tween(c, CYCLE - FLIP, CYCLE, 0, 180, easeInOut);
	return (
		<SceneShell level={level} {...props}>
			<Layer glow={ink}>
				<Profile pose={duaBreath(f)} x={330} anchor="ankle" scale={SCALE} />
				<Hourglass x={780} y={1260} h={290} t={t} rot={rot} f={f} />
			</Layer>
		</SceneShell>
	);
};

/** Gebetsablauf: Stehen – Verbeugen – Aufrichten – in die Knie – Niederwerfen – Sitzen – Niederwerfen. */
const PRAYER: [number, ProfilePose][] = [
	[0, QIYAM],
	[26, QIYAM],
	[46, RUKU],
	[76, RUKU],
	[96, QIYAM],
	[106, QIYAM],
	[118, BEND_DOWN],
	[132, KNEEL_UP],
	[150, SUJUD],
	[178, SUJUD],
	[198, JALSA],
	[214, JALSA],
	[236, SUJUD],
];

export const Gebet: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const W = 460;
	const top = 900;
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
				<Profile pose={sequence(f, PRAYER)} x={420} anchor="ankle" scale={SCALE} />
			</Layer>
		</SceneShell>
	);
};

/** Warmes Licht vom Emblem hüllt die kniende Figur ein; sie hebt Blick und Hände etwas höher. */
export const MitAllah: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const warmth = tween(f, 6, 46, 0, 1, easeInOut);
	const ring = (f % 45) / 45;
	return (
		<SceneShell level={level} {...props}>
			<Halo x={430} y={1280} r={360} color={warm} opacity={warmth} />
			<Layer glow={warm} strength={0.9}>
				<Rays cx={760} cy={960} f={f} n={12} len={560} color={warm} strength={warmth} id="ma" />
				<circle cx={760} cy={960} r={90 + ring * 300} fill="none" stroke={warm} strokeWidth={3} opacity={(1 - ring) * 0.5 * warmth} />
				<Emblem x={760} y={960} size={150} rot={f * 0.5} />
				<Motes f={f} n={14} x={480} w={300} y0={1020} y1={1440} color={warm} seed="m" opacity={warmth} />
			</Layer>
			<Layer glow={ink}>
				<Profile pose={duaBreath(f, tween(f, 10, 50, 0, 14, easeInOut))} x={330} anchor="ankle" scale={SCALE} />
			</Layer>
		</SceneShell>
	);
};
