// Alter Farbfilm wie im Vorbild: satte Farben mit tiefen Schwarztönen (Kodachrome-artig), Bildstehen-Wackeln,
// Helligkeitsflackern, Staub, gelegentlich ein senkrechter Kratzer. Das Korn kommt erst in
// scripts/render.sh per ffmpeg dazu (im Browser pro Frame zu teuer).
import type {CSSProperties} from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {F} from '../fonts';
import {BAND} from '../video';

export type Grade = 'film' | 'filmBw' | 'filmWarm' | 'dark' | 'none';

// Rückmeldung: nostalgischer, lebendiger, düsterer – wie das Vorbild (satt, tiefe Schwarztöne,
// türkiser Himmel, rötliche Wärme). Erste Fassung war zu blass und zu sepia.
const GRADE: Record<Grade, string> = {
	film: 'contrast(1.22) saturate(1.38) sepia(0.12) brightness(0.9)',
	// Schwarzweiß-Vorlagen: getönt wie abgefilmtes Material, Tiefen satt
	filmBw: 'grayscale(1) sepia(0.55) saturate(1.5) contrast(1.5) brightness(0.76)',
	filmWarm: 'contrast(1.2) saturate(1.25) sepia(0.32) brightness(0.86)',
	dark: 'contrast(1.35) saturate(1.2) sepia(0.25) brightness(0.62)',
	none: 'none',
};

/** Ein Bild im Filmstreifen mit langsamer Fahrt (Zoom um einen Fokuspunkt). */
export const Shot: React.FC<{
	src: string;
	/** Fokuspunkt im Bild (0–1) – bleibt im Zoom an seiner Stelle im Ausschnitt */
	focus?: [number, number];
	zoom?: [number, number];
	/** Verschiebung in px über die Einstellung */
	drift?: [number, number];
	dur: number;
	grade?: Grade;
	flip?: boolean;
	/** Kleine Vorlagen (≤ 750 px) leicht weichzeichnen – wirkt wie Film statt wie Pixel */
	soft?: boolean;
	style?: CSSProperties;
}> = ({src, focus = [0.5, 0.5], zoom = [1, 1.06], drift = [0, 0], dur, grade = 'film', flip, soft, style}) => {
	const fr = useCurrentFrame();
	const p = interpolate(fr, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const z = zoom[0] + (zoom[1] - zoom[0]) * p;
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<Img
				src={staticFile(src)}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`,
					transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`,
					transform: `translate(${drift[0] * p}px, ${drift[1] * p}px) scale(${z})${flip ? ' scaleX(-1)' : ''}`,
					filter: GRADE[grade] + (soft ? ' blur(0.9px)' : ''),
					...style,
				}}
			/>
		</AbsoluteFill>
	);
};

/** Filmstreifen: schneidet auf das 4:3-Band zu und legt die Filmfehler darüber. */
export const FilmBand: React.FC<{children: React.ReactNode}> = ({children}) => {
	const fr = useCurrentFrame();
	// Bildstand: kleine, ruckartige Verschiebung (wie ein Projektor), alle 2 Frames neu
	const k = Math.floor(fr / 2);
	const wx = (random(`wx${k}`) - 0.5) * 2.2;
	const wy = (random(`wy${k}`) - 0.5) * 3.2;
	const flick = 1 + (random(`fl${fr}`) - 0.5) * 0.06;
	return (
		<div style={{position: 'absolute', left: BAND.x, top: BAND.y, width: BAND.w, height: BAND.h, overflow: 'hidden', background: '#000'}}>
			<div style={{position: 'absolute', inset: -6, transform: `translate(${wx}px, ${wy}px)`, filter: `brightness(${flick})`}}>
				{children}
			</div>
			{/* Farbstich des alten Materials: oben türkis, unten rötlich-warm */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,120,130,0.28), rgba(150,60,40,0.22))', mixBlendMode: 'soft-light'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)'}} />
			<Dust />
		</div>
	);
};

const Dust: React.FC = () => {
	const fr = useCurrentFrame();
	const specks = [];
	const n = Math.floor(random(`dn${fr}`) * 4);
	for (let i = 0; i < n; i++) {
		const r = 1 + random(`dr${fr}-${i}`) * 3.5;
		const light = random(`dl${fr}-${i}`) > 0.6;
		specks.push(
			<div
				key={i}
				style={{
					position: 'absolute',
					left: random(`dx${fr}-${i}`) * BAND.w,
					top: random(`dy${fr}-${i}`) * BAND.h,
					width: r * (random(`dw${fr}-${i}`) > 0.8 ? 4 : 1),
					height: r,
					borderRadius: r,
					background: light ? 'rgba(255,250,235,0.75)' : 'rgba(10,8,6,0.8)',
					transform: `rotate(${random(`da${fr}-${i}`) * 180}deg)`,
				}}
			/>,
		);
	}
	// Senkrechter Kratzer: steht ein paar Sekunden an fast derselben Stelle, wie im Vorbild
	const seg = Math.floor(fr / 70);
	const showScratch = random(`ss${seg}`) > 0.45;
	const sx = random(`sx${seg}`) * BAND.w * 0.8 + BAND.w * 0.1 + Math.sin(fr * 0.7) * 1.5;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{specks}
			{showScratch && (
				<div style={{position: 'absolute', left: sx, top: 0, width: 1.6, height: '100%', background: 'rgba(170,230,210,0.35)'}} />
			)}
		</AbsoluteFill>
	);
};

/** Eingeblendetes Bildkästchen (Collage) – hart geschnitten, ohne Rahmen, wie im Vorbild. */
export const PopBox: React.FC<{
	src: string;
	x: number;
	y: number;
	w: number;
	h: number;
	focus?: [number, number];
	zoom?: number;
	grade?: Grade;
	word?: string;
	wordSize?: number;
	/** Frames bis zum Erscheinen (relativ zur Einstellung) */
	at: number;
}> = ({src, x, y, w, h, focus = [0.5, 0.5], zoom = 1, grade = 'dark', word, wordSize = 56, at}) => {
	const fr = useCurrentFrame();
	if (fr < at) return null;
	// 2 Frames leichtes Aufploppen
	const s = interpolate(fr - at, [0, 2], [1.06, 1], {extrapolateRight: 'clamp'});
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', transform: `scale(${s})`, background: '#000'}}>
			<Img
				src={staticFile(src)}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`,
					transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`,
					transform: `scale(${zoom})`,
					filter: GRADE[grade],
				}}
			/>
			{/* Wie im Vorbild: Motiv taucht aus Schwarz auf */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%)'}} />
			{word && (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
					<Outline size={wordSize} color="#fff" stroke="#000" width={3}>
						{word}
					</Outline>
				</AbsoluteFill>
			)}
		</div>
	);
};

/** Schmale, fette Großbuchstaben mit Kontur wie im Vorbild. */
export const Outline: React.FC<{
	children: React.ReactNode;
	size: number;
	color: string;
	stroke: string;
	width?: number;
	align?: 'left' | 'center' | 'right';
	style?: CSSProperties;
}> = ({children, size, color, stroke, width = 3, align = 'center', style}) => (
	<div
		style={{
			fontFamily: F.cond,
			fontWeight: 700,
			fontSize: size,
			lineHeight: 1.04,
			letterSpacing: -0.5,
			textTransform: 'uppercase',
			color,
			WebkitTextStroke: `${width}px ${stroke}`,
			paintOrder: 'stroke fill',
			textAlign: align,
			whiteSpace: 'pre',
			transform: 'scaleX(0.86)',
			...style,
		}}
	>
		{children}
	</div>
);
