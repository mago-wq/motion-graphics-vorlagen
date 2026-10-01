// Das ganze Video: Szenen nach globalem Frame, Übergänge, TV-Anmutung, Ton. Ab STILL_FROM steht das Bild (letzte halbe Sekunde).
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {SafeZoneOverlay} from './components/SafeZoneOverlay';
import {SoundTrack} from './components/SoundTrack';
import {VhsOverlay} from './components/VhsOverlay';
import {clamp} from './motion';
import {AberNochScene} from './scenes/AberNochScene';
import {AlleScene} from './scenes/AlleScene';
import {ClaimScene} from './scenes/ClaimScene';
import {CtaScene} from './scenes/CtaScene';
import {DemoScene} from './scenes/DemoScene';
import {HookScene} from './scenes/HookScene';
import {MagnesiumScene} from './scenes/MagnesiumScene';
import {PreisScene} from './scenes/PreisScene';
import {ProblemScene} from './scenes/ProblemScene';
import {RevealScene} from './scenes/RevealScene';
import {SCENES, STILL_FROM, TRANSITION_FRAMES, type SceneId} from './timing';
import {HEIGHT, WIDTH} from './video';

const COMPONENTS: Record<SceneId, React.FC<{frame: number}>> = {
	hook: HookScene,
	problem: ProblemScene,
	reveal: RevealScene,
	demo: DemoScene,
	magnesium: MagnesiumScene,
	claim: ClaimScene,
	aberNoch: AberNochScene,
	preis: PreisScene,
	alle: AlleScene,
	cta: CtaScene,
};

/** Stern mit 5 Zacken als clip-path, Radius r um die Bildmitte */
const starClip = (r: number, rot: number): string => {
	const pts = Array.from({length: 10}, (_, i) => {
		const a = (i / 10) * Math.PI * 2 - Math.PI / 2 + rot;
		const rr = i % 2 === 0 ? r : r * 0.45;
		return `${(WIDTH / 2 + rr * Math.cos(a)).toFixed(1)}px ${(HEIGHT / 2 + rr * Math.sin(a)).toFixed(1)}px`;
	});
	return `polygon(${pts.join(', ')})`;
};

const Static: React.FC<{frame: number; opacity: number}> = ({frame, opacity}) => (
	<AbsoluteFill style={{opacity, overflow: 'hidden', background: '#777'}}>
		<div style={{position: 'absolute', left: -Math.floor(random(`zx${frame}`) * 512), top: -Math.floor(random(`zy${frame}`) * 512), width: WIDTH + 512, display: 'flex', flexWrap: 'wrap', filter: 'contrast(2.2)'}}>
			{Array.from({length: 24}, (_, i) => (
				<Img key={i} src={staticFile('textur/rauschen.png')} style={{width: 512, height: 512}} />
			))}
		</div>
	</AbsoluteFill>
);

export const TeleshopAd: React.FC<{showSafeZone: boolean}> = ({showSafeZone}) => {
	const frame = Math.min(useCurrentFrame(), STILL_FROM);
	let idx = 0;
	SCENES.forEach((s, i) => {
		if (frame >= s.from) idx = i;
	});
	const scene = SCENES[idx];
	const prev = idx > 0 ? SCENES[idx - 1] : null;
	const Current = COMPONENTS[scene.id];
	const Prev = prev ? COMPONENTS[prev.id] : null;

	const len = TRANSITION_FRAMES[scene.in];
	const t = len > 0 ? interpolate(frame, [scene.from, scene.from + len], [0, 1], clamp) : 1;
	const active = t < 1;
	const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

	let currentStyle: React.CSSProperties = {};
	let prevStyle: React.CSSProperties = {};
	let showPrev = false;
	let overlay: React.ReactNode = null;

	if (active) {
		switch (scene.in) {
			case 'tvAn': {
				// Röhrenfernseher: erst ein heller Strich, der sich zur Fläche öffnet
				const sy = interpolate(t, [0, 0.55, 1], [0.004, 0.05, 1], clamp);
				const sx = interpolate(t, [0, 0.35], [0.25, 1], clamp);
				// Nur das Bild selbst leuchtet über; der Rand bleibt schwarz wie die Röhre
				currentStyle = {transform: `scale(${sx}, ${sy})`, filter: `brightness(${interpolate(t, [0, 1], [3, 1])})`};
				break;
			}
			case 'zapp':
				overlay = <Static frame={frame} opacity={interpolate(t, [0, 0.5, 1], [1, 0.8, 0], clamp)} />;
				currentStyle = {transform: `translateY(${(random(`zj${frame}`) - 0.5) * 60 * (1 - t)}px)`};
				break;
			case 'stern': {
				showPrev = true;
				const e = ease(t);
				currentStyle = {clipPath: starClip(e * 2300, e * 1.2)};
				break;
			}
			case 'wisch': {
				showPrev = true;
				const e = ease(t);
				prevStyle = {transform: `translateX(${-e * WIDTH}px) skewX(${e * 8}deg)`};
				currentStyle = {transform: `translateX(${(1 - e) * WIDTH}px) skewX(${(1 - e) * 8}deg)`};
				break;
			}
			case 'blitz':
				overlay = <AbsoluteFill style={{background: '#FFFFFF', opacity: 1 - t}} />;
				break;
			case 'cut':
				break;
		}
	}

	return (
		<AbsoluteFill style={{background: '#000000', overflow: 'hidden'}}>
			{showPrev && Prev ? (
				<AbsoluteFill style={prevStyle}>
					<Prev frame={frame} />
				</AbsoluteFill>
			) : null}
			<AbsoluteFill style={currentStyle}>
				<Current frame={frame} />
			</AbsoluteFill>
			{overlay}
			{scene.in === 'tvAn' && active ? null : <VhsOverlay frame={frame} strong={scene.id === 'problem'} />}
			{showSafeZone ? <SafeZoneOverlay /> : null}
			<SoundTrack />
		</AbsoluteFill>
	);
};
