import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {FontGate} from './components/FontGate';
import {CONFIG} from './config';
import {RainWindow} from './scenes/RainWindow';
import {Handle, Source, Verse} from './scenes/Verse';
import {LINES, SOURCE} from './timing';
import {BAND} from './video';

export const ZitatReel: React.FC = () => (
	<AbsoluteFill style={{background: '#000'}}>
		{CONFIG.ambience ? <Audio src={staticFile('regen.wav')} volume={CONFIG.ambienceVolume} /> : null}
		<FontGate>
			<div style={{position: 'absolute', top: BAND.top, left: 0, width: BAND.width, height: BAND.height, overflow: 'hidden'}}>
				<RainWindow />
				{CONFIG.lines.map((line, i) => (
					<Verse key={i} line={line} timing={LINES[i]} />
				))}
				<Source text={CONFIG.source} start={SOURCE.in} end={SOURCE.out} />
				<Handle text={CONFIG.handle} />
			</div>
		</FontGate>
	</AbsoluteFill>
);
