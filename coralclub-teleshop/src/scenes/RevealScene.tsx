// Szene 3: "Darf ich vorstellen: Oceanmin von Coral Club!"
// Dunkle Bühne, zwei Scheinwerfer suchen die Mitte, Trommelwirbel. Auf
// "Oceanmin" Blitz, Strahlenkranz, die Packung knallt herein, Glanzlicht und
// Glitzer. "von Coral Club" mit dem Packungsstreifen.
import {AbsoluteFill, interpolate} from 'remotion';
import {At} from '../components/At';
import {ChromeText} from '../components/ChromeText';
import {Product} from '../components/Product';
import {Sparkles, sparkleRing} from '../components/Sparkles';
import {Stripe} from '../components/Stripe';
import {Sunburst} from '../components/Sunburst';
import {config} from '../config';
import {clamp, framesToLand, ramp, shakeAt, SPRINGS, springFrom} from '../motion';
import {COLORS, FONT, WIDE} from '../theme';
import {EV, line, word} from '../timing';
import {SAFE} from '../video';
import {fitSize} from '../components/FitText';

const SNAP = framesToLand(SPRINGS.snap);
const start = line('reveal').start;

export const REVEAL_T = {
	start,
	worte: [word('reveal', 'Darf').start, word('reveal', 'ich').start, word('reveal', 'vorstellen').start],
	produkt: EV.fanfare,
	coral: word('reveal', 'Coral').start,
};
export const REVEAL_IMPACTS = {
	produkt: REVEAL_T.produkt + SNAP,
	glanz: REVEAL_T.produkt + SNAP + 4,
};

const Spotlight: React.FC<{x: number; angle: number; opacity: number}> = ({x, angle, opacity}) => (
	<div
		style={{
			position: 'absolute',
			left: x - 260,
			top: -120,
			width: 520,
			height: 1900,
			transformOrigin: '50% 0%',
			transform: `rotate(${angle}deg)`,
			background: 'linear-gradient(180deg, rgba(255,250,220,0.55) 0%, rgba(255,250,220,0.18) 70%, rgba(255,250,220,0) 100%)',
			clipPath: 'polygon(44% 0%, 56% 0%, 100% 100%, 0% 100%)',
			filter: 'blur(6px)',
			opacity,
			mixBlendMode: 'screen',
		}}
	/>
);

export const RevealScene: React.FC<{frame: number}> = ({frame}) => {
	const T = REVEAL_T;
	const lit = frame >= T.produkt;
	// Bühne: Scheinwerfer schwenken und treffen sich zur Fanfare in der Mitte
	const sweep = interpolate(frame, [T.start, T.produkt], [1, 0], clamp);
	const swing = Math.sin(frame * 0.22) * 14 * sweep;
	const box = springFrom(frame, T.produkt, SPRINGS.snap);
	const boxScale = interpolate(box, [0, 1], [2.6, 1]);
	const turn = Math.sin((frame - T.produkt) * 0.07) * 9;
	const float = Math.sin((frame - T.produkt) * 0.09) * 10;
	const flash = lit ? interpolate(frame, [T.produkt, T.produkt + 5], [1, 0], clamp) : 0;
	const shake = shakeAt(frame, [{frame: REVEAL_IMPACTS.produkt, strength: 16}], 'reveal');
	const title = springFrom(frame, T.produkt + 3, SPRINGS.slam);

	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 55% at 50% 60%, #12205E 0%, #050A26 70%, #01030D 100%)'}}>
			{lit ? (
				<Sunburst frame={frame} colors={{base: COLORS.blue, ray: COLORS.blueRay, glow: COLORS.cyan, edge: COLORS.blueDeep}} cy={930} speed={0.4} />
			) : (
				<>
					{/* Bühnenboden */}
					<At x={540} y={1260}>
						<div style={{width: 900, height: 180, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(255,245,210,0.35) 0%, rgba(255,245,210,0) 70%)'}} />
					</At>
					<Spotlight x={150} angle={-22 + swing} opacity={0.9} />
					<Spotlight x={930} angle={22 - swing} opacity={0.9} />
				</>
			)}

			{/* "Darf ich vorstellen:" Wort für Wort, nach der Fanfare nach oben weg */}
			<AbsoluteFill style={{opacity: 1 - ramp(frame, T.produkt, T.produkt + 4)}}>
				<At x={540} y={880}>
					<div
						style={{
							display: 'flex',
							gap: '0.3em',
							fontFamily: FONT,
							fontStyle: 'italic',
							fontWeight: 800,
							fontStretch: WIDE,
							fontSize: fitSize({text: config.reveal.vorstellen, maxWidth: SAFE.width * 0.92, maxSize: 84, weight: 800}),
							color: '#FFFFFF',
							textTransform: 'uppercase',
							whiteSpace: 'nowrap',
						}}
					>
						{config.reveal.vorstellen.split(' ').map((w, i) => {
							const p = springFrom(frame, T.worte[i] ?? T.worte[T.worte.length - 1], SPRINGS.pop);
							return (
								<span key={w + i} style={{opacity: interpolate(p, [0, 0.3], [0, 1], clamp), transform: `translateY(${(1 - p) * 40}px)`, display: 'inline-block', textShadow: '0 6px 0 #000'}}>
									{w}
								</span>
							);
						})}
					</div>
				</At>
			</AbsoluteFill>

			{lit ? (
				<AbsoluteFill style={{transform: shake}}>
					<At x={540} y={430} transform={`scale(${interpolate(title, [0, 1], [1.8, 1])})`} opacity={ramp(frame, T.produkt + 3, T.produkt + 6)}>
						<ChromeText text={config.produkt.name} size={170} maxWidth={SAFE.width} />
					</At>
					<At x={540} y={930 + float} transform={`perspective(1600px) rotateY(${turn}deg) scale(${boxScale})`}>
						<Product src={config.produkt.bild} height={720} frame={frame} glintAt={REVEAL_IMPACTS.glanz} glintFrames={18} />
						{/* Plakette "Bestseller" (so auf der Produktseite markiert) */}
						<div
							style={{
								position: 'absolute',
								right: -70,
								top: 30,
								transform: `rotate(12deg) scale(${springFrom(frame, REVEAL_IMPACTS.produkt + 2, SPRINGS.pop)})`,
								background: COLORS.yellow,
								color: COLORS.ink,
								border: `5px solid ${COLORS.red}`,
								borderRadius: 14,
								padding: '12px 22px',
								fontFamily: FONT,
								fontWeight: 900,
								fontStyle: 'italic',
								fontStretch: WIDE,
								fontSize: 40,
								textTransform: 'uppercase',
								boxShadow: '6px 8px 0 rgba(3,10,46,0.6)',
							}}
						>
							{config.produkt.plakette}
						</div>
					</At>
					{frame >= T.coral ? (
						<At x={540} y={1400} opacity={ramp(frame, T.coral, T.coral + 5)}>
							<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
								<div style={{fontFamily: FONT, fontWeight: 800, fontStyle: 'italic', fontStretch: WIDE, fontSize: 58, color: '#FFFFFF', textTransform: 'uppercase', textShadow: '0 5px 0 #030A2E', whiteSpace: 'nowrap'}}>
									{config.reveal.von}
								</div>
								<Stripe frame={frame} start={T.coral + 2} width={560} thickness={12} />
							</div>
						</At>
					) : null}
				</AbsoluteFill>
			) : null}
			<Sparkles frame={frame} items={sparkleRing(540, 930, REVEAL_IMPACTS.produkt - 1, 12, 420, 470, 58)} />
			{flash > 0 ? <AbsoluteFill style={{background: '#FFFFFF', opacity: flash}} /> : null}
		</AbsoluteFill>
	);
};
