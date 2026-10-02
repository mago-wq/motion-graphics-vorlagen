import {Composition} from 'remotion';
import {DURATION, FPS, HEIGHT, WIDTH} from './video';
import {WeltLaerm} from './WeltLaerm';

export const RemotionRoot: React.FC = () => (
	<Composition id="WeltLaerm" component={WeltLaerm} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
