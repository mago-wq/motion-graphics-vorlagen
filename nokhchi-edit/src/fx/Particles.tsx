// Glut (steigt auf, Krieg) und Schnee (fällt, 1944). Deterministisch über random(), also in jedem Render gleich.
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

export const Particles: React.FC<{kind: 'ember' | 'snow'; count?: number; from: number; to: number}> = ({kind, count = 70, from, to}) => {
	const frame = useCurrentFrame();
	if (frame < from || frame >= to) return null;
	const t = frame - from;
	const fadeIn = Math.min(1, t / 10);
	const fadeOut = Math.min(1, (to - frame) / 8);
	const items = [];
	for (let i = 0; i < count; i++) {
		const r = (k: string) => random(`${kind}${i}${k}`);
		const speed = kind === 'ember' ? 3 + r('s') * 7 : 1.4 + r('s') * 3.2;
		const size = kind === 'ember' ? 2 + r('z') * 5 : 2 + r('z') * 7;
		const sway = Math.sin((t + r('p') * 200) / (12 + r('w') * 20)) * (kind === 'ember' ? 30 : 46);
		const x = r('x') * 1180 - 50 + sway;
		const travel = (r('y') * 2100 + t * speed) % 2100;
		const y = kind === 'ember' ? 1980 - travel : travel - 80;
		const flicker = kind === 'ember' ? 0.45 + 0.55 * Math.abs(Math.sin((t + i * 7) / 3.1)) : 0.55 + r('o') * 0.45;
		items.push(
			<div
				key={i}
				style={{
					position: 'absolute',
					left: x,
					top: y,
					width: size,
					height: size,
					borderRadius: '50%',
					backgroundColor: kind === 'ember' ? '#ff7a2a' : '#eef3f8',
					boxShadow: kind === 'ember' ? `0 0 ${size * 3}px ${size}px rgba(255,90,20,0.55)` : 'none',
					filter: kind === 'snow' && size > 6 ? 'blur(2px)' : undefined,
					opacity: flicker,
				}}
			/>,
		);
	}
	return <AbsoluteFill style={{opacity: fadeIn * fadeOut, mixBlendMode: kind === 'ember' ? 'screen' : 'normal', pointerEvents: 'none'}}>{items}</AbsoluteFill>;
};
