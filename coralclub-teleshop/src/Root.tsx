import {Composition} from 'remotion';
import {FontGate} from './components/FontGate';
import {TeleshopAd} from './TeleshopAd';
import {DURATION} from './timing';
import {FPS, HEIGHT, WIDTH} from './video';

const Video: React.FC<{showSafeZone: boolean}> = (props) => (
	<FontGate>
		<TeleshopAd {...props} />
	</FontGate>
);

export const RemotionRoot: React.FC = () => (
	<Composition
		id="CoralClubTeleshop"
		component={Video}
		durationInFrames={DURATION}
		fps={FPS}
		width={WIDTH}
		height={HEIGHT}
		defaultProps={{showSafeZone: false}}
	/>
);
