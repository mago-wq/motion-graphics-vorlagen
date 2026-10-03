// Hintergrund: Foto (oder Video) mit langsamer Kamerafahrt, kühler Sturm-Farbgebung
// und Vignette. Beim Blitz ein kurzer Stoß nach vorn, ab "VERGEBEN" wird es heller und wärmer.
import {noise2D} from '@remotion/noise';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {config} from '../config';
import {DURATION, INTRO, RUHE_AB} from '../timing';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Hintergrund: React.FC = () => {
	const frame = useCurrentFrame();

	// Langsame Fahrt nach vorn, dazu leichtes Schweben wie aus der Hand gefilmt
	const zoom = interpolate(frame, [0, DURATION], [1.06, 1.16]);
	const punch = frame >= INTRO.flash - 2 ? 0.045 * Math.exp(-(frame - INTRO.flash + 2) / 7) : 0;
	const dx = noise2D('x', frame / 110, 0) * 12;
	const dy = noise2D('y', frame / 110, 3) * 10;
	const rot = noise2D('r', frame / 140, 7) * 0.4;

	// Nach dem Sturm: etwas mehr Licht und Farbe
	const nachher = interpolate(frame, [RUHE_AB, RUHE_AB + 75], [0, 1], clamp);
	const filter = `saturate(${0.3 + 0.25 * nachher}) contrast(1.16) brightness(${0.7 + 0.1 * nachher})`;

	const media = config.bild.hintergrundVideo ? (
		<OffthreadVideo src={staticFile(config.bild.hintergrundVideo)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
	) : (
		<Img src={staticFile(config.bild.hintergrund)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
	);

	return (
		<AbsoluteFill style={{backgroundColor: '#0a0c10'}}>
			<AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${zoom + punch}) rotate(${rot}deg)`, filter}}>
				{media}
			</AbsoluteFill>
			{/* Kühler, dunkler Sturm-Ton (oben blaugrau, unten tiefer) */}
			<AbsoluteFill
				style={{
					background: 'linear-gradient(180deg, rgba(52, 66, 92, 0.55) 0%, rgba(30, 36, 48, 0.25) 55%, rgba(8, 10, 14, 0.6) 100%)',
					mixBlendMode: 'multiply',
					opacity: 1 - 0.35 * nachher,
				}}
			/>
			{/* Warmes Licht nach dem Sturm */}
			<AbsoluteFill
				style={{
					background: 'radial-gradient(ellipse 90% 60% at 70% 20%, rgba(255, 196, 140, 0.45), transparent 70%)',
					mixBlendMode: 'soft-light',
					opacity: nachher,
				}}
			/>
			{/* Vignette */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 62% at 50% 46%, transparent 52%, rgba(0, 0, 0, 0.62) 100%)'}} />
		</AbsoluteFill>
	);
};
