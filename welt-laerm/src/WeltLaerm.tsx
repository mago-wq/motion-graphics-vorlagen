// Gesamtvideo: Originalton, fünf Szenen nacheinander, Schmier-Blende am Ende.
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame} from 'remotion';
import {Grain, Vignette} from './components/Atmosphere';
import {FontGate} from './components/FontGate';
import {CONFIG} from './config';
import {easeInOut, tween} from './motion';
import {KruemelScene} from './scenes/KruemelScene';
import {LaermScene} from './scenes/LaermScene';
import {MuedeScene} from './scenes/MuedeScene';
import {ParadiesScene} from './scenes/ParadiesScene';
import {SattScene} from './scenes/SattScene';
import {SMEAR, STAR_OUT} from './timing';

/** Seitliches Verwischen: nur horizontale Unschärfe, wie eine schnelle Kameraschwenk-Spur. */
const Smear: React.FC<{children: React.ReactNode}> = ({children}) => {
	const frame = useCurrentFrame();
	const p = tween(frame, SMEAR.from, SMEAR.to, 0, 1, easeInOut);
	if (p === 0) return <>{children}</>;
	return (
		<AbsoluteFill>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="smear" x="-50%" y="0" width="200%" height="100%">
					<feGaussianBlur stdDeviation={`${p * 90} ${p * 2}`} />
				</filter>
			</svg>
			<AbsoluteFill style={{filter: 'url(#smear)', transform: `scaleX(${1 + p * 0.5})`, opacity: 1 - p * p}}>{children}</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** Nach der Blende bleibt ein warmer Lichtpunkt und verglimmt. */
const LastLight: React.FC = () => {
	const frame = useCurrentFrame();
	const appear = tween(frame, SMEAR.from + 8, SMEAR.to, 0, 1);
	const fade = tween(frame, STAR_OUT.from + 10, STAR_OUT.to, 1, 0, easeInOut);
	const o = appear * fade;
	if (o <= 0) return null;
	const warm = CONFIG.colors.warm;
	return (
		<AbsoluteFill style={{opacity: o}}>
			<div
				style={{
					position: 'absolute',
					left: 540 - 7,
					top: 1090 - 7,
					width: 14,
					height: 14,
					borderRadius: 7,
					background: '#fff8ea',
					boxShadow: `0 0 12px 4px ${warm}, 0 0 60px 20px ${warm}88, 0 0 160px 60px ${warm}33`,
					transform: `scale(${1 + 0.15 * Math.sin(frame / 5)})`,
				}}
			/>
		</AbsoluteFill>
	);
};

export const WeltLaerm: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: CONFIG.colors.background}}>
		<Html5Audio src={staticFile(CONFIG.audio.file)} volume={CONFIG.audio.volume} />
		<FontGate>
			<LaermScene />
			<SattScene />
			<MuedeScene />
			<KruemelScene />
			<Smear>
				<ParadiesScene />
			</Smear>
			<LastLight />
		</FontGate>
		<Vignette />
		<Grain />
	</AbsoluteFill>
);
