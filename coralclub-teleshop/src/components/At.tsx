// Element mittig auf einen Punkt setzen (x/y = Mittelpunkt), plus eigene Transformation.
import type {CSSProperties} from 'react';

export const At: React.FC<{
	x: number;
	y: number;
	transform?: string;
	opacity?: number;
	origin?: string;
	style?: CSSProperties;
	children: React.ReactNode;
}> = ({x, y, transform = '', opacity = 1, origin = '50% 50%', style, children}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			transform: `translate(-50%, -50%) ${transform}`,
			transformOrigin: origin,
			opacity,
			...style,
		}}
	>
		{children}
	</div>
);
