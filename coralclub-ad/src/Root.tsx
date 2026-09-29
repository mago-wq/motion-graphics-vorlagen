import {Composition} from 'remotion';
import {CoralClubAd, type CoralClubAdProps} from './CoralClubAd';
import {DURATION, FPS, HEIGHT, WIDTH} from './video';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="CoralClubAd"
		component={CoralClubAd}
		durationInFrames={DURATION}
		fps={FPS}
		width={WIDTH}
		height={HEIGHT}
		defaultProps={{showSafeZone: false} satisfies CoralClubAdProps}
	/>
);
