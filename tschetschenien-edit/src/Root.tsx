import {Composition} from 'remotion';
import {Edit} from './Edit';
import {DURATION} from './timing';
import {FPS, HEIGHT, WIDTH} from './video';

export const RemotionRoot: React.FC = () => (
	<Composition id="TschetschenienEdit" component={Edit} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
