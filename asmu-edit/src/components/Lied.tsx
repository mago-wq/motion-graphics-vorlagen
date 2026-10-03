// Gesungene Zeile: arabische Wörter erscheinen mit ihrem Einsatz (von rechts), die
// deutsche Übersetzung läuft mit dem ersten Wort ein. Die Schrift zittert leicht mit der Stimme.
import {fitText} from '@remotion/layout-utils';
import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {COLORS, Liedzeile, VERS} from '../config';
import {ARABIC, COND} from '../fonts';
import {clamp, easeIn, easeOut} from '../fx';
import {env, FPS} from '../timing';
import {Muster} from './Muster';

const AR_Y = 1150;

export const LiedView: React.FC<{zeile: Liedzeile}> = ({zeile}) => {
	const frame = useCurrentFrame();
	const outK = interpolate(frame, [zeile.out * FPS - 6, zeile.out * FPS], [0, 1], {...clamp, easing: easeIn});
	const de = interpolate(frame, [(zeile.t[0] + 0.2) * FPS, (zeile.t[0] + 0.2) * FPS + 14], [0, 1], {...clamp, easing: easeOut});
	// Wortabstand (0,24 em) und Innenabstand je Wort sind breiter als ein Leerzeichen: knapper messen
	const size = Math.min(112, fitText({text: zeile.ar.join(' '), withinWidth: 760, fontFamily: ARABIC, fontWeight: 700}).fontSize);
	// Zittern mit der Stimme (wie in rahil-reel gewünscht), hier zurückhaltend
	const e = env(frame);
	const tick = Math.floor(frame / 2);
	const amp = 0.6 + 3.2 * Math.pow(e, 2.4);
	const jx = (random(`lx${tick}`) - 0.5) * 2 * amp;
	const jy = (random(`ly${tick}`) - 0.5) * 2 * amp;
	return (
		<AbsoluteFill style={{opacity: 1 - outK, filter: outK > 0.05 ? `blur(${outK * 10}px)` : undefined}}>
			{/* dunkler Hof hinter dem Text */}
			<AbsoluteFill style={{background: `radial-gradient(ellipse 85% 14% at 50% ${AR_Y + 60}px, rgba(0,0,0,0.6), rgba(0,0,0,0))`}} />
			<div lang="ar" dir="rtl" style={{position: 'absolute', top: AR_Y, left: 60, right: 60, transform: `translate(${jx}px, calc(-50% + ${jy}px))`,
				display: 'flex', justifyContent: 'center', columnGap: '0.24em', fontFamily: ARABIC, fontWeight: 700, fontSize: size,
				lineHeight: 1.7, color: COLORS.goldHell, whiteSpace: 'nowrap'}}>
				{zeile.ar.map((w, i) => {
					const f = frame - zeile.t[i] * FPS;
					const p = interpolate(f, [0, 12], [0, 1], {...clamp, easing: easeOut});
					const flare = interpolate(f, [0, 4, 18], [0, 1, 0], clamp);
					return (
						<span key={i} style={{display: 'inline-block', padding: '0 0.06em', opacity: p,
							transform: `translateY(${(1 - p) * 30}px) scale(${1.12 - 0.12 * p})`,
							filter: p < 1 || flare > 0.02 ? `blur(${(1 - p) * 12}px) brightness(${1 + flare * 0.7})` : undefined,
							textShadow: `0 0 ${18 + flare * 30}px rgba(226,184,92,0.65), 0 0 60px rgba(226,184,92,0.3), 0 5px 18px rgba(0,0,0,0.75)`}}>
							{w}
						</span>
					);
				})}
			</div>
			<div style={{position: 'absolute', top: AR_Y + 122, left: 100, right: 100, textAlign: 'center', fontFamily: COND, fontWeight: 600,
				fontSize: 54, lineHeight: 1.2, textWrap: 'balance', letterSpacing: '0.03em', color: COLORS.knochen, opacity: 0.95 * de,
				transform: `translateY(${(1 - de) * 14}px)`, filter: de < 1 ? `blur(${(1 - de) * 6}px)` : undefined,
				textShadow: '0 3px 18px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.6)'}}>
				{zeile.de}
			</div>
		</AbsoluteFill>
	);
};

/** Schlusstafel: Koran 13:11 über dem sich zeichnenden Sternmuster, dann Abblende. */
export const VersView: React.FC<{ende: number}> = ({ende}) => {
	const frame = useCurrentFrame();
	const t = frame / FPS - VERS.at;
	// Umbruch nach „بِقَوْمٍ“: „… eines Volkes, / bis sie ändern …“
	const zeilen = [VERS.ar.split(' ').slice(0, 6).join(' '), VERS.ar.split(' ').slice(6).join(' ')];
	const arSize = Math.min(84, fitText({text: zeilen[0], withinWidth: 900, fontFamily: ARABIC, fontWeight: 700}).fontSize);
	const ar = interpolate(t, [0.1, 0.9], [0, 1], {...clamp, easing: easeOut});
	const de = interpolate(t, [1.0, 1.7], [0, 1], {...clamp, easing: easeOut});
	const q = interpolate(t, [1.8, 2.4], [0, 1], {...clamp, easing: easeOut});
	const muster = interpolate(t, [-0.1, 3.2], [0, 1], clamp);
	const abblende = interpolate(frame, [ende - 0.8 * FPS, ende - 1], [0, 1], clamp);
	return (
		<AbsoluteFill style={{background: COLORS.nacht}}>
			<Muster progress={muster} cell={200} opacity={0.5} rotate={t * 1.2} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 30% at 50% 47%, rgba(7,7,10,0.92), rgba(7,7,10,0.2) 80%)'}} />
			<div style={{position: 'absolute', top: 760, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
				{zeilen.map((z, i) => (
					<div key={i} lang="ar" dir="rtl" style={{fontFamily: ARABIC, fontWeight: 700, fontSize: arSize, lineHeight: 1.75,
						color: COLORS.goldHell, whiteSpace: 'nowrap', opacity: interpolate(ar, [i * 0.4, 0.6 + i * 0.4], [0, 1], clamp),
						textShadow: '0 0 26px rgba(226,184,92,0.55), 0 4px 18px rgba(0,0,0,0.8)'}}>
						{z}
					</div>
				))}
				<div style={{marginTop: 34, maxWidth: 860, textAlign: 'center', fontFamily: COND, fontWeight: 600, fontSize: 44, lineHeight: 1.25,
					color: COLORS.knochen, opacity: de, transform: `translateY(${(1 - de) * 12}px)`}}>
					{VERS.de}
				</div>
				<div style={{marginTop: 30, fontFamily: COND, fontWeight: 700, fontSize: 30, letterSpacing: '0.42em', paddingLeft: '0.42em',
					color: COLORS.gold, opacity: q}}>
					{VERS.quelle}
				</div>
			</div>
			<AbsoluteFill style={{background: '#000', opacity: abblende}} />
		</AbsoluteFill>
	);
};
