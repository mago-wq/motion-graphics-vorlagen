// Vers 152: „Gedenkt Meiner, so gedenke Ich euer. Und dankt Mir und seid Mir nicht undankbar.“
import {CONFIG} from '../config';
import {Emblem, Fig, Motes, RedX} from '../components/Props';
import {Halo, Layer, SceneShell, useScene, type SceneProps} from '../components/Scene';
import {breathe, easeInOut, jitter, tween} from '../motion';
import {CHEST, PROUD, DUA, mixStance, STAND} from '../poses';

const {ink, warm, red} = CONFIG.colors;

/** Figur legt die Hand aufs Herz, über ihr bildet sich eine Gedankenblase mit dem Emblem. */
export const Gedenken: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const stance = mixStance(STAND, CHEST, tween(f, 3, 20, 0, 1, easeInOut));
	const bubble = (k: number) => tween(f, 8 + k * 5, 18 + k * 5, 0, 1);
	const pulse = 1 + 0.06 * Math.sin(f / 4);
	return (
		<SceneShell level={level} {...props}>
			<Layer glow={ink}>
				<Fig x={470} stance={stance} rise={breathe(f, 70, 3)} />
				<circle cx={575} cy={880} r={12 * bubble(0)} fill="none" stroke={ink} strokeWidth={6} />
				<circle cx={612} cy={835} r={20 * bubble(1)} fill="none" stroke={ink} strokeWidth={6} />
				<circle cx={700} cy={738} r={98 * bubble(2)} fill="none" stroke={ink} strokeWidth={7} />
			</Layer>
			<Layer glow={warm}>
				<Emblem x={700} y={738} size={118 * bubble(2) * pulse} rot={f * 0.6} opacity={bubble(2)} />
			</Layer>
		</SceneShell>
	);
};

/** Licht fällt vom Emblem auf die Figur („so gedenke Ich euer“), sie hebt die Hände zum Dank. */
export const Danken: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const beam = tween(f, 4, 34, 0, 1, easeInOut);
	const stance = mixStance(CHEST, DUA, tween(f, 26, 46, 0, 1, easeInOut));
	return (
		<SceneShell level={level} {...props}>
			<Layer glow={warm} strength={0.8}>
				<defs>
					<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor={warm} stopOpacity={0.45 * beam} />
						<stop offset="1" stopColor={warm} stopOpacity={0.04 * beam} />
					</linearGradient>
				</defs>
				<polygon points={`505,900 575,900 700,1470 380,1470`} fill="url(#beam)" />
				<Motes f={f} n={18} x={540} w={220} y0={920} y1={1420} color={warm} seed="d" opacity={beam} />
				<Emblem x={540} y={870} size={130} rot={f * 0.5} />
			</Layer>
			<Layer glow={ink}>
				<Fig x={540} stance={stance} rise={breathe(f, 70, 3)} />
			</Layer>
		</SceneShell>
	);
};

/** Figur stemmt die Hände in die Hüften (Hochmut); ein rotes Kreuz streicht die Haltung durch. */
export const Undank: React.FC<SceneProps> = (props) => {
	const {f, level} = useScene(props);
	if (level === 0) return null;
	const mark = (props.mark ?? props.from + 45) - props.from;
	const cross = tween(f, mark, mark + 16, 0, 1, easeInOut);
	const stance = mixStance(DUA, PROUD, tween(f, 2, 18, 0, 1, easeInOut));
	// leichtes Wippen vor dem Kreuz (selbstgefällig), danach sackt die Figur ab und wird dunkler
	const sway = cross > 0 ? 0 : breathe(f, 40, 4);
	const dim = 1 - 0.45 * cross;
	const shake = cross > 0 && cross < 1 ? jitter('x', f, 6) : 0;
	return (
		<SceneShell level={level} {...props}>
			<Halo x={540} y={1210} r={420} color={red} opacity={cross * (0.8 + 0.2 * Math.sin(f / 5))} />
			<Layer glow={ink} opacity={dim}>
				<g transform={`rotate(${sway} 540 1470)`}>
					<Fig x={540 + shake} stance={stance} rise={-cross * 8} />
				</g>
			</Layer>
			<Layer glow={red}>
				<RedX x={540} y={1190} size={210} p={cross} />
			</Layer>
		</SceneShell>
	);
};
