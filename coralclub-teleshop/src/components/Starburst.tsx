// Der "Störer": gezackter Stern mit Verlauf und Kontur, in dem ein Preis oder
// Ausruf steht. Dreht sich leicht hin und her, wie im Teleshopping.
import {useMemo} from 'react';

export const Starburst: React.FC<{
	size: number;
	spikes?: number;
	/** Verhältnis innerer zu äußerer Radius */
	inner?: number;
	colors?: {from: string; to: string; stroke: string};
	rotate?: number;
	children?: React.ReactNode;
	style?: React.CSSProperties;
}> = ({size, spikes = 22, inner = 0.82, colors = {from: '#FFF27A', to: '#FFC400', stroke: '#E2081C'}, rotate = 0, children, style}) => {
	const points = useMemo(() => {
		const r = size / 2;
		return Array.from({length: spikes * 2}, (_, i) => {
			const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
			const rr = i % 2 === 0 ? r : r * inner;
			return `${(r + rr * Math.cos(a)).toFixed(1)},${(r + rr * Math.sin(a)).toFixed(1)}`;
		}).join(' ');
	}, [size, spikes, inner]);
	const id = `st-${colors.from.slice(1)}-${colors.to.slice(1)}`;
	return (
		<div style={{position: 'relative', width: size, height: size, ...style}}>
			<svg width={size} height={size} style={{position: 'absolute', inset: 0, overflow: 'visible', transform: `rotate(${rotate}deg)`}}>
				<defs>
					<radialGradient id={id} cx="50%" cy="40%" r="60%">
						<stop offset="0" stopColor={colors.from} />
						<stop offset="1" stopColor={colors.to} />
					</radialGradient>
				</defs>
				<polygon points={points} fill="rgba(3,10,46,0.55)" transform={`translate(${size * 0.025} ${size * 0.035})`} />
				<polygon points={points} fill={`url(#${id})`} stroke={colors.stroke} strokeWidth={size * 0.022} strokeLinejoin="round" />
			</svg>
			<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
		</div>
	);
};
