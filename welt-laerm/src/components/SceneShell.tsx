// Rahmen jeder Szene: Lichtkegel, langsame Kamerafahrt, leuchtende Bildebene, Untertitel.
import type {ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {Line} from '../config';
import {easeInOut, tween} from '../motion';
import type {SceneTiming} from '../timing';
import {HEIGHT, WIDTH} from '../video';
import {Spotlight} from './Atmosphere';
import {Glow} from './Glow';
import {Subtitle} from './Subtitle';

export const SceneShell: React.FC<{
	line: Line;
	timing: SceneTiming;
	level: number;
	color: string;
	subtitle?: {top?: number; fontSize?: number};
	spotlightY?: number;
	/** Bildebene als SVG im Videoformat (1080×1920). */
	children: ReactNode;
	/** Ebene ohne Leuchten, z. B. schwarze Silhouetten vor hellem Licht. */
	overlay?: ReactNode;
}> = ({line, timing, level, color, subtitle, spotlightY, children, overlay}) => {
	const frame = useCurrentFrame();
	const push = tween(frame, timing.from, timing.to, 1, 1.05, easeInOut);
	return (
		<AbsoluteFill>
			<Spotlight level={level} color={color} y={spotlightY} />
			<AbsoluteFill style={{opacity: level, transform: `scale(${push})`, transformOrigin: '50% 58%'}}>
				<Glow color={color}>
					<svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
						{children}
					</svg>
				</Glow>
				{overlay && (
					<svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{position: 'absolute', inset: 0}}>
						{overlay}
					</svg>
				)}
			</AbsoluteFill>
			<Subtitle line={line} timing={timing} level={level} color={color} {...subtitle} />
		</AbsoluteFill>
	);
};
