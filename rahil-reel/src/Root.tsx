import {Composition} from 'remotion';
import {DURATION_S, FPS} from './config';
import {RahilReel} from './RahilReel';
import './fonts';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="RahilReel"
		component={RahilReel}
		durationInFrames={Math.round(DURATION_S * FPS)}
		fps={FPS}
		width={1080}
		height={1920}
	/>
);
