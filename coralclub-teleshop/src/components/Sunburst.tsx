// Der Strahlenkranz hinter jedem Produkt im Teleshopping: abwechselnd helle und
// dunkle Keile, die sich langsam drehen, mit hellem Zentrum und dunklem Rand.
import {useMemo} from 'react';
import {HEIGHT, WIDTH} from '../video';

export const Sunburst: React.FC<{
	frame: number;
	colors: {base: string; ray: string; glow: string; edge: string};
	cx?: number;
	cy?: number;
	rays?: number;
	/** Grad pro Frame */
	speed?: number;
	/** Helligkeit des Zentrums 0–1 */
	glow?: number;
}> = ({frame, colors, cx = WIDTH / 2, cy = HEIGHT * 0.42, rays = 22, speed = 0.18, glow = 0.85}) => {
	const R = 2600;
	const wedges = useMemo(() => {
		const step = (Math.PI * 2) / rays;
		return Array.from({length: rays / 2}, (_, i) => {
			const a0 = i * 2 * step;
			const a1 = a0 + step;
			return `M0 0 L${R * Math.cos(a0)} ${R * Math.sin(a0)} L${R * Math.cos(a1)} ${R * Math.sin(a1)} Z`;
		}).join(' ');
	}, [rays]);
	const id = `sb-${colors.ray.slice(1)}`;
	return (
		<svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
			<defs>
				<radialGradient id={`${id}-glow`} cx={cx} cy={cy} r={1100} gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor={colors.glow} stopOpacity={glow} />
					<stop offset="0.45" stopColor={colors.glow} stopOpacity={glow * 0.25} />
					<stop offset="1" stopColor={colors.glow} stopOpacity={0} />
				</radialGradient>
				<radialGradient id={`${id}-edge`} cx={cx} cy={cy} r={1500} gradientUnits="userSpaceOnUse">
					<stop offset="0.45" stopColor={colors.edge} stopOpacity={0} />
					<stop offset="1" stopColor={colors.edge} stopOpacity={0.85} />
				</radialGradient>
			</defs>
			<rect width={WIDTH} height={HEIGHT} fill={colors.base} />
			<path d={wedges} fill={colors.ray} transform={`translate(${cx} ${cy}) rotate(${frame * speed})`} />
			<rect width={WIDTH} height={HEIGHT} fill={`url(#${id}-glow)`} />
			<rect width={WIDTH} height={HEIGHT} fill={`url(#${id}-edge)`} />
		</svg>
	);
};
