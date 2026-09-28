// Szene 2 (1,5–4,0 s): Schere zeichnet sich, schnippt zweimal.
// Darunter "Nicht bei uns." in Gold, danach der Name des Barbershops.
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {FitText} from '../components/FitText';
import {MaskReveal} from '../components/MaskReveal';
import {SafeArea} from '../components/SafeArea';
import {AnimatedScissors} from '../components/Scissors';
import {config} from '../config';
import {softIn, springFrom, SPRINGS} from '../motion';
import {BODY_FONT, COLORS, HEADLINE_FONT} from '../theme';
import {SCENES, SCISSORS} from '../timing';
import {SAFE} from '../video';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Kleine Haar-Schnipsel, die nach jedem Schnipp aus den Klingen fallen (SVG-Koordinaten 0–100). */
const HairClippings: React.FC<{frame: number}> = ({frame}) => (
	<>
		{SCISSORS.snips.flatMap((snip, si) =>
			Array.from({length: 8}, (_, pi) => {
				const t = frame - snip;
				if (t < 0 || t > 24) return null;
				const seed = `haar-${si}-${pi}`;
				const x0 = 50 + (random(`${seed}-x`) - 0.5) * 12;
				const y0 = 22 + random(`${seed}-y`) * 22;
				const vx = (random(`${seed}-vx`) - 0.5) * 1.6;
				const vy = -0.5 - random(`${seed}-vy`) * 0.7;
				const x = x0 + vx * t;
				const y = y0 + vy * t + 0.05 * t * t; // Schwerkraft
				const rotation = random(`${seed}-r`) * 180 + t * (random(`${seed}-rv`) - 0.5) * 24;
				const length = 2.5 + random(`${seed}-l`) * 3.5;
				const opacity = interpolate(t, [0, 2, 14, 24], [0, 0.9, 0.7, 0], clamp);
				return (
					<line
						key={seed}
						x1={x - length / 2}
						y1={y}
						x2={x + length / 2}
						y2={y}
						transform={`rotate(${rotation} ${x} ${y})`}
						stroke={pi % 3 === 0 ? COLORS.accent : COLORS.text}
						strokeWidth={0.9}
						strokeLinecap="round"
						opacity={opacity}
					/>
				);
			}),
		)}
	</>
);

export const ScissorsScene: React.FC = () => {
	const frame = useCurrentFrame() + SCENES.schere.from;

	// Strich-Animation der Schere: startet zügig (sichtbar schon im Übergang), läuft weich aus
	const draw = interpolate(frame, [SCISSORS.drawStart, SCISSORS.drawEnd], [0, 1], {
		...clamp,
		easing: Easing.bezier(0.25, 0.1, 0.25, 1),
	});
	const settle = softIn(frame, SCISSORS.drawStart, 28);

	// Zweimal schnippen: schnell zu, federnd wieder auf
	let close = 0;
	let kick = 0;
	for (const snip of SCISSORS.snips) {
		close += springFrom(frame, snip - SCISSORS.snipCloseFrames, SPRINGS.snipClose);
		close -= springFrom(frame, snip + 1, SPRINGS.snipOpen);
		kick += interpolate(frame, [snip - 1, snip, snip + 7], [0, 1, 0], {...clamp, easing: Easing.out(Easing.quad)});
	}

	const answer = softIn(frame, SCISSORS.answerIn, 16);
	const name = softIn(frame, SCISSORS.nameIn, 18);
	const tagline = softIn(frame, SCISSORS.taglineIn, 16);

	return (
		<AbsoluteFill>
			<SafeArea>
				<div
					style={{
						transform: `rotate(${interpolate(settle, [0, 1], [-14, 0])}deg) scale(${
							interpolate(settle, [0, 1], [0.9, 1]) * (1 + 0.035 * kick)
						})`,
						marginBottom: 40,
					}}
				>
					<AnimatedScissors
						size={580}
						draw={draw}
						close={Math.min(close, 1.05)}
						color={COLORS.text}
						pivotColor={COLORS.accent}
						strokeWidth={2.4}
					>
						<HairClippings frame={frame} />
					</AnimatedScissors>
				</div>

				<MaskReveal progress={answer}>
					<FitText
						text={config.texte.antwort}
						maxWidth={SAFE.width}
						maxFontSize={118}
						fontFamily={BODY_FONT}
						fontWeight={800}
						letterSpacing={-0.035}
						style={{color: COLORS.accent}}
					/>
				</MaskReveal>

				<div style={{height: 40}} />

				<MaskReveal progress={name}>
					<FitText
						text={config.name}
						maxWidth={SAFE.width}
						maxFontSize={190}
						fontFamily={HEADLINE_FONT}
						letterSpacing={0.01}
						uppercase
						style={{color: COLORS.text}}
					/>
				</MaskReveal>

				<div style={{height: 22, flexShrink: 0}} />

				<div style={{opacity: tagline, transform: `translateY(${(1 - tagline) * 18}px)`}}>
					<FitText
						text={`${config.branche} · ${config.stadt}`}
						maxWidth={SAFE.width}
						maxFontSize={34}
						fontFamily={BODY_FONT}
						fontWeight={600}
						letterSpacing={0.3}
						uppercase
						style={{color: COLORS.textMuted}}
					/>
				</div>
			</SafeArea>
		</AbsoluteFill>
	);
};
