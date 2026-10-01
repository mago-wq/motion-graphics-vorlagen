import {Composition} from 'remotion';
import {DURATION} from './timing';
import {FPS, HEIGHT, WIDTH} from './video';
import {ZitatEdit, type ZitatEditProps} from './ZitatEdit';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="ZitatEdit"
		component={ZitatEdit}
		durationInFrames={DURATION}
		fps={FPS}
		width={WIDTH}
		height={HEIGHT}
		defaultProps={{showSafeZone: false} satisfies ZitatEditProps}
	/>
);
