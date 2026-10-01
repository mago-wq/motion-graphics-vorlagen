// Szene 4: "Einfach einen Stick in Wasser auflösen und über den Tag verteilt trinken!"
// Das echte Shopfoto vom Stick fährt ins Bild, das Pulver rieselt (Maske läuft
// nach unten auf), landet im Wasserglas, das Wasser wirbelt. Rechts hakt eine
// Checkliste die drei Schritte ab, synchron zum Sprecher.
import {AbsoluteFill, Img, interpolate, staticFile} from 'remotion';
import {At} from '../components/At';
import {ChromeText} from '../components/ChromeText';
import {Check, WaterGlass} from '../components/Icons';
import {Sunburst} from '../components/Sunburst';
import {config} from '../config';
import {clamp, framesToLand, ramp, SPRINGS, springFrom} from '../motion';
import {FONT} from '../theme';
import {line, word} from '../timing';
import {SAFE} from '../video';

const SNAP = framesToLand(SPRINGS.snap);
const start = line('demo').start;

export const DEMO_T = {
	start,
	stick: word('demo', 'Stick').start - 4,
	schritte: [word('demo', 'Stick').start, word('demo', 'Wasser').start, word('demo', 'verteilt').start],
};
/** Pulver beginnt zu rieseln, sobald der Stick steht; trifft 10 Frames später das Wasser */
export const DEMO_IMPACTS = {
	riss: DEMO_T.stick + SNAP,
	wasser: DEMO_T.stick + SNAP + 10,
	schritte: DEMO_T.schritte.map((t) => t + 2),
};

const STICK_H = 780;

export const DemoScene: React.FC<{frame: number}> = ({frame}) => {
	const T = DEMO_T;
	const head = springFrom(frame, T.start, SPRINGS.slam);
	const stick = springFrom(frame, T.stick, SPRINGS.snap);
	const pour = ramp(frame, DEMO_IMPACTS.riss, DEMO_IMPACTS.wasser + 6);
	const swirl = ramp(frame, DEMO_IMPACTS.wasser, DEMO_IMPACTS.wasser + 20);
	const glass = springFrom(frame, T.start + 2, SPRINGS.snap);

	return (
		<AbsoluteFill>
			<Sunburst frame={frame} colors={{base: '#1A86E6', ray: '#279CF0', glow: '#C8F2FF', edge: '#0B2C9A'}} cy={1000} speed={0.2} glow={0.7} />
			<At x={540} y={360} transform={`scale(${interpolate(head, [0, 1], [1.6, 1])})`} opacity={ramp(frame, T.start, T.start + 4)}>
				<ChromeText text={config.demo.titel} size={96} maxWidth={SAFE.width} />
			</At>

			{/* Wasserglas */}
			<div style={{position: 'absolute', left: 560 - 165, top: 1010, transform: `translateY(${(1 - glass) * 700}px)`}}>
				<WaterGlass width={330} height={400} frame={frame} swirl={swirl} cloud={swirl} />
			</div>

			{/* Stick mit Pulverstrahl: Foto, Pulver wird per Maske von oben nach unten freigegeben */}
			<div
				style={{
					position: 'absolute',
					left: 4,
					top: 440,
					transform: `translate(${(1 - stick) * -620}px, ${(1 - stick) * -620}px) rotate(${(1 - stick) * -18}deg)`,
					WebkitMaskImage: `linear-gradient(180deg, #000 ${48 + pour * 52}%, transparent ${54 + pour * 52}%)`,
					maskImage: `linear-gradient(180deg, #000 ${48 + pour * 52}%, transparent ${54 + pour * 52}%)`,
				}}
			>
				<Img src={staticFile(config.produkt.stickBild)} style={{height: STICK_H, display: 'block', filter: 'drop-shadow(0 20px 30px rgba(3,10,46,0.45))'}} />
			</div>

			{/* Checkliste rechts */}
			{config.demo.schritte.map((text, i) => {
				const at = DEMO_IMPACTS.schritte[i] ?? DEMO_IMPACTS.schritte[DEMO_IMPACTS.schritte.length - 1];
				const p = springFrom(frame, at, SPRINGS.pop);
				return frame >= at ? (
					<div
						key={text}
						style={{
							position: 'absolute',
							left: 655,
							top: 520 + i * 165,
							width: 345,
							display: 'flex',
							alignItems: 'center',
							gap: 14,
							transform: `translateX(${(1 - p) * 120}px)`,
							opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
						}}
					>
						<div style={{flex: '0 0 auto'}}>
							<Check size={74} progress={ramp(frame, at, at + 10)} />
						</div>
						<div
							style={{
								fontFamily: FONT,
								fontWeight: 900,
								fontStyle: 'italic',
								fontStretch: '88%',
								fontSize: 50,
								lineHeight: 1.02,
								color: '#FFFFFF',
								textTransform: 'uppercase',
								textShadow: '0 4px 0 #06124A, 0 0 2px #06124A',
							}}
						>
							{text}
						</div>
					</div>
				) : null;
			})}
		</AbsoluteFill>
	);
};
