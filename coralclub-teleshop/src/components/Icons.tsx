// Gezeichnete Requisiten für die Szenen (SVG, keine Fotos).
import {interpolate} from 'remotion';
import {clamp} from '../motion';

/** Wanduhr. `hours` (0–12, auch gebrochen) stellt die Zeiger. */
export const Clock: React.FC<{size: number; hours: number; minutes: number; color?: string; face?: string}> = ({
	size,
	hours,
	minutes,
	color = '#111',
	face = '#F2F2F2',
}) => {
	const r = size / 2;
	return (
		<svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`}>
			<circle r={r * 0.97} fill={face} stroke={color} strokeWidth={r * 0.07} />
			{Array.from({length: 12}, (_, i) => {
				const a = (i / 12) * Math.PI * 2;
				const long = i % 3 === 0;
				return (
					<line
						key={i}
						x1={Math.sin(a) * r * (long ? 0.68 : 0.76)}
						y1={-Math.cos(a) * r * (long ? 0.68 : 0.76)}
						x2={Math.sin(a) * r * 0.86}
						y2={-Math.cos(a) * r * 0.86}
						stroke={color}
						strokeWidth={r * (long ? 0.06 : 0.03)}
						strokeLinecap="round"
					/>
				);
			})}
			<line x1={0} y1={0} x2={0} y2={-r * 0.45} stroke={color} strokeWidth={r * 0.07} strokeLinecap="round" transform={`rotate(${hours * 30})`} />
			<line x1={0} y1={0} x2={0} y2={-r * 0.7} stroke={color} strokeWidth={r * 0.045} strokeLinecap="round" transform={`rotate(${minutes * 6})`} />
			<circle r={r * 0.06} fill={color} />
		</svg>
	);
};

/** Kaffeetasse mit aufsteigendem Dampf (frame für die Dampfbewegung). */
export const CoffeeCup: React.FC<{size: number; frame: number; color?: string; fill?: string}> = ({size, frame, color = '#111', fill = '#EDEDED'}) => {
	const w = size;
	const steam = (i: number) => {
		const x = w * (0.32 + i * 0.16);
		const phase = frame * 0.12 + i * 1.7;
		const d = `M${x} ${w * 0.3} C ${x + Math.sin(phase) * w * 0.06} ${w * 0.2}, ${x - Math.sin(phase) * w * 0.06} ${w * 0.12}, ${x + Math.sin(phase + 1) * w * 0.04} ${w * 0.02}`;
		return <path key={i} d={d} fill="none" stroke={color} strokeWidth={w * 0.035} strokeLinecap="round" opacity={0.55} />;
	};
	return (
		<svg width={w} height={w} viewBox={`0 0 ${w} ${w}`}>
			{[0, 1, 2].map(steam)}
			<path
				d={`M${w * 0.16} ${w * 0.38} H${w * 0.78} L${w * 0.72} ${w * 0.86} Q${w * 0.71} ${w * 0.93} ${w * 0.64} ${w * 0.93} H${w * 0.3} Q${w * 0.23} ${w * 0.93} ${w * 0.22} ${w * 0.86} Z`}
				fill={fill}
				stroke={color}
				strokeWidth={w * 0.045}
				strokeLinejoin="round"
			/>
			<path
				d={`M${w * 0.77} ${w * 0.48} C ${w * 0.98} ${w * 0.46}, ${w * 0.98} ${w * 0.72}, ${w * 0.73} ${w * 0.72}`}
				fill="none"
				stroke={color}
				strokeWidth={w * 0.045}
				strokeLinecap="round"
			/>
			<line x1={w * 0.08} y1={w * 0.97} x2={w * 0.86} y2={w * 0.97} stroke={color} strokeWidth={w * 0.045} strokeLinecap="round" />
		</svg>
	);
};

/**
 * Wasserglas. `fill` 0–1 Füllhöhe, `swirl` 0–1 wie stark das Wasser wirbelt,
 * `cloud` 0–1 wie sehr das Pulver sich gerade löst (milchige Wolke).
 */
export const WaterGlass: React.FC<{width: number; height: number; frame: number; swirl: number; cloud: number}> = ({
	width: w,
	height: h,
	frame,
	swirl,
	cloud,
}) => {
	const top = h * 0.24;
	const wave = (k: number) => {
		const amp = 6 + swirl * 14;
		const pts = Array.from({length: 13}, (_, i) => {
			const x = w * 0.1 + (i / 12) * w * 0.8;
			const y = top + Math.sin(i * 0.9 + frame * 0.35 + k) * amp * (0.4 + 0.6 * swirl);
			return `${x.toFixed(1)},${y.toFixed(1)}`;
		});
		return pts.join(' ');
	};
	return (
		<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow: 'visible'}}>
			<defs>
				<linearGradient id="wg-water" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#8FDCFF" stopOpacity="0.85" />
					<stop offset="1" stopColor="#1C8FE0" stopOpacity="0.9" />
				</linearGradient>
				<clipPath id="wg-inner">
					<path d={`M${w * 0.1} ${h * 0.04} L${w * 0.17} ${h * 0.95} H${w * 0.83} L${w * 0.9} ${h * 0.04} Z`} />
				</clipPath>
			</defs>
			<g clipPath="url(#wg-inner)">
				<polygon points={`${wave(0)} ${w * 0.95},${h} ${w * 0.05},${h}`} fill="url(#wg-water)" />
				{/* Pulverwolke, dreht sich mit */}
				{Array.from({length: 7}, (_, i) => {
					const a = frame * 0.18 * swirl + i * 0.9;
					return (
						<ellipse
							key={i}
							cx={w * 0.5 + Math.cos(a) * w * 0.18}
							cy={h * 0.55 + Math.sin(a * 1.3) * h * 0.18}
							rx={w * 0.14}
							ry={h * 0.06}
							fill="#FFFFFF"
							opacity={0.22 * cloud}
						/>
					);
				})}
				{/* Bläschen */}
				{Array.from({length: 9}, (_, i) => {
					const y = h - ((frame * (2 + (i % 3)) + i * 47) % (h * 0.7));
					return <circle key={`b${i}`} cx={w * (0.24 + (i % 5) * 0.13)} cy={y} r={3 + (i % 3) * 2} fill="#FFFFFF" opacity={0.55} />;
				})}
			</g>
			{/* Glas: Kontur und Lichtkante */}
			<path
				d={`M${w * 0.1} ${h * 0.04} L${w * 0.17} ${h * 0.95} Q${w * 0.18} ${h} ${w * 0.25} ${h} H${w * 0.75} Q${w * 0.82} ${h} ${w * 0.83} ${h * 0.95} L${w * 0.9} ${h * 0.04}`}
				fill="rgba(255,255,255,0.12)"
				stroke="#FFFFFF"
				strokeWidth={7}
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
			<path d={`M${w * 0.2} ${h * 0.12} L${w * 0.25} ${h * 0.82}`} stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" opacity={0.5} />
		</svg>
	);
};

/** Haken im Kreis, zeichnet sich bei progress 0 -> 1 */
export const Check: React.FC<{size: number; progress: number; color?: string; ring?: string}> = ({size, progress, color = '#FFFFFF', ring = '#1FB04A'}) => {
	const len = 1;
	return (
		<svg width={size} height={size} viewBox="0 0 100 100">
			<circle cx={50} cy={50} r={46} fill={ring} transform={`scale(${interpolate(progress, [0, 0.4], [0.4, 1], clamp)})`} style={{transformOrigin: '50px 50px'}} />
			<path
				d="M28 52 L44 67 L73 35"
				fill="none"
				stroke={color}
				strokeWidth={11}
				strokeLinecap="round"
				strokeLinejoin="round"
				pathLength={len}
				strokeDasharray={len}
				strokeDashoffset={len * (1 - interpolate(progress, [0.25, 1], [0, 1], clamp))}
			/>
		</svg>
	);
};

/** Pfeil nach oben (zur Bio) */
export const ArrowUp: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<path d="M50 8 L88 50 H63 V92 H37 V50 H12 Z" fill={color} />
	</svg>
);
