// Der Film: Ein Mann will abends trainieren, sein Studio hat zu. Er fragt bei MFit ein
// Probetraining an, kommt nachts per Face-ID rein, sieht drinnen die Extras, erfährt von
// allen Studios und dem Preis – und wird selbst zum Probetraining eingeladen.
// Alle Szenen bekommen den globalen Frame und blenden sich selbst ein und aus.
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../../components/Background';
import {FontGate} from '../../components/FontGate';
import {GoldDefs} from '../../components/Glyphs';
import {SafeZoneOverlay} from '../../components/SafeZoneOverlay';
import {COLORS} from '../../theme';
import {HandyBlende, HandySzene} from './HandySzene';
import {LogoSzene} from './LogoSzene';
import {CtaBlende, PreisCtaSzene} from './PreisCtaSzene';
import {ProblemSzene} from './ProblemSzene';
import {StudiosSzene} from './StudiosSzene';
import {TourSzene} from './TourSzene';
import {TuerSzene} from './TuerSzene';
import {STILL_AB} from './zeit';

export type FilmProps = {
	/** Tonspur einbinden (Vorschau im Studio; beim Rendern kommt der Ton per ffmpeg dazu) */
	mitTon: boolean;
	/** 4K-Render (--scale=2): Filmkorn in doppelter Auflösung */
	hd: boolean;
	/** Sicherheitszone einblenden (nur für Kontrollbilder) */
	sicherheitszone: boolean;
};

export const Film: React.FC<FilmProps> = ({mitTon, hd, sicherheitszone}) => {
	const roh = useCurrentFrame();
	const frame = Math.min(roh, STILL_AB);
	return (
		<AbsoluteFill style={{backgroundColor: COLORS.bg}}>
			<GoldDefs />
			<FontGate>
				<ProblemSzene frame={frame} />
				<HandySzene frame={frame} />
				<TuerSzene frame={frame} />
				<TourSzene frame={frame} />
				<StudiosSzene frame={frame} />
				<PreisCtaSzene frame={frame} />
				<LogoSzene frame={frame} />
				<HandyBlende frame={frame} />
				<CtaBlende frame={frame} />
			</FontGate>
			<Grain frame={frame} still={roh >= STILL_AB} hd={hd} />
			{mitTon ? <Html5Audio src={staticFile('audio/mfit-film.wav')} /> : null}
			{sicherheitszone ? <SafeZoneOverlay /> : null}
		</AbsoluteFill>
	);
};
