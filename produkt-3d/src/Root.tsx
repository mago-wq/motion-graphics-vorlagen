import {Composition} from 'remotion';
import {Produkt3D} from './Produkt3D';
import {DURATION, FPS, HEIGHT, WIDTH} from './video';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="Produkt3D"
		component={Produkt3D}
		durationInFrames={DURATION}
		fps={FPS}
		width={WIDTH}
		height={HEIGHT}
	/>
);
