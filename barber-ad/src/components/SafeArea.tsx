// Container exakt in der Sicherheitszone (x 80–1000, y 250–1500).
import type {CSSProperties} from 'react';
import {SAFE} from '../video';

export const SafeArea: React.FC<{children: React.ReactNode; style?: CSSProperties}> = ({children, style}) => (
	<div
		style={{
			position: 'absolute',
			left: SAFE.left,
			top: SAFE.top,
			width: SAFE.width,
			height: SAFE.height,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			...style,
		}}
	>
		{children}
	</div>
);
