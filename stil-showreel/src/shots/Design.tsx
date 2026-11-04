import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {fitText} from '@remotion/layout-utils';
import {COLOR, TEXT} from '../config';
import {F} from '../fonts';
import {easeOut, lerp, pop, ramp} from '../lib/motion';
import {BAUHAUS_LAND, BRUTAL_LAND, STILL_FROM, shot} from '../timing';

// ── 37 Bauhaus ───────────────────────────────────────────────────────────────
export const Bauhaus: React.FC = () => {
	const f = useCurrentFrame();
	const [l0, l1, l2, l3] = BAUHAUS_LAND.map((l) => pop(f, l - 3, {damping: 13, stiffness: 320}));
	const spin = interpolate(f, [0, 12], [0, 18]);
	return (
		<AbsoluteFill style={{background: COLOR.bauhausCream}}>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920">
				<g transform={`translate(${lerp(-700, 0, l0)} 0)`}>
					<circle cx={400} cy={820} r={290} fill={COLOR.bauhausRed} />
				</g>
				<g transform={`translate(${lerp(900, 0, l1)} ${lerp(-300, 0, l1)}) rotate(${-12 + spin * 0.3} 690 1160)`}>
					<rect x={500} y={970} width={380} height={380} fill={COLOR.bauhausBlue} />
				</g>
				<g transform={`translate(0 ${lerp(1200, 0, l2)})`}>
					<polygon points="150,1560 520,1560 335,1240" fill={COLOR.bauhausYellow} />
				</g>
				<g transform={`rotate(${lerp(-90, -32, l3)} 540 960)`} opacity={l3 > 0.01 ? 1 : 0}>
					<rect x={80} y={940} width={920} height={40} fill={COLOR.ink} />
				</g>
				<g transform={`scale(${l3}) `} style={{transformOrigin: '820px 600px'}}>
					<path d="M 700 600 A 120 120 0 0 1 940 600 Z" fill={COLOR.ink} />
				</g>
				<circle cx={760} cy={1520} r={lerp(0, 60, l2)} fill={COLOR.ink} />
				<circle cx={250} cy={460} r={lerp(0, 34, l1)} fill="none" stroke={COLOR.ink} strokeWidth={10} />
			</svg>
		</AbsoluteFill>
	);
};

// ── 38 Art déco ──────────────────────────────────────────────────────────────
export const Deco: React.FC = () => {
	const f = useCurrentFrame();
	const rays = ramp(f, 0, 6, easeOut);
	const arch = ramp(f, 1, 7, easeOut);
	const text = ramp(f, 3, 8, easeOut);
	const cx = 540;
	const base = 1480;
	const N = 23;
	return (
		<AbsoluteFill style={{background: '#0a0908'}}>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920">
				<defs>
					<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor={COLOR.goldLight} />
						<stop offset="0.45" stopColor={COLOR.gold} />
						<stop offset="0.6" stopColor="#a8822e" />
						<stop offset="1" stopColor={COLOR.goldLight} />
					</linearGradient>
				</defs>
				<rect x={50} y={50} width={980} height={1820} fill="none" stroke="url(#gold)" strokeWidth={5} />
				<rect x={72} y={72} width={936} height={1776} fill="none" stroke="url(#gold)" strokeWidth={2} />
				{Array.from({length: N}, (_, i) => {
					const a = Math.PI + (i / (N - 1)) * Math.PI;
					const len = 1100 * rays;
					return (
						<line
							key={i}
							x1={cx + Math.cos(a) * 300}
							y1={base + Math.sin(a) * 300}
							x2={cx + Math.cos(a) * (300 + len)}
							y2={base + Math.sin(a) * (300 + len)}
							stroke="url(#gold)"
							strokeWidth={i % 2 ? 3 : 7}
						/>
					);
				})}
				{[0, 1, 2].map((k) => {
					const w = 260 - k * 70;
					const top = 760 + k * 90;
					const d = `M ${cx - w} ${base} L ${cx - w} ${top + w} A ${w} ${w} 0 0 1 ${cx + w} ${top + w} L ${cx + w} ${base}`;
					return (
						<path
							key={k}
							d={d}
							fill={k === 0 ? '#0a0908' : 'none'}
							stroke="url(#gold)"
							strokeWidth={k === 0 ? 10 : 5}
							pathLength={1}
							strokeDasharray={1}
							strokeDashoffset={1 - arch}
						/>
					);
				})}
				{[-1, 1].map((sgn) => (
					<g key={sgn} transform={`translate(${cx + sgn * 380} 330) scale(${sgn} 1)`} opacity={arch}>
						{[0, 1, 2, 3].map((k) => (
							<path key={k} d={`M 0 0 L ${-120 + k * 30} 0 A ${120 - k * 30} ${120 - k * 30} 0 0 1 0 ${120 - k * 30} Z`} fill="none" stroke="url(#gold)" strokeWidth={4} />
						))}
					</g>
				))}
				<g opacity={text} transform={`translate(0 ${lerp(40, 0, text)})`}>
					<text x={cx} y={640} textAnchor="middle" fontFamily={F.deco} fontSize={190} letterSpacing={40} fill="url(#gold)">
						{TEXT.deco}
					</text>
					<line x1={cx - 300} y1={690} x2={cx + 300} y2={690} stroke="url(#gold)" strokeWidth={4} />
				</g>
			</svg>
		</AbsoluteFill>
	);
};

// ── 40 Neo-Brutalismus (Endkarte) ────────────────────────────────────────────
const Box: React.FC<{
	t: number;
	top: number;
	rotate: number;
	bg: string;
	children: React.ReactNode;
	pressed?: number;
	style?: React.CSSProperties;
}> = ({t, top, rotate, bg, children, pressed = 0, style}) => {
	const sh = lerp(18, 4, pressed);
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: 0,
				width: '100%',
				display: 'flex',
				justifyContent: 'center',
				opacity: t > 0.02 ? 1 : 0,
				transform: `translateY(${(1 - t) * -140}px) scale(${lerp(1.3, 1, t)}) rotate(${rotate}deg)`,
			}}
		>
			<div
				style={{
					background: bg,
					border: '8px solid #111',
					boxShadow: `${sh}px ${sh}px 0 #111`,
					transform: `translate(${18 - sh}px, ${18 - sh}px)`,
					padding: '10px 36px',
					color: '#111',
					...style,
				}}
			>
				{children}
			</div>
		</div>
	);
};

const Star: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="-10 -10 20 20" style={{margin: '0 26px', verticalAlign: 'middle'}}>
		<polygon points="0,-10 2.6,-2.6 10,0 2.6,2.6 0,10 -2.6,2.6 -10,0 -2.6,-2.6" fill={color} />
	</svg>
);

export const Brutal: React.FC = () => {
	const f = useCurrentFrame();
	const L = BRUTAL_LAND;
	const sp = (k: number) => pop(f, k - 3, {damping: 12, stiffness: 380, mass: 0.55});
	const main = sp(L.main);
	const second = sp(L.second);
	const third = sp(L.third);
	const sticker = sp(L.sticker);
	const button = sp(L.button);
	const hint = sp(L.hint);
	const press = interpolate(f, [L.press - 1, L.press, L.press + 3], [0, 1, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const stillLocal = STILL_FROM - shot('brutal').from;
	const tick = interpolate(Math.min(f, stillLocal), [0, stillLocal], [0, -520]);
	const mainSize = fitText({text: TEXT.endMain, withinWidth: 760, fontFamily: F.black}).fontSize;
	const tickerItems = [...TEXT.ticker, ...TEXT.ticker, ...TEXT.ticker];
	return (
		<AbsoluteFill
			style={{
				background: COLOR.brutalBg,
				backgroundImage:
					'linear-gradient(rgba(17,17,17,0.08) 3px, transparent 3px), linear-gradient(90deg, rgba(17,17,17,0.08) 3px, transparent 3px)',
				backgroundSize: '90px 90px',
			}}
		>
			<Box t={main} top={420} rotate={-3} bg="#ffffff" style={{fontFamily: F.black, fontSize: mainSize, lineHeight: 1.1}}>
				{TEXT.endMain}
			</Box>
			<Box t={second} top={650} rotate={2.5} bg={COLOR.brutalCyan} style={{fontFamily: F.black, fontSize: 88, lineHeight: 1.15}}>
				{TEXT.endSecond}
			</Box>
			<Box t={third} top={830} rotate={-2} bg={COLOR.brutalPink} style={{fontFamily: F.black, fontSize: 104, lineHeight: 1.12}}>
				{TEXT.endThird}
			</Box>
			<div
				style={{
					position: 'absolute',
					left: 24,
					top: 1318,
					width: 190,
					height: 190,
					borderRadius: 95,
					zIndex: 2,
					background: COLOR.brutalLime,
					border: '7px solid #111',
					boxShadow: '10px 10px 0 #111',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: F.black,
					fontSize: 26,
					lineHeight: 1.12,
					textAlign: 'center',
					opacity: sticker > 0.02 ? 1 : 0,
					transform: `scale(${sticker}) rotate(${lerp(-40, 12, sticker)}deg)`,
				}}
			>
				{TEXT.endSticker.map((s) => (
					<div key={s}>{s}</div>
				))}
			</div>
			<Box
				t={button}
				top={1090}
				rotate={0}
				bg={COLOR.brutalOrange}
				pressed={press}
				style={{fontFamily: F.grotesk, fontWeight: 700, fontSize: 64, padding: '26px 50px', borderRadius: 26}}
			>
				{TEXT.endButton} ↓
			</Box>
			<div
				style={{
					position: 'absolute',
					top: 1270,
					width: '100%',
					textAlign: 'center',
					fontFamily: F.grotesk,
					fontWeight: 700,
					fontSize: 44,
					color: '#111',
					opacity: hint,
					transform: `translateY(${(1 - hint) * 30}px)`,
				}}
			>
				{TEXT.endHint}
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1380,
					left: -40,
					width: 1160,
					height: 100,
					background: '#111',
					transform: 'rotate(-2deg)',
					overflow: 'hidden',
					whiteSpace: 'nowrap',
				}}
			>
				<div style={{transform: `translateX(${tick}px)`, fontFamily: F.black, fontSize: 52, lineHeight: '100px', color: COLOR.brutalBg}}>
					{tickerItems.map((t, i) => (
						<span key={i}>
							{t}
							<Star size={34} color={COLOR.brutalBg} />
						</span>
					))}
				</div>
			</div>
		</AbsoluteFill>
	);
};
