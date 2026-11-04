import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {STYLES} from './config';
import {F} from './fonts';
import {easeOut, pop} from './lib/motion';
import {SHOTS} from './timing';

/** Stilnummer, die bei einem globalen Frame im HUD steht. */
export const styleAt = (g: number) => {
	let nr = 1;
	for (const s of SHOTS) {
		for (const [n, at] of s.styles) if (g >= s.from + at) nr = n;
	}
	return nr;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Zähler oben: „07/40 Kinetische Typo“ mit rollenden Ziffern und 40 Strichen Fortschritt. */
export const Hud: React.FC = () => {
	const g = useCurrentFrame();
	const nr = styleAt(g);
	let since = 0;
	while (since < 4 && g - since - 1 >= 0 && styleAt(g - since - 1) === nr) since++;
	const changed = since < 4 && g > 0;
	const prev = changed ? styleAt(g - since - 1) : nr;
	const roll = changed ? interpolate(since, [0, 3], [0, 1], {extrapolateRight: 'clamp', easing: easeOut}) : 1;
	const enter = pop(g, 0, {damping: 15, stiffness: 300});
	const label = STYLES[nr - 1];
	const kick = changed ? interpolate(since, [0, 3], [1.06, 1], {extrapolateRight: 'clamp'}) : 1;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					top: 222,
					left: 0,
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					transform: `translateY(${(1 - enter) * -60}px) scale(${kick})`,
					opacity: enter,
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 20,
						background: '#ffffff',
						border: '5px solid #111',
						boxShadow: '8px 8px 0 #111',
						borderRadius: 16,
						padding: '10px 26px 10px 20px',
					}}
				>
					<div
						style={{
							position: 'relative',
							height: 56,
							width: 70,
							overflow: 'hidden',
							fontFamily: F.monoX,
							fontSize: 48,
							lineHeight: '56px',
							color: '#111',
						}}
					>
						<div style={{position: 'absolute', top: -56 * roll}}>{pad(prev)}</div>
						<div style={{position: 'absolute', top: 56 - 56 * roll}}>{pad(nr)}</div>
					</div>
					<div style={{fontFamily: F.monoX, fontSize: 30, color: '#888', marginLeft: -12}}>/40</div>
					<div style={{width: 4, height: 40, background: '#111', borderRadius: 2}} />
					<div style={{fontFamily: F.grotesk, fontWeight: 700, fontSize: 42, color: '#111', whiteSpace: 'nowrap'}}>
						{label}
					</div>
				</div>
				<div style={{display: 'flex', gap: 4, marginTop: 18}}>
					{STYLES.map((_, i) => (
						<div
							key={i}
							style={{
								width: 11,
								height: 14,
								borderRadius: 3,
								background: i < nr ? '#ffffff' : 'rgba(255,255,255,0.28)',
								boxShadow: i < nr ? '0 0 0 2px #111' : 'none',
							}}
						/>
					))}
				</div>
			</div>
		</AbsoluteFill>
	);
};
