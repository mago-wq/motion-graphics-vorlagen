// Der Streifen aus fünf Farbsegmenten, der auf jeder Coral-Club-Packung unter
// dem Produktnamen steht. Er zeichnet sich Segment für Segment von links nach
// rechts – als Zierlinie unter Namen und als Durchstreichung alter Preise.
import {Easing, interpolate} from 'remotion';
import {STRIPE} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Wie weit Segment i gezeichnet ist (0–1) */
export const segmentProgress = (frame: number, start: number, i: number, stagger: number, length: number): number =>
	interpolate(frame, [start + i * stagger, start + i * stagger + length], [0, 1], {
		...clamp,
		easing: Easing.out(Easing.cubic),
	});

export const Stripe: React.FC<{
	frame: number;
	start: number;
	width: number;
	thickness: number;
	/** Versatz zwischen den Segmenten in Frames */
	stagger?: number;
	/** Zeichendauer je Segment in Frames */
	length?: number;
	style?: React.CSSProperties;
}> = ({frame, start, width, thickness, stagger = 1.5, length = 6, style}) => {
	const segment = width / STRIPE.length;
	return (
		<div style={{display: 'flex', width, height: thickness, ...style}}>
			{STRIPE.map((color, i) => (
				<div key={color} style={{width: segment, height: thickness, overflow: 'hidden'}}>
					<div
						style={{
							width: segment * segmentProgress(frame, start, i, stagger, length),
							height: thickness,
							background: color,
						}}
					/>
				</div>
			))}
		</div>
	);
};
