// Goldstreifen als Trenner: läuft von der Mitte nach außen, mit kleiner Raute.
import {COLORS} from '../theme';

export const GoldRule: React.FC<{progress: number; width: number; thickness?: number}> = ({
	progress,
	width,
	thickness = 3,
}) => (
	<div style={{position: 'relative', width, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				height: thickness,
				background: COLORS.accent,
				transform: `scaleX(${progress})`,
				borderRadius: thickness,
			}}
		/>
		<div
			style={{
				width: 14,
				height: 14,
				background: COLORS.accent,
				border: `4px solid ${COLORS.bg}`,
				boxSizing: 'content-box',
				transform: `rotate(45deg) scale(${Math.min(1, progress * 1.4)})`,
			}}
		/>
	</div>
);
