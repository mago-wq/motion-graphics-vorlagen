// Ein Bild als Einstellung: Ausschnitt, Bewegung, Farbstimmung und Schnitt-Effekte.
// Wird immer innerhalb einer <Sequence> benutzt – Frame 0 ist der Schnitt.
import {useId} from 'react';
import type {CSSProperties} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export type Grade = 'paint' | 'bw' | 'warm' | 'cold' | 'blood' | 'none';

export const GRADE: Record<Grade, string> = {
	paint: 'contrast(1.2) saturate(0.7) sepia(0.18) brightness(0.9)',
	warm: 'contrast(1.25) saturate(0.55) sepia(0.3) brightness(0.9)',
	bw: 'grayscale(1) contrast(1.4) brightness(0.95) sepia(0.14)',
	cold: 'grayscale(0.9) contrast(1.2) brightness(0.7)',
	blood: 'grayscale(1) contrast(1.75) brightness(0.88)',
	none: 'none',
};

// Farbschicht über dem Bild je Stimmung
const TINT: Partial<Record<Grade, CSSProperties>> = {
	blood: {backgroundColor: '#c8141e', mixBlendMode: 'multiply', opacity: 0.85},
	cold: {backgroundColor: '#2b4766', mixBlendMode: 'soft-light', opacity: 0.9},
	warm: {backgroundColor: '#5a1a08', mixBlendMode: 'soft-light', opacity: 0.55},
};

export type PhotoProps = {
	/** Pfad unter public/ – null, wenn das Bild (noch) fehlt */
	src: string | null;
	/** Bildmitte des Ausschnitts (0–1), z. B. Gesicht */
	focus?: [number, number];
	/** Zoom von → bis über die Einstellung */
	zoom?: [number, number];
	/** Verschiebung in px über die Einstellung */
	drift?: [number, number];
	/** Zusatz-Zoom beim Schnitt, der in ~6 Frames abklingt („Punch-in“) */
	punch?: number;
	grade?: Grade;
	/** RGB-Versatz in px: konstant (rgb) bzw. beim Schnitt, abklingend (rgbIn) */
	rgb?: number;
	rgbIn?: number;
	/** Zoom-Schlieren beim Schnitt */
	trail?: boolean;
	/** Bildstörung (Streifen) in den ersten n Frames */
	glitch?: number;
	/** Rückwärts-Zoom (Bild „fällt weg“) für Bandstopp */
	fall?: boolean;
	contain?: boolean;
	rotate?: number;
	flip?: boolean;
	opacity?: number;
	blur?: number;
	style?: CSSProperties;
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Dunkler Grund, falls ein Bild fehlt */
export const Fallback: React.FC = () => (
	<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #2a0d10 0%, #060507 70%)'}} />
);

export const Photo: React.FC<PhotoProps> = ({
	src, focus = [0.5, 0.5], zoom = [1.04, 1.14], drift = [0, 0], punch = 0.14, grade = 'paint',
	rgb = 0, rgbIn = 0, trail = false, glitch = 0, fall = false, contain = false, rotate = 0, flip = false,
	opacity = 1, blur = 0, style,
}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const fid = `rgb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	if (!src) return <Fallback />;
	const p = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const pe = ease(p);
	let scale = interpolate(pe, [0, 1], zoom);
	scale *= 1 + punch * Math.exp(-frame / 2.2);
	if (fall) {
		const q = Easing.in(Easing.cubic)(p);
		scale *= 1 - 0.35 * q;
	}
	const tx = drift[0] * pe;
	const ty = drift[1] * pe;
	const split = rgb + rgbIn * Math.exp(-frame / 3);
	const fallBlur = fall ? 14 * Easing.in(Easing.cubic)(p) : 0;
	const imgStyle: CSSProperties = {
		position: 'absolute',
		inset: 0,
		width: '100%',
		height: '100%',
		objectFit: contain ? 'contain' : 'cover',
		objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`,
	};
	const url = staticFile(src);
	const layer = (s: number, o: number, key: string, extra?: CSSProperties) => (
		<div
			key={key}
			style={{
				position: 'absolute',
				inset: 0,
				transform: `translate(${tx}px, ${ty}px) scale(${s}) rotate(${rotate}deg) scaleX(${flip ? -1 : 1})`,
				transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`,
				opacity: o,
				...extra,
			}}
		>
			<Img src={url} style={imgStyle} />
		</div>
	);

	const layers = [layer(scale, 1, 'main')];
	if (trail && frame < 6) {
		for (let k = 1; k <= 4; k++) {
			layers.push(layer(scale * (1 + 0.045 * k * Math.exp(-frame / 2.5)), 0.32 / k, `t${k}`));
		}
	}
	if (glitch && frame < glitch) {
		for (let k = 0; k < 7; k++) {
			const top = random(`${src}gt${frame}${k}`) * 92;
			const h = 2 + random(`${src}gh${frame}${k}`) * 9;
			const dx = (random(`${src}gx${frame}${k}`) - 0.5) * 140;
			layers.push(
				<div key={`g${k}`} style={{position: 'absolute', inset: 0, clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - h)}% 0)`, transform: `translateX(${dx}px)`}}>
					{layer(scale * 1.02, 1, `gi${k}`)}
				</div>,
			);
		}
	}

	const filter = [GRADE[grade], split > 0.3 ? `url(#${fid})` : '', blur + fallBlur > 0 ? `blur(${blur + fallBlur}px)` : '']
		.filter((x) => x && x !== 'none')
		.join(' ');

	return (
		<AbsoluteFill style={{overflow: 'hidden', opacity, ...style}}>
			{split > 0.3 ? (
				<svg width={0} height={0} style={{position: 'absolute'}}>
					<filter id={fid} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
						<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
						<feOffset in="r" dx={split} dy={split * 0.15} result="r2" />
						<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
						<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
						<feOffset in="b" dx={-split} dy={-split * 0.15} result="b2" />
						<feBlend in="r2" in2="g" mode="screen" result="rg" />
						<feBlend in="rg" in2="b2" mode="screen" />
					</filter>
				</svg>
			) : null}
			<AbsoluteFill style={{filter: filter || undefined}}>{layers}</AbsoluteFill>
			{TINT[grade] ? <AbsoluteFill style={TINT[grade]} /> : null}
		</AbsoluteFill>
	);
};
