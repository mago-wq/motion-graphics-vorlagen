// Die komplette Tonspur: Flächen (Regen, Wind, Donner, Vögel), Stimme und Effekte.
import {Html5Audio, interpolate, Sequence, staticFile} from 'remotion';
import {ATMO, buildCues, TOENE} from '../audio/cues';
import {envelope} from '../motion';
import {DURATION, FADE_OUT, STIMME, VOICE_START} from '../timing';
import {FPS} from '../video';

/** Gemeinsame Abblende am Ende für alles, was noch klingt */
const ende = (f: number) => envelope(f, [[FADE_OUT, 1], [DURATION, 0]]);

export const SoundTrack: React.FC = () => (
	<>
		{ATMO.map((a) => (
			<Html5Audio key={a.sound} src={staticFile(TOENE[a.sound].file)} loop volume={(f) => a.volume(f) * ende(f)} name={`Fläche: ${a.sound}`} />
		))}

		<Sequence from={VOICE_START} durationInFrames={Math.min(Math.ceil(STIMME.dauer * FPS), DURATION - VOICE_START)} name="Stimme" layout="none">
			<Html5Audio src={staticFile('stimme/stimme.wav')} volume={(f) => ende(f + VOICE_START)} />
		</Sequence>

		{buildCues().map((cue, i) => {
			const sound = TOENE[cue.sound];
			// Anker des Effekts (z. B. der Einschlag im Boom) auf den Bild-Frame legen
			let from = cue.frame - Math.round(sound.anchor * FPS);
			let trimBefore = 0;
			if (from < 0) {
				trimBefore = -from;
				from = 0;
			}
			const durationInFrames = Math.min(Math.ceil(sound.duration * FPS) - trimBefore, DURATION - from);
			if (durationInFrames <= 0) return null;
			// Optional kürzen: ab Anker + kuerzen Frames über 12 Frames ausblenden
			const cut = cue.kuerzen === undefined ? Infinity : cue.frame + cue.kuerzen - from;
			const kurz = (f: number) => (cut === Infinity ? 1 : interpolate(f, [cut, cut + 12], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
			return (
				<Sequence key={`${cue.sound}-${i}`} from={from} durationInFrames={durationInFrames} name={`Ton: ${cue.sound}`} layout="none">
					<Html5Audio src={staticFile(sound.file)} volume={(f) => (cue.volume ?? 1) * kurz(f) * ende(f + from)} trimBefore={trimBefore || undefined} />
				</Sequence>
			);
		})}
	</>
);
