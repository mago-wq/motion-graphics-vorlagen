// Szene 5: "Mit satten hundertzwanzig Milligramm Magnesium pro Stick!"
// Der Zähler läuft auf "hundertzwanzig" von 0 bis 120 hoch, dann klappt die
// Periodensystem-Kachel "Mg" herein, zuletzt "PRO STICK". Darunter klein der
// Anteil am Nährstoffbezugswert (von der Produktseite).
import {AbsoluteFill, interpolate} from 'remotion';
import {At} from '../components/At';
import {ChromeText} from '../components/ChromeText';
import {Sunburst} from '../components/Sunburst';
import {config} from '../config';
import {clamp, framesToLand, ramp, shakeAt, SPRINGS, springFrom} from '../motion';
import {COLORS, FONT, WIDE} from '../theme';
import {line, word} from '../timing';
import {SAFE} from '../video';

const SLAM = framesToLand(SPRINGS.slam);
const zahl = word('magnesium', 'hundertzwanzig');

export const MG_T = {
	start: line('magnesium').start,
	zaehlen: zahl.start,
	/** Zähler steht, wenn das Wort gesprochen ist */
	zahlFertig: Math.max(zahl.end, zahl.start + 8),
	kachel: word('magnesium', 'Magnesium').start,
	proStick: word('magnesium', 'Stick').start,
};
export const MG_IMPACTS = {
	zahl: MG_T.zahlFertig,
	kachel: MG_T.kachel + 6,
	proStick: MG_T.proStick + SLAM,
	/** Ticks während des Zählens (für den Ton) */
	ticks: Array.from({length: Math.max(0, Math.floor((MG_T.zahlFertig - MG_T.zaehlen) / 2))}, (_, i) => MG_T.zaehlen + i * 2),
};

export const MagnesiumScene: React.FC<{frame: number}> = ({frame}) => {
	const T = MG_T;
	const count = interpolate(frame, [T.zaehlen, T.zahlFertig], [0, config.produkt.magnesiumMg], {...clamp, easing: (t) => 1 - (1 - t) ** 2});
	const bump = frame >= T.zahlFertig ? interpolate(springFrom(frame, T.zahlFertig, SPRINGS.pop), [0, 1], [1.18, 1]) : 1;
	const appear = ramp(frame, T.start, T.start + 5);
	const flip = springFrom(frame, T.kachel, {damping: 14, stiffness: 140, mass: 0.7});
	const stick = springFrom(frame, T.proStick, SPRINGS.slam);
	const shake = shakeAt(frame, [{frame: MG_IMPACTS.zahl, strength: 10}], 'mg');

	return (
		<AbsoluteFill>
			<Sunburst frame={frame} colors={{base: COLORS.blue, ray: COLORS.blueRay, glow: COLORS.cyan, edge: COLORS.blueDeep}} cy={640} speed={0.3} />
			<AbsoluteFill style={{transform: shake}}>
				<At x={540} y={600} transform={`scale(${bump})`} opacity={appear}>
					<ChromeText
						text={`${Math.round(count)}\u00A0mg`}
						fitTo={`${config.produkt.magnesiumMg}\u00A0mg`}
						size={300}
						maxWidth={SAFE.width}
						variant="gold"
						uppercase={false}
						style={{fontVariantNumeric: 'tabular-nums'}}
					/>
				</At>

				{frame >= T.kachel ? (
					<At x={540} y={1060} transform={`perspective(1400px) rotateY(${(1 - flip) * 95}deg)`}>
						<div
							style={{
								width: 330,
								height: 360,
								borderRadius: 26,
								background: 'linear-gradient(160deg, #FFFFFF 0%, #DCE8FF 100%)',
								border: `8px solid ${COLORS.ink}`,
								boxShadow: '14px 18px 0 rgba(3,10,46,0.6)',
								position: 'relative',
								fontFamily: FONT,
								color: COLORS.ink,
							}}
						>
							<div style={{position: 'absolute', left: 26, top: 18, fontSize: 52, fontWeight: 800}}>{config.magnesium.element.nummer}</div>
							<div style={{position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontSize: 190, fontWeight: 900, lineHeight: 1}}>
								{config.magnesium.element.symbol}
							</div>
							<div style={{position: 'absolute', left: 0, right: 0, bottom: 28, textAlign: 'center', fontSize: 44, fontWeight: 800, fontStretch: WIDE}}>
								{config.magnesium.element.name}
							</div>
						</div>
					</At>
				) : null}

				{frame >= T.proStick ? (
					<At x={540} y={1345} transform={`scale(${interpolate(stick, [0, 1], [1.8, 1])}) rotate(-3deg)`} opacity={ramp(frame, T.proStick, T.proStick + 3)}>
						<div style={{background: COLORS.red, padding: '10px 34px 6px', borderRadius: 16, border: '5px solid #FFFFFF', boxShadow: '10px 12px 0 rgba(3,10,46,0.6)'}}>
							<ChromeText text={config.magnesium.proStick} size={92} variant="white" outline={0.05} depth={0} />
						</div>
					</At>
				) : null}

				<At x={540} y={1465} opacity={ramp(frame, T.proStick + 6, T.proStick + 14)}>
					<div style={{fontFamily: FONT, fontWeight: 700, fontSize: 32, color: '#FFFFFF', whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.6)'}}>
						= {config.produkt.nrvProzent}&nbsp;% des Nährstoffbezugswerts (NRV) pro Tagesportion
					</div>
				</At>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
