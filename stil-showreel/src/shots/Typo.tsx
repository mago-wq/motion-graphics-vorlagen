import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {fitText} from '@remotion/layout-utils';
import {COLOR, TEXT} from '../config';
import {F} from '../fonts';
import {hash2} from '../lib/rand';
import {easeOut, pop} from '../lib/motion';

// ── 01 Fallblatt ─────────────────────────────────────────────────────────────
const FLAP_CHARS = 'ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789';
const CELL_W = 112;
const CELL_H = 168;
const GAP = 10;
const COLS = 8;

const flapChar = (row: number, col: number, f: number, target: string) => {
	const land = 5 + col + row * 5;
	if (f >= land) return target;
	return FLAP_CHARS[Math.floor(hash2(row * 31 + col, f) * FLAP_CHARS.length)];
};

const Half: React.FC<{ch: string; top: boolean; shade?: number}> = ({ch, top, shade = 0}) => (
	<div
		style={{
			position: 'absolute',
			left: 0,
			width: CELL_W,
			top: top ? 0 : CELL_H / 2,
			height: CELL_H / 2,
			overflow: 'hidden',
			background: top ? 'linear-gradient(#2a2a2a,#1f1f1f)' : 'linear-gradient(#1b1b1b,#242424)',
			borderRadius: top ? '10px 10px 0 0' : '0 0 10px 10px',
		}}
	>
		<div
			style={{
				position: 'absolute',
				top: top ? 0 : -CELL_H / 2,
				width: CELL_W,
				height: CELL_H,
				lineHeight: `${CELL_H}px`,
				textAlign: 'center',
				fontFamily: F.monoX,
				fontSize: 124,
				color: '#f2efe6',
				opacity: 1 - shade,
			}}
		>
			{ch === ' ' ? '' : ch}
		</div>
	</div>
);

export const Fallblatt: React.FC = () => {
	const f = useCurrentFrame();
	const rows = TEXT.flapRows.map((r) => r.padEnd(COLS, ' ').slice(0, COLS));
	const total = COLS * CELL_W + (COLS - 1) * GAP;
	const zoom = interpolate(f, [0, 24], [1.0, 1.06]);
	const footerOn = f >= 19;
	return (
		<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #262626 0%, #0d0d0d 70%)'}}>
			<AbsoluteFill style={{transform: `scale(${zoom})`}}>
				<div
					style={{
						position: 'absolute',
						top: 690,
						width: '100%',
						textAlign: 'center',
						fontFamily: F.mono,
						fontSize: 40,
						letterSpacing: 18,
						color: '#ffb52e',
					}}
				>
					{TEXT.flapHeader}
				</div>
				{rows.map((row, r) =>
					row.split('').map((target, c) => {
						const now = flapChar(r, c, f, target);
						const prev = flapChar(r, c, Math.max(0, f - 1), target);
						const flipping = now !== prev;
						return (
							<div
								key={`${r}-${c}`}
								style={{
									position: 'absolute',
									left: (1080 - total) / 2 + c * (CELL_W + GAP),
									top: 770 + r * (CELL_H + 24),
									width: CELL_W,
									height: CELL_H,
									boxShadow: '0 10px 24px rgba(0,0,0,0.6)',
									borderRadius: 10,
								}}
							>
								<Half ch={now} top />
								<Half ch={flipping ? prev : now} top={false} shade={flipping ? 0.25 : 0} />
								<div
									style={{
										position: 'absolute',
										top: CELL_H / 2 - 2,
										width: CELL_W,
										height: 4,
										background: '#050505',
									}}
								/>
								{flipping ? (
									// fallende Klappe, halb umgeschlagen
									<div
										style={{
											position: 'absolute',
											top: CELL_H / 2,
											width: CELL_W,
											height: CELL_H * 0.18,
											background: 'linear-gradient(#3a3a3a,#141414)',
											borderRadius: '0 0 8px 8px',
										}}
									/>
								) : null}
							</div>
						);
					}),
				)}
				<div
					style={{
						position: 'absolute',
						top: 1170,
						width: '100%',
						textAlign: 'center',
						fontFamily: F.mono,
						fontSize: 38,
						letterSpacing: 14,
						color: footerOn ? '#7dff9a' : '#2c3a2f',
						textShadow: footerOn ? '0 0 18px rgba(125,255,154,0.7)' : 'none',
					}}
				>
					{TEXT.flapFooter}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ── 02 Kinetische Typo ───────────────────────────────────────────────────────
export const Kinetik: React.FC = () => {
	const f = useCurrentFrame();
	const [w1, w2] = TEXT.kinetic;
	const s1 = fitText({text: w1, withinWidth: 900, fontFamily: F.black}).fontSize;
	const s2 = fitText({text: w2, withinWidth: 900, fontFamily: F.black}).fontSize;
	const shake = f >= 5 && f <= 7 ? (f % 2 ? 10 : -10) : 0;
	const letters = (word: string, start: number, mode: 'slam' | 'stretch') =>
		word.split('').map((ch, i) => {
			const t = pop(f, start - 1 + i * 0.6, {damping: 16, stiffness: 420, mass: 0.5});
			const sc = mode === 'slam' ? interpolate(t, [0, 1], [2.6, 1]) : 1;
			const sx = mode === 'stretch' ? interpolate(t, [0, 1], [2.2, 1]) : 1;
			const sy = mode === 'stretch' ? interpolate(t, [0, 1], [0.4, 1]) : 1;
			const dx = mode === 'stretch' ? interpolate(t, [0, 1], [700, 0]) : 0;
			const skew = mode === 'stretch' ? interpolate(t, [0, 1], [-30, 0]) : 0;
			return (
				<span
					key={i}
					style={{
						display: 'inline-block',
						opacity: t > 0.02 ? 1 : 0,
						transform: `translateX(${dx}px) scale(${sc * sx}, ${sc * sy}) skewX(${skew}deg)`,
						transformOrigin: '50% 60%',
					}}
				>
					{ch}
				</span>
			);
		});
	return (
		<AbsoluteFill style={{background: COLOR.kineticBg, transform: `translate(${shake}px, ${-shake / 2}px)`}}>
			<div
				style={{
					position: 'absolute',
					top: 560,
					width: '100%',
					textAlign: 'center',
					fontFamily: F.black,
					fontSize: s1,
					lineHeight: 1,
					color: COLOR.ink,
				}}
			>
				{letters(w1, 0, 'slam')}
			</div>
			<div
				style={{
					position: 'absolute',
					top: 560 + s1 * 0.95,
					width: '100%',
					textAlign: 'center',
					fontFamily: F.black,
					fontSize: s2,
					lineHeight: 1,
					color: '#fff4e8',
				}}
			>
				{letters(w2, 5, 'stretch')}
			</div>
		</AbsoluteFill>
	);
};

// ── 03 Neon ──────────────────────────────────────────────────────────────────
const FLICKER = [0, 1, 0.12, 0.9, 0.3, 1, 1, 0.85, 1, 1, 0.95, 1];

export const Neon: React.FC = () => {
	const f = useCurrentFrame();
	const on = FLICKER[Math.min(f, FLICKER.length - 1)];
	const frameOn = f >= 4 ? 1 : 0;
	const zoom = interpolate(f, [0, 12], [1.04, 1.0], {easing: easeOut});
	const pink = COLOR.neonPink;
	const cyan = COLOR.neonCyan;
	return (
		<AbsoluteFill
			style={{
				background: '#0b0714',
				backgroundImage:
					'linear-gradient(rgba(255,255,255,0.035) 3px, transparent 3px), linear-gradient(90deg, rgba(255,255,255,0.03) 3px, transparent 3px)',
				backgroundSize: '160px 70px, 160px 140px',
			}}
		>
			<AbsoluteFill
				style={{
					background: `radial-gradient(circle at 50% 50%, rgba(255,63,216,${0.35 * on}) 0%, rgba(63,244,255,${0.12 * frameOn}) 35%, transparent 65%)`,
				}}
			/>
			<AbsoluteFill style={{transform: `scale(${zoom})`}}>
				<svg width={1080} height={1920} viewBox="0 0 1080 1920">
					<defs>
						<filter id="glowP" x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur stdDeviation="18" result="b1" />
							<feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b2" />
							<feMerge>
								<feMergeNode in="b1" />
								<feMergeNode in="b1" />
								<feMergeNode in="b2" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>
					<g opacity={frameOn} filter="url(#glowP)">
						<rect x={150} y={640} width={780} height={560} rx={90} fill="none" stroke={cyan} strokeWidth={14} />
						<rect x={150} y={640} width={780} height={560} rx={90} fill="none" stroke="#e8feff" strokeWidth={4} />
					</g>
					<g opacity={on} filter="url(#glowP)">
						<text
							x={540}
							y={1030}
							textAnchor="middle"
							fontFamily={F.chalk}
							fontWeight={700}
							fontSize={330}
							fill={pink}
							transform="rotate(-6 540 920)"
						>
							{TEXT.neon}
						</text>
						<text
							x={540}
							y={1030}
							textAnchor="middle"
							fontFamily={F.chalk}
							fontWeight={700}
							fontSize={330}
							fill="none"
							stroke="#ffe3fa"
							strokeWidth={5}
							transform="rotate(-6 540 920)"
						>
							{TEXT.neon}
						</text>
					</g>
				</svg>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
