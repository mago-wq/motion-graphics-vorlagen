// Das komplette Video: Hintergrund, fünf Szenen mit Übergängen, Tonspur.
import {springTiming, TransitionSeries} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {AbsoluteFill} from 'remotion';
import {BarberPoleBackground} from './components/BarberPole';
import {FontGate} from './components/FontGate';
import {SafeZoneOverlay} from './components/SafeZoneOverlay';
import {SoundTrack} from './components/SoundTrack';
import {HookScene} from './scenes/HookScene';
import {OfferScene} from './scenes/OfferScene';
import {OutroScene} from './scenes/OutroScene';
import {ScissorsScene} from './scenes/ScissorsScene';
import {ServicesScene} from './scenes/ServicesScene';
import {COLORS} from './theme';
import {SCENES, TRANSITION_FRAMES, TRANSITIONS} from './timing';

export type BarberAdProps = {
	/** Blendet die Sicherheitszone ein (nur für Kontrollbilder) */
	showSafeZone: boolean;
};

// Weiche Feder ohne Überschwingen, gestaucht auf 10 Frames
const transitionTiming = springTiming({config: {damping: 200}, durationInFrames: TRANSITION_FRAMES});
const slideTo = (i: number) => slide({direction: TRANSITIONS[i].direction});

export const BarberAd: React.FC<BarberAdProps> = ({showSafeZone}) => (
	<AbsoluteFill style={{backgroundColor: COLORS.bg}}>
		{/* Läuft durchgehend hinter allen Szenen, auch während der Übergänge */}
		<BarberPoleBackground />
		<FontGate>
			<TransitionSeries>
				<TransitionSeries.Sequence durationInFrames={SCENES.hook.durationInFrames} name="1 Hook">
					<HookScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={slideTo(0)} timing={transitionTiming} />
				<TransitionSeries.Sequence durationInFrames={SCENES.schere.durationInFrames} name="2 Schere">
					<ScissorsScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={slideTo(1)} timing={transitionTiming} />
				<TransitionSeries.Sequence durationInFrames={SCENES.leistungen.durationInFrames} name="3 Leistungen">
					<ServicesScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={slideTo(2)} timing={transitionTiming} />
				<TransitionSeries.Sequence durationInFrames={SCENES.angebot.durationInFrames} name="4 Angebot">
					<OfferScene />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition presentation={slideTo(3)} timing={transitionTiming} />
				<TransitionSeries.Sequence durationInFrames={SCENES.abschluss.durationInFrames} name="5 Abschluss">
					<OutroScene />
				</TransitionSeries.Sequence>
			</TransitionSeries>
		</FontGate>
		<SoundTrack />
		{showSafeZone ? <SafeZoneOverlay /> : null}
	</AbsoluteFill>
);
