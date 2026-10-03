import {Composition} from 'remotion';
import {AsmuEdit} from './AsmuEdit';
import {DURATION_FRAMES, FPS} from './timing';
import './fonts';

export const RemotionRoot: React.FC = () => (
	<Composition id="AsmuEdit" component={AsmuEdit} durationInFrames={DURATION_FRAMES} fps={FPS} width={1080} height={1920} />
);
