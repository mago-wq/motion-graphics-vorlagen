// Szene 7: "Aber das ist noch nicht alles!"
// Plattenkratzer, die Musik stoppt. Tunnel aus rotierenden Speed-Lines, die
// drei Zeilen knallen nacheinander ein, "ALLES!" in Gold mit dem großen Schlag.
import {AbsoluteFill, interpolate} from 'remotion';
import {At} from '../components/At';
import {ChromeText} from '../components/ChromeText';
import {Sparkles, sparkleRing} from '../components/Sparkles';
import {config} from '../config';
import {clamp, framesToLand, shakeAt, SPRINGS, springFrom} from '../motion';
import {COLORS} from '../theme';
import {EV, word} from '../timing';
import {SAFE} from '../video';

const SLAM = framesToLand(SPRINGS.slam);

export const ABERNOCH_T = {
	start: EV.stopp,
	zeilen: [word('abernoch', 'Aber').start, word('abernoch', 'noch').start, word('abernoch', 'alles').start],
	schlag: EV.einschlag,
};
export const ABERNOCH_IMPACTS = {
	zeilen: ABERNOCH_T.zeilen.map((t) => t + SLAM),
	schlag: ABERNOCH_T.schlag,
};

const SpeedLines: React.FC<{frame: number; boost: number}> = ({frame, boost}) => (
	<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
		<g transform={`translate(540 900) rotate(${frame * (1.5 + boost * 4)})`}>
			{Array.from({length: 48}, (_, i) => {
				const a = (i / 48) * Math.PI * 2;
				const r0 = 180 + (i % 3) * 60;
				return (
					<line
						key={i}
						x1={Math.cos(a) * r0}
						y1={Math.sin(a) * r0}
						x2={Math.cos(a) * 1500}
						y2={Math.sin(a) * 1500}
						stroke={i % 2 ? '#FFFFFF' : COLORS.cyan}
						strokeWidth={i % 4 === 0 ? 10 : 4}
						opacity={0.16 + 0.2 * boost}
					/>
				);
			})}
		</g>
		{/* Ringe, die nach außen wandern: Sog in die Tiefe */}
		{Array.from({length: 5}, (_, i) => {
			const r = ((frame * 14 + i * 260) % 1300) + 40;
			return <circle key={`r${i}`} cx={540} cy={900} r={r} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.12 * (1 - r / 1340)} />;
		})}
	</svg>
);

export const AberNochScene: React.FC<{frame: number}> = ({frame}) => {
	const T = ABERNOCH_T;
	const hit = frame >= T.schlag;
	const boost = interpolate(frame, [T.schlag, T.schlag + 12], [1, 0.3], clamp) * (hit ? 1 : 0);
	// Plattenkratzer: kurzes Ruckeln am Anfang
	const scratch = interpolate(frame, [T.start, T.start + 7], [1, 0], clamp);
	const shake = shakeAt(
		frame,
		[...ABERNOCH_IMPACTS.zeilen.map((f) => ({frame: f, strength: 9})), {frame: T.schlag, strength: 24}],
		'aber',
	);
	const ys = [600, 790, 1060];
	const sizes = [118, 128, 270];
	return (
		<AbsoluteFill style={{background: hit ? `radial-gradient(circle at 50% 47%, ${COLORS.red} 0%, ${COLORS.redDeep} 55%, #2A0005 100%)` : `radial-gradient(circle at 50% 47%, #1240C4 0%, #06124A 60%, #01030D 100%)`}}>
			<SpeedLines frame={frame} boost={boost} />
			<AbsoluteFill style={{transform: `${shake} skewX(${scratch * Math.sin(frame * 3) * 6}deg)`}}>
				{config.aberNoch.map((text, i) => {
					const at = T.zeilen[i] ?? T.zeilen[T.zeilen.length - 1];
					if (frame < at) return null;
					const s = springFrom(frame, at, SPRINGS.slam);
					const isLast = i === config.aberNoch.length - 1;
					return (
						<At key={text} x={540} y={ys[i] ?? 1060} transform={`scale(${interpolate(s, [0, 1], [2.4, 1])}) rotate(${isLast ? -5 : 0}deg)`} opacity={interpolate(frame, [at, at + 2], [0, 1], clamp)}>
							<ChromeText text={text} size={sizes[i] ?? 120} maxWidth={SAFE.width + (isLast ? 0 : 0)} variant={isLast ? 'gold' : 'chrome'} />
						</At>
					);
				})}
			</AbsoluteFill>
			<Sparkles frame={frame} items={sparkleRing(540, 1060, T.schlag, 12, 480, 260, 60)} />
			{hit ? <AbsoluteFill style={{background: '#FFFFFF', opacity: interpolate(frame, [T.schlag, T.schlag + 5], [0.85, 0], clamp)}} /> : null}
		</AbsoluteFill>
	);
};
