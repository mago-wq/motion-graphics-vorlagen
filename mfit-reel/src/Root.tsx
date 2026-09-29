import {Composition, Still} from 'remotion';
import {MfitReel, type MfitReelProps} from './MfitReel';
import {StilFigur} from './story/StilFigur';
import {StilHandy} from './story/StilHandy';
import {DURATION} from './timing';
import {FPS, HEIGHT, WIDTH} from './video';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="MfitReel"
			component={MfitReel}
			durationInFrames={DURATION}
			fps={FPS}
			width={WIDTH}
			height={HEIGHT}
			defaultProps={{showSafeZone: false, withAudio: true, hd: false} satisfies MfitReelProps}
		/>
		{/* Stilbilder für das zweite Video (Figuren + Anmelde-Ablauf) */}
		<Still id="StilFigur" component={StilFigur} width={WIDTH} height={HEIGHT} />
		<Still id="StilHandy" component={StilHandy} width={WIDTH} height={HEIGHT} />
	</>
);
