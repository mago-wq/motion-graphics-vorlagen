// Szene 3 – „Müdigkeit und Unruhe“: Brustbild mit schweren Lidern.
// Der Kopf nickt weg (Sekundenschlaf), schreckt hoch; darüber kreist
// ein nervöses Gedankenknäuel, das sich selbst zeichnet und nie still steht.
import {interpolate, random, spring, useCurrentFrame} from 'remotion';
import {CONFIG} from '../config';
import {SceneShell} from '../components/SceneShell';
import {clamp, easeInOut, jitter, lightLevel, tween} from '../motion';
import {T} from '../timing';
import {FPS} from '../video';

const HEAD = {x: 540, y: 1090, r: 172};
const EYE = {dx: 64, dy: 12, rx: 38, ry: 27};
const KNOT = {x: 540, y: 800, rx: 150, ry: 62};

const NOD_FROM = 18;
const NOD_TO = 66;
const BLINK_AT = 112;

/** Unruhiges Knäuel: Schleifen um eine Ellipse, neu „gekocht“ alle 3 Frames. */
const knotPath = (boil: number) => {
	const pts: [number, number][] = [];
	const n = 70;
	for (let i = 0; i <= n; i++) {
		const a = i * 0.52;
		const wob = 0.55 + 0.45 * Math.sin(i * 1.37) + (random(`k${i}-${boil}`) - 0.5) * 0.18;
		const drift = (i / n - 0.5) * 70;
		pts.push([KNOT.x + drift + Math.cos(a) * KNOT.rx * wob, KNOT.y + Math.sin(a) * KNOT.ry * wob]);
	}
	let d = `M${pts[0][0]} ${pts[0][1]}`;
	for (let i = 1; i < pts.length - 1; i++) {
		const mx = (pts[i][0] + pts[i + 1][0]) / 2;
		const my = (pts[i][1] + pts[i + 1][1]) / 2;
		d += ` Q${pts[i][0]} ${pts[i][1]} ${mx} ${my}`;
	}
	return d;
};

const Eye: React.FC<{side: -1 | 1; lid: number; id: string}> = ({side, lid, id}) => {
	const cx = HEAD.x + side * EYE.dx;
	const cy = HEAD.y + EYE.dy;
	const lidY = cy - EYE.ry + 2 * EYE.ry * lid;
	return (
		<g>
			<clipPath id={id}>
				<ellipse cx={cx} cy={cy} rx={EYE.rx} ry={EYE.ry} />
			</clipPath>
			<g clipPath={`url(#${id})`}>
				<rect x={cx - EYE.rx} y={lidY} width={EYE.rx * 2} height={EYE.ry * 2} fill="#000" />
			</g>
			{/* Augenringe */}
			<path d={`M${cx - 30} ${cy + EYE.ry + 14} q30 ${16} 60 0`} fill="none" stroke="#000" strokeWidth={6} strokeLinecap="round" opacity={0.85} />
		</g>
	);
};

export const MuedeScene: React.FC = () => {
	const frame = useCurrentFrame();
	const t = T.muede;
	const level = lightLevel(frame, t.from, t.to);
	if (level === 0) return null;
	const f = frame - t.from;
	const ink = CONFIG.colors.ink;

	// Lider: halb offen → fallen zu (Wegnicken) → Aufschrecken → wieder schwer, ein Blinzeln
	const wake = spring({frame: f - NOD_TO, fps: FPS, config: {damping: 9, stiffness: 220}});
	let lid = tween(f, NOD_FROM, NOD_TO, 0.48, 0.97, easeInOut);
	if (f >= NOD_TO) lid = interpolate(wake, [0, 1], [0.97, 0.22]) + tween(f, NOD_TO + 12, NOD_TO + 40, 0, 0.3, easeInOut);
	const blink = interpolate(f, [BLINK_AT, BLINK_AT + 3, BLINK_AT + 7], [0, 1, 0], clamp);
	lid = Math.min(1, lid + blink * (1 - lid));

	const sink = f < NOD_TO ? tween(f, NOD_FROM, NOD_TO, 0, 34, easeInOut) : interpolate(wake, [0, 1], [34, -4]);
	const tilt = f < NOD_TO ? tween(f, NOD_FROM, NOD_TO, 0, -5, easeInOut) : interpolate(wake, [0, 1], [-5, 1.5]);
	const breathe = Math.sin(f / 14) * 4;

	const draw = tween(f, 6, 70, 0, 1, easeInOut);
	const boil = Math.floor(f / 3);
	const knotRot = f * 0.35 + jitter('kr', f, 2.5, 3);

	return (
		<SceneShell line={CONFIG.lines.muede} timing={t} level={level} color={ink} subtitle={{top: 270, fontSize: 60}} spotlightY={56}>
			{/* Gedankenknäuel */}
			<g transform={`rotate(${knotRot} ${KNOT.x} ${KNOT.y}) translate(${jitter('kx', f, 3, 3)} ${jitter('ky', f, 3, 3)})`}>
				<path d={knotPath(boil)} fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
			</g>
			{/* Schultern */}
			<path d={`M190 1930 L190 ${1560} A350 300 0 0 1 890 1560 L890 1930 Z`} fill={ink} transform={`translate(0 ${breathe})`} />
			{/* Kopf mit Gesicht */}
			<g transform={`translate(0 ${sink + breathe * 0.6}) rotate(${tilt} ${HEAD.x} ${HEAD.y})`}>
				<circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={ink} />
				<Eye side={-1} lid={lid} id="eyeL" />
				<Eye side={1} lid={lid} id="eyeR" />
				<path d={`M${HEAD.x - 34} ${HEAD.y + 100} q17 -9 34 -2 q17 7 34 -1`} fill="none" stroke="#000" strokeWidth={7} strokeLinecap="round" />
			</g>
		</SceneShell>
	);
};
