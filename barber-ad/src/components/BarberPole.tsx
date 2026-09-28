// Dauerhafter Hintergrund: diagonale Barber-Pole-Streifen, langsam wandernd,
// geringe Deckkraft, dazu eine Vignette für Ruhe an den Rändern.
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, withAlpha} from '../theme';
import {STILL_FROM} from '../timing';
import {HEIGHT, WIDTH} from '../video';

const PERIOD = 300; // Abstand, nach dem sich das Muster wiederholt (px)
const BAND = 78; // Breite eines Streifens (px)
const ANGLE = -52; // Neigung der Streifen (Grad)

export const BarberPoleBackground: React.FC = () => {
	const frame = useCurrentFrame();
	// Wandert drei Perioden weit, läuft sanft an und kommt zum Ende hin zur Ruhe.
	const offset = interpolate(frame, [0, STILL_FROM], [0, PERIOD * 3], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.3, 0.2, 0.45, 1),
	});

	return (
		<AbsoluteFill style={{backgroundColor: COLORS.bg}}>
			<svg width={WIDTH} height={HEIGHT} style={{position: 'absolute'}}>
				<defs>
					<pattern
						id="barber-pole"
						width={PERIOD}
						height={PERIOD}
						patternUnits="userSpaceOnUse"
						patternTransform={`rotate(${ANGLE}) translate(${offset} 0)`}
					>
						<rect x={0} y={0} width={BAND} height={PERIOD} fill={COLORS.accent} fillOpacity={0.085} />
						<rect x={PERIOD / 2} y={0} width={BAND} height={PERIOD} fill={COLORS.text} fillOpacity={0.04} />
					</pattern>
				</defs>
				<rect width={WIDTH} height={HEIGHT} fill="url(#barber-pole)" />
			</svg>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 85% 62% at 50% 46%, ${withAlpha(COLORS.bg, 0)} 30%, ${withAlpha(COLORS.bg, 0.55)} 72%, ${withAlpha(COLORS.bg, 0.92)} 100%)`,
				}}
			/>
		</AbsoluteFill>
	);
};
