// Bildzeichen der Szenen (SVG): Figur am Boden, Allah-Emblem, rotes Kreuz, Sanduhr,
// Grabstein, Strahlen, Lichtfunken. Alles im Koordinatensystem 1080×1920.
import {random} from 'remotion';
import {CONFIG} from '../config';
import {QURAN_FONT} from '../fonts';
import type {Stance} from '../poses';
import {GROUND} from '../video';
import {Figure} from './Figure';

/** Figur, deren Füße (bzw. Knie/Stirn) auf `ground` stehen. */
export const Fig: React.FC<{
	x: number;
	stance: Stance;
	scale?: number;
	ground?: number;
	color?: string;
	far?: string;
	flip?: boolean;
	/** Zusätzliches Anheben (px), z. B. Schweben. */
	rise?: number;
	/** Schwarze Trennfuge; aus bei durchscheinenden Figuren. */
	outline?: boolean;
	children?: React.ReactNode;
}> = ({x, stance, scale = 1.55, ground = GROUND, color = CONFIG.colors.ink, far = '#bfc6dc', flip = false, rise = 0, outline = true, children}) => (
	<g transform={`translate(${x} ${ground - stance.lift * scale - rise}) scale(${flip ? -scale : scale} ${scale})`}>
		<Figure pose={stance.pose} color={color} far={far} outline={outline} />
		{children}
	</g>
);

/** Achtzackiger Stern mit „ٱللَّه“ – wie im Vorbild, warm. */
export const Emblem: React.FC<{x: number; y: number; size: number; rot?: number; color?: string; opacity?: number}> = ({
	x,
	y,
	size,
	rot = 0,
	color = CONFIG.colors.warm,
	opacity = 1,
}) => {
	const s = size;
	const sq = s * 0.62;
	return (
		<g transform={`translate(${x} ${y})`} opacity={opacity}>
			<g transform={`rotate(${rot})`} fill="none" stroke={color} strokeWidth={s * 0.045} strokeLinejoin="round">
				<rect x={-sq} y={-sq} width={sq * 2} height={sq * 2} rx={s * 0.05} />
				<rect x={-sq} y={-sq} width={sq * 2} height={sq * 2} rx={s * 0.05} transform="rotate(45)" />
				<circle r={s * 0.5} strokeWidth={s * 0.025} />
			</g>
			<text
				x={0}
				y={s * 0.2}
				textAnchor="middle"
				fontFamily={QURAN_FONT}
				fontSize={s * 0.62}
				fill={color}
				style={{direction: 'rtl'}}
			>
				ٱللَّه
			</text>
		</g>
	);
};

/** Rotes Kreuz, das sich zeichnet (p = 0..1). */
export const RedX: React.FC<{x: number; y: number; size: number; p: number}> = ({x, y, size, p}) => {
	const a = Math.min(1, p * 2);
	const b = Math.max(0, p * 2 - 1);
	const len = size * 2 * Math.SQRT2;
	const line = (x1: number, y1: number, x2: number, y2: number, t: number) => (
		<line
			x1={x + x1}
			y1={y + y1}
			x2={x + x2}
			y2={y + y2}
			stroke={CONFIG.colors.red}
			strokeWidth={size * 0.13}
			strokeLinecap="round"
			strokeDasharray={len}
			strokeDashoffset={len * (1 - t)}
		/>
	);
	return (
		<g opacity={p > 0 ? 1 : 0}>
			{line(-size, -size, size, size, a)}
			{line(size, -size, -size, size, b)}
		</g>
	);
};

/** Sanduhr: oben schwindet der Sand, unten wächst er, dazwischen rieselt es. t = 0..1 Füllstand-Fortschritt. */
export const Hourglass: React.FC<{x: number; y: number; h: number; t: number; rot?: number; f: number}> = ({x, y, h, t, rot = 0, f}) => {
	const w = h * 0.62;
	const ink = CONFIG.colors.ink;
	const warm = CONFIG.colors.warm;
	const top = (1 - t) * 0.82;
	const bottom = t * 0.82;
	const half = h / 2;
	const neck = h * 0.05;
	// Sand oben: Dreieck zur Engstelle, Höhe ~ Restmenge
	const ht = (half - 12) * Math.sqrt(top);
	const hb = (half - 12) * Math.sqrt(bottom);
	const glass = `M${-w / 2} ${-half} L${w / 2} ${-half} C${w / 2} ${-h * 0.12}, ${neck} ${-h * 0.06}, ${neck} 0 C${neck} ${h * 0.06}, ${w / 2} ${h * 0.12}, ${w / 2} ${half} L${-w / 2} ${half} C${-w / 2} ${h * 0.12}, ${-neck} ${h * 0.06}, ${-neck} 0 C${-neck} ${-h * 0.06}, ${-w / 2} ${-h * 0.12}, ${-w / 2} ${-half} Z`;
	const flowing = t > 0.02 && t < 0.98;
	return (
		<g transform={`translate(${x} ${y}) rotate(${rot})`}>
			<clipPath id="hg">
				<path d={glass} />
			</clipPath>
			<g clipPath="url(#hg)" fill={warm}>
				<polygon points={`${-w / 2} ${-ht},${w / 2} ${-ht},0 0`} opacity={top > 0.01 ? 0.95 : 0} />
				<polygon points={`${-w / 2} ${half},${w / 2} ${half},${w * 0.12} ${half - hb},${-w * 0.12} ${half - hb}`} opacity={0.95} />
				{flowing && <rect x={-2} y={0} width={4} height={half - hb} opacity={0.75 + 0.25 * Math.sin(f)} />}
			</g>
			<path d={glass} fill="none" stroke={ink} strokeWidth={7} />
			<rect x={-w / 2 - 16} y={-half - 16} width={w + 32} height={14} rx={5} fill={ink} />
			<rect x={-w / 2 - 16} y={half + 2} width={w + 32} height={14} rx={5} fill={ink} />
		</g>
	);
};

/** Grabstein mit Hügel, steht auf `ground`. `cracks` 0..1 lässt Risse wachsen. */
export const Gravestone: React.FC<{x: number; w: number; h: number; ground?: number; cracks?: number; crackColor?: string}> = ({
	x,
	w,
	h,
	ground = GROUND,
	cracks = 0,
	crackColor = CONFIG.colors.warm,
}) => {
	const ink = CONFIG.colors.ink;
	const L = x - w / 2;
	const top = ground - h;
	const r = w / 2;
	const shape = `M${L} ${ground} L${L} ${top + r} A${r} ${r} 0 0 1 ${L + w} ${top + r} L${L + w} ${ground} Z`;
	const crack = `M${x - 6} ${top + 8} l14 46 l-22 38 l18 52 l-12 44`;
	const crack2 = `M${x + 18} ${top + 120} l26 30 l-10 40`;
	const len = 260;
	return (
		<g>
			<path d={shape} fill="none" stroke={ink} strokeWidth={12} strokeLinejoin="round" />
			{[0.42, 0.56, 0.7].map((k, i) => (
				<line key={i} x1={x - w * 0.24} x2={x + w * 0.24} y1={top + h * k} y2={top + h * k} stroke={ink} strokeWidth={10} strokeLinecap="round" />
			))}
			<path d={`M${L - 60} ${ground} Q ${x} ${ground - 40} ${L + w + 60} ${ground}`} fill="none" stroke={ink} strokeWidth={10} strokeLinecap="round" />
			{cracks > 0 && (
				<g stroke={crackColor} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round">
					<path d={crack} strokeDasharray={len} strokeDashoffset={len * (1 - cracks)} />
					<path d={crack2} strokeDasharray={120} strokeDashoffset={120 * (1 - Math.max(0, cracks * 1.6 - 0.6))} />
				</g>
			)}
		</g>
	);
};

/** Drehende Lichtstrahlen um einen Punkt. */
export const Rays: React.FC<{cx: number; cy: number; f: number; n?: number; len?: number; color: string; strength: number; id: string}> = ({
	cx,
	cy,
	f,
	n = 14,
	len = 900,
	color,
	strength,
	id,
}) => (
	<g>
		<defs>
			<radialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={len}>
				<stop offset="0" stopColor={color} stopOpacity={0.34 * strength} />
				<stop offset="1" stopColor={color} stopOpacity={0} />
			</radialGradient>
		</defs>
		{Array.from({length: n}, (_, i) => {
			const a = (i / n) * Math.PI * 2 + f * 0.005;
			const sp = 0.06;
			return (
				<polygon
					key={i}
					points={`${cx},${cy} ${cx + Math.cos(a - sp) * len},${cy + Math.sin(a - sp) * len} ${cx + Math.cos(a + sp) * len},${cy + Math.sin(a + sp) * len}`}
					fill={`url(#${id})`}
				/>
			);
		})}
	</g>
);

/** Lichtfunken, die steigen (dir = -1) oder sinken (dir = 1). */
export const Motes: React.FC<{
	f: number;
	n: number;
	x: number;
	w: number;
	y0: number;
	y1: number;
	color: string;
	seed: string;
	opacity?: number;
}> = ({f, n, x, w, y0, y1, color, seed, opacity = 1}) => (
	<g>
		{Array.from({length: n}, (_, i) => {
			const life = 80 + random(`${seed}l${i}`) * 60;
			const age = (f + random(`${seed}o${i}`) * life) % life;
			const t = age / life;
			const px = x - w / 2 + random(`${seed}x${i}`) * w + Math.sin((f + i * 17) / 20) * 10;
			const py = y0 + (y1 - y0) * t;
			const tw = 0.6 + 0.4 * Math.sin(f / 5 + i);
			return <circle key={i} cx={px} cy={py} r={2 + random(`${seed}r${i}`) * 3.5} fill={color} opacity={opacity * Math.sin(t * Math.PI) * tw} />;
		})}
	</g>
);
