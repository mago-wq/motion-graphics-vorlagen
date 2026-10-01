// Szene 1: "Meine Damen und Herren – aufgepasst!"
// Blauer Strahlenkranz, die Anrede knallt Zeile für Zeile in Chrom ein, dann
// rutscht sie nach oben und "AUFGEPASST!" springt in einem gelben Störer auf.
import {AbsoluteFill, interpolate} from 'remotion';
import {At} from '../components/At';
import {ChromeText} from '../components/ChromeText';
import {Sparkles, sparkleRing} from '../components/Sparkles';
import {Starburst} from '../components/Starburst';
import {Sunburst} from '../components/Sunburst';
import {config} from '../config';
import {clamp, framesToLand, shakeAt, SPRINGS, springFrom} from '../motion';
import {COLORS} from '../theme';
import {word} from '../timing';
import {SAFE} from '../video';

const SLAM = framesToLand(SPRINGS.slam);
const WOBBLE = framesToLand(SPRINGS.wobble);

export const HOOK_T = {
	zeile1: word('hook', 'Meine').start,
	zeile2: word('hook', 'und').start,
	knaller: word('hook', 'aufgepasst').start,
};
/** Sichtbarer Einschlag (für Ton und Shake) */
export const HOOK_IMPACTS = {
	zeile1: HOOK_T.zeile1 + SLAM,
	zeile2: HOOK_T.zeile2 + SLAM,
	knaller: HOOK_T.knaller + WOBBLE,
};

const slamIn = (frame: number, at: number) => {
	const s = springFrom(frame, at, SPRINGS.slam);
	return {scale: interpolate(s, [0, 1], [1.9, 1]), opacity: interpolate(frame, [at, at + 3], [0, 1], clamp)};
};

export const HookScene: React.FC<{frame: number}> = ({frame}) => {
	const l1 = slamIn(frame, HOOK_T.zeile1);
	const l2 = slamIn(frame, HOOK_T.zeile2);
	// Anrede rutscht nach oben, sobald "Aufgepasst" kommt
	const up = springFrom(frame, HOOK_T.knaller - 2, SPRINGS.snap);
	const y1 = interpolate(up, [0, 1], [800, 470]);
	const y2 = interpolate(up, [0, 1], [950, 610]);
	const lineScale = interpolate(up, [0, 1], [1, 0.86]);

	const k = springFrom(frame, HOOK_T.knaller, SPRINGS.wobble);
	const kScale = interpolate(k, [0, 1], [0, 1]);
	const wiggle = Math.sin((frame - HOOK_T.knaller) * 0.25) * 3;

	const shake = shakeAt(
		frame,
		[
			{frame: HOOK_IMPACTS.zeile1, strength: 7},
			{frame: HOOK_IMPACTS.zeile2, strength: 7},
			{frame: HOOK_IMPACTS.knaller, strength: 20},
		],
		'hook',
	);

	return (
		<AbsoluteFill>
			<Sunburst frame={frame} colors={{base: COLORS.blue, ray: COLORS.blueRay, glow: COLORS.cyan, edge: COLORS.blueDeep}} cy={900} speed={0.35} />
			<AbsoluteFill style={{transform: shake}}>
				<At x={540} y={y1} transform={`scale(${l1.scale * lineScale})`} opacity={l1.opacity}>
					<ChromeText text={config.hook.zeile1} size={132} maxWidth={SAFE.width} />
				</At>
				<At x={540} y={y2} transform={`scale(${l2.scale * lineScale})`} opacity={l2.opacity}>
					<ChromeText text={config.hook.zeile2} size={132} maxWidth={SAFE.width} />
				</At>
				{frame >= HOOK_T.knaller ? (
					<At x={540} y={1115} transform={`scale(${kScale}) rotate(${-6 + wiggle}deg)`}>
						<Starburst size={780} rotate={frame * 0.4}>
							<ChromeText text={config.hook.knaller} size={150} maxWidth={SAFE.width} stretch="100%" variant="red" style={{transform: 'rotate(-4deg)'}} />
						</Starburst>
					</At>
				) : null}
			</AbsoluteFill>
			<Sparkles frame={frame} items={sparkleRing(540, 1115, HOOK_IMPACTS.knaller - 2, 10, 420, 420, 54)} />
		</AbsoluteFill>
	);
};
