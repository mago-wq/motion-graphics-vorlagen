// „Aus dem Bild heraus“: das Bild steckt in einem Rahmen, die freigestellte Person ragt darüber hinaus.
// Optional steht ein riesiger Name HINTER der Person (Tiefe wie in den bekannten Edits).
import type {CSSProperties} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {F} from '../fonts';
import {C} from '../theme';
import {Fallback, GRADE, type Grade} from './Photo';

type Rect = {x: number; y: number; w: number; h: number};

export const PopOut: React.FC<{
	src: string | null;
	cut: string | null;
	/** Rahmen in px (1080×1920-Raster) */
	frameRect?: Rect;
	/** Bildgeometrie: Bild wird so skaliert/positioniert, dass das Gesicht über den Rahmen ragt */
	img: {x: number; y: number; w: number; h: number};
	grade?: Grade;
	/** Name hinter der Person */
	behind?: string;
	behindY?: number;
	behindSize?: number;
	behindCyr?: boolean;
	tilt?: number;
	/** Hintergrund: dasselbe Bild groß, dunkel und unscharf */
	bgDim?: number;
	zoom?: [number, number];
	noFrame?: boolean;
	style?: CSSProperties;
}> = ({
	src, cut, frameRect = {x: 120, y: 560, w: 840, h: 1000}, img, grade = 'paint', behind, behindY = 520, behindSize = 330,
	behindCyr = false, tilt = -2.5, bgDim = 0.55, zoom = [1, 1.06], noFrame = false, style,
}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	if (!src || !cut) return <Fallback />;
	const p = Easing.bezier(0.16, 1, 0.3, 1)(Math.min(1, frame / Math.max(1, durationInFrames - 1)));
	const z = interpolate(p, [0, 1], zoom) * (1 + 0.12 * Math.exp(-frame / 2.4));
	const cx = img.x + img.w / 2;
	const cy = img.y + img.h / 2;
	const T = `translate(${cx}px, ${cy}px) scale(${z}) rotate(${tilt * 0.3}deg) translate(${-cx}px, ${-cy}px)`;
	const imgStyle: CSSProperties = {position: 'absolute', left: img.x, top: img.y, width: img.w, height: img.h, objectFit: 'cover'};
	// Rahmen leicht gekippt: Eckpunkte für clip-path berechnen
	const r = frameRect;
	const rad = (tilt * Math.PI) / 180;
	const fcx = r.x + r.w / 2;
	const fcy = r.y + r.h / 2;
	const pts = [
		[-r.w / 2, -r.h / 2], [r.w / 2, -r.h / 2], [r.w / 2, r.h / 2], [-r.w / 2, r.h / 2],
	].map(([dx, dy]) => `${fcx + dx * Math.cos(rad) - dy * Math.sin(rad)}px ${fcy + dx * Math.sin(rad) + dy * Math.cos(rad)}px`);
	const frameIn = Easing.out(Easing.back(1.4))(Math.min(1, frame / 7));
	const filter = GRADE[grade] === 'none' ? undefined : GRADE[grade];
	const behindAge = frame;
	return (
		<AbsoluteFill style={{overflow: 'hidden', ...style}}>
			{/* Hintergrund: dasselbe Bild, groß, dunkel, unscharf */}
			<AbsoluteFill style={{filter: `${filter ?? ''} blur(18px) brightness(${1 - bgDim})`, transform: `scale(${1.25 + 0.05 * p})`}}>
				<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
			</AbsoluteFill>
			<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, rgba(110,7,16,0.35), rgba(0,0,0,0.65))`}} />
			{behind ? (
				<div
					style={{
						position: 'absolute',
						left: -40,
						right: -40,
						top: behindY,
						transform: `translateY(-50%) scale(${1 + 0.35 * Math.exp(-behindAge / 2)})`,
						textAlign: 'center',
						fontFamily: behindCyr ? F.cyr : F.slam,
						fontWeight: behindCyr ? 700 : 400,
						fontSize: behindSize,
						lineHeight: 0.9,
						color: C.bone,
						letterSpacing: '-0.01em',
						whiteSpace: 'nowrap',
						opacity: Math.min(1, behindAge / 2),
						filter: behindAge < 4 ? `blur(${10 * Math.exp(-behindAge / 1.2)}px)` : undefined,
					}}
				>
					{behind}
				</div>
			) : null}
			{/* Bild im Rahmen */}
			{!noFrame ? (
				<div style={{position: 'absolute', inset: 0, transform: `scale(${0.88 + 0.12 * frameIn})`, transformOrigin: `${fcx}px ${fcy}px`}}>
					<div style={{position: 'absolute', inset: 0, clipPath: `polygon(${pts.join(',')})`}}>
						<div style={{position: 'absolute', inset: 0, transform: T, filter}}>
							<Img src={staticFile(src)} style={imgStyle} />
						</div>
					</div>
					{/* Rahmenlinie */}
					<div
						style={{
							position: 'absolute',
							left: r.x,
							top: r.y,
							width: r.w,
							height: r.h,
							border: `7px solid ${C.bone}`,
							transform: `rotate(${tilt}deg)`,
							boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
						}}
					/>
				</div>
			) : null}
			{/* Freigestellte Person – nicht beschnitten, ragt über den Rahmen */}
			<div style={{position: 'absolute', inset: 0, transform: `${noFrame ? '' : `scale(${0.88 + 0.12 * frameIn}) `}`, transformOrigin: `${fcx}px ${fcy}px`}}>
				<div style={{position: 'absolute', inset: 0, transform: T, filter: `${filter ?? ''} drop-shadow(0 20px 40px rgba(0,0,0,0.7))`}}>
					<Img src={staticFile(cut)} style={imgStyle} />
				</div>
			</div>
		</AbsoluteFill>
	);
};
