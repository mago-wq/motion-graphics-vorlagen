import {AbsoluteFill, Composition, Html5Audio, staticFile} from 'remotion';
import {FontGate} from './components/FontGate';
import {C} from './theme';
import {DURATION, FPS, HEIGHT, WIDTH} from './video';

// Vorläufig: nur Tonspur auf Schwarz – der Bildschnitt (Edit.tsx) folgt.
const NokhchiEdit: React.FC = () => (
	<FontGate>
		<AbsoluteFill style={{backgroundColor: C.black}}>
			<Html5Audio src={staticFile('audio/mix.wav')} />
		</AbsoluteFill>
	</FontGate>
);

export const RemotionRoot: React.FC = () => (
	<Composition id="NokhchiEdit" component={NokhchiEdit} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
