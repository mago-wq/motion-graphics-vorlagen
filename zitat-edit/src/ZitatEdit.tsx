// Das komplette Video, Ebenen von unten nach oben.
import {AbsoluteFill} from 'remotion';
import {Blende} from './components/Blende';
import {FontGate} from './components/FontGate';
import {Hintergrund} from './components/Hintergrund';
import {Koernung} from './components/Koernung';
import {Licht} from './components/Licht';
import {Partikel} from './components/Partikel';
import {Quelle} from './components/Quelle';
import {SafeZoneOverlay} from './components/SafeZoneOverlay';
import {SoundTrack} from './components/SoundTrack';
import {Tafeln} from './components/Tafeln';
import {Tauben} from './components/Tauben';

export type ZitatEditProps = {
	/** Blendet die Sicherheitszone ein (nur für Kontrollbilder) */
	showSafeZone: boolean;
};

export const ZitatEdit: React.FC<ZitatEditProps> = ({showSafeZone}) => (
	<AbsoluteFill style={{backgroundColor: '#000'}}>
		<Hintergrund />
		<Partikel />
		<Tauben />
		<Licht />
		<FontGate>
			<Tafeln />
			<Quelle />
		</FontGate>
		<Koernung />
		<Blende />
		<SoundTrack />
		{showSafeZone ? <SafeZoneOverlay /> : null}
	</AbsoluteFill>
);
