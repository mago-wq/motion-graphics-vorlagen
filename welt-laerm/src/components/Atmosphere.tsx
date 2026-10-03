// Raum um die Szenen: Lichtkegel (folgt dem Lichtpegel), Filmkorn, Vignette.
import {AbsoluteFill, useCurrentFrame} from 'remotion';

export const Spotlight: React.FC<{level: number; color: string; y?: number; size?: number}> = ({
	level,
	color,
	y = 52,
	size = 62,
}) => (
	<AbsoluteFill
		style={{
			opacity: level,
			background: `radial-gradient(ellipse ${size}% ${size * 0.62}% at 50% ${y}%, ${color}38 0%, ${color}14 45%, transparent 100%)`,
		}}
	/>
);

export const Grain: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: 0.11, mixBlendMode: 'screen', pointerEvents: 'none'}}>
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
	<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 50%, transparent 55%, #000000d0 100%)'}} />
);
