// Szenenwechsel: fünf breite Bänder in den Streifenfarben fahren schräg durchs
// Bild. Auf der Szenengrenze ist alles bedeckt, dort liegt der Schnitt.
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {STRIPE} from '../theme';
import {WIPE} from '../timing';
import {HEIGHT, WIDTH} from '../video';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const TILT = -14;
/** Bänder deutlich größer als das Bild, damit die Schräge keine Ecken freilässt */
const SPAN_W = WIDTH * 2.2;
const SPAN_H = HEIGHT * 1.35;

/** Position von Band i: -1 (links draußen) → 0 (deckt) → +1 (rechts draußen) */
const bandPosition = (frame: number, center: number, i: number): number => {
	const inStart = center - WIPE.inLead + i * WIPE.stagger;
	const outStart = center + 1 + i * WIPE.stagger;
	if (frame < outStart) {
		return interpolate(frame, [inStart, inStart + WIPE.inLength], [-1, 0], {...clamp, easing: Easing.in(Easing.cubic)});
	}
	return interpolate(frame, [outStart, outStart + WIPE.outLength], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
};

export const StripeWipe: React.FC = () => {
	const frame = useCurrentFrame();
	const active = WIPE.centers.find((c) => frame >= c - WIPE.inLead - 1 && frame <= c + 2 + 4 * WIPE.stagger + WIPE.outLength);
	if (active === undefined) return null;
	const bandH = SPAN_H / STRIPE.length;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					left: (WIDTH - SPAN_W) / 2,
					top: (HEIGHT - SPAN_H) / 2,
					width: SPAN_W,
					height: SPAN_H,
					transform: `rotate(${TILT}deg)`,
				}}
			>
				{STRIPE.map((color, i) => {
					const pos = bandPosition(frame, active, i);
					return (
						<div
							key={color}
							style={{
								position: 'absolute',
								left: 0,
								top: i * bandH - 1,
								width: SPAN_W,
								// 2 px Überlappung gegen Haarlinien zwischen den Bändern
								height: bandH + 2,
								background: color,
								transform: `translateX(${pos * SPAN_W}px)`,
							}}
						/>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
