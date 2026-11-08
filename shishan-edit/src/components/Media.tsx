// Eine Einstellung: Bild oder Clip, formatfüllend (oder als Band/Dreifachband), mit Kamerafahrt,
// Look-Filter und Helligkeitsflackern pro Frame (wie die Referenz). Wird in einer <Sequence>
// gerendert – useCurrentFrame() zählt also ab Beginn der Einstellung.
import {AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, random, useCurrentFrame} from 'remotion';
import {aspectOf, clipSrc, cutSrc, imgSrc, isClip} from '../assets';
import {FILTER, type Look} from '../look';
import {HEIGHT, WIDTH} from '../video';

export type Cam = {
	/** Zoom am Anfang/Ende (1 = füllt gerade so) */
	z0: number;
	z1: number;
	/** Bildpunkt (0–1), der in der Mitte liegen soll – Anfang und Ende */
	x0: number;
	y0: number;
	x1?: number;
	y1?: number;
	/** Drehung in Grad, Anfang/Ende */
	r0?: number;
	r1?: number;
	ease?: 'lin' | 'out' | 'in' | 'inout';
};

export type Layout = 'full' | 'band' | 'square' | 'triple';

export type ShotSpec = {
	from: number;
	to: number;
	key: string;
	look: Look;
	cam: Cam;
	layout?: Layout;
	/** Clip: Startpunkt in Sekunden und Abspielrate */
	clipAt?: number;
	speed?: number;
	/** Freisteller über den hinteren Wörtern („Text hinter dem Motiv“) – gleiche Kamera wie das Bild */
	fg?: boolean;
	/** Nur der Freisteller, auf Schwarz (Hintergrund des Fotos fällt weg) */
	cutOnly?: boolean;
	/** Oberen Bildteil (Himmel) abdunkeln, 0–1 */
	burn?: number;
	/** Helligkeitsflackern (0 = aus) */
	flicker?: number;
	/** Look-Flackern wie in der Referenz (dasselbe Bild springt für 1–2 Frames in einen anderen Look) */
	alt?: Look[];
	altP?: number;
	/** Deckkraft (für Überblendungen von Ebenen wie Nebel/Funken) */
	opacity?: number;
	blend?: React.CSSProperties['mixBlendMode'];
};

const EASE = {
	lin: (t: number) => t,
	out: Easing.out(Easing.cubic),
	in: Easing.in(Easing.cubic),
	inout: Easing.inOut(Easing.cubic),
};

/** Rahmen, der eine Box (bw×bh) bei Zoom z füllt und Bildpunkt (fx, fy) mittig hält, ohne Ränder zu zeigen */
export const coverBox = (aspect: number, bw: number, bh: number, z: number, fx: number, fy: number, free = false) => {
	let w: number;
	let h: number;
	if (aspect > bw / bh) {
		h = bh * z;
		w = h * aspect;
	} else {
		w = bw * z;
		h = w / aspect;
	}
	// free: Freisteller auf Schwarz – darf kleiner als das Bild sein und frei stehen
	const left = free ? bw / 2 - fx * w : Math.min(0, Math.max(bw - w, bw / 2 - fx * w));
	const top = free ? bh / 2 - fy * h : Math.min(0, Math.max(bh - h, bh / 2 - fy * h));
	return {left, top, width: w, height: h};
};

export const camAt = (cam: Cam, p: number) => {
	const e = EASE[cam.ease ?? 'out'](Math.min(1, Math.max(0, p)));
	return {
		z: cam.z0 + (cam.z1 - cam.z0) * e,
		x: cam.x0 + ((cam.x1 ?? cam.x0) - cam.x0) * e,
		y: cam.y0 + ((cam.y1 ?? cam.y0) - cam.y0) * e,
		r: (cam.r0 ?? 0) + ((cam.r1 ?? cam.r0 ?? 0) - (cam.r0 ?? 0)) * e,
	};
};

const flickerFilter = (seed: string, frame: number, amount: number) => {
	if (!amount) return '';
	const b = 1 + (random(`fl-${seed}-${frame}`) - 0.5) * 2 * amount;
	return ` brightness(${b.toFixed(3)})`;
};

/** Look dieses Frames: meist der Grund-Look, gelegentlich (je 2 Frames) einer der Alternativen */
const lookAt = (spec: ShotSpec, local: number): Look => {
	if (!spec.alt?.length || local < 2) return spec.look;
	const block = Math.floor(local / 2);
	const r = random(`alt-${spec.key}-${spec.from}-${block}`);
	if (r >= (spec.altP ?? 0.3)) return spec.look;
	const l = spec.alt[Math.floor(random(`alti-${spec.key}-${spec.from}-${block}`) * spec.alt.length)];
	// Clips haben keine vorgerechneten Looks
	return isClip(spec.key) && (l === 'red' || l === 'half') ? 'hard' : l;
};

/** Medium in einer Box – Bild, Freisteller oder Clip */
const MediaBox: React.FC<{
	spec: ShotSpec;
	bw: number;
	bh: number;
	local: number;
	variant?: 'base' | 'cut';
	timeOffset?: number;
	mirror?: boolean;
}> = ({spec, bw, bh, local, variant = 'base', timeOffset = 0, mirror}) => {
	const dur = Math.max(1, spec.to - spec.from);
	const c = camAt(spec.cam, local / dur);
	const box = coverBox(aspectOf(spec.key), bw, bh, c.z, c.x, c.y, Boolean(spec.cutOnly));
	const look = lookAt(spec, local);
	const filter = (variant === 'cut' ? FILTER[look === 'red' || look === 'half' ? 'ink' : look] : FILTER[look]) +
		flickerFilter(spec.key, spec.from + local, spec.flicker ?? 0.09);
	const style: React.CSSProperties = {
		position: 'absolute',
		left: box.left,
		top: box.top,
		width: box.width,
		height: box.height,
		filter,
		transform: `${mirror ? 'scaleX(-1) ' : ''}`,
	};
	const rot = c.r ? `rotate(${c.r}deg)` : undefined;
	if (variant === 'cut') {
		return (
			<AbsoluteFill style={{transform: rot, overflow: 'hidden'}}>
				<Img src={cutSrc(spec.key)} style={style} />
			</AbsoluteFill>
		);
	}
	if (isClip(spec.key)) {
		return (
			<AbsoluteFill style={{transform: rot, overflow: 'hidden'}}>
				<OffthreadVideo
					src={clipSrc(spec.key)}
					trimBefore={Math.round(((spec.clipAt ?? 0) + timeOffset) * 30)}
					playbackRate={spec.speed ?? 1}
					muted
					style={{...style, objectFit: 'fill'}}
				/>
			</AbsoluteFill>
		);
	}
	return (
		<AbsoluteFill style={{transform: rot, overflow: 'hidden'}}>
			<Img src={imgSrc(spec.key, look)} style={style} />
		</AbsoluteFill>
	);
};

/** Ganze Einstellung je nach Layout */
export const Shot: React.FC<{spec: ShotSpec; variant?: 'base' | 'cut'}> = ({spec, variant: v = 'base'}) => {
	const local = useCurrentFrame();
	const layout = spec.layout ?? 'full';
	const variant = spec.cutOnly ? 'cut' : v;
	const wrap: React.CSSProperties = {opacity: spec.opacity ?? 1, mixBlendMode: spec.blend};
	if (layout === 'full') {
		return (
			<AbsoluteFill style={wrap}>
				<MediaBox spec={spec} bw={WIDTH} bh={HEIGHT} local={local} variant={variant} />
				{spec.burn && variant === 'base' ? (
					<AbsoluteFill
						style={{background: `linear-gradient(180deg, rgba(0,0,0,${spec.burn}) 0%, rgba(0,0,0,${spec.burn * 0.85}) 22%, rgba(0,0,0,0) 48%)`}}
					/>
				) : null}
			</AbsoluteFill>
		);
	}
	if (layout === 'band' || layout === 'square') {
		const bh = layout === 'band' ? Math.round(WIDTH * 0.68) : WIDTH;
		// Band öffnet sich in den ersten 4 Frames von der Mitte aus (wie ein Schlitz)
		const open = interpolate(local, [0, 4], [0.15, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
		const h = bh * open;
		return (
			<AbsoluteFill style={wrap}>
				<div style={{position: 'absolute', left: 0, top: (HEIGHT - h) / 2, width: WIDTH, height: h, overflow: 'hidden'}}>
					<div style={{position: 'absolute', left: 0, top: -(bh - h) / 2, width: WIDTH, height: bh}}>
						<MediaBox spec={spec} bw={WIDTH} bh={bh} local={local} variant={variant} />
					</div>
				</div>
			</AbsoluteFill>
		);
	}
	// Dreifachband: drei Streifen untereinander, leicht zeitversetzt, der mittlere gespiegelt
	const gap = 8;
	const bh = (HEIGHT - 2 * gap) / 3;
	return (
		<AbsoluteFill style={wrap}>
			{[0, 1, 2].map((i) => {
				const appear = local >= i * 2; // Streifen erscheinen nacheinander (je 2 Frames)
				if (!appear) return null;
				return (
					<div key={i} style={{position: 'absolute', left: 0, top: i * (bh + gap), width: WIDTH, height: bh, overflow: 'hidden'}}>
						<MediaBox spec={spec} bw={WIDTH} bh={bh} local={local} timeOffset={i * 0.22} mirror={i === 1} />
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
