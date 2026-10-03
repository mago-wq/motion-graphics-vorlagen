// Neuer Hintergrund statt schwarzem Sternenfeld: Nachthimmel über Wüstendünen.
// Sterne funkeln und ziehen langsam (zwei Tiefen), hinter den Dünen liegt ein
// Mondschein am Horizont, über den Boden zieht Dunst. Ab und zu eine Sternschnuppe.
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {CONFIG} from '../config';
import {GROUND, HEIGHT, WIDTH} from '../video';

const STARS = Array.from({length: 190}, (_, i) => ({
	x: random(`x${i}`) * WIDTH,
	y: random(`y${i}`) * 1380,
	r: 0.6 + random(`r${i}`) ** 3 * 2.4,
	depth: random(`d${i}`) < 0.7 ? 0.35 : 1,
	tw: 40 + random(`t${i}`) * 90,
	ph: random(`p${i}`) * 200,
}));

/** Sternschnuppen: Startframe, Startpunkt, Richtung. */
const SHOOTING = [
	{at: 140, x: 820, y: 220, dx: -1, dy: 0.45},
	{at: 760, x: 260, y: 160, dx: 1, dy: 0.5},
	{at: 1330, x: 900, y: 300, dx: -1, dy: 0.35},
];

const BACK_DUNE = `M0 1392 C 180 1350, 320 1356, 470 1398 S 760 1440, 880 1402 S 1030 1360, ${WIDTH} 1380 L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;
const FRONT_DUNE = `M0 1560 C 120 1520, 210 ${GROUND + 4}, 330 ${GROUND} L 760 ${GROUND} C 880 ${GROUND + 2}, 980 1530, ${WIDTH} 1575 L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;

export const Background: React.FC = () => {
	const frame = useCurrentFrame();
	const c = CONFIG.colors;
	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${c.skyTop} 0%, #060a18 55%, ${c.skyHorizon} 74%, #070a14 100%)`}}>
			<svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
				<defs>
					<radialGradient id="moonGlow" cx="50%" cy="73%" r="55%">
						<stop offset="0" stopColor="#9fb2ff" stopOpacity={0.2} />
						<stop offset="0.35" stopColor="#6c7fd0" stopOpacity={0.08} />
						<stop offset="1" stopColor="#000" stopOpacity={0} />
					</radialGradient>
					<linearGradient id="shoot" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0" stopColor="#fff" stopOpacity={0} />
						<stop offset="1" stopColor="#fff" stopOpacity={0.9} />
					</linearGradient>
					<filter id="mist" x="-20%" y="-50%" width="140%" height="200%">
						<feGaussianBlur stdDeviation="28" />
					</filter>
				</defs>
				<rect width={WIDTH} height={HEIGHT} fill="url(#moonGlow)" />
				{STARS.map((s, i) => {
					const x = (((s.x - frame * 0.12 * s.depth) % WIDTH) + WIDTH) % WIDTH;
					const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin((frame + s.ph) / s.tw * Math.PI * 2));
					return <circle key={i} cx={x} cy={s.y} r={s.r} fill="#dfe6ff" opacity={tw * (s.depth === 1 ? 0.95 : 0.5)} />;
				})}
				{SHOOTING.map((s, i) => {
					const t = (frame - s.at) / 22;
					if (t < 0 || t > 1) return null;
					const len = 170;
					const x = s.x + s.dx * t * 420;
					const y = s.y + s.dy * t * 420;
					const o = Math.sin(t * Math.PI);
					return (
						<line
							key={i}
							x1={x - s.dx * len}
							y1={y - s.dy * len}
							x2={x}
							y2={y}
							stroke={s.dx > 0 ? 'url(#shoot)' : '#ffffff'}
							strokeOpacity={s.dx > 0 ? o : o * 0.7}
							strokeWidth={2.4}
							strokeLinecap="round"
						/>
					);
				})}
				<path d={BACK_DUNE} fill="#080d1d" />
				<path d={BACK_DUNE} fill="none" stroke="#8fa3ff" strokeOpacity={0.16} strokeWidth={2} />
				{/* Dunst zieht langsam über den Boden */}
				<g filter="url(#mist)" opacity={0.55}>
					<ellipse cx={((frame * 0.9) % 1600) - 260} cy={1450} rx={360} ry={40} fill="#5b6aa6" opacity={0.35} />
					<ellipse cx={1340 - ((frame * 0.6) % 1700)} cy={1490} rx={420} ry={46} fill="#4a578c" opacity={0.3} />
				</g>
				<path d={FRONT_DUNE} fill="#03050b" />
				<path d={FRONT_DUNE} fill="none" stroke="#aebdff" strokeOpacity={0.22} strokeWidth={2.5} />
			</svg>
		</AbsoluteFill>
	);
};

export const Grain: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: 0.08, mixBlendMode: 'screen', pointerEvents: 'none'}}>
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

export const Vignette: React.FC = () => (
	<AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 62% at 50% 50%, transparent 58%, #000000c0 100%)'}} />
);
