// Texttafeln: große Aussagen (Anton), Namensbalken (Barlow Condensed) und der Titel „أسمو“.
import {fitText} from '@remotion/layout-utils';
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, Tafel, Zeile} from '../config';
import {ARABIC, COND, DISPLAY} from '../fonts';
import {clamp, easeIn, easeOut, hits} from '../fx';
import {FPS} from '../timing';
import {Muster} from './Muster';

const MAXW = 920;
const deFormat = new Intl.NumberFormat('de-DE');

/** Ausblenden am Ende einer Tafel: leicht größer, unscharf, weg (5 Frames). */
const useExit = (out: number) => {
	const frame = useCurrentFrame();
	const k = interpolate(frame, [out * FPS - 5, out * FPS], [0, 1], {...clamp, easing: easeIn});
	return {opacity: 1 - k, scale: 1 + 0.07 * k, blur: 9 * k};
};

/** Ruck beim Erscheinen: groß und unscharf -> scharf, mit kurzem Rot/Cyan-Versatz. */
const slam = (frame: number, at: number) => {
	const f = frame - at * FPS;
	const p = interpolate(f, [0, 7], [0, 1], {...clamp, easing: easeOut});
	const split = interpolate(f, [0, 2, 9], [0, 14, 0], clamp);
	return {f, p, split, visible: f >= 0};
};

const textShadow = (gold: boolean, split: number) =>
	[
		'0 6px 30px rgba(0,0,0,0.65)',
		gold ? `0 0 26px rgba(226,184,92,0.55)` : '0 0 18px rgba(255,240,220,0.18)',
		split > 0.5 ? `${-split}px 0 0 rgba(255,50,40,0.7)` : '',
		split > 0.5 ? `${split}px 0 0 rgba(40,220,255,0.7)` : '',
	]
		.filter(Boolean)
		.join(', ');

const ZeileView: React.FC<{z: Zeile; tafel: Tafel}> = ({z, tafel}) => {
	const frame = useCurrentFrame();
	const {f, p, split, visible} = slam(frame, z.at);
	let text = z.text;
	if (tafel.zaehler && text.includes('{n}')) {
		const c = tafel.zaehler;
		const k = interpolate(f, [0, c.dauer * FPS], [0, 1], {...clamp, easing: easeOut});
		text = text.replace('{n}', deFormat.format(Math.round(c.von + (c.bis - c.von) * k)));
	}
	// Größe: gewünscht, aber nie breiter als MAXW (mit der Endzahl gemessen, damit nichts springt)
	const measure = tafel.zaehler ? z.text.replace('{n}', deFormat.format(tafel.zaehler.bis)) : z.text;
	const size = Math.min(z.size ?? 120, fitText({text: measure, withinWidth: MAXW, fontFamily: DISPLAY}).fontSize);
	return (
		<div
			style={{
				fontFamily: DISPLAY,
				fontSize: size,
				lineHeight: 1.02,
				color: z.gold ? COLORS.gold : COLORS.knochen,
				whiteSpace: 'nowrap',
				textAlign: 'center',
				letterSpacing: `${0.02 + (1 - p) * 0.1}em`,
				opacity: visible ? Math.min(1, p * 2.2) : 0,
				transform: `scale(${1.45 - 0.45 * p})`,
				filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
				textShadow: textShadow(Boolean(z.gold), split),
			}}
		>
			{text}
		</div>
	);
};

const Aussage: React.FC<{tafel: Tafel}> = ({tafel}) => {
	const frame = useCurrentFrame();
	const ex = useExit(tafel.out);
	const start = tafel.zeilen[0].at;
	// langsames Heranfahren über die Lebensdauer der Tafel
	const life = interpolate(frame, [start * FPS, tafel.out * FPS], [1, 1.05], clamp);
	return (
		<AbsoluteFill
			style={{
				justifyContent: 'center',
				alignItems: 'center',
				opacity: ex.opacity,
				filter: ex.blur > 0.2 ? `blur(${ex.blur}px)` : undefined,
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: tafel.y,
					left: 0,
					right: 0,
					transform: `translateY(-50%) scale(${life * ex.scale})`,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 6,
				}}
			>
				{tafel.zeilen.map((z, i) => (
					<ZeileView key={i} z={z} tafel={tafel} />
				))}
			</div>
		</AbsoluteFill>
	);
};

const Name: React.FC<{tafel: Tafel}> = ({tafel}) => {
	const frame = useCurrentFrame();
	const ex = useExit(tafel.out);
	const at = tafel.zeilen[0].at * FPS;
	const line = interpolate(frame, [at, at + 11], [0, 1], {...clamp, easing: easeOut});
	const name = interpolate(frame, [at + 2, at + 12], [0, 1], {...clamp, easing: easeOut});
	const unter = interpolate(frame, [at + 7, at + 17], [0, 1], {...clamp, easing: easeOut});
	return (
		<AbsoluteFill style={{opacity: ex.opacity}}>
			<AbsoluteFill style={{background: `radial-gradient(ellipse 75% 9% at 50% ${tafel.y}px, rgba(0,0,0,${0.62 * line}), rgba(0,0,0,0))`}} />
			<div style={{position: 'absolute', top: tafel.y, left: 0, right: 0, transform: 'translateY(-50%)', display: 'flex',
				flexDirection: 'column', alignItems: 'center'}}>
				<div style={{fontFamily: COND, fontWeight: 700, fontSize: 66, color: COLORS.gold, opacity: name,
					letterSpacing: `${0.34 + (1 - name) * 0.3}em`, paddingLeft: '0.34em', textShadow: '0 4px 24px rgba(0,0,0,0.8), 0 0 22px rgba(226,184,92,0.4)',
					whiteSpace: 'nowrap'}}>
					{tafel.zeilen[0].text}
				</div>
				<div style={{width: 600 * line, height: 3, margin: '14px 0 16px', background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
					boxShadow: `0 0 14px ${COLORS.gold}`}} />
				{tafel.unter ? (
					<div style={{fontFamily: COND, fontWeight: 600, fontSize: 32, color: COLORS.knochen, opacity: 0.88 * unter,
						letterSpacing: '0.24em', paddingLeft: '0.24em', textShadow: '0 3px 16px rgba(0,0,0,0.85)', whiteSpace: 'nowrap',
						transform: `translateY(${(1 - unter) * 10}px)`}}>
						{tafel.unter}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

const Titel: React.FC<{tafel: Tafel}> = ({tafel}) => {
	const frame = useCurrentFrame();
	const ex = useExit(tafel.out);
	const [ar, de] = tafel.zeilen;
	const a = interpolate(frame, [ar.at * FPS, ar.at * FPS + 14], [0, 1], {...clamp, easing: easeOut});
	const d = interpolate(frame, [de.at * FPS, de.at * FPS + 12], [0, 1], {...clamp, easing: easeOut});
	const glow = 1 + hits(frame).flash * 1.5;
	const muster = interpolate(frame, [ar.at * FPS, tafel.out * FPS], [0, 1], clamp);
	return (
		<AbsoluteFill style={{opacity: ex.opacity, filter: ex.blur > 0.2 ? `blur(${ex.blur}px)` : undefined}}>
			<Muster progress={muster * 1.3} cell={240} opacity={0.22 * a} rotate={muster * 6} cy={tafel.y} />
			<div style={{position: 'absolute', top: tafel.y, left: 0, right: 0, transform: `translateY(-50%) scale(${(1.25 - 0.25 * a) * ex.scale})`,
				display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
				<div lang="ar" dir="rtl" style={{fontFamily: ARABIC, fontWeight: 700, fontSize: ar.size ?? 330, lineHeight: 1.25, color: COLORS.goldHell,
					opacity: a, filter: a < 1 ? `blur(${(1 - a) * 18}px)` : undefined,
					textShadow: `0 0 ${30 * glow}px rgba(226,184,92,0.75), 0 0 ${90 * glow}px rgba(226,184,92,0.45), 0 8px 30px rgba(0,0,0,0.7)`}}>
					{ar.text}
				</div>
				<div style={{fontFamily: COND, fontWeight: 600, fontSize: 54, color: COLORS.knochen, opacity: d,
					letterSpacing: `${0.42 + (1 - d) * 0.25}em`, paddingLeft: '0.42em', marginTop: -10, whiteSpace: 'nowrap',
					textShadow: '0 4px 20px rgba(0,0,0,0.85)'}}>
					{de.text}
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const TafelView: React.FC<{tafel: Tafel}> = ({tafel}) => {
	if (tafel.kind === 'name') return <Name tafel={tafel} />;
	if (tafel.kind === 'titel') return <Titel tafel={tafel} />;
	return <Aussage tafel={tafel} />;
};
