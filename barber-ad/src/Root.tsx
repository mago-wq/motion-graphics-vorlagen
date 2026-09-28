import {Composition} from 'remotion';
import {BarberAd, type BarberAdProps} from './BarberAd';
import {DURATION, FPS, HEIGHT, WIDTH} from './video';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="BarberAd"
		component={BarberAd}
		durationInFrames={DURATION}
		fps={FPS}
		width={WIDTH}
		height={HEIGHT}
		defaultProps={{showSafeZone: false} satisfies BarberAdProps}
	/>
);
