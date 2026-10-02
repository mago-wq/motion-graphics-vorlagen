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
					width: kind === 'ember' ? size * 3 : size * 1.4,
					height: kind === 'ember' ? size * 3 : size * 1.4,
					borderRadius: '50%',
					// weicher Rand über Verlauf – billiger als box-shadow oder CSS blur()
					background: kind === 'ember'
						? 'radial-gradient(circle, #ffd2a0 0%, #ff7a2a 35%, rgba(255,90,20,0.35) 60%, rgba(255,90,20,0) 72%)'
						: 'radial-gradient(circle, rgba(238,243,248,1) 0%, rgba(238,243,248,0.85) 45%, rgba(238,243,248,0) 72%)',
					opacity: flicker,
				}}
			/>,
		);
	}
	return <AbsoluteFill style={{opacity: fadeIn * fadeOut, pointerEvents: 'none'}}>{items}</AbsoluteFill>;
};
