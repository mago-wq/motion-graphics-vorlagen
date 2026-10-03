// Typografie des Edits. Alle Texte werden mit fitText auf die Sicherheitszone begrenzt.
import {fitText} from '@remotion/layout-utils';
import type {CSSProperties} from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {F} from '../fonts';
import {C} from '../theme';
import {SAFE} from '../video';

type Common = {
	/** Frame (relativ zur Sequenz), ab dem der Text steht */
	at?: number;
	/** Mitte des Textes, vertikal in px */
	y: number;
	style?: CSSProperties;
};

const fit = (text: string, font: string, max: number, weight = '400', width = SAFE.width) =>
	Math.min(max, fitText({text, withinWidth: width, fontFamily: font, fontWeight: weight}).fontSize);

const centered = (y: number): CSSProperties => ({
	position: 'absolute',
	left: SAFE.left,
	width: SAFE.width,
	top: y,
	transform: 'translateY(-50%)',
	textAlign: 'center',
	whiteSpace: 'nowrap',
});

/** Schwerer Titel, der auf den Schlag einschlägt – mit Nachbild-Kontur */
export const Slam: React.FC<Common & {text: string; size?: number; color?: string; cyr?: boolean; echo?: boolean; tracking?: number; outline?: boolean}> = ({
	text, at = 0, y, size = 260, color = C.bone, cyr = false, echo = true, tracking = 0.01, outline = false, style,
}) => {
	const frame = useCurrentFrame();
	const age = frame - at;
	if (age < 0) return null;
	const font = cyr ? F.cyr : F.slam;
	const weight = cyr ? '700' : '400';
	const fs = fit(text, font, size, weight) * (1 - tracking * 2);
	const s = 1 + 0.55 * Math.exp(-age / 1.5);
	const blur = 16 * Math.exp(-age / 1.1);
	const o = Math.min(1, 0.35 + age / 1.5);
	const base: CSSProperties = {
		...centered(y),
		fontFamily: font,
		fontWeight: weight as CSSProperties['fontWeight'],
		fontSize: fs,
		lineHeight: 1,
		letterSpacing: `${tracking}em`,
		textTransform: 'uppercase',
	};
	return (
		<>
			{echo && age < 14 ? (
				<div
					style={{
						...base,
						color: 'transparent',
						WebkitTextStroke: `2px ${color}`,
						transform: `translateY(-50%) scale(${1 + 0.4 * (1 - Math.exp(-age / 4))})`,
						opacity: 0.75 * Math.exp(-age / 4),
					}}
				>
					{text}
				</div>
			) : null}
			<div
				style={{
					...base,
					color: outline ? 'transparent' : color,
					WebkitTextStroke: outline ? `3px ${color}` : undefined,
					transform: `translateY(-50%) scale(${s})`,
					filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
					opacity: o,
					textShadow: outline ? undefined : '0 10px 40px rgba(0,0,0,0.65)',
					...style,
				}}
			>
				{text}
			</div>
		</>
	);
};

/** Kleine Zeile in Versalien mit weiter Laufweite – wird von links aufgedeckt */
export const Kicker: React.FC<Common & {text: string; size?: number; color?: string; line?: boolean}> = ({
	text, at = 0, y, size = 36, color = 'rgba(239,232,218,0.88)', line = true, style,
}) => {
	const frame = useCurrentFrame();
	const age = frame - at;
	if (age < 0) return null;
	const p = Easing.out(Easing.cubic)(Math.min(1, age / 9));
	// fitText kennt keine Laufweite: die 0,28em pro Zeichen hier selbst einrechnen
	const W = SAFE.width * 0.92;
	const fs0 = fit(text.toUpperCase(), F.mono, 400, '500', W);
	const fs = Math.min(size, W / (W / fs0 + 0.28 * text.length));
	return (
		<div style={{...centered(y), clipPath: `inset(0 ${100 - p * 100}% 0 0)`, ...style}}>
			{line ? <div style={{width: 70 * p, height: 3, backgroundColor: C.red, margin: '0 auto 16px'}} /> : null}
			<div style={{fontFamily: F.mono, fontWeight: 500, fontSize: fs, letterSpacing: '0.28em', color, textTransform: 'uppercase'}}>{text}</div>
		</div>
	);
};

/** Schreibmaschine: Buchstabe für Buchstabe, mit Cursor */
export const Typed: React.FC<Common & {text: string; size?: number; cps?: number; color?: string}> = ({
	text, at = 0, y, size = 54, cps = 22, color = C.bone, style,
}) => {
	const frame = useCurrentFrame();
	const age = frame - at;
	if (age < 0) return null;
	const n = Math.min(text.length, Math.floor((age / 30) * cps));
	const cursor = n < text.length || Math.floor(age / 8) % 2 === 0;
	const fs = fit(text, F.mono, size, '500', SAFE.width * 0.95);
	return (
		<div style={{...centered(y), fontFamily: F.mono, fontWeight: 500, fontSize: fs, color, letterSpacing: '0.04em', ...style}}>
			{text.slice(0, n)}
			<span style={{opacity: cursor ? 1 : 0, color: C.red}}>▌</span>
		</div>
	);
};

/** Zitat: Wörter erscheinen nacheinander, Serifenschrift kursiv */
export const Quote: React.FC<Common & {lines: string[]; size?: number; source?: string; wordsPerSec?: number; color?: string}> = ({
	lines, at = 0, y, size = 68, source, wordsPerSec = 6, color = C.bone, style,
}) => {
	const frame = useCurrentFrame();
	const age = frame - at;
	if (age < 0) return null;
	let idx = 0;
	const lh = size * 1.18;
	const total = lines.join(' ').split(' ').length;
	const srcAt = (total / wordsPerSec) * 30 + 6;
	return (
		<div style={{position: 'absolute', left: SAFE.left, width: SAFE.width, top: y - (lines.length * lh) / 2, textAlign: 'center', ...style}}>
			{lines.map((ln, li) => (
				<div key={li} style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: size, lineHeight: `${lh}px`, color}}>
					{ln.split(' ').map((w, wi) => {
						const t0 = (idx++ / wordsPerSec) * 30;
						const o = interpolate(age, [t0, t0 + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
						const bl = interpolate(age, [t0, t0 + 6], [10, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
						return (
							<span key={wi} style={{opacity: o, filter: bl > 0.2 ? `blur(${bl}px)` : undefined, display: 'inline-block', marginRight: '0.26em'}}>
								{w}
							</span>
						);
					})}
				</div>
			))}
			{source ? (
				<div
					style={{
						marginTop: 34,
						fontFamily: F.mono,
						fontSize: 26,
						letterSpacing: '0.24em',
						color: C.boneDim,
						textTransform: 'uppercase',
						opacity: interpolate(age, [srcAt, srcAt + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					}}
				>
					{source}
				</div>
			) : null}
		</div>
	);
};

/** Jahreszahl, die hoch- oder herunterzählt */
export const Counter: React.FC<Common & {from: number; to: number; frames: number; size?: number; suffix?: string; color?: string}> = ({
	from, to, frames, at = 0, y, size = 300, suffix = '', color = C.bone, style,
}) => {
	const frame = useCurrentFrame();
	const age = frame - at;
	if (age < 0) return null;
	const p = Easing.out(Easing.exp)(Math.min(1, age / frames));
	const v = Math.round(from + (to - from) * p);
	return (
		<div style={{...centered(y), fontFamily: F.slam, fontSize: size, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', ...style}}>
			{v}
			{suffix}
		</div>
	);
};
