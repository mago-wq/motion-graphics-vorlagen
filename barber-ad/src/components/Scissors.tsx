// Große Schere für Szene 2: zeichnet sich per Strich und kann schnippen.
import {interpolate} from 'remotion';
import {SCISSORS_CLOSE_DEG, SCISSORS_SHAPE, StrokePath, sequentialStroke} from './Icons';

export const AnimatedScissors: React.FC<{
	size: number;
	/** Zeichen-Fortschritt 0..1 */
	draw: number;
	/** 0 = offen, 1 = Klingen geschlossen */
	close: number;
	color: string;
	pivotColor: string;
	strokeWidth: number;
	/** Zusätzliche SVG-Elemente im selben Koordinatensystem (z. B. Haar-Schnipsel) */
	children?: React.ReactNode;
}> = ({size, draw, close, color, pivotColor, strokeWidth, children}) => {
	const {x, y} = SCISSORS_SHAPE.pivot;
	const angle = SCISSORS_CLOSE_DEG * close;
	const pivotScale = interpolate(draw, [0.9, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const stroke = {color, strokeWidth};

	return (
		<svg viewBox="0 0 100 100" width={size} height={size} style={{overflow: 'visible'}}>
			<g transform={`rotate(${-angle} ${x} ${y})`}>
				{sequentialStroke(SCISSORS_SHAPE.halfA, draw).map(({d, local}) => (
					<StrokePath key={d} d={d} progress={local} {...stroke} />
				))}
			</g>
			<g transform={`rotate(${angle} ${x} ${y})`}>
				{sequentialStroke(SCISSORS_SHAPE.halfB, draw).map(({d, local}) => (
					<StrokePath key={d} d={d} progress={local} {...stroke} />
				))}
			</g>
			<circle cx={x} cy={y} r={3.2 * pivotScale} fill={pivotColor} />
			{children}
		</svg>
	);
};
