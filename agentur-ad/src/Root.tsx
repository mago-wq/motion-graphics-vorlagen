import {Composition} from 'remotion';
import {AgenturAd} from './AgenturAd';
import {DURATION, FPS, HEIGHT, WIDTH} from './video';

export const RemotionRoot: React.FC = () => (
	<Composition id="AgenturAd" component={AgenturAd} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
