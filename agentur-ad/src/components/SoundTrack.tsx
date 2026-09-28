// Legt alle Toneffekte aus src/audio/cues.ts framegenau an.
import {Html5Audio, Sequence, staticFile} from 'remotion';
import {buildCues, SFX} from '../audio/cues';
import {STILL_FROM} from '../timing';
import {FPS} from '../video';

export const SoundTrack: React.FC = () => (
	<>
		{buildCues().map((cue, i) => {
			const sound = SFX[cue.sound];
			// Anker des Effekts (z. B. der Klick im Schnipp-Geräusch) auf den Bild-Frame legen
			let from = cue.frame - Math.round(sound.anchor * FPS);
			let trimBefore = 0;
			if (from < 0) {
				trimBefore = -from;
				from = 0;
			}
			// Die letzte halbe Sekunde bleibt garantiert still.
			const durationInFrames = Math.min(Math.ceil(sound.duration * FPS) - trimBefore, STILL_FROM - from);
			if (durationInFrames <= 0) return null;
			return (
				<Sequence key={`${cue.sound}-${i}`} from={from} durationInFrames={durationInFrames} name={`Ton: ${cue.sound}`} layout="none">
					<Html5Audio src={staticFile(sound.file)} volume={cue.volume ?? 1} trimBefore={trimBefore || undefined} />
				</Sequence>
			);
		})}
	</>
);
