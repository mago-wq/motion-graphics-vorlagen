// Islamisches Sternmuster (achtzackige Sterne aus zwei Quadraten, Khatam), das sich
// von der Mitte aus zeichnet. Für den Titel „أسمو“ und die Schlusstafel.
import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {COLORS} from '../config';
import {clamp, easeOut} from '../fx';

const star = (cx: number, cy: number, r: number) => {
	const sq = (rot: number) =>
		[0, 1, 2, 3]
			.map((k) => {
				const a = rot + (k * Math.PI) / 2;
				return `${k ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
			})
			.join('') + 'Z';
	return [sq(0), sq(Math.PI / 4)];
};

type Props = {
	/** 0–1: wie weit sich das Muster von der Mitte aus gezeichnet hat */
	progress: number;
	cell?: number;
	opacity?: number;
	rotate?: number;
	cy?: number;
};

export const Muster: React.FC<Props> = ({progress, cell = 180, opacity = 0.35, rotate = 0, cy = 960}) => {
	const cols = Math.ceil(1500 / cell) + 1;
	const rows = Math.ceil(2400 / cell) + 1;
	const maxD = Math.hypot(760, 1200);
	const items: React.ReactNode[] = [];
	for (let i = -Math.floor(cols / 2); i <= Math.floor(cols / 2); i++) {
		for (let j = -Math.floor(rows / 2); j <= Math.floor(rows / 2); j++) {
			const x = 540 + i * cell;
			const y = cy + j * cell;
			const dist = Math.hypot(x - 540, y - cy) / maxD;
			// jeder Stern zeichnet sich, sobald die Welle ihn erreicht
			const k = interpolate(progress, [dist * 0.75, dist * 0.75 + 0.25], [0, 1], {...clamp, easing: easeOut});
			if (k <= 0) continue;
			const [a, b] = star(x, y, cell * 0.5);
			for (const [n, d] of [a, b].entries()) {
				items.push(
					<path key={`${i}_${j}_${n}`} d={d} pathLength={1} fill="none" stroke={COLORS.gold} strokeWidth={1.6}
						strokeDasharray="1 1" strokeDashoffset={1 - k} strokeOpacity={0.4 + 0.6 * (1 - dist)} />,
				);
			}
			// kleiner Kreis in der Sternmitte
			items.push(<circle key={`${i}_${j}_c`} cx={x} cy={y} r={cell * 0.16 * k} fill="none" stroke={COLORS.gold}
				strokeWidth={1.2} strokeOpacity={0.5 * k} />);
		}
	}
	return (
		<AbsoluteFill style={{opacity, transform: `rotate(${rotate}deg) scale(1.02)`}}>
			<svg width={1080} height={1920}>{items}</svg>
		</AbsoluteFill>
	);
};
