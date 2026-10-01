// Glitzer: vierzackige Lichtsterne, die kurz aufblitzen und sich dabei drehen.
import {interpolate} from 'remotion';
import {clamp} from '../motion';

export type Sparkle = {x: number; y: number; at: number; size: number};

const STAR = 'M0 -1 C0.08 -0.2 0.2 -0.08 1 0 C0.2 0.08 0.08 0.2 0 1 C-0.08 0.2 -0.2 0.08 -1 0 C-0.2 -0.08 -0.08 -0.2 0 -1 Z';

export const Sparkles: React.FC<{frame: number; items: Sparkle[]; life?: number; color?: string}> = ({
	frame,
	items,
	life = 16,
	color = '#FFFFFF',
}) => (
	<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
		{items.map((s, i) => {
			const t = frame - s.at;
			if (t < 0 || t > life) return null;
			const scale = interpolate(t, [0, life * 0.35, life], [0, 1, 0], clamp);
			return (
				<g key={i} transform={`translate(${s.x} ${s.y}) rotate(${t * 6}) scale(${s.size * scale})`}>
					<path d={STAR} fill={color} />
					<circle r={0.18} fill={color} opacity={0.9} />
				</g>
			);
		})}
	</svg>
);

/** Glitzer rund um einen Punkt verteilt, deterministisch aus einem Startwert. */
export const sparkleRing = (cx: number, cy: number, at: number, count: number, rx: number, ry: number, size = 46): Sparkle[] =>
	Array.from({length: count}, (_, i) => {
		const a = (i / count) * Math.PI * 2 + i * 0.7;
		const r = 0.65 + 0.35 * Math.abs(Math.sin(i * 12.9898));
		return {
			x: cx + Math.cos(a) * rx * r,
			y: cy + Math.sin(a) * ry * r,
			at: at + (i % 5) * 2,
			size: size * (0.55 + 0.45 * Math.abs(Math.cos(i * 4.1))),
		};
	});
