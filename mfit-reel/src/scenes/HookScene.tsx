// Szene 1 (0–1,6 s): "PREMIUM-GYM FÜR 17,90 €?"
// Schon Frame 0 zeigt Text in Bewegung. Der Preis rollt wie eine Walze und
// rastet auf dem Clap ein. Das Fragezeichen ist der Köder für die nächste Szene.
import {interpolate} from 'remotion';
import {config} from '../config';
import {At} from '../components/Layout';
import {SlotText} from '../components/SlotText';
import {fitSize, goldTextStyle, Line, MaskReveal, TextLine} from '../components/Type';
import {clamp, exitProgress, impulse, progress, springFrom, SPRINGS} from '../motion';
import {COLORS, DISPLAY_FONT, formatAmount, NBSP} from '../theme';
import {HAKEN, HOOK} from '../timing';
import {TYPE_WIDTH} from '../video';

export const HookScene: React.FC<{frame: number}> = ({frame}) => {
	const end = HAKEN.start;
	if (frame >= end) return null;

	// Einschlag schon vor Frame 0 begonnen: das erste Bild ist lesbar und in Bewegung
	const slam = springFrom(frame, HOOK.premium - 2, SPRINGS.slam);
	const premiumScale = 1 + 0.14 * (1 - slam);
	const fuer = progress(frame, HOOK.fuer, 7);
	const landed = frame >= HOOK.landet;
	const priceSlam = springFrom(frame, HOOK.landet, SPRINGS.slam);
	const imMonat = progress(frame, HOOK.imMonat, 8);
	const out = exitProgress(frame, end, 5);

	const amount = formatAmount(config.preis.aktuell);
	const priceText = `${amount}${NBSP}€?`;
	const priceSize = fitSize({text: priceText, maxWidth: TYPE_WIDTH, maxSize: 230});
	// Fragezeichen wippt nach dem Einrasten
	const qT = frame - HOOK.landet;
	const qAngle = landed ? 16 * Math.exp(-qT / 14) * Math.sin(qT * 0.55) + 5 * impulse(frame, HOOK.imMonat + 6, 12) : 0;
	const push = interpolate(frame, [0, end], [1, 1.035], clamp);

	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				transform: `translateY(${-out * 160}px) scale(${push})`,
				opacity: 1 - out,
				filter: out > 0 ? `blur(${out * 8}px)` : undefined,
			}}
		>
			<At y={600}>
				<div style={{transform: `scale(${premiumScale})`}}>
					<Line text={config.hook.zeile} maxWidth={TYPE_WIDTH} maxSize={132} />
				</div>
			</At>
			<At y={728}>
				<MaskReveal p={fuer}>
					<TextLine text={config.hook.vorPreis.toUpperCase()} maxWidth={400} maxSize={58} weight={700} tracking={0.16} gold />
				</MaskReveal>
			</At>
			<At y={868}>
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						fontFamily: DISPLAY_FONT,
						fontSize: priceSize,
						lineHeight: 1,
						transform: landed ? `scale(${1 + 0.12 * (1 - priceSlam)})` : undefined,
					}}
				>
					<SlotText
						text={amount}
						frame={frame}
						rollFrom={HOOK.rollen}
						lockAt={HOOK.ziffern}
						turns={3}
						digitStyle={goldTextStyle()}
					/>
					<span style={{display: 'inline-block', height: '1em', opacity: landed ? 1 : 0, ...goldTextStyle()}}>
						{`${NBSP}€`}
					</span>
					<span
						style={{
							display: 'inline-block',
							height: '1em',
							color: COLORS.text,
							opacity: landed ? 1 : 0,
							transform: `rotate(${qAngle}deg)`,
							transformOrigin: '50% 90%',
						}}
					>
						?
					</span>
				</div>
			</At>
			<At y={1010}>
				<MaskReveal p={imMonat}>
					<TextLine
						text={config.hook.unterPreis.toUpperCase()}
						maxWidth={600}
						maxSize={44}
						weight={600}
						tracking={0.24}
						color={COLORS.textMuted}
					/>
				</MaskReveal>
			</At>
		</div>
	);
};

