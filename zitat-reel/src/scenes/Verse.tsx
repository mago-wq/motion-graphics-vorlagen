// Text über dem Bild: Original groß, Übersetzung kursiv darunter, mittig.
// Look aus den Referenzen: weiße Serifenschrift mit weichem Leuchten und leichter
// chromatischer Aberration (rot/cyan versetzt), Einblenden aus der Unschärfe.
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import type {Line} from '../config';
import {ARABIC_FONT, LATIN_FONT} from '../fonts';
import {FADE_IN, FADE_OUT, HIGHLIGHT_AT, type LineTiming} from '../timing';

const ease = Easing.bezier(0.22, 1, 0.36, 1);

/** 0→1 beim Einblenden ab `start`, 1→0 beim Ausblenden bis `end`. */
const presence = (frame: number, start: number, end: number) => {
	const fadeIn = interpolate(frame, [start, start + FADE_IN], [0, 1], {
		easing: ease,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const fadeOut = interpolate(frame, [end - FADE_OUT, end], [1, 0], {
		easing: Easing.in(Easing.cubic),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return Math.min(fadeIn, fadeOut);
};

const WARM = [255, 205, 140];

/** Teilt Text am Leuchtwort; das Wort bekommt Farbe und stärkeres Glühen. */
const WithHighlight: React.FC<{text: string; word?: string; glow: number}> = ({text, word, glow}) => {
	if (!word || !text.includes(word)) return <>{text}</>;
	const [before, after] = text.split(word);
	const c = WARM.map((v) => Math.round(255 + (v - 255) * glow)).join(',');
	return (
		<>
			{before}
			<span
				style={{
					color: `rgb(${c})`,
					textShadow: `0 0 ${18 + 26 * glow}px rgba(255,170,80,${0.15 + 0.55 * glow})`,
				}}
			>
				{word}
			</span>
			{after}
		</>
	);
};

/** Dreifach gezeichnet: rot links, cyan rechts, weiß obenauf -> Aberration. */
const Aberrated: React.FC<{children: React.ReactNode; offset: number; style: React.CSSProperties}> = ({
	children,
	offset,
	style,
}) => (
	<div style={{position: 'relative', ...style}}>
		<div style={{position: 'absolute', inset: 0, color: 'rgba(255,60,60,0.5)', transform: `translateX(${-offset}px)`, mixBlendMode: 'screen', textShadow: 'none'}}>
			{children}
		</div>
		<div style={{position: 'absolute', inset: 0, color: 'rgba(60,220,255,0.5)', transform: `translateX(${offset}px)`, mixBlendMode: 'screen', textShadow: 'none'}}>
			{children}
		</div>
		<div style={{position: 'relative'}}>{children}</div>
	</div>
);

export const Verse: React.FC<{line: Line; timing: LineTiming}> = ({line, timing}) => {
	const frame = useCurrentFrame();
	const a = presence(frame, timing.in, timing.out);
	const t = presence(frame, timing.translationIn, timing.out);
	if (a <= 0 && t <= 0) return null;

	const glow = line.highlight
		? interpolate(frame, [HIGHLIGHT_AT, HIGHLIGHT_AT + 36], [0, 1], {
				easing: ease,
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			})
		: 0;

	// Aberration klingt nach dem Einblenden auf einen Rest ab, wie bei den Referenzen
	const ab = 1.5 + 4 * (1 - a);

	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: '0 70px', paddingBottom: 90}}>
			<Aberrated
				offset={ab}
				style={{
					fontFamily: ARABIC_FONT,
					fontWeight: 700,
					fontSize: 112,
					lineHeight: 1.5,
					direction: 'rtl',
					textAlign: 'center',
					color: '#fbf7f0',
					textShadow: '0 0 22px rgba(255,236,210,0.38), 0 0 3px rgba(255,255,255,0.4)',
					opacity: a,
					filter: `blur(${(1 - a) * 14}px)`,
					transform: `translateY(${(1 - a) * 22}px)`,
				}}
			>
				<WithHighlight text={line.original} word={line.highlight?.original} glow={glow} />
			</Aberrated>
			<Aberrated
				offset={ab * 0.6}
				style={{
					marginTop: 6,
					fontFamily: LATIN_FONT,
					fontStyle: 'italic',
					fontWeight: 400,
					fontSize: 52,
					lineHeight: 1.25,
					textAlign: 'center',
					color: 'rgba(240,232,220,0.92)',
					textShadow: '0 0 16px rgba(255,236,210,0.3), 0 1px 2px rgba(0,0,0,0.6)',
					opacity: t,
					filter: `blur(${(1 - t) * 10}px)`,
					transform: `translateY(${(1 - t) * 14}px)`,
				}}
			>
				<WithHighlight text={line.translation} word={line.highlight?.translation} glow={glow} />
			</Aberrated>
		</AbsoluteFill>
	);
};

export const Source: React.FC<{text: string; start: number; end: number}> = ({text, start, end}) => {
	const frame = useCurrentFrame();
	const o = presence(frame, start, end);
	if (o <= 0) return null;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 90}}>
			<div
				style={{
					fontFamily: LATIN_FONT,
					fontWeight: 500,
					fontSize: 34,
					letterSpacing: '0.22em',
					textTransform: 'uppercase',
					color: 'rgba(240,232,220,0.8)',
					textShadow: '0 0 14px rgba(255,236,210,0.3)',
					opacity: o,
					filter: `blur(${(1 - o) * 8}px)`,
				}}
			>
				{text}
			</div>
		</AbsoluteFill>
	);
};

export const Handle: React.FC<{text: string}> = ({text}) => (
	<div
		style={{
			position: 'absolute',
			left: 48,
			bottom: 40,
			fontFamily: LATIN_FONT,
			fontWeight: 500,
			fontSize: 26,
			letterSpacing: '0.18em',
			color: 'rgba(240,232,220,0.42)',
			textShadow: '0 0 8px rgba(160,200,255,0.35)',
		}}
	>
		{text}
	</div>
);
