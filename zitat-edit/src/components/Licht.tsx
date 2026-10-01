// Lichtlecks und Blitz im Intro (warm -> lila -> türkis -> weiß), wie bei einem
// Film-Übergang, und Lichtstrahlen durch die Wolken, sobald sich der Sturm legt.
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {curve, envelope} from '../motion';
import {DURATION, LEAKS, RUHE_AB} from '../timing';

type Leak = {frames: number[]; opacity: number[]};

const LeakLayer: React.FC<{
	leak: Leak;
	frame: number;
	color: string;
	from: [number, number];
	to: [number, number];
	size: number;
}> = ({leak, frame, color, from, to, size}) => {
	const opacity = curve(frame, leak.frames, leak.opacity);
	if (opacity <= 0.001) return null;
	const p = interpolate(frame, [leak.frames[0], leak.frames[leak.frames.length - 1]], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const x = from[0] + (to[0] - from[0]) * p;
	const y = from[1] + (to[1] - from[1]) * p;
	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(circle ${size}px at ${x}% ${y}%, ${color} 0%, ${color.replace(/[\d.]+\)$/, '0.35)')} 35%, transparent 70%)`,
				mixBlendMode: 'screen',
				opacity,
			}}
		/>
	);
};

export const Licht: React.FC = () => {
	const frame = useCurrentFrame();
	const blitz = curve(frame, LEAKS.blitz.frames, LEAKS.blitz.opacity);
	const strahlen = envelope(frame, [
		[RUHE_AB, 0],
		[RUHE_AB + 70, 0.8],
		[DURATION, 1],
	]);

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<LeakLayer leak={LEAKS.warm} frame={frame} color="rgba(255, 138, 64, 1)" from={[10, 8]} to={[42, 30]} size={1100} />
			<LeakLayer leak={LEAKS.lila} frame={frame} color="rgba(150, 72, 255, 1)" from={[85, 18]} to={[58, 52]} size={1200} />
			<LeakLayer leak={LEAKS.tuerkis} frame={frame} color="rgba(64, 255, 220, 1)" from={[15, 78]} to={[55, 46]} size={1100} />
			{blitz > 0.001 ? (
				<AbsoluteFill
					style={{
						background: 'radial-gradient(ellipse 70% 55% at 50% 40%, #ffffff 0%, rgba(235, 244, 255, 0.95) 45%, rgba(200, 220, 255, 0.7) 100%)',
						opacity: blitz,
					}}
				/>
			) : null}
			{strahlen > 0.001 ? (
				<AbsoluteFill
					style={{
						background: `repeating-conic-gradient(from ${196 + frame * 0.03}deg at 88% -12%, rgba(255, 236, 205, 0) 0deg, rgba(255, 236, 205, 0.16) 2.4deg, rgba(255, 236, 205, 0) 6deg)`,
						WebkitMaskImage: 'radial-gradient(ellipse 110% 70% at 88% 0%, #000 0%, transparent 75%)',
						maskImage: 'radial-gradient(ellipse 110% 70% at 88% 0%, #000 0%, transparent 75%)',
						filter: 'blur(5px)',
						mixBlendMode: 'screen',
						opacity: strahlen,
					}}
				/>
			) : null}
		</AbsoluteFill>
	);
};
