// Szene 4 (8,5–12,0 s): Angebotskarte. Die Rabatt-Zahl zählt hoch,
// ein Goldrahmen zeichnet sich einmal um die Karte, am Ende ein kurzer Stoß.
import {measureText} from '@remotion/layout-utils';
import {getLength, getPointAtLength} from '@remotion/paths';
import {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {FitText, fitFontSize} from '../components/FitText';
import {StrokePath} from '../components/Icons';
import {MaskReveal} from '../components/MaskReveal';
import {SafeArea} from '../components/SafeArea';
import {config} from '../config';
import {softIn, springFrom, SPRINGS} from '../motion';
import {COLORS, HEADLINE_FONT, NARROW_NBSP} from '../theme';
import {discountAt, OFFER, SCENES} from '../timing';
import {SAFE} from '../video';

const CARD_WIDTH = SAFE.width;
const CARD_HEIGHT = 820;
const RADIUS = 18;
const FRAME_STROKE = 6;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Rahmen als ein Pfad: startet oben links, läuft im Uhrzeigersinn einmal herum. */
const framePath = (() => {
	const i = FRAME_STROKE / 2;
	const [x0, y0, x1, y1, r] = [i, i, CARD_WIDTH - i, CARD_HEIGHT - i, RADIUS];
	return [
		`M ${x0 + r} ${y0} H ${x1 - r} A ${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
		`V ${y1 - r} A ${r} ${r} 0 0 1 ${x1 - r} ${y1}`,
		`H ${x0 + r} A ${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
		`V ${y0 + r} A ${r} ${r} 0 0 1 ${x0 + r} ${y0}`,
	].join(' ');
})();
const FRAME_LENGTH = getLength(framePath);

/** Stoß beim Abschluss-Schlag: kurz anschwellen, federnd zurück. 0 = Ruhe. */
const punchAt = (frame: number): number => {
	if (frame < OFFER.finalHit) {
		return interpolate(frame, [OFFER.finalHit - 3, OFFER.finalHit], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	}
	return 1 - springFrom(frame, OFFER.finalHit, SPRINGS.punch);
};

export const OfferScene: React.FC = () => {
	const frame = useCurrentFrame() + SCENES.angebot.from;
	const {wert, einheit} = config.neukundenrabatt;

	const appear = softIn(frame, OFFER.cardIn, 16);
	const line1 = softIn(frame, OFFER.cardIn + 3, 16);
	const numberIn = softIn(frame, OFFER.cardIn + 6, 14);
	const line3 = softIn(frame, OFFER.cardIn + 10, 16);
	const punch = punchAt(frame);

	// Goldrahmen: ease-in-out, ein Umlauf
	const frameProgress = interpolate(frame, [OFFER.frameStart, OFFER.frameStart + OFFER.frameDuration], [0, 1], {
		...clamp,
		easing: Easing.inOut(Easing.cubic),
	});
	const pen = frameProgress > 0 && frameProgress < 1 ? getPointAtLength(framePath, FRAME_LENGTH * frameProgress) : null;

	// Zahl: feste Breite für die Ziffern, damit beim Hochzählen nichts springt
	const finalText = `${wert}${NARROW_NBSP}${einheit}`;
	const numberSize = useMemo(
		() => fitFontSize({text: finalText, maxWidth: CARD_WIDTH - 180, maxFontSize: 450, fontFamily: HEADLINE_FONT}),
		[finalText],
	);
	const digitsWidth = useMemo(
		() => measureText({text: String(wert), fontFamily: HEADLINE_FONT, fontSize: numberSize}).width,
		[wert, numberSize],
	);

	return (
		<AbsoluteFill>
			<SafeArea>
				<div
					style={{
						position: 'relative',
						width: CARD_WIDTH,
						height: CARD_HEIGHT,
						opacity: appear,
						transform: `scale(${interpolate(appear, [0, 1], [0.9, 1]) * (1 + 0.012 * punch)})`,
					}}
				>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background: COLORS.surface,
							border: `2px solid ${COLORS.hairline}`,
							borderRadius: RADIUS,
						}}
					/>
					<svg
						width={CARD_WIDTH}
						height={CARD_HEIGHT}
						style={{position: 'absolute', inset: 0, overflow: 'visible'}}
					>
						<StrokePath d={framePath} progress={frameProgress} color={COLORS.accent} strokeWidth={FRAME_STROKE} />
						{pen ? <circle cx={pen.x} cy={pen.y} r={9} fill={COLORS.accent} /> : null}
					</svg>

					<div
						style={{
							position: 'absolute',
							inset: 0,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<MaskReveal progress={line1}>
							<FitText
								text={config.texte.vorRabatt}
								maxWidth={CARD_WIDTH - 160}
								maxFontSize={118}
								fontFamily={HEADLINE_FONT}
								letterSpacing={0.02}
								uppercase
								style={{color: COLORS.text}}
							/>
						</MaskReveal>

						<div
							style={{
								display: 'flex',
								alignItems: 'baseline',
								fontFamily: HEADLINE_FONT,
								fontSize: numberSize,
								lineHeight: 0.92,
								color: COLORS.accent,
								margin: '14px 0 6px',
								opacity: numberIn,
								transform: `translateY(${(1 - numberIn) * 40}px) scale(${1 + 0.1 * punch})`,
							}}
						>
							<span style={{display: 'inline-block', width: digitsWidth, textAlign: 'right'}}>
								{discountAt(frame)}
							</span>
							<span>{`${NARROW_NBSP}${einheit}`}</span>
						</div>

						<MaskReveal progress={line3}>
							<FitText
								text={config.texte.nachRabatt}
								maxWidth={CARD_WIDTH - 140}
								maxFontSize={104}
								fontFamily={HEADLINE_FONT}
								letterSpacing={0.02}
								uppercase
								style={{color: COLORS.text}}
							/>
						</MaskReveal>
					</div>
				</div>
			</SafeArea>
		</AbsoluteFill>
	);
};
