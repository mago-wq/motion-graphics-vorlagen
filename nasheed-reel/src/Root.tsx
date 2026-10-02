import {Composition} from 'remotion';
import {DURATION_S, FPS} from './config';
import {NasheedReel} from './NasheedReel';
import './fonts';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="NasheedReel"
		component={NasheedReel}
		durationInFrames={Math.round(DURATION_S * FPS)}
		fps={FPS}
		width={1080}
		height={1920}
	/>
);
