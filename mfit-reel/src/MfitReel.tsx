// Das komplette Reel: Hintergrund, Szenen, Haken/Häkchen, Kopfzeile, Filmkorn, Tonspur.
// Alle Szenen bekommen den globalen Frame und blenden sich selbst ein und aus –
// so können Übergänge über Szenengrenzen laufen, ohne dass etwas springt.
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame} from 'remotion';
import {Background, Grain} from './components/Background';
import {FontGate} from './components/FontGate';
import {GoldDefs} from './components/Glyphs';
import {Header} from './components/Header';
import {HookSwarm} from './components/HookSwarm';
import {SafeZoneOverlay} from './components/SafeZoneOverlay';
import {impulse, shake} from './motion';
import {CtaScene} from './scenes/CtaScene';
import {EndScene} from './scenes/EndScene';
import {HakenScene} from './scenes/HakenScene';
import {HookScene} from './scenes/HookScene';
import {ItemsScene} from './scenes/ItemsScene';
import {AnkerScene, PreisScene} from './scenes/PriceScenes';
import {RecapScene} from './scenes/RecapScene';
import {ENDE, HAKEN, HOOK, ITEMS, PREIS, STILL_FROM} from './timing';

export type MfitReelProps = {
	/** Blendet die Sicherheitszone ein (nur für Kontrollbilder) */
	showSafeZone: boolean;
	/** Tonspur einbinden (für die Vorschau im Studio; beim Rendern kommt der Ton per ffmpeg dazu) */
	withAudio: boolean;
	/** 4K-Render (--scale=2): feineres Filmkorn in doppelter Auflösung */
	hd: boolean;
};

/** Große Momente: Kamera-Stoß und warmer Lichtstoß im Hintergrund */
const DROPS = [HOOK.premium, ITEMS[0].start, PREIS.slam, ENDE.finale];
/** Kleinere Einschläge: nur ein leichter Kamera-Stoß */
const HITS = [HOOK.landet, HAKEN.haken];

export const MfitReel: React.FC<MfitReelProps> = ({showSafeZone, withAudio, hd}) => {
	const raw = useCurrentFrame();
	// Letzte Frames: Standbild, damit das Reel sauber endet
	const frame = Math.min(raw, STILL_FROM);
	const still = raw >= STILL_FROM;
	const punch =
		DROPS.reduce((s, at) => s + 0.04 * impulse(frame, at, 12), 0) + HITS.reduce((s, at) => s + 0.02 * impulse(frame, at, 9), 0);
	const quake = DROPS.map((at) => shake(frame, at, 9, 9)).reduce((a, b) => ({x: a.x + b.x, y: a.y + b.y}), {x: 0, y: 0});

	return (
		<AbsoluteFill>
			<GoldDefs />
			<Background frame={frame} drops={DROPS} />
			<FontGate>
				<AbsoluteFill style={{transform: `translate(${quake.x}px, ${quake.y}px) scale(${1 + punch})`}}>
					<HookScene frame={frame} />
					<HakenScene frame={frame} />
					<ItemsScene frame={frame} />
					<RecapScene frame={frame} />
					<AnkerScene frame={frame} />
					<PreisScene frame={frame} />
					<CtaScene frame={frame} />
					<EndScene frame={frame} />
					<HookSwarm frame={frame} />
					<Header frame={frame} />
				</AbsoluteFill>
			</FontGate>
			<Grain frame={frame} still={still} hd={hd} />
			{withAudio ? <Html5Audio src={staticFile('audio/mfit-soundtrack.wav')} /> : null}
			{showSafeZone ? <SafeZoneOverlay /> : null}
		</AbsoluteFill>
	);
};
