// Szene 1 – „Lärm“: Lärmwellen drängen von beiden Seiten heran,
// die Figur presst die Hände auf die Ohren und zittert.
import {random, useCurrentFrame} from 'remotion';
import {CONFIG} from '../config';
import {Figure, mixPose, type Pose} from '../components/Figure';
import {SceneShell} from '../components/SceneShell';
import {jitter, lightLevel, tween} from '../motion';
import {T} from '../timing';

const HIP: [number, number] = [540, 1190];
const SCALE = 1.95;
const HEAD_Y = HIP[1] - 165 * SCALE;

const RELAXED: Pose = {
	neck: [0, -115],
	head: [0, -165],
	lHand: [-38, 2],
	rHand: [38, 2],
	lFoot: [-34, 164],
	rFoot: [34, 164],
	bend: {lArm: 1, rArm: -1},
};
const EARS: Pose = {
	...RELAXED,
	head: [0, -163],
	lHand: [-44, -166],
	rHand: [44, -166],
	bend: {lArm: -1, rArm: 1},
};

const WAVE_PERIOD = 26;

/** Zickzack-Linie: eine Lärmwelle auf dem Weg zum Kopf. */
const Wave: React.FC<{side: -1 | 1; k: number; f: number; ink: string}> = ({side, k, f, ink}) => {
	const t = ((f + k * (WAVE_PERIOD / 3)) % WAVE_PERIOD) / WAVE_PERIOD;
	const x = 540 + side * (470 - t * 300);
	const h = 120 + t * 160;
	const n = 9;
	const pts = Array.from({length: n + 1}, (_, i) => {
		const y = HEAD_Y - h / 2 + (h * i) / n;
		const amp = (14 + 26 * random(`w-${side}-${k}-${i}-${Math.floor(f / 2)}`)) * (i % 2 ? 1 : -1);
		return `${x + amp},${y}`;
	});
	const opacity = Math.sin(t * Math.PI);
	return <polyline points={pts.join(' ')} fill="none" stroke={ink} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" opacity={opacity} />;
};

export const LaermScene: React.FC = () => {
	const frame = useCurrentFrame();
	const t = T.laerm;
	const level = lightLevel(frame, t.from, t.to);
	if (level === 0) return null;
	const f = frame - t.from;
	const ink = CONFIG.colors.ink;

	const cover = tween(f, 4, 16, 0, 1);
	const pose = mixPose(RELAXED, EARS, cover);
	const shake = cover * (1 + f / 60);
	const rot = jitter('rot', f, 2.2 * shake);
	const dx = jitter('dx', f, 5 * shake);

	return (
		<SceneShell line={CONFIG.lines.laerm} timing={t} level={level} color={ink} subtitle={{top: 300, fontSize: 64}}>
			{([-1, 1] as const).map((side) => [0, 1, 2].map((k) => <Wave key={`${side}${k}`} side={side} k={k} f={f} ink={ink} />))}
			<g transform={`translate(${HIP[0] + dx} ${HIP[1]}) rotate(${rot} 0 ${-165 * SCALE}) scale(${SCALE})`}>
				<Figure pose={pose} color={ink} far="#cfcfcf" face={cover > 0.6 ? 'squint' : 'none'} />
			</g>
		</SceneShell>
	);
};
