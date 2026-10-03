// Ebenen über dem Bild: Filmkorn, Vignette, Blitz/Lichtleck bei Treffern, Funken.
import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPARKS, STRAHLEN} from '../config';
import {clamp, hits} from '../fx';
import {FPS, fr} from '../timing';

export const Grain: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: 0.085, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<svg width="100%" height="100%">
				<filter id="korn">
					<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={frame % 24} />
				</filter>
				<rect width="100%" height="100%" filter="url(#korn)" />
			</svg>
		</AbsoluteFill>
	);
};

export const Vignette: React.FC = () => (
	<AbsoluteFill
		style={{
			background:
				'radial-gradient(ellipse 78% 60% at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 78%, rgba(0,0,0,0.88) 100%)',
		}}
	/>
);

/** Weißer/goldener Blitz plus warmes Lichtleck vom Rand, gesteuert von TREFFER. */
export const Blitz: React.FC = () => {
	const frame = useCurrentFrame();
	const h = hits(frame);
	if (h.flash < 0.01) return null;
	return (
		<>
			<AbsoluteFill style={{background: h.farbe, opacity: Math.min(1, h.flash * 0.85), mixBlendMode: 'screen'}} />
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 70% 45% at ${30 + (frame % 7) * 6}% 18%, ${h.farbe}, rgba(0,0,0,0) 70%)`,
					opacity: Math.min(1, h.flash * 1.2),
					mixBlendMode: 'screen',
				}}
			/>
		</>
	);
};

/** Funkenregen (Clip 3463, schwarzer Grund) aufgehellt eingerechnet. */
export const Funken: React.FC = () => (
	<>
		{SPARKS.map(([von, bis, staerke], i) => (
			<Sequence key={i} from={fr(von)} durationInFrames={fr(bis) - fr(von)} name={`Funken ${von}`}>
				<FunkenEbene laenge={(bis - von) * FPS} staerke={staerke} offset={i * 2.5} />
			</Sequence>
		))}
	</>
);

const FunkenEbene: React.FC<{laenge: number; staerke: number; offset: number}> = ({laenge, staerke, offset}) => {
	const frame = useCurrentFrame();
	const o = interpolate(frame, [0, 4, laenge - 6, laenge], [0, 1, 1, 0], clamp) * staerke;
	return (
		<AbsoluteFill style={{mixBlendMode: 'screen', opacity: o}}>
			<OffthreadVideo src={staticFile('clips/3463.mp4')} trimBefore={Math.round(offset * FPS)} muted
				style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.3) saturate(1.2)'}} />
		</AbsoluteFill>
	);
};

/** Zickzack-Linie nach unten, zufällig aber reproduzierbar (seed). */
const zickzack = (seed: string, x: number, y: number, bis: number, streu: number, schritt: number) => {
	const pts: [number, number][] = [[x, y]];
	let i = 0;
	while (y < bis) {
		y += schritt * (0.6 + random(`${seed}y${i}`) * 0.8);
		x += (random(`${seed}x${i}`) - 0.5) * streu;
		pts.push([x, y]);
		i++;
	}
	return pts;
};

const toPath = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L');

/** Gezeichneter Blitzstrahl mit Verästelungen, flackert 7 Frames lang (STRAHLEN in config.ts). */
export const Strahlen: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<>
			{STRAHLEN.map(([at, xp, seed]) => {
				const d = frame - Math.round(at * FPS);
				if (d < 0 || d > 6) return null;
				const o = [1, 0.85, 0.12, 0.7, 0.3, 0.12, 0.04][d];
				const stamm = zickzack(seed, xp * 10.8, -30, 1100 + random(`${seed}e`) * 300, 120, 55);
				const aeste = [0.25, 0.45, 0.6].map((k, j) => {
					const [bx, by] = stamm[Math.floor(stamm.length * k)];
					const dir = random(`${seed}r${j}`) > 0.5 ? 1 : -1;
					return zickzack(`${seed}a${j}`, bx, by, by + 220 + random(`${seed}l${j}`) * 260, 90, 38).map(
						([x, y], n) => [x + dir * n * 22, y] as [number, number],
					);
				});
				return (
					<AbsoluteFill key={seed} style={{mixBlendMode: 'screen', opacity: o}}>
						<svg width={1080} height={1920}>
							<defs>
								<filter id={`gl${seed}`} x="-50%" y="-10%" width="200%" height="120%">
									<feGaussianBlur stdDeviation="14" result="b" />
									<feMerge>
										<feMergeNode in="b" />
										<feMergeNode in="b" />
										<feMergeNode in="SourceGraphic" />
									</feMerge>
								</filter>
							</defs>
							<g filter={`url(#gl${seed})`} fill="none" strokeLinejoin="round" strokeLinecap="round">
								<path d={toPath(stamm)} stroke="#e8f0ff" strokeWidth={7} />
								{aeste.map((a, j) => (
									<path key={j} d={toPath(a)} stroke="#cfe0ff" strokeWidth={3} strokeOpacity={0.85} />
								))}
							</g>
						</svg>
					</AbsoluteFill>
				);
			})}
		</>
	);
};
