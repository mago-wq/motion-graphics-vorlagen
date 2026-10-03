// Globale Ebenen über allem: Vignette, Blitze auf Treffern, Kinobalken, Kamerawackler.
// (Filmkorn kommt erst beim Muxen per ffmpeg dazu – im Browser wäre es pro Frame zu teuer.)
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lastHit} from '../timeline';

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.85}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse 75% 62% at 50% 46%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
			pointerEvents: 'none',
		}}
	/>
);

/**
 * Blitz auf Treffern: Weiß bei schweren Schlägen, rot bei Stotterern.
 * Klingt in wenigen Frames ab – ein Frame voll, dann exponentiell.
 */
export const HitFlash: React.FC<{from: number; to: number}> = ({from, to}) => {
	const frame = useCurrentFrame();
	if (frame < from || frame >= to) return null;
	const h = lastHit(frame, ['boom', 'stutter']);
	if (!h || h.frame < from) return null;
	const age = frame - h.frame;
	const boom = h.kind === 'boom';
	const len = boom ? 7 : 3;
	if (age >= len) return null;
	const a = boom ? Math.exp(-age / 1.6) * 0.95 : (age === 0 ? 0.55 : 0.15);
	return <AbsoluteFill style={{backgroundColor: boom ? C.bone : C.red, opacity: a, mixBlendMode: boom ? 'screen' : 'normal'}} />;
};

/** Dum-Puls: Bild wird auf jedem Schlag kurz heller (fühlt sich an wie ein Druckstoß) */
export const BeatPulse: React.FC<{from: number; to: number; amount?: number}> = ({from, to, amount = 0.14}) => {
	const frame = useCurrentFrame();
	if (frame < from || frame >= to) return null;
	const h = lastHit(frame, ['dum', 'boom']);
	if (!h || h.frame < from) return null;
	const age = frame - h.frame;
	if (age > 6) return null;
	return <AbsoluteFill style={{backgroundColor: '#fff', opacity: amount * Math.exp(-age / 1.8), mixBlendMode: 'overlay'}} />;
};

/** Kinobalken, die hereinfahren (für die ruhigen, schweren Abschnitte) */
export const Letterbox: React.FC<{from: number; to: number; size?: number}> = ({from, to, size = 230}) => {
	const frame = useCurrentFrame();
	const inP = interpolate(frame, [from, from + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const outP = interpolate(frame, [to - 6, to], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const h = size * Math.min(inP, outP);
	if (h <= 0) return null;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', top: 0, left: 0, right: 0, height: h, backgroundColor: '#000'}} />
			<div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: h, backgroundColor: '#000'}} />
		</AbsoluteFill>
	);
};

/** Kamerawackler aus den Treffern: Boom stark und länger, Dum kurz und leicht */
export const useShake = (frame: number) => {
	const h = lastHit(frame, ['boom', 'dum', 'stutter']);
	if (!h) return '';
	const age = frame - h.frame;
	const [amp, len] = h.kind === 'boom' ? [34, 12] : h.kind === 'stutter' ? [10, 3] : [9, 5];
	if (age >= len) return '';
	const k = Math.exp(-age / (len / 3)) * amp;
	const x = (random(`sx${frame}`) - 0.5) * 2 * k;
	const y = (random(`sy${frame}`) - 0.5) * 2 * k;
	const r = (random(`sr${frame}`) - 0.5) * 2 * k * 0.03;
	const s = 1 + (h.kind === 'boom' ? 0.06 : 0.018) * Math.exp(-age / 2);
	return `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`;
};

