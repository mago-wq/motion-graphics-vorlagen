import {ThreeCanvas} from '@remotion/three';
import {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useVideoConfig} from 'remotion';
import {config} from './config';
import {fontsReady} from './fonts';
import {Texte} from './overlay/Texte';
import {Szene} from './szene/Szene';

/** Hält das Rendern an, bis die Schriften da sind (Etikett und fitText messen damit). */
const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
	const [handle] = useState(() => delayRender('Schriften laden'));
	const [bereit, setBereit] = useState(false);
	useEffect(() => {
		fontsReady.then(() => {
			setBereit(true);
			continueRender(handle);
		});
	}, [handle]);
	return bereit ? <>{children}</> : null;
};

export const Produkt3D: React.FC = () => {
	const {width, height} = useVideoConfig();
	const {farben} = config;
	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(ellipse 70% 45% at 50% 46%, ${farben.etikett} 0%, ${farben.hintergrund} 70%)`,
			}}
		>
			<FontGate>
				<ThreeCanvas
					width={width}
					height={height}
					shadows
					camera={{fov: 30, position: [0, 0.6, 14.4], near: 0.1, far: 100}}
					gl={{antialias: true, preserveDrawingBuffer: true}}
				>
					<Szene />
				</ThreeCanvas>
				<Texte />
			</FontGate>
		</AbsoluteFill>
	);
};
