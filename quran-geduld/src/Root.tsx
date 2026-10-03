import {Composition} from 'remotion';
import {DURATION, FPS, HEIGHT, WIDTH} from './video';
import {QuranGeduld} from './QuranGeduld';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="QuranGeduld" component={QuranGeduld} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
	</>
);
