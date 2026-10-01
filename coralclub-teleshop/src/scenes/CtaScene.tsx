// Szene 10: "Also: Link in der Bio antippen, registrieren und sparen! Greifen Sie zu!"
// Wie das Bestell-Banner alter TV-Werbung ("Jetzt anrufen!"), nur mit
// "LINK IN BIO" statt Telefonnummer. Drei Schritte haken sich ab, auf
// "Greifen Sie zu!" pumpt alles, die Schluss-Fanfare setzt den Glitzer.
// Ab STILL_FROM steht das Bild (siehe TeleshopAd).
import {AbsoluteFill, interpolate} from 'remotion';
import {At} from '../components/At';
import {ChromeText} from '../components/ChromeText';
import {ArrowUp, Check} from '../components/Icons';
import {Product} from '../components/Product';
import {Sparkles, sparkleRing} from '../components/Sparkles';
import {Starburst} from '../components/Starburst';
import {Sunburst} from '../components/Sunburst';
import {config} from '../config';
import {clamp, framesToLand, ramp, SPRINGS, springFrom} from '../motion';
import {COLORS, FONT, WIDE} from '../theme';
import {EV, line, STILL_FROM, word} from '../timing';
import {SAFE} from '../video';

const SLAM = framesToLand(SPRINGS.slam);
const start = line('cta').start;

export const CTA_T = {
	start,
	banner: word('cta', 'Link').start,
	schritte: [word('cta', 'antippen').start, word('cta', 'registrieren').start, word('cta', 'sparen').start],
	greifen: word('cta', 'Greifen').start,
	schluss: EV.schluss,
};
export const CTA_IMPACTS = {
	banner: CTA_T.banner + SLAM,
	schritte: CTA_T.schritte.map((t) => t + 3),
	greifen: CTA_T.greifen + 2,
	schluss: CTA_T.schluss,
};

export const CtaScene: React.FC<{frame: number}> = ({frame}) => {
	const T = CTA_T;
	const head = springFrom(frame, T.start, SPRINGS.slam);
	const box = springFrom(frame, T.start + 2, SPRINGS.snap);
	const badge = springFrom(frame, T.start + 6, SPRINGS.wobble);
	const banner = springFrom(frame, T.banner, SPRINGS.slam);
	// Puls des Banners: läuft, bis die Fanfare ausklingt, steht vor STILL_FROM
	const pulseAmp = interpolate(frame, [T.schluss + 6, Math.min(T.schluss + 20, STILL_FROM - 2)], [1, 0], clamp);
	const pulse = 1 + 0.035 * Math.max(0, Math.sin((frame - T.banner) * 0.32)) * pulseAmp;
	const greifen = frame >= T.greifen ? interpolate(springFrom(frame, T.greifen, SPRINGS.pop), [0, 1], [1.12, 1]) : 1;
	const fanfare = frame >= T.schluss ? interpolate(springFrom(frame, T.schluss, SPRINGS.pop), [0, 1], [1.1, 1]) : 1;
	const bounce = greifen * fanfare;

	return (
		<AbsoluteFill>
			<Sunburst
				frame={frame}
				colors={{base: COLORS.blue, ray: COLORS.blueRay, glow: COLORS.cyan, edge: COLORS.blueDeep}}
				cy={720}
				speed={0.5}
			/>
			<At x={540} y={370} transform={`scale(${interpolate(head, [0, 1], [1.7, 1]) * bounce})`} opacity={ramp(frame, T.start, T.start + 3)}>
				<ChromeText text={config.cta.titel} size={118} maxWidth={SAFE.width} variant="gold" />
			</At>

			<At x={330} y={700} transform={`translateY(${(1 - box) * 600}px) rotate(-5deg) scale(${bounce})`}>
				<Product src={config.produkt.bild} height={430} frame={frame} glintAt={T.schluss} glintFrames={16} />
			</At>
			<At x={760} y={690} transform={`scale(${badge * bounce}) rotate(${10 + Math.sin(frame * 0.2) * 3}deg)`}>
				<Starburst size={360}>
					<div style={{transform: 'rotate(-6deg)', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
						<ChromeText text={`−${config.rabattProzent} %`} size={96} variant="red" />
						<div
							style={{
								fontFamily: FONT,
								fontWeight: 900,
								fontStyle: 'italic',
								fontStretch: WIDE,
								fontSize: 30,
								color: COLORS.ink,
								textTransform: 'uppercase',
								marginTop: -4,
							}}
						>
							{config.cta.stoerer}
						</div>
					</div>
				</Starburst>
			</At>

			{/* Drei Schritte, als Gruppe mittig, Zeilen linksbündig */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 950, display: 'flex', justifyContent: 'center'}}>
				<div style={{position: 'relative', display: 'flex', flexDirection: 'column', gap: 18}}>
					{config.cta.schritte.map((text, i) => {
						const at = T.schritte[i] ?? T.schritte[T.schritte.length - 1];
						const p = springFrom(frame, at, SPRINGS.pop);
						return (
							<div
								key={text}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 18,
									opacity: frame >= at ? interpolate(p, [0, 0.3], [0, 1], clamp) : 0.28,
									transform: `translateX(${frame >= at ? (1 - p) * 60 : 0}px)`,
								}}
							>
								<Check
									size={64}
									progress={frame >= at ? ramp(frame, at, at + 9) : 0}
									ring={frame >= at ? '#1FB04A' : 'rgba(255,255,255,0.25)'}
								/>
								<div
									style={{
										fontFamily: FONT,
										fontWeight: 900,
										fontStyle: 'italic',
										fontStretch: WIDE,
										fontSize: 50,
										color: '#FFFFFF',
										textTransform: 'uppercase',
										textShadow: '0 4px 0 #030A2E',
										whiteSpace: 'nowrap',
									}}
								>
									{text}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Bestell-Banner */}
			{frame >= T.banner ? (
				<At
					x={540}
					y={1265}
					transform={`scale(${interpolate(banner, [0, 1], [1.6, 1]) * pulse * bounce})`}
					opacity={ramp(frame, T.banner, T.banner + 3)}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 22,
							padding: '18px 44px 16px 36px',
							background: `linear-gradient(180deg, #FF3344 0%, ${COLORS.red} 55%, ${COLORS.redDeep} 100%)`,
							border: '6px solid #FFFFFF',
							borderRadius: 22,
							boxShadow: '12px 14px 0 rgba(3,10,46,0.65)',
						}}
					>
						<ArrowUp size={86} color={COLORS.yellow} />
						<ChromeText text={config.cta.button} size={104} maxWidth={720} variant="gold" outline={0.08} />
					</div>
				</At>
			) : null}

			<At x={540} y={1430} opacity={ramp(frame, T.start + 8, T.start + 16)}>
				<div
					style={{
						width: 880,
						fontFamily: FONT,
						fontWeight: 600,
						fontSize: 25,
						lineHeight: 1.3,
						color: '#FFFFFF',
						textAlign: 'center',
						textShadow: '0 2px 4px rgba(0,0,0,0.6)',
					}}
				>
					{config.werbung} · {config.hinweis} {config.preisStand}
				</div>
			</At>

			<Sparkles
				frame={frame}
				items={[
					...sparkleRing(540, 1265, CTA_IMPACTS.greifen, 8, 470, 120, 46),
					...sparkleRing(450, 760, CTA_IMPACTS.schluss, 14, 430, 380, 60),
				]}
			/>
		</AbsoluteFill>
	);
};
