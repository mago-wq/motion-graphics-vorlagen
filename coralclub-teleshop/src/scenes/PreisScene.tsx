// Szene 8: "Mit dem Clubpreis zahlen Sie nicht dreiundzwanzig Euro fünfundsiebzig –
// sondern nur neunzehn Euro!"
// Gelber Strahlenkranz. Der Normalpreis erscheint, der Coral-Club-Streifen
// streicht ihn durch, auf "neunzehn" springt der rote Preis-Störer auf.
import {AbsoluteFill, interpolate} from 'remotion';
import {At} from '../components/At';
import {ChromeText} from '../components/ChromeText';
import {Product} from '../components/Product';
import {Sparkles, sparkleRing} from '../components/Sparkles';
import {Starburst} from '../components/Starburst';
import {Stripe} from '../components/Stripe';
import {Sunburst} from '../components/Sunburst';
import {config, euro} from '../config';
import {framesToLand, ramp, shakeAt, SPRINGS, springFrom} from '../motion';
import {COLORS, FONT, WIDE} from '../theme';
import {EV, line, word} from '../timing';
import {SAFE} from '../video';

const WOBBLE = framesToLand(SPRINGS.wobble);
const start = line('preis').start;

export const PREIS_T = {
	start,
	alt: word('preis', 'dreiundzwanzig').start,
	strich: Math.max(word('preis', 'fünfundsiebzig').end - 3, word('preis', 'dreiundzwanzig').start + 8),
	neu: EV.preis,
};
export const PREIS_IMPACTS = {
	alt: PREIS_T.alt + 3,
	strich: PREIS_T.strich,
	neu: PREIS_T.neu + WOBBLE,
};

export const PreisScene: React.FC<{frame: number}> = ({frame}) => {
	const T = PREIS_T;
	const head = springFrom(frame, T.start, SPRINGS.slam);
	const box = springFrom(frame, T.start + 2, SPRINGS.snap);
	const alt = springFrom(frame, T.alt, SPRINGS.pop);
	const neu = springFrom(frame, T.neu, SPRINGS.wobble);
	const dim = ramp(frame, T.strich + 6, T.strich + 14);
	const shake = shakeAt(frame, [{frame: PREIS_IMPACTS.neu, strength: 16}], 'preis');
	return (
		<AbsoluteFill>
			<Sunburst frame={frame} colors={{base: '#FFB300', ray: '#FFCB2E', glow: '#FFF7C8', edge: '#E06200'}} cy={900} speed={0.35} />
			<AbsoluteFill style={{transform: shake}}>
				<At x={540} y={380} transform={`scale(${interpolate(head, [0, 1], [1.7, 1])})`} opacity={ramp(frame, T.start, T.start + 3)}>
					<ChromeText text={config.preis.mitClubpreis} size={112} maxWidth={SAFE.width} />
				</At>

				{frame >= T.alt ? (
					<At x={540} y={640} transform={`scale(${alt * (1 - 0.18 * dim)})`} opacity={1 - 0.35 * dim}>
						<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
							<div style={{fontFamily: FONT, fontWeight: 800, fontStyle: 'italic', fontStretch: WIDE, fontSize: 44, color: COLORS.ink, textTransform: 'uppercase', marginBottom: 6}}>
								{config.preis.normal}
							</div>
							<div style={{position: 'relative'}}>
								<ChromeText text={euro(config.produkt.normalpreis)} size={150} uppercase={false} />
								<div style={{position: 'absolute', left: 10, right: 10, top: '50%', transform: 'rotate(-9deg)'}}>
									<Stripe frame={frame} start={T.strich} width={640} thickness={26} stagger={1.2} length={5} />
								</div>
							</div>
						</div>
					</At>
				) : null}

				<At x={290} y={1170} transform={`translateX(${(1 - box) * -500}px) rotate(-6deg)`}>
					<Product src={config.produkt.bild} height={560} frame={frame} />
				</At>

				{frame >= T.neu ? (
					<At x={705} y={1110} transform={`scale(${interpolate(neu, [0, 1], [0, 1])}) rotate(${-8 + Math.sin((frame - T.neu) * 0.22) * 2.5}deg)`}>
						<Starburst size={590} colors={{from: '#FF5A5A', to: COLORS.red, stroke: '#FFFFFF'}} rotate={frame * 0.5}>
							<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'rotate(-4deg)'}}>
								<ChromeText text={config.preis.nur} size={84} variant="white" outline={0.06} depth={0.04} />
								<ChromeText text={euro(config.produkt.clubpreis)} size={170} maxWidth={540} stretch="100%" variant="gold" uppercase={false} />
							</div>
						</Starburst>
					</At>
				) : null}
			</AbsoluteFill>
			<Sparkles frame={frame} items={sparkleRing(705, 1110, PREIS_IMPACTS.neu - 2, 10, 330, 330, 52)} />
		</AbsoluteFill>
	);
};
