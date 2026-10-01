// Tonspur: Sprecher, Musikbett und alle Effekte aus src/audio/cues.ts framegenau.
// Musik und Sprecher sind fertig gemischt (Ducking im Musik-Generator), hier
// nur noch Pegel. Nach STILL_FROM ist es still.
//
// MIX_GAIN gibt der Summe Reserve, damit Remotions 16-bit-Ausgabe nie clippt;
// die Lautheit holt scripts/master.py danach wieder auf ca. -14 LUFS.
import {Html5Audio, Sequence, staticFile} from 'remotion';
import {buildCues, SFX} from '../audio/cues';
import {STILL_FROM} from '../timing';
import {FPS} from '../video';

const MIX_GAIN = 0.5;

export const SoundTrack: React.FC = () => (
	<>
		<Sequence name="Sprecher" durationInFrames={STILL_FROM} layout="none">
			<Html5Audio src={staticFile('ton/sprecher.wav')} volume={MIX_GAIN} />
		</Sequence>
		<Sequence name="Musik" durationInFrames={STILL_FROM} layout="none">
			<Html5Audio src={staticFile('ton/musik.wav')} volume={MIX_GAIN} />
		</Sequence>
		{buildCues().map((cue, i) => {
			const sound = SFX[cue.sound];
			// Anker des Effekts (z. B. der Anschlag) auf den Bild-Frame legen
			let from = cue.frame - Math.round(sound.anchor * FPS);
			let trimBefore = 0;
			if (from < 0) {
				trimBefore = -from;
				from = 0;
			}
			const durationInFrames = Math.min(Math.ceil(sound.duration * FPS) - trimBefore, STILL_FROM - from);
			if (durationInFrames <= 0) return null;
			return (
				<Sequence key={`${cue.sound}-${i}`} from={from} durationInFrames={durationInFrames} name={`Ton: ${cue.sound}`} layout="none">
					<Html5Audio src={staticFile(sound.file)} volume={(cue.volume ?? 1) * MIX_GAIN} trimBefore={trimBefore || undefined} />
				</Sequence>
			);
		})}
	</>
);
