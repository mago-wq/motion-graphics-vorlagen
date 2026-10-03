// Szene 2 – „satt“: Die Figur sitzt am Tisch, Kopf in der Hand.
// Aus dem Handy quellen Benachrichtigungen, der Zähler läuft hoch.
import {interpolate, random, spring, useCurrentFrame} from 'remotion';
import {CONFIG} from '../config';
import {Figure, type Pose} from '../components/Figure';
import {SceneShell} from '../components/SceneShell';
import {TITLE_FONT} from '../fonts';
import {clamp, jitter, lightLevel, tween} from '../motion';
import {T} from '../timing';
import {FPS} from '../video';

const ORIGIN: [number, number] = [330, 1280];
const SCALE = 1.7;

const SLUMP: Pose = {
	neck: [56, -96],
	head: [92, -132],
	lHand: [176, -46],
	rHand: [132, -128],
	lFoot: [74, 84],
	rFoot: [96, 84],
	bend: {lArm: 1, rArm: 1, lLeg: -1, rLeg: -1},
};

const PHONE = {x: 292, y: -128, w: 50, h: 92};
const BUBBLES = 8;
const BUBBLE_EVERY = 6;
const BUBBLE_FIRST = 7;

const Bubble: React.FC<{i: number; f: number; ink: string}> = ({i, f, ink}) => {
	const born = BUBBLE_FIRST + i * BUBBLE_EVERY;
	if (f < born) return null;
	const s = spring({frame: f - born, fps: FPS, config: {damping: 13, stiffness: 170, mass: 0.7}});
	// Ziel: Wolke über dem Handy, leicht versetzt gestapelt
	const tx = 40 + random(`bx${i}`) * 250 + (i % 2) * 20;
	const ty = -205 - random(`by${i}`) * 150 - (i % 3) * 18;
	const sx = PHONE.x + PHONE.w / 2;
	const sy = PHONE.y + 20;
	const x = interpolate(s, [0, 1], [sx, tx]);
	const y = interpolate(s, [0, 1], [sy, ty]) + Math.sin((f - born) / 9 + i) * 3;
	const w = 118;
	const h = 50;
	return (
		<g transform={`translate(${x} ${y}) scale(${Math.max(0, s)}) rotate(${(random(`br${i}`) - 0.5) * 10})`}>
			<rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill="none" stroke={ink} strokeWidth={6} />
			<circle cx={-w / 2 + 22} cy={0} r={10} fill={ink} />
			<path d={`M${-w / 2 + 42} -7 h${50 - (i % 3) * 8} M${-w / 2 + 42} 9 h${34}`} stroke={ink} strokeWidth={6} strokeLinecap="round" />
		</g>
	);
};

export const SattScene: React.FC = () => {
	const frame = useCurrentFrame();
	const t = T.satt;
	const level = lightLevel(frame, t.from, t.to);
	if (level === 0) return null;
	const f = frame - t.from;
	const ink = CONFIG.colors.ink;

	const arrived = Math.max(0, Math.min(BUBBLES, Math.floor((f - BUBBLE_FIRST) / BUBBLE_EVERY) + 1));
	const count = Math.min(99, Math.round(interpolate(f, [BUBBLE_FIRST, BUBBLE_FIRST + BUBBLES * BUBBLE_EVERY + 10], [1, 99], clamp)));
	// Handy-Bildschirm blitzt bei jeder neuen Nachricht
	const sinceLast = (f - BUBBLE_FIRST) % BUBBLE_EVERY;
	const flash = arrived > 0 && arrived <= BUBBLES ? interpolate(sinceLast, [0, 4], [0.9, 0.25], clamp) : 0.25;
	// Seufzer: der Kopf sinkt langsam tiefer in die Hand
	const sink = tween(f, 0, 60, 0, 10);
	const pose: Pose = {
		...SLUMP,
		head: [SLUMP.head[0] + sink * 0.4, SLUMP.head[1] + sink],
		rHand: [SLUMP.rHand[0] + sink * 0.4, SLUMP.rHand[1] + sink],
		neck: [SLUMP.neck[0], SLUMP.neck[1] + sink * 0.4],
	};
	const buzz = arrived > 0 && arrived <= BUBBLES && sinceLast < 4 ? jitter('buzz', f, 3, 1) : 0;

	return (
		<SceneShell line={CONFIG.lines.satt} timing={t} level={level} color={ink} subtitle={{top: 280, fontSize: 70}} spotlightY={58}>
			<g transform={`translate(${ORIGIN[0]} ${ORIGIN[1]}) scale(${SCALE})`}>
				{/* Hocker */}
				<rect x={-58} y={10} width={104} height={16} rx={6} fill={ink} />
				<path d="M-44 26 L-50 92 M32 26 L38 92" stroke={ink} strokeWidth={11} strokeLinecap="round" />
				{/* Tisch */}
				<rect x={118} y={-36} width={290} height={14} rx={6} fill={ink} />
				<path d="M140 -22 L140 92 M386 -22 L386 92" stroke={ink} strokeWidth={11} strokeLinecap="round" />
				<Figure pose={pose} color={ink} far="#a8a8a8" face="down" />
				{/* Handy */}
				<g transform={`translate(${buzz} 0)`}>
					<rect x={PHONE.x} y={PHONE.y} width={PHONE.w} height={PHONE.h} rx={10} fill="none" stroke={ink} strokeWidth={6} />
					<rect x={PHONE.x + 7} y={PHONE.y + 9} width={PHONE.w - 14} height={PHONE.h - 18} rx={4} fill={ink} opacity={flash} />
					{count > 0 && f >= BUBBLE_FIRST && (
						<g transform={`translate(${PHONE.x + PHONE.w} ${PHONE.y})`}>
							<circle r={22} fill={ink} />
							<text textAnchor="middle" dy={7} fontFamily={TITLE_FONT} fontWeight={900} fontSize={count > 9 ? 17 : 21} fill="#000">
								{count >= 99 ? '99+' : count}
							</text>
						</g>
					)}
				</g>
				{Array.from({length: BUBBLES}, (_, i) => (
					<Bubble key={i} i={i} f={f} ink={ink} />
				))}
			</g>
		</SceneShell>
	);
};
