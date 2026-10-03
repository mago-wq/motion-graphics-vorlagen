// Hintergrund im Stil des Vorbilds, aber mit mehr Licht: schwarz-weiß, hoher Kontrast.
// - Lichtsäule von oben in der Bildmitte, die mit dem Szenenlicht mitflackert
// - weiche Lichtstrahlen, die langsam schwenken, und Dunst, der im Licht treibt
// - fallender Staub in drei Tiefen (vorne groß und unscharf, hinten klein und scharf)
// - Lichtfleck am Boden unter den Figuren, Aufblitzen bei jedem Szenenwechsel
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {CONFIG} from '../config';
import {lightLevel} from '../motion';
import {GROUND, HEIGHT, sec, WIDTH} from '../video';

/** Gesamtlicht 0..1: folgt den Szenen (an/aus mit Flackern), nie ganz dunkel. */
export const useSceneLight = () => {
	const frame = useCurrentFrame();
	let l = 0;
	for (const s of CONFIG.scenes) l = Math.max(l, lightLevel(frame, sec(s.on), sec(s.off)));
	return l;
};

/** Frames seit dem letzten Szenenstart (für das Aufblitzen). */
const sinceSceneStart = (frame: number) => {
	let best = Infinity;
	for (const s of CONFIG.scenes) {
		const d = frame - sec(s.on);
		if (d >= 0 && d < best) best = d;
	}
	return best;
};

type Mote = {x: number; y: number; vx: number; vy: number; r: number; a: number; depth: 0 | 1 | 2; tw: number};
const MOTES: Mote[] = Array.from({length: 170}, (_, i) => {
	const d = random(`dd${i}`);
	const depth = (d < 0.62 ? 0 : d < 0.9 ? 1 : 2) as 0 | 1 | 2;
	return {
		x: random(`dx${i}`) * WIDTH,
		y: random(`dy${i}`) * HEIGHT,
		vx: (random(`vx${i}`) - 0.6) * (0.6 + depth * 0.5),
		vy: (0.7 + random(`vy${i}`) * 1.4) * (0.7 + depth * 0.9),
		r: [1.1, 2.4, 6][depth] * (0.7 + random(`r${i}`) * 0.7),
		a: [0.75, 0.6, 0.22][depth] * (0.5 + random(`a${i}`) * 0.5),
		depth,
		tw: random(`tw${i}`) * 100,
	};
});

const wrap = (v: number, m: number) => ((v % m) + m) % m;

export const Background: React.FC = () => {
	const frame = useCurrentFrame();
	const light = useSceneLight();
	const since = sinceSceneStart(frame);
	const flash = since < 14 ? Math.exp(-since / 4) * (since < 2 ? since / 2 : 1) : 0;
	const base = 0.35 + 0.65 * light;
	const breath = 1 + 0.06 * Math.sin(frame / 37);
	const rays = [-0.32, -0.15, 0.02, 0.18, 0.34].map((a, i) => a + Math.sin(frame / (90 + i * 17) + i) * 0.04);

	return (
		<AbsoluteFill style={{background: '#000'}}>
			{/* Lichtsäule: große weiche Aufhellung, oben schmal, unten breit */}
			<AbsoluteFill
				style={{
					opacity: base * breath,
					background:
						'radial-gradient(ellipse 46% 62% at 50% 52%, #8a8a8a 0%, #4a4a4a 30%, #1c1c1c 62%, #000 100%)',
				}}
			/>
			<svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{position: 'absolute', inset: 0}}>
				<defs>
					<linearGradient id="rayGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#fff" stopOpacity={0.5} />
						<stop offset="0.7" stopColor="#fff" stopOpacity={0.1} />
						<stop offset="1" stopColor="#fff" stopOpacity={0} />
					</linearGradient>
					<filter id="rayBlur" x="-30%" y="-10%" width="160%" height="120%">
						<feGaussianBlur stdDeviation="22" />
					</filter>
					<filter id="haze" x="0" y="0" width="100%" height="100%">
						<feTurbulence type="fractalNoise" baseFrequency="0.0035 0.006" numOctaves={3} seed={7} />
						<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -0.55" />
					</filter>
					<radialGradient id="hazeMask" cx="50%" cy="55%" r="55%">
						<stop offset="0" stopColor="#fff" />
						<stop offset="1" stopColor="#000" />
					</radialGradient>
					<mask id="inLight">
						<rect width={WIDTH} height={HEIGHT} fill="url(#hazeMask)" />
					</mask>
					<radialGradient id="pool" cx="50%" cy="50%" r="50%">
						<stop offset="0" stopColor="#fff" stopOpacity={0.55} />
						<stop offset="0.45" stopColor="#fff" stopOpacity={0.16} />
						<stop offset="1" stopColor="#fff" stopOpacity={0} />
					</radialGradient>
					<radialGradient id="bokeh" cx="50%" cy="50%" r="50%">
						<stop offset="0" stopColor="#fff" stopOpacity={1} />
						<stop offset="0.6" stopColor="#fff" stopOpacity={0.5} />
						<stop offset="1" stopColor="#fff" stopOpacity={0} />
					</radialGradient>
				</defs>

				{/* Lichtstrahlen von oben */}
				<g filter="url(#rayBlur)" opacity={0.18 * base}>
					{rays.map((a, i) => {
						const top = 540 + a * 300;
						const w = 40 + (i % 2) * 30;
						const bottomX = 540 + a * 2600;
						return <polygon key={i} points={`${top - w / 2},-60 ${top + w / 2},-60 ${bottomX + 260},${HEIGHT} ${bottomX - 260},${HEIGHT}`} fill="url(#rayGrad)" />;
					})}
				</g>

				{/* Dunst treibt langsam durchs Licht */}
				<g mask="url(#inLight)" opacity={0.22 * base}>
					<rect x={-400 + ((frame * 0.6) % 400)} y={-200 + Math.sin(frame / 80) * 40} width={WIDTH + 800} height={HEIGHT + 400} filter="url(#haze)" />
				</g>

				{/* Lichtfleck am Boden */}
				<ellipse cx={540} cy={GROUND + 10} rx={520} ry={70} fill="url(#pool)" opacity={0.75 * base} />

				{/* Staub: hinten klein und scharf, vorne groß und unscharf; Schlieren in Fallrichtung */}
				{MOTES.map((m, i) => {
					const x = wrap(m.x + m.vx * frame, WIDTH + 40) - 20;
					const y = wrap(m.y + m.vy * frame, HEIGHT + 40) - 20;
					const tw = 0.55 + 0.45 * Math.sin((frame + m.tw) / (9 + (i % 7)));
					const o = m.a * tw * (0.55 + 0.45 * base);
					if (m.depth === 2) return <circle key={i} cx={x} cy={y} r={m.r} fill="url(#bokeh)" opacity={o} />;
					const len = 2.2 + m.vy * 2.4;
					return (
						<line
							key={i}
							x1={x}
							y1={y}
							x2={x - m.vx * len}
							y2={y - m.vy * len}
							stroke="#fff"
							strokeWidth={m.r}
							strokeLinecap="round"
							opacity={o}
						/>
					);
				})}
			</svg>

			{/* Aufblitzen beim Szenenwechsel: weiche Lichtblüte + waagrechter Lichtstreif */}
			{flash > 0.01 && (
				<AbsoluteFill style={{opacity: flash, mixBlendMode: 'screen'}}>
					<AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 30% at 50% 62%, #ffffff55 0%, #ffffff18 45%, transparent 100%)'}} />
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: 1180,
							height: 6,
							background: 'linear-gradient(90deg, transparent, #ffffffcc 35%, #fff 50%, #ffffffcc 65%, transparent)',
							filter: 'blur(3px)',
						}}
					/>
				</AbsoluteFill>
			)}
		</AbsoluteFill>
	);
};

export const Grain: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'screen', pointerEvents: 'none'}}>
			<svg width="100%" height="100%">
				<filter id="grain">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 12} />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#grain)" />
			</svg>
		</AbsoluteFill>
	);
};

/** Starke Vignette für Kontrast: Ränder fast schwarz. */
export const Vignette: React.FC = () => (
	<AbsoluteFill style={{background: 'radial-gradient(ellipse 72% 58% at 50% 50%, transparent 50%, #000000e0 100%)'}} />
);
