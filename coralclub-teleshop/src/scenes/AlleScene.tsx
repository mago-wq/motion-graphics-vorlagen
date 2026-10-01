// Szene 9: "Zwanzig Prozent weniger – und das auf alle Coral-Club-Produkte!"
// "−20 %" zählt hoch, dann "AUF ALLE CORAL-CLUB-PRODUKTE" und drei Packungen
// aus dem Sortiment springen nebeneinander auf (Beleg statt Behauptung).
import {AbsoluteFill, interpolate} from 'remotion';
import {At} from '../components/At';
import {ChromeText} from '../components/ChromeText';
import {Product} from '../components/Product';
import {Sunburst} from '../components/Sunburst';
import {config} from '../config';
import {clamp, framesToLand, ramp, shakeAt, SPRINGS, springFrom} from '../motion';
import {COLORS} from '../theme';
import {line, word} from '../timing';
import {SAFE} from '../video';

const POP = framesToLand(SPRINGS.pop);
const zahl = word('alle', 'Zwanzig');
const start = line('alle').start;

export const ALLE_T = {
	start,
	zaehlen: zahl.start,
	zahlFertig: Math.max(zahl.end + 2, zahl.start + 8),
	alle: word('alle', 'alle').start,
	produkte: word('alle', 'Coral').start,
};
const PACKS = [config.weitereProdukte[0], config.produkt.bild, config.weitereProdukte[1]];
export const ALLE_IMPACTS = {
	zahl: ALLE_T.zahlFertig,
	ticks: Array.from({length: Math.max(0, Math.floor((ALLE_T.zahlFertig - ALLE_T.zaehlen) / 2))}, (_, i) => ALLE_T.zaehlen + i * 2),
	packungen: PACKS.map((_, i) => ALLE_T.produkte + i * 4 + POP),
};

export const AlleScene: React.FC<{frame: number}> = ({frame}) => {
	const T = ALLE_T;
	const n = interpolate(frame, [T.zaehlen, T.zahlFertig], [0, config.rabattProzent], {...clamp, easing: (t) => 1 - (1 - t) ** 2});
	const bump = frame >= T.zahlFertig ? interpolate(springFrom(frame, T.zahlFertig, SPRINGS.pop), [0, 1], [1.2, 1]) : 1;
	const alle = springFrom(frame, T.alle, SPRINGS.slam);
	const shake = shakeAt(frame, [{frame: ALLE_IMPACTS.zahl, strength: 12}], 'alle');
	return (
		<AbsoluteFill>
			<Sunburst frame={frame} colors={{base: COLORS.blue, ray: COLORS.blueRay, glow: COLORS.cyan, edge: COLORS.blueDeep}} cy={620} speed={0.45} />
			<AbsoluteFill style={{transform: shake}}>
				<At x={540} y={600} transform={`scale(${bump}) rotate(-4deg)`} opacity={ramp(frame, T.start, T.start + 4)}>
					<ChromeText text={`−${Math.round(n)} %`} fitTo={`−${config.rabattProzent} %`} size={300} maxWidth={SAFE.width} variant="gold" />
				</At>
				{frame >= T.alle ? (
					<At x={540} y={900} transform={`scale(${interpolate(alle, [0, 1], [1.8, 1])})`} opacity={ramp(frame, T.alle, T.alle + 3)}>
						<ChromeText text={config.alle.auf} size={120} maxWidth={SAFE.width} />
					</At>
				) : null}
				{frame >= T.produkte ? (
					<At x={540} y={1035} opacity={ramp(frame, T.produkte, T.produkte + 4)} transform={`translateY(${(1 - ramp(frame, T.produkte, T.produkte + 8)) * 30}px)`}>
						<ChromeText text={config.alle.produkte} size={84} maxWidth={SAFE.width} variant="white" />
					</At>
				) : null}
				{PACKS.map((src, i) => {
					const at = T.produkte + i * 4;
					if (frame < at) return null;
					const s = springFrom(frame, at, SPRINGS.pop);
					return (
						<At key={src} x={250 + i * 290} y={1300} transform={`translateY(${(1 - s) * 300}px) rotate(${(i - 1) * 6}deg) scale(${0.6 + 0.4 * s})`}>
							<Product src={src} height={i === 1 ? 360 : 330} frame={frame} />
						</At>
					);
				})}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
