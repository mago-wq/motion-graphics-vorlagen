import {Composition} from 'remotion';
import {FontGate} from './components/FontGate';
import {Edit} from './Edit';
import {DURATION, FPS, HEIGHT, WIDTH} from './video';

const NokhchiEdit: React.FC = () => (
	<FontGate>
		<Edit />
	</FontGate>
);

export const RemotionRoot: React.FC = () => (
	<Composition id="NokhchiEdit" component={NokhchiEdit} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
