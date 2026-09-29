import {Composition} from 'remotion';
import {MfitReel, type MfitReelProps} from './MfitReel';
import {DURATION} from './timing';
import {FPS, HEIGHT, WIDTH} from './video';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="MfitReel"
		component={MfitReel}
		durationInFrames={DURATION}
		fps={FPS}
		width={WIDTH}
		height={HEIGHT}
		defaultProps={{showSafeZone: false, withAudio: true, hd: false} satisfies MfitReelProps}
	/>
);
