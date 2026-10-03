// Auf- und Abblende über Schwarz. TikTok spielt in Schleife: Ende und Anfang treffen sich in Schwarz.
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {DURATION, FADE_OUT, INTRO} from '../timing';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Blende: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = Math.max(
		interpolate(frame, [0, INTRO.fadeIn], [1, 0], clamp),
		interpolate(frame, [FADE_OUT, DURATION - 1], [0, 1], clamp),
	);
	return opacity > 0 ? <AbsoluteFill style={{backgroundColor: '#000', opacity}} /> : null;
};
