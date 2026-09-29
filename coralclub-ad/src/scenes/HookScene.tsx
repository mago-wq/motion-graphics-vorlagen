// Szene 1 (0–2,3 s): "Voller Preis?" – der Normalpreis knallt hin, der
// Packungsstreifen streicht ihn durch, er kippt weg, der Clubpreis springt
// auf, ein "Nö."-Stempel sitzt drauf.
import {measureText} from '@remotion/layout-utils';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {fitFontSize} from '../components/FitText';
import {shakeAt} from '../components/Shake';
import {Stripe} from '../components/Stripe';
import {config} from '../config';
import {springFrom, SPRINGS} from '../motion';
import {DISPLAY_WEIGHT, FONT, formatEuro, STRIPE, TEXT_WEIGHT, withAlpha} from '../theme';
import {HOOK, HOOK_WORDS} from '../timing';
import {SAFE, WIDTH} from '../video';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ink = config.hook.schrift;
const product = config.produkte[config.hook.preisVon];

const PRICE_Y = 1030;
const PRICE_SIZE = 230;

const Word: React.FC<{word: string; impact: number; frame: number; size: number}> = ({word, impact, frame, size}) => {
	const start = impact - HOOK.slamLand;
	const slam = springFrom(frame, start, SPRINGS.slam);
	const t = frame - start;
	return (
		<div
			style={{
				fontFamily: FONT,
				fontWeight: DISPLAY_WEIGHT,
				fontSize: size,
				lineHeight: 0.88,
				letterSpacing: '-0.035em',
				color: ink,
				transform: `scale(${interpolate(slam, [0, 1], [2.2, 1])})`,
				opacity: interpolate(t, [0, 1.5], [0, 1], clamp),
				filter: t < HOOK.slamLand ? `blur(${interpolate(t, [0, HOOK.slamLand], [12, 0], clamp)}px)` : undefined,
				textTransform: 'uppercase',
				whiteSpace: 'nowrap',
			}}
		>
			{word}
		</div>
	);
};

export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();

	const wordSize = Math.min(
		...HOOK_WORDS.map((w) =>
			fitFontSize({text: w, maxWidth: SAFE.width - 40, maxFontSize: 250, fontFamily: FONT, fontWeight: DISPLAY_WEIGHT, uppercase: true, letterSpacing: -0.035}),
		),
	);
	const oldText = formatEuro(product.normalpreis);
	const newText = formatEuro(product.clubpreis);
	const priceWidth = measureText({text: oldText, fontFamily: FONT, fontSize: PRICE_SIZE, fontWeight: String(DISPLAY_WEIGHT), letterSpacing: '-0.04em'}).width;

	// Normalpreis: knallt herein, kippt nach dem Durchstreichen weg und fällt
	const priceSlam = springFrom(frame, HOOK.priceImpact - HOOK.slamLand, SPRINGS.slam);
	const fall = interpolate(frame, [HOOK.fallStart, HOOK.fallStart + 14], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	const oldVisible = frame >= HOOK.priceImpact - HOOK.slamLand;

	// Clubpreis: springt aus dem Nichts auf
	const club = springFrom(frame, HOOK.clubStart, SPRINGS.pop);
	// Stempel: von groß auf Endgröße, leicht gedreht
	const stamp = springFrom(frame, HOOK.stampStart, SPRINGS.stamp);
	const caption = springFrom(frame, HOOK.captionIn, SPRINGS.soft, 12);

	const shake = shakeAt(
		frame,
		[
			...HOOK.wordImpacts.map((f) => ({frame: f, strength: 10})),
			{frame: HOOK.priceImpact, strength: 18},
			{frame: HOOK.stampLand, strength: 14},
		],
		'hook',
	);

	return (
		<AbsoluteFill style={{background: config.hook.grund}}>
			{/* dezente Körnung aus großen, weichen Farbflecken der Streifenfarben */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(900px 700px at 90% 8%, ${withAlpha(STRIPE[0], 0.2)}, transparent 70%), radial-gradient(800px 800px at 0% 100%, ${withAlpha(STRIPE[2], 0.16)}, transparent 70%)`,
				}}
			/>
			<AbsoluteFill style={shake}>
				{/* Frage */}
				<div style={{position: 'absolute', top: SAFE.top + 200, left: SAFE.left, width: SAFE.width, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
					{HOOK_WORDS.map((w, i) => (
						<Word key={w} word={w} impact={HOOK.wordImpacts[i]} frame={frame} size={wordSize} />
					))}
				</div>

				{/* Normalpreis + Durchstreichung */}
				{oldVisible ? (
					<div
						style={{
							position: 'absolute',
							left: 0,
							width: WIDTH,
							top: PRICE_Y,
							display: 'flex',
							justifyContent: 'center',
							transform: `translateY(${fall * 900}px) rotate(${fall * 24}deg) scale(${interpolate(priceSlam, [0, 1], [1.9, 1])})`,
							transformOrigin: '30% 50%',
							opacity: interpolate(fall, [0.6, 1], [1, 0], clamp),
						}}
					>
						<div style={{position: 'relative'}}>
							<div style={{fontFamily: FONT, fontWeight: DISPLAY_WEIGHT, fontSize: PRICE_SIZE, lineHeight: 1, letterSpacing: '-0.04em', color: ink, whiteSpace: 'nowrap'}}>
								{oldText}
							</div>
							<Stripe
								frame={frame}
								start={HOOK.strikeStart}
								width={priceWidth + 60}
								thickness={30}
								stagger={HOOK.strikeStagger}
								length={HOOK.strikeLength}
								style={{position: 'absolute', left: -30, top: PRICE_SIZE * 0.5, transform: 'rotate(-7deg)'}}
							/>
						</div>
					</div>
				) : null}

				{/* Clubpreis */}
				{frame >= HOOK.clubStart ? (
					<div style={{position: 'absolute', left: 0, width: WIDTH, top: PRICE_Y - 20, display: 'flex', justifyContent: 'center'}}>
						<div
							style={{
								transform: `scale(${club}) rotate(${interpolate(club, [0, 1], [-10, -3])}deg)`,
								background: STRIPE[0],
								color: '#FFFFFF',
								borderRadius: 40,
								padding: '26px 54px 34px',
								fontFamily: FONT,
								fontWeight: DISPLAY_WEIGHT,
								fontSize: PRICE_SIZE,
								lineHeight: 1,
								letterSpacing: '-0.04em',
								whiteSpace: 'nowrap',
								boxShadow: `0 30px 60px ${withAlpha('#5A1030', 0.3)}`,
							}}
						>
							{newText}
						</div>
					</div>
				) : null}

				{/* "Nö."-Stempel */}
				{frame >= HOOK.stampStart ? (
					<div
						style={{
							position: 'absolute',
							left: 700,
							top: PRICE_Y - 190,
							width: 250,
							height: 250,
							borderRadius: '50%',
							background: STRIPE[1],
							color: '#FFFFFF',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontFamily: FONT,
							fontWeight: DISPLAY_WEIGHT,
							fontSize: 110,
							letterSpacing: '-0.04em',
							transform: `scale(${interpolate(stamp, [0, 1], [2.4, 1])}) rotate(12deg)`,
							opacity: interpolate(frame - HOOK.stampStart, [0, 1.5], [0, 1], clamp),
							boxShadow: `0 18px 40px ${withAlpha('#2A1440', 0.35)}`,
						}}
					>
						{config.hook.antwort}
					</div>
				) : null}

				{/* Wer ist gemeint */}
				<div
					style={{
						position: 'absolute',
						left: SAFE.left,
						width: SAFE.width,
						top: PRICE_Y + 330,
						textAlign: 'center',
						fontFamily: FONT,
						fontWeight: TEXT_WEIGHT,
						fontSize: 44,
						lineHeight: 1.25,
						color: ink,
						opacity: caption,
						transform: `translateY(${(1 - caption) * 24}px)`,
					}}
				>
					<span style={{fontWeight: DISPLAY_WEIGHT}}>Clubpreis</span> für {product.name}
					<br />
					{product.inhalt} statt {oldText}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
