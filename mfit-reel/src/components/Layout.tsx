// Platzierung im 1080×1920-Bild: Inhalte horizontal mittig, vertikal über ihre Mitte gesetzt.
import type {CSSProperties} from 'react';

/** Setzt `children` horizontal zentriert, mit der vertikalen Mitte auf `y`. */
export const At: React.FC<{y: number; x?: number; children: React.ReactNode; style?: CSSProperties}> = ({
	y,
	x = 540,
	children,
	style,
}) => (
	<div
		style={{
			position: 'absolute',
			left: x - 540,
			width: 1080,
			top: y,
			display: 'flex',
			justifyContent: 'center',
			transform: 'translateY(-50%)',
			...style,
		}}
	>
		{children}
	</div>
);

/** Linksbündig ab `x`, vertikale Mitte auf `y`. */
export const AtLeft: React.FC<{y: number; x: number; children: React.ReactNode; style?: CSSProperties}> = ({
	y,
	x,
	children,
	style,
}) => (
	<div style={{position: 'absolute', left: x, top: y, transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', ...style}}>
		{children}
	</div>
);
