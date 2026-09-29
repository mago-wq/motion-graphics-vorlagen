// Szene 5 (11,3–15 s): Die drei Packungen fallen als Gruppe zusammen, die
// Ersparnis zählt hoch, dann der Aufruf "Link in Bio" mit pulsierendem Button.
// Ab STILL_FROM steht alles still.
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {fitFontSize} from '../components/FitText';
import {shakeAt} from '../components/Shake';
import {Stripe} from '../components/Stripe';
import {config} from '../config';
import {springFrom, SPRINGS} from '../motion';
import {DISPLAY_WEIGHT, FONT, NARROW_NBSP, STRIPE, TEXT_WEIGHT, withAlpha} from '../theme';
import {OUTRO, SAVING_IS_UNIFORM, savingAt, SCENES, STILL_FROM} from '../timing';
import {SAFE, WIDTH} from '../video';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const cfg = config.abschluss;

/** Anordnung der drei Packungen: Mitte vorn, links und rechts gedreht dahinter */
const PACKS = [
	{x: -250, rotate: -11, scale: 0.9, z: 1},
	{x: 250, rotate: 11, scale: 0.9, z: 1},
	{x: 0, rotate: 0, scale: 1, z: 2},
];
const PACK_FLOOR = 790;
const PACK_HEIGHT = 440;

const PULSE_RISE = 4;
const pulseBump = (frame: number, start: number, length: number): number => {
	if (frame <= start || frame >= start + length) return 0;
	if (frame < start + PULSE_RISE) {
		return interpolate(frame, [start, start + PULSE_RISE], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	}
	return interpolate(frame, [start + PULSE_RISE, start + length], [1, 0], {...clamp, easing: Easing.inOut(Easing.sin)});
};

const rise = (frame: number, start: number) => {
	const p = springFrom(frame, start, SPRINGS.soft, 12);
	return {opacity: p, transform: `translateY(${(1 - p) * 26}px)`};
};

/** Pfeil nach oben (Richtung Profil / Bio) */
const Arrow: React.FC<{color: string}> = ({color}) => (
	<svg width={46} height={54} viewBox="0 0 46 54">
		<path d="M23 50V6M5 23 23 5l18 18" fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

export const OutroScene: React.FC = () => {
	// Ab STILL_FROM steht das Bild: Zeit einfrieren
	const frame = Math.min(useCurrentFrame() + SCENES.abschluss.from, STILL_FROM - 1);
	const ink = cfg.schrift;

	const value = savingAt(frame);
	const bigText = `−${value}${NARROW_NBSP}%`;
	const bigSize = fitFontSize({text: `−${99}${NARROW_NBSP}%`, maxWidth: SAFE.width * 0.8, maxFontSize: 240, fontFamily: FONT, fontWeight: DISPLAY_WEIGHT, letterSpacing: -0.05});
	const hit = springFrom(frame, OUTRO.finalHit, SPRINGS.pop);
	const hitScale = frame >= OUTRO.finalHit ? interpolate(hit, [0, 1], [1.18, 1]) : 1;

	const button = springFrom(frame, OUTRO.buttonIn, SPRINGS.pop);
	const bump = OUTRO.pulses.reduce((sum, start) => sum + pulseBump(frame, start, OUTRO.pulseLength), 0);
	// Pfeil hüpft nach oben, mit dem Takt der Pulse
	const arrowIn = springFrom(frame, OUTRO.arrowIn, SPRINGS.soft, 10);
	const arrowHop = -14 * bump;

	const shake = shakeAt(
		frame,
		[...OUTRO.packLands.map((f) => ({frame: f, strength: 6})), {frame: OUTRO.finalHit, strength: 12}],
		'outro',
	);

	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${cfg.grund[0]} 0%, ${cfg.grund[1]} 100%)`, overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					background: `radial-gradient(700px 520px at 50% 34%, ${withAlpha('#FFFFFF', 0.22)}, transparent 70%), radial-gradient(700px 700px at 100% 100%, ${withAlpha(STRIPE[0], 0.35)}, transparent 70%), radial-gradient(600px 600px at 0% 80%, ${withAlpha(STRIPE[2], 0.3)}, transparent 70%)`,
				}}
			/>
			<AbsoluteFill style={shake}>
				{/* Packungen */}
				{PACKS.map((pack, i) => {
					const product = config.produkte[i];
					const snap = springFrom(frame, OUTRO.packStarts[i], SPRINGS.snap);
					const h = PACK_HEIGHT * pack.scale * (product.hoehe / 620);
					return (
						<div
							key={product.name}
							style={{
								position: 'absolute',
								left: 0,
								width: WIDTH,
								top: PACK_FLOOR - h,
								height: h,
								display: 'flex',
								justifyContent: 'center',
								zIndex: pack.z,
								transform: `translate(${pack.x}px, ${interpolate(snap, [0, 1], [-1100, 0])}px) rotate(${pack.rotate * snap}deg)`,
								transformOrigin: '50% 100%',
							}}
						>
							<Img src={staticFile(product.bild)} style={{height: h, width: 'auto', filter: `drop-shadow(0 26px 30px ${withAlpha('#1A0B2E', 0.4)})`}} />
						</div>
					);
				})}

				{/* Ersparnis */}
				<div style={{position: 'absolute', top: PACK_FLOOR + 30, left: SAFE.left, width: SAFE.width, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
					{!SAVING_IS_UNIFORM ? (
						<div style={{fontFamily: FONT, fontWeight: TEXT_WEIGHT, fontSize: 44, color: ink, opacity: frame >= OUTRO.countStart ? 1 : 0}}>bis zu</div>
					) : null}
					<div
						style={{
							fontFamily: FONT,
							fontWeight: DISPLAY_WEIGHT,
							fontSize: bigSize,
							lineHeight: 0.95,
							letterSpacing: '-0.05em',
							color: STRIPE[4],
							fontVariantNumeric: 'tabular-nums',
							whiteSpace: 'nowrap',
							opacity: frame >= OUTRO.countStart ? 1 : 0,
							transform: `scale(${hitScale})`,
							textShadow: `0 10px 30px ${withAlpha('#1A0B2E', 0.35)}`,
						}}
					>
						{bigText}
					</div>
					<div
						style={{
							marginTop: 6,
							fontFamily: FONT,
							fontWeight: DISPLAY_WEIGHT,
							fontSize: 68,
							lineHeight: 1,
							letterSpacing: '-0.03em',
							color: ink,
							whiteSpace: 'nowrap',
							...rise(frame, OUTRO.titleIn),
						}}
					>
						{cfg.titel}
					</div>
					<Stripe frame={frame} start={OUTRO.titleIn + 3} width={300} thickness={10} style={{marginTop: 22}} />
					<div
						style={{
							marginTop: 22,
							maxWidth: 760,
							textAlign: 'center',
							fontFamily: FONT,
							fontWeight: TEXT_WEIGHT,
							fontSize: 38,
							lineHeight: 1.25,
							color: ink,
							...rise(frame, OUTRO.sublineIn),
						}}
					>
						{cfg.unterzeile}
					</div>
				</div>

				{/* Button */}
				<div style={{position: 'absolute', top: 1290, left: 0, width: WIDTH, display: 'flex', justifyContent: 'center'}}>
					<div style={{position: 'relative', transform: `scale(${button * (1 + 0.05 * bump)})`, opacity: frame >= OUTRO.buttonIn ? 1 : 0}}>
						{OUTRO.pulses.map((start) => {
							const p = interpolate(frame, [start, start + OUTRO.pulseLength], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
							const visible = frame > start && frame < start + OUTRO.pulseLength;
							return (
								<div
									key={start}
									style={{
										position: 'absolute',
										inset: 0,
										borderRadius: 999,
										border: `4px solid ${cfg.button}`,
										transform: `scale(${1 + 0.12 * p}, ${1 + 0.4 * p})`,
										opacity: visible ? 0.7 * (1 - p) : 0,
									}}
								/>
							);
						})}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 22,
								background: cfg.button,
								color: cfg.buttonSchrift,
								borderRadius: 999,
								padding: '26px 56px 30px 60px',
								fontFamily: FONT,
								fontWeight: DISPLAY_WEIGHT,
								fontSize: 64,
								lineHeight: 1,
								letterSpacing: '-0.02em',
								whiteSpace: 'nowrap',
								boxShadow: `0 20px 44px ${withAlpha('#1A0B2E', 0.4)}`,
							}}
						>
							{cfg.buttonText}
							<div style={{opacity: arrowIn, transform: `translateY(${(1 - arrowIn) * 20 + arrowHop}px)`, display: 'flex'}}>
								<Arrow color={cfg.buttonSchrift} />
							</div>
						</div>
					</div>
				</div>

				{/* Hinweis */}
				<div
					style={{
						position: 'absolute',
						top: 1450,
						left: SAFE.left,
						width: SAFE.width,
						textAlign: 'center',
						fontFamily: FONT,
						fontWeight: TEXT_WEIGHT,
						fontSize: 24,
						color: withAlpha('#FFFFFF', 0.8),
						...rise(frame, OUTRO.noteIn),
					}}
				>
					{config.hinweis}, Stand {config.preisStand}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
