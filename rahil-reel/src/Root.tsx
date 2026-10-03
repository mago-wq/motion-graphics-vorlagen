import {Composition} from 'remotion';
import {DURATION_S, FPS} from './config';
import {RahilReel} from './RahilReel';
import {SommerReel} from './sommer/SommerReel';
import * as Sommer from './sommer/config';
import './fonts';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="RahilReel"
			component={RahilReel}
			durationInFrames={Math.round(DURATION_S * FPS)}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		{/* Gleicher Ton, andere Aussage: „und schon sind die Sommertage Vergangenheit“ */}
		<Composition
			id="SommerReel"
			component={SommerReel}
			durationInFrames={Math.round(Sommer.DURATION_S * Sommer.FPS)}
			fps={Sommer.FPS}
			width={1080}
			height={1920}
		/>
	</>
);
