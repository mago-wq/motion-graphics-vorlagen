// Feines Filmkorn über allem: jeder Frame ein anderes Rauschen, kaum sichtbar.
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH} from '../video';

export const Koernung: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<svg width={WIDTH} height={HEIGHT}>
				<filter id="korn">
					<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={frame % 97} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width={WIDTH} height={HEIGHT} filter="url(#korn)" />
			</svg>
		</AbsoluteFill>
	);
};
