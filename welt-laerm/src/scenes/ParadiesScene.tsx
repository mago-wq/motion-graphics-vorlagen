// Szene 5 – „Paradies“: Zum ersten Mal wird das Licht warm. Ein Tor öffnet sich,
// Strahlen drehen sich dahinter, Lichtfunken steigen auf. Die Figur steht als
// Silhouette davor, blickt hinauf und streckt die Hand aus.
// Am Ende verwischt das Bild seitlich, ein einzelner Lichtpunkt bleibt.
import {random, useCurrentFrame} from 'remotion';
import {CONFIG} from '../config';
import {Figure, mixPose, type Pose} from '../components/Figure';
import {SceneShell} from '../components/SceneShell';
import {easeInOut, lightLevel, tween} from '../motion';
import {T} from '../timing';

const GATE = {x: 540, bottom: 1440, w: 400, top: 840};
const R = GATE.w / 2;
const L = GATE.x - R;
const Rt = GATE.x + R;
const ARCH = `M${L} ${GATE.bottom} L${L} ${GATE.top + R} A${R} ${R} 0 0 1 ${Rt} ${GATE.top + R} L${Rt} ${GATE.bottom} Z`;
const CENTER: [number, number] = [GATE.x, GATE.top + R + 60];

const HIP: [number, number] = [540, 1282];
const SCALE = 0.95;
const STAND: Pose = {
	neck: [0, -115],
	head: [0, -163],
	lHand: [-36, 4],
	rHand: [36, 4],
	lFoot: [-30, 164],
	rFoot: [30, 164],
	bend: {lArm: 1, rArm: -1},
};
const REACH: Pose = {...STAND, head: [6, -166], rHand: [92, -176], bend: {lArm: 1, rArm: 1}};

const SPARKS = 28;
const RAYS = 16;

export const ParadiesScene: React.FC = () => {
	const frame = useCurrentFrame();
	const t = T.paradies;
	const level = lightLevel(frame, t.from, 99999);
	if (level === 0 || frame > t.to + 40) return null;
	const f = frame - t.from;
	const warm = CONFIG.colors.warm;

	const open = tween(f, 6, 46, 0, 1, easeInOut);
	const reach = tween(f, 38, 62, 0, 1, easeInOut);
	const pose = mixPose(STAND, REACH, reach);

	const rays = Array.from({length: RAYS}, (_, i) => {
		const a = (i / RAYS) * Math.PI * 2 + f * 0.006;
		const spread = 0.07;
		const len = 1100;
		const p1 = [CENTER[0] + Math.cos(a - spread) * len, CENTER[1] + Math.sin(a - spread) * len];
		const p2 = [CENTER[0] + Math.cos(a + spread) * len, CENTER[1] + Math.sin(a + spread) * len];
		return <polygon key={i} points={`${CENTER[0]},${CENTER[1]} ${p1.join(',')} ${p2.join(',')}`} fill="url(#rayFade)" />;
	});

	const sparks = Array.from({length: SPARKS}, (_, i) => {
		const speed = 2 + random(`sp${i}`) * 3.5;
		const life = 70;
		const age = (f * speed * 0.5 + random(`so${i}`) * life) % life;
		const x = L + 30 + random(`sx${i}`) * (GATE.w - 60) + Math.sin((f + i * 20) / 18) * 12;
		const y = GATE.bottom - 40 - age * 9;
		const tw = 0.5 + 0.5 * Math.sin(f / 4 + i);
		return <circle key={i} cx={x} cy={y} r={2.5 + random(`sr${i}`) * 4} fill={warm} opacity={open * Math.sin((age / life) * Math.PI) * tw} />;
	});

	return (
		<SceneShell
			line={CONFIG.lines.paradies}
			timing={t}
			level={level}
			color={warm}
			subtitle={{top: 290, fontSize: 66}}
			spotlightY={60}
			overlay={
				<g transform={`translate(${HIP[0]} ${HIP[1]}) scale(${SCALE})`}>
					<Figure pose={pose} color="#050403" face="none" outline={false} />
				</g>
			}
		>
			<defs>
				<radialGradient id="rayFade" gradientUnits="userSpaceOnUse" cx={CENTER[0]} cy={CENTER[1]} r={900}>
					<stop offset="0" stopColor={warm} stopOpacity={0.32 * open} />
					<stop offset="1" stopColor={warm} stopOpacity={0} />
				</radialGradient>
				<linearGradient id="doorLight" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#fff8ea" />
					<stop offset="1" stopColor={warm} />
				</linearGradient>
				<linearGradient id="floorLight" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={warm} stopOpacity={0.55 * open} />
					<stop offset="1" stopColor={warm} stopOpacity={0} />
				</linearGradient>
				<clipPath id="arch">
					<path d={ARCH} />
				</clipPath>
			</defs>
			{rays}
			{/* Lichtteppich vor dem Tor */}
			<polygon points={`${L},${GATE.bottom} ${Rt},${GATE.bottom} ${Rt + 220},${GATE.bottom + 190} ${L - 220},${GATE.bottom + 190}`} fill="url(#floorLight)" />
			{/* Torinneres: Licht hinter zwei Flügeln, die aufschwingen */}
			<g clipPath="url(#arch)">
				<rect x={L} y={GATE.top} width={GATE.w} height={GATE.bottom - GATE.top} fill="url(#doorLight)" />
				<rect x={L} y={GATE.top} width={R * (1 - open)} height={GATE.bottom - GATE.top} fill="#060504" />
				<rect x={Rt - R * (1 - open)} y={GATE.top} width={R * (1 - open)} height={GATE.bottom - GATE.top} fill="#060504" />
			</g>
			<path d={ARCH} fill="none" stroke={warm} strokeWidth={10} />
			{sparks}
		</SceneShell>
	);
};
