// Szenen 2–4 (je 3 s): ein Bestseller. Der Grund flutet in der Farbe der
// Packung, das Produkt fällt ins Bild und setzt auf (eigenes Geräusch je
// Produkt), dann Name, Streifen, Fakt und der Preis: Normalpreis wird vom
// Packungsstreifen durchgestrichen, der Clubpreis springt auf.
import {measureText} from '@remotion/layout-utils';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {fitFontSize} from '../components/FitText';
import {shakeAt} from '../components/Shake';
import {Stripe} from '../components/Stripe';
import {config} from '../config';
import {springFrom, SPRINGS} from '../motion';
import {DISPLAY_WEIGHT, FONT, formatEuro, NARROW_NBSP, savingPercent, STRIPE, TEXT_WEIGHT, withAlpha} from '../theme';
import {PRODUCT_STRIKE, PRODUCTS, SCENES} from '../timing';
import {SAFE, WIDTH} from '../video';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Unterkante des Produktfotos (Boden, auf dem es aufsetzt) */
const FLOOR_Y = 1000;
const NAME_Y = 1030;
const PRICE_Y = 1275;
const OLD_SIZE = 64;
const CLUB_SIZE = 104;

/** Weiche Einblendung von unten */
const rise = (frame: number, start: number) => {
	const p = springFrom(frame, start, SPRINGS.soft, 12);
	return {opacity: p, transform: `translateY(${(1 - p) * 28}px)`};
};

export const ProductScene: React.FC<{index: number}> = ({index}) => {
	const frame = useCurrentFrame() + SCENES.produkte[index].from;
	const p = config.produkte[index];
	const t = PRODUCTS[index];
	const ink = p.schrift;

	// Produkt: fällt von oben, setzt auf, federt einmal nach; danach schwebt es kaum merklich
	const drop = springFrom(frame, t.dropStart, SPRINGS.drop);
	const bob = frame > t.dropLand ? Math.sin((frame - t.dropLand) / 14) * 5 : 0;
	const y = interpolate(drop, [0, 1], [-1300, 0]) + bob;
	const tilt = interpolate(drop, [0, 1], [index % 2 === 0 ? -14 : 14, index % 2 === 0 ? -3 : 3]);
	// Bodenschatten wächst, je näher das Produkt dem Boden kommt
	const shadow = interpolate(drop, [0.5, 1], [0, 1], clamp);

	// Riesiger Produktname im Hintergrund, driftet langsam
	const ghostX = interpolate(frame, [t.start - 10, t.start + 90], [80, -160]);

	const badge = springFrom(frame, t.badgeStart, SPRINGS.stamp);
	const club = springFrom(frame, t.clubStart, SPRINGS.pop);
	const saving = springFrom(frame, t.savingStart, SPRINGS.pop);

	const nameSize = fitFontSize({text: p.name, maxWidth: SAFE.width - 40, maxFontSize: 104, fontFamily: FONT, fontWeight: DISPLAY_WEIGHT, letterSpacing: -0.03});
	const oldText = formatEuro(p.normalpreis);
	const oldWidth = measureText({text: oldText, fontFamily: FONT, fontSize: OLD_SIZE, fontWeight: String(DISPLAY_WEIGHT), letterSpacing: '-0.03em'}).width;
	const savingText = `−${savingPercent(p.normalpreis, p.clubpreis)}${NARROW_NBSP}%`;

	const shake = shakeAt(frame, [{frame: t.dropLand, strength: 9}], `produkt-${index}`);

	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${p.grund[0]} 0%, ${p.grund[1]} 100%)`, overflow: 'hidden'}}>
			{/* Lichtkegel hinter dem Produkt */}
			<AbsoluteFill style={{background: `radial-gradient(620px 620px at 50% 50%, ${withAlpha('#FFFFFF', 0.28)}, transparent 70%)`}} />

			{/* Produktname riesig als Kontur im Hintergrund */}
			<div
				style={{
					position: 'absolute',
					top: 420,
					left: 0,
					transform: `translateX(${ghostX}px)`,
					fontFamily: FONT,
					fontWeight: DISPLAY_WEIGHT,
					fontSize: 420,
					lineHeight: 1,
					letterSpacing: '-0.04em',
					whiteSpace: 'nowrap',
					color: 'transparent',
					WebkitTextStroke: `3px ${withAlpha(ink, 0.14)}`,
				}}
			>
				{p.name.split(' ')[0]}
			</div>

			<AbsoluteFill style={shake}>
				{/* Bodenschatten */}
				<div
					style={{
						position: 'absolute',
						left: WIDTH / 2 - 230,
						top: FLOOR_Y - 26,
						width: 460,
						height: 52,
						borderRadius: '50%',
						background: withAlpha('#000000', 0.3 * shadow),
						filter: 'blur(18px)',
						transform: `scaleX(${0.6 + 0.4 * shadow})`,
					}}
				/>

				{/* Produkt */}
				<div
					style={{
						position: 'absolute',
						left: 0,
						width: WIDTH,
						top: FLOOR_Y - p.hoehe,
						height: p.hoehe,
						display: 'flex',
						justifyContent: 'center',
						transform: `translateY(${y}px) rotate(${tilt}deg)`,
						transformOrigin: '50% 100%',
					}}
				>
					<Img src={staticFile(p.bild)} style={{height: p.hoehe, width: 'auto', filter: `drop-shadow(0 24px 30px ${withAlpha('#000000', 0.22)})`}} />
				</div>

				{/* Bestseller-Stempel + Zähler */}
				<div
					style={{
						position: 'absolute',
						top: SAFE.top + 90,
						left: 0,
						width: WIDTH,
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						gap: 20,
						opacity: interpolate(frame - t.badgeStart, [0, 1.5], [0, 1], clamp),
						transform: `scale(${interpolate(badge, [0, 1], [2.2, 1])}) rotate(${index % 2 === 0 ? -4 : 4}deg)`,
					}}
				>
					<div
						style={{
							background: STRIPE[4],
							color: '#17130F',
							fontFamily: FONT,
							fontWeight: DISPLAY_WEIGHT,
							fontSize: 40,
							letterSpacing: '0.06em',
							lineHeight: 1,
							padding: '14px 26px 16px',
							borderRadius: 14,
							boxShadow: `0 10px 24px ${withAlpha('#000000', 0.18)}`,
						}}
					>
						BESTSELLER
					</div>
					<div style={{fontFamily: FONT, fontWeight: TEXT_WEIGHT, fontSize: 34, color: ink, opacity: 0.85, fontVariantNumeric: 'tabular-nums'}}>
						{index + 1}/3
					</div>
				</div>

				{/* Name, Streifen, Fakt */}
				<div style={{position: 'absolute', top: NAME_Y, left: SAFE.left, width: SAFE.width, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
					<div
						style={{
							fontFamily: FONT,
							fontWeight: DISPLAY_WEIGHT,
							fontSize: nameSize,
							lineHeight: 1,
							letterSpacing: '-0.03em',
							color: ink,
							whiteSpace: 'nowrap',
							...rise(frame, t.nameIn),
						}}
					>
						{p.name}
					</div>
					<Stripe frame={frame} start={t.stripeIn} width={300} thickness={10} style={{marginTop: 20}} />
					<div
						style={{
							marginTop: 22,
							fontFamily: FONT,
							fontWeight: TEXT_WEIGHT,
							fontSize: 42,
							lineHeight: 1.2,
							color: ink,
							textAlign: 'center',
							...rise(frame, t.factIn),
						}}
					>
						{p.fakt}
					</div>
				</div>

				{/* Preiszeile */}
				<div style={{position: 'absolute', top: PRICE_Y, left: SAFE.left, width: SAFE.width, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 34}}>
					<div style={{position: 'relative', marginBottom: 34, ...rise(frame, t.priceIn)}}>
						<div style={{fontFamily: FONT, fontWeight: DISPLAY_WEIGHT, fontSize: OLD_SIZE, lineHeight: 1, letterSpacing: '-0.03em', color: ink, opacity: 0.75, whiteSpace: 'nowrap'}}>
							{oldText}
						</div>
						<Stripe
							frame={frame}
							start={t.strikeStart}
							width={oldWidth + 24}
							thickness={12}
							stagger={PRODUCT_STRIKE.stagger}
							length={PRODUCT_STRIKE.length}
							style={{position: 'absolute', left: -12, top: OLD_SIZE * 0.46, transform: 'rotate(-8deg)'}}
						/>
					</div>
					<div style={{position: 'relative', transform: `scale(${club})`, opacity: frame >= t.clubStart ? 1 : 0}}>
						<div
							style={{
								background: '#FFFFFF',
								color: '#17130F',
								fontFamily: FONT,
								fontWeight: DISPLAY_WEIGHT,
								fontSize: CLUB_SIZE,
								lineHeight: 1,
								letterSpacing: '-0.035em',
								padding: '18px 34px 24px',
								borderRadius: 28,
								whiteSpace: 'nowrap',
								boxShadow: `0 18px 40px ${withAlpha('#000000', 0.2)}`,
							}}
						>
							{formatEuro(p.clubpreis)}
						</div>
						{/* Ersparnis-Plakette */}
						<div
							style={{
								position: 'absolute',
								right: -34,
								top: -36,
								width: 112,
								height: 112,
								borderRadius: '50%',
								background: STRIPE[0],
								color: '#FFFFFF',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontFamily: FONT,
								fontWeight: DISPLAY_WEIGHT,
								fontSize: 34,
								letterSpacing: '-0.02em',
								whiteSpace: 'nowrap',
								transform: `scale(${saving}) rotate(14deg)`,
								opacity: frame >= t.savingStart ? 1 : 0,
							}}
						>
							{savingText}
						</div>
					</div>
				</div>
				<div
					style={{
						position: 'absolute',
						top: PRICE_Y + 166,
						left: SAFE.left,
						width: SAFE.width,
						textAlign: 'center',
						fontFamily: FONT,
						fontWeight: TEXT_WEIGHT,
						fontSize: 32,
						color: ink,
						opacity: 0.9 * interpolate(frame, [t.clubLand, t.clubLand + 8], [0, 1], {...clamp, easing: Easing.out(Easing.quad)}),
					}}
				>
					Clubpreis · {p.inhalt}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
