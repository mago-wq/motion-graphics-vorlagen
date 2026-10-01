// Nur zur Kontrolle (Prop showSafeZone): markiert alles außerhalb der Sicherheitszone.
import {AbsoluteFill} from 'remotion';
import {HEIGHT, SAFE, WIDTH} from '../video';

const SHADE = 'rgba(255, 0, 60, 0.22)';

export const SafeZoneOverlay: React.FC = () => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<svg width={WIDTH} height={HEIGHT}>
			<path
				fillRule="evenodd"
				fill={SHADE}
				d={`M0 0H${WIDTH}V${HEIGHT}H0Z M${SAFE.left} ${SAFE.top}V${SAFE.bottom}H${SAFE.right}V${SAFE.top}Z`}
			/>
			<rect
				x={SAFE.left}
				y={SAFE.top}
				width={SAFE.width}
				height={SAFE.height}
				fill="none"
				stroke="rgb(255, 0, 60)"
				strokeWidth={3}
				strokeDasharray="18 12"
			/>
		</svg>
	</AbsoluteFill>
);
