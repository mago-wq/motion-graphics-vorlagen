// Neon-Leuchten: dreistufiger Schein um alles, was darin liegt.
import type {CSSProperties, ReactNode} from 'react';

export const glowFilter = (color: string, strength = 1) =>
	[
		`drop-shadow(0 0 ${4 * strength}px ${color})`,
		`drop-shadow(0 0 ${18 * strength}px ${color}cc)`,
		`drop-shadow(0 0 ${55 * strength}px ${color}66)`,
	].join(' ');

export const Glow: React.FC<{color: string; strength?: number; style?: CSSProperties; children: ReactNode}> = ({
	color,
	strength = 1,
	style,
	children,
}) => <div style={{position: 'absolute', inset: 0, filter: glowFilter(color, strength), ...style}}>{children}</div>;
