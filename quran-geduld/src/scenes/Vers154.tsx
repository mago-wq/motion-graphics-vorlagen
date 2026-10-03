// Vers 154: „Und sagt nicht von denen, die auf Allahs Weg getötet werden, sie seien tot.
// Nein, sie sind lebendig, doch ihr nehmt es nicht wahr.“
import {CONFIG} from '../config';
import {Front, Profile} from '../components/Person';
import {Emblem, Gravestone, Motes, Rays, RedX} from '../components/Props';
import {Halo, Layer, SceneShell, useScene, type SceneProps} from '../components/Scene';
import {mixFront} from '../components/Body';
import {breathe, easeInOut, jitter, tween} from '../motion';
import {walkTravel} from '../motion2';
import {BLIND_BASE, F_OPEN, F_STAND, walkPose} from '../poses';
import {GROUND} from '../video';

const {ink, warm, red} = CONFIG.colors;
const STONE = {x: 540, w: 230, h: 330};
const STONE_MID = GROUND - STONE.h / 2;

/** Grabstein steigt auf; beim Wort „tot“ streicht ihn ein rotes Kreuz durch. */
export const Grab: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const mark = (props.mark ?? props.from + 150) - props.from;
	const up = tween(f, 0, 30, 0, 1, easeInOut);
	const cross = tween(f, mark, mark + 16, 0, 1, easeInOut);
	const shake = cross > 0 && cross < 1 ? jitter('g', f, 7) : 0;
	return (
		<SceneShell level={level} {...props}>
			<Halo x={540} y={STONE_MID} r={380} color={red} opacity={cross * (0.75 + 0.25 * Math.sin(f / 5))} />
			<Layer glow={warm} strength={0.7}>
				<Emblem x={540} y={960} size={110} rot={f * 0.4} opacity={0.85} />
			</Layer>
			<Layer glow={ink}>
				<g transform={`translate(${shake} ${(1 - up) * 60})`} opacity={up}>
					<Gravestone {...STONE} />
				</g>
			</Layer>
			<Layer glow={red}>
				<RedX x={540} y={STONE_MID} size={175} p={cross} />
			</Layer>
		</SceneShell>
	);
};

/** Das Kreuz bleibt, im Stein reißen Spalten auf, warmes Licht dringt heraus und steigt. */
export const GrabLicht: React.FC<SceneProps> = (props) => {
	const {f, level, len} = useScene(props);
	if (level === 0) return null;
	const cracks = tween(f, 20, 120, 0, 1, easeInOut);
	const glow = tween(f, 60, len, 0, 1, easeInOut);
	return (
		<SceneShell level={level} {...props}>
			<Halo x={540} y={STONE_MID} r={360} color={red} opacity={0.5 * (1 - glow)} />
			<Halo x={540} y={STONE_MID} r={460} color={warm} opacity={glow} />
			<Layer glow={warm} strength={0.7}>
				<Emblem x={540} y={960} size={110} rot={f * 0.4} opacity={0.85} />
				<Motes f={f} n={22} x={540} w={260} y0={GROUND - 40} y1={900} color={warm} seed="gl" opacity={glow} />
			</Layer>
			<Layer glow={ink}>
				<Gravestone {...STONE} cracks={cracks} />
			</Layer>
			<Layer glow={red} opacity={1 - 0.6 * glow}>
				<RedX x={540} y={STONE_MID} size={175} p={1} />
			</Layer>
		</SceneShell>
	);
};

/** Lichtpodest mit Strahlen: die Figur steht auf und öffnet die Arme. */
const Podium: React.FC<{x: number; w: number; color: string}> = ({x, w, color}) => (
	<g stroke={color} strokeWidth={7} fill="none" strokeLinecap="round">
		<line x1={x - w / 2} x2={x + w / 2} y1={GROUND} y2={GROUND} />
		<line x1={x - w / 2 - 30} x2={x + w / 2 + 30} y1={GROUND + 18} y2={GROUND + 18} />
		<line x1={x - w / 2 - 60} x2={x + w / 2 + 60} y1={GROUND + 36} y2={GROUND + 36} />
	</g>
);

export const Lebendig: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const light = tween(f, 0, 30, 0, 1, easeInOut);
	const pose = mixFront(F_STAND, F_OPEN, tween(f, 14, 40, 0, 1, easeInOut));
	return (
		<SceneShell level={level} {...props}>
			<Halo x={540} y={1200} r={480} color={warm} opacity={light} />
			<Layer glow={warm} strength={0.9}>
				<Rays cx={540} cy={1150} f={f} n={16} len={720} color={warm} strength={light} id="lb" />
				<Podium x={540} w={260} color={warm} />
				<Motes f={f} n={26} x={540} w={360} y0={GROUND} y1={850} color={warm} seed="lb" opacity={light} />
			</Layer>
			<Layer glow="#fff4dc">
				<Front pose={pose} x={540} scale={1.65} color="#fff8ec" rise={tween(f, 0, 40, -24, 4) + breathe(f, 60, 3)} />
			</Layer>
		</SceneShell>
	);
};

/**
 * Ein Mensch mit Blindenstock geht langsam vorbei. Hinter ihm steht – kaum sichtbar – die
 * lebendige Figur im Licht: Sie ist da, aber er nimmt sie nicht wahr.
 */
export const Blind: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const STEP = 24;
	const phase = f / STEP;
	// Kurze, tastende Schritte
	const poseAt = (p: number) => walkPose(p, BLIND_BASE, false, 13);
	const SCALE = 1.65;
	const x = 90 + walkTravel(phase, poseAt) * SCALE;
	// Stock pendelt vor ihm und tippt bei jedem Schritt auf den Boden
	const sweep = Math.cos(phase * Math.PI);
	const lift = Math.max(0, Math.sin(phase * Math.PI * 2)) * 10;
	const ghost = 0.3 + 0.08 * Math.sin(f / 12);
	return (
		<SceneShell level={level} {...props}>
			<Halo x={830} y={1180} r={300} color={warm} opacity={ghost} />
			<Layer glow={warm} strength={0.6} opacity={ghost * 1.4}>
				<Podium x={830} w={180} color={warm} />
			</Layer>
			<Layer glow="#fff4dc" opacity={ghost}>
				<Front pose={F_OPEN} x={830} scale={1.2} color="#fff8ec" rise={6 + breathe(f, 60, 4)} />
			</Layer>
			<Layer glow={ink}>
				<Profile
					pose={poseAt(phase)}
					x={x}
					scale={SCALE}
					handProp={(h) => {
						const [, , W] = h;
						// Stockspitze: vor der Figur auf Bodenhöhe (Figur-Einheiten, Boden ≈ 183 unter der Hüfte)
						const tip: [number, number] = [W[0] + 70 + sweep * 18, 180 - lift];
						return <line x1={W[0]} y1={W[1]} x2={tip[0]} y2={tip[1]} stroke={ink} strokeWidth={8} strokeLinecap="round" />;
					}}
				/>
			</Layer>
		</SceneShell>
	);
};
