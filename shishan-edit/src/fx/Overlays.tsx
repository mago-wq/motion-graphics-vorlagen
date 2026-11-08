// Globale Ebenen: Vignette, Blitze, Zeilenraster, „Schmelz“-Verzerrung, Kamerawackler.
// (Filmkorn kommt erst beim Muxen per ffmpeg dazu – im Browser wäre es pro Frame zu teuer.)
import {AbsoluteFill, random} from 'remotion';
import {lastHit} from '../timeline';

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse 80% 64% at 50% 47%, rgba(0,0,0,0) 48%, rgba(0,0,0,${strength}) 100%)`,
			pointerEvents: 'none',
		}}
	/>
);

/** Fernseh-Zeilen (Referenz Frame 433/449/466): grobe waagerechte Linien, leicht versetzt */
export const Scanlines: React.FC<{frame: number; strength?: number}> = ({frame, strength = 0.6}) => {
	const off = Math.floor(random(`scan-${frame}`) * 6);
	return (
		<AbsoluteFill
			style={{
				backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,${strength}) 0px, rgba(0,0,0,${strength}) 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 6px)`,
				backgroundPosition: `0 ${off}px`,
				mixBlendMode: 'multiply',
			}}
		/>
	);
};

/** SVG-Filter für die „Schmelz“-Frames (Referenz Frame 15–19): Rauschen verschiebt das Bild in Blasen */
export const BlobFilter: React.FC<{frame: number; scale: number}> = ({frame, scale}) => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<filter id="blob" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
			<feTurbulence type="fractalNoise" baseFrequency="0.0065 0.0095" numOctaves={2} seed={frame % 97} result="n" />
			<feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
		</filter>
	</svg>
);

/** Kamerawackler und Druckstoß aus den Treffern der Tonspur */
export const hitTransform = (frame: number) => {
	const h = lastHit(frame, ['boom', 'dum', 'soft', 'pickup']);
	if (!h) return '';
	const age = frame - h.frame;
	const [amp, len, punch] =
		h.kind === 'boom' ? [34, 13, 0.075] : h.kind === 'dum' ? [13, 7, 0.035] : h.kind === 'soft' ? [7, 5, 0.02] : [5, 4, 0.012];
	if (age >= len) return '';
	const k = Math.exp(-age / (len / 3.2));
	const x = (random(`sx${frame}`) - 0.5) * 2 * amp * k;
	const y = (random(`sy${frame}`) - 0.5) * 2 * amp * k;
	const r = (random(`sr${frame}`) - 0.5) * 2 * amp * k * 0.025;
	const s = 1 + punch * Math.exp(-age / 2.2);
	return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`;
};
