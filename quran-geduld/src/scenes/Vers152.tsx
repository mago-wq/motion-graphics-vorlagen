// Vers 152: „Gedenkt Meiner, so gedenke Ich euer. Und dankt Mir und seid Mir nicht undankbar.“
import {mixProfile} from '../components/Body';
import {Profile} from '../components/Person';
import {Emblem, Motes, RedX, Tasbih} from '../components/Props';
import {Halo, Layer, SceneShell, useScene, type SceneProps} from '../components/Scene';
import {CONFIG} from '../config';
import {breathe, easeInOut, tween} from '../motion';
import {walkTravel} from '../motion2';
import {KNEEL_DHIKR, KNEEL_DUA, PROUD, walkPose} from '../poses';

const {ink, warm, red} = CONFIG.colors;
const SCALE = 1.5;

/** Dhikr mit leichtem Nicken im Zählrhythmus. */
const dhikr = (f: number) => ({
	...KNEEL_DHIKR,
	tilt: KNEEL_DHIKR.tilt + Math.sin((f / 9) * Math.PI * 2) * 3,
	armN: {...KNEEL_DHIKR.armN, e: KNEEL_DHIKR.armN.e + Math.max(0, Math.sin((f / 9) * Math.PI * 2)) * 4},
});

/** Kniende Figur zählt mit der Gebetskette, über ihr eine Gedankenblase mit dem Emblem. */
export const Gedenken: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const bubble = (k: number) => tween(f, 6 + k * 5, 16 + k * 5, 0, 1);
	const pulse = 1 + 0.05 * Math.sin(f / 4);
	return (
		<SceneShell level={level} {...props}>
			<Layer glow={ink}>
				<Profile pose={dhikr(f)} x={430} anchor="ankle" scale={SCALE} handProp={(h) => <Tasbih hand={h} f={f} color={warm} />} />
				<circle cx={600} cy={1060} r={11 * bubble(0)} fill="none" stroke={ink} strokeWidth={6} />
				<circle cx={640} cy={1010} r={19 * bubble(1)} fill="none" stroke={ink} strokeWidth={6} />
			</Layer>
			<Layer glow={warm}>
				<circle cx={740} cy={900} r={100 * bubble(2)} fill="none" stroke={ink} strokeWidth={7} />
				<Emblem x={740} y={900} size={120 * bubble(2) * pulse} rot={f * 0.6} opacity={bubble(2)} />
			</Layer>
		</SceneShell>
	);
};

/** Licht fällt vom Emblem auf die Figur („so gedenke Ich euer“), sie hebt die Hände zum Dank. */
export const Danken: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const beam = tween(f, 4, 34, 0, 1, easeInOut);
	const raise = tween(f, 30, 58, 0, 1, easeInOut);
	const pose = mixProfile(dhikr(f), KNEEL_DUA, raise);
	// Nach dem Heben: Hände und Blick leicht nach oben, ruhiges Atmen
	const lifted = {...pose, tilt: pose.tilt - raise * 10, armN: {...pose.armN, e: pose.armN.e + raise * breathe(f, 60, 4)}};
	return (
		<SceneShell level={level} {...props}>
			<Layer glow={warm} strength={0.8}>
				<defs>
					<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor={warm} stopOpacity={0.45 * beam} />
						<stop offset="1" stopColor={warm} stopOpacity={0.05 * beam} />
					</linearGradient>
				</defs>
				<polygon points={`535,930 605,930 760,1470 380,1470`} fill="url(#beam)" />
				<Motes f={f} n={18} x={570} w={240} y0={950} y1={1420} color={warm} seed="d" opacity={beam} />
				<Emblem x={570} y={880} size={130} rot={f * 0.5} />
			</Layer>
			<Layer glow={ink}>
				<Profile
					pose={lifted}
					x={460}
					anchor="ankle"
					scale={SCALE}
					handProp={(h) => <Tasbih hand={h} f={f} color={warm} opacity={1 - tween(f, 26, 36, 0, 1)} />}
				/>
			</Layer>
		</SceneShell>
	);
};

/**
 * Undank: Licht rieselt vom Emblem herab, die Figur dreht sich weg und geht erhobenen Kinns davon.
 * Beim Wort „undankbar“ streicht ein rotes Kreuz sie durch, sie bleibt stehen.
 */
export const Undank: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const mark = (props.mark ?? props.from + 45) - props.from;
	const TURN = [10, 22];
	const STEP = 13;
	const walkFrom = 22;
	const walkEnd = mark + 6;
	const turn = tween(f, TURN[0], TURN[1], -1, 1, easeInOut);
	const phase = Math.max(0, Math.min(f, walkEnd) - walkFrom) / STEP;
	// Ausgehen aus dem Schritt: nach walkEnd zurück in den Stand
	const settle = tween(f, walkEnd, walkEnd + 10, 0, 1, easeInOut);
	const walking = walkPose(phase, PROUD);
	// Anlaufen aus dem Stand (halber Schritt), am Ende wieder in den Stand
	const start = Math.min(1, phase * 2);
	const pose = mixProfile(mixProfile(PROUD, walking, start), PROUD, settle);
	const x = 470 + walkTravel(phase, (p) => walkPose(p, PROUD)) * SCALE;
	const cross = tween(f, mark, mark + 16, 0, 1, easeInOut);
	const dim = 1 - 0.45 * cross;
	const crossX = 470 + walkTravel(Math.max(0, walkEnd - walkFrom) / STEP, (p) => walkPose(p, PROUD)) * SCALE;
	return (
		<SceneShell level={level} {...props}>
			<Halo x={crossX} y={1200} r={400} color={red} opacity={cross * (0.8 + 0.2 * Math.sin(f / 5))} />
			<Layer glow={warm} strength={0.8} opacity={1 - 0.5 * cross}>
				<Emblem x={230} y={930} size={120} rot={f * 0.5} />
				<Motes f={f} n={14} x={300} w={260} y0={980} y1={1420} color={warm} seed="u" />
			</Layer>
			<Layer glow={ink} opacity={dim}>
				<Profile pose={pose} x={x} turn={turn} scale={SCALE} rise={-cross * 6} />
			</Layer>
			<Layer glow={red}>
				<RedX x={crossX} y={1190} size={200} p={cross} />
			</Layer>
		</SceneShell>
	);
};
