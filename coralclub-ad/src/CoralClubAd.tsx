// Das komplette Video: fünf Szenen mit harten Schnitten unter dem
// Streifen-Wischer, Werbekennzeichnung obenauf, Tonspur.
import {AbsoluteFill, Sequence} from 'remotion';
import {AdLabel} from './components/AdLabel';
import {FontGate} from './components/FontGate';
import {SafeZoneOverlay} from './components/SafeZoneOverlay';
import {SoundTrack} from './components/SoundTrack';
import {StripeWipe} from './components/StripeWipe';
import {config} from './config';
import {HookScene} from './scenes/HookScene';
import {OutroScene} from './scenes/OutroScene';
import {ProductScene} from './scenes/ProductScene';
import {SCENES} from './timing';

export type CoralClubAdProps = {
	/** Blendet die Sicherheitszone ein (nur für Kontrollbilder) */
	showSafeZone: boolean;
};

export const CoralClubAd: React.FC<CoralClubAdProps> = ({showSafeZone}) => (
	<AbsoluteFill style={{backgroundColor: config.hook.grund}}>
		<FontGate>
			<Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.durationInFrames} name="1 Hook">
				<HookScene />
			</Sequence>
			{SCENES.produkte.map((s, i) => (
				<Sequence key={config.produkte[i].name} from={s.from} durationInFrames={s.durationInFrames} name={`${i + 2} ${config.produkte[i].name}`}>
					<ProductScene index={i} />
				</Sequence>
			))}
			<Sequence from={SCENES.abschluss.from} durationInFrames={SCENES.abschluss.durationInFrames} name="5 Abschluss">
				<OutroScene />
			</Sequence>
			<StripeWipe />
			<AdLabel />
		</FontGate>
		<SoundTrack />
		{showSafeZone ? <SafeZoneOverlay /> : null}
	</AbsoluteFill>
);
