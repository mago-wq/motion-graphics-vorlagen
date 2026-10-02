import {Composition} from 'remotion';
import {ZitatReel} from './ZitatReel';
import {DURATION, FPS, HEIGHT, WIDTH} from './video';

export const RemotionRoot: React.FC = () => (
	<Composition id="ZitatReel" component={ZitatReel} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
