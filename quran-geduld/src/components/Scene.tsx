// Rahmen jeder Bildszene: Lichtpegel (Flackern wie im Vorbild), langsame Kamerafahrt,
// Ebenen mit eigenem Leuchten (kalt-weiß oder warm).
import type {ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeInOut, lightLevel, tween} from '../motion';
import {HEIGHT, WIDTH} from '../video';
import {Glow} from './Glow';

export type SceneProps = {from: number; to: number; mark?: number};

/** Lichtpegel und lokale Zeit einer Szene. */
export const useScene = ({from, to}: SceneProps) => {
	const frame = useCurrentFrame();
	return {frame, f: frame - from, level: lightLevel(frame, from, to), len: to - from};
};

export const SceneShell: React.FC<{level: number; from: number; to: number; children: ReactNode}> = ({level, from, to, children}) => {
	const frame = useCurrentFrame();
	const push = tween(frame, from, to, 1, 1.045, easeInOut);
	return (
		<AbsoluteFill style={{opacity: level, transform: `scale(${push})`, transformOrigin: '50% 72%'}}>
			{children}
		</AbsoluteFill>
	);
};

/** Eine leuchtende SVG-Ebene im Videoformat. */
export const Layer: React.FC<{glow: string; strength?: number; opacity?: number; children: ReactNode}> = ({
	glow,
	strength = 1,
	opacity = 1,
	children,
}) => (
	<Glow color={glow} strength={strength} style={{opacity}}>
		<svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
			{children}
		</svg>
	</Glow>
);

/** Weicher Lichtfleck (ohne Glow-Filter), z. B. rotes oder warmes Leuchten hinter einem Zeichen. */
export const Halo: React.FC<{x: number; y: number; r: number; color: string; opacity: number}> = ({x, y, r, color, opacity}) => (
	<AbsoluteFill
		style={{
			opacity,
			background: `radial-gradient(circle ${r}px at ${x}px ${y}px, ${color}66 0%, ${color}22 45%, transparent 100%)`,
		}}
	/>
);
