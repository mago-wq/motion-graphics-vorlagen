// Szene 3 (10–18 s): 03:17 Uhr, jetzt als Mitglied. Er kommt gut gelaunt zum MFit-Studio,
// Face-ID-Scan, die Tür gleitet auf, er geht hinein. Die Kamera fährt ihm durch die Tür nach.
import {interpolate} from 'remotion';
import {clamp, EASE} from '../../motion';
import {COLORS} from '../../theme';
import {easeInOut, macheGang} from '../figuren/gang';
import {LottieFigur, lottieGesicht} from '../figuren/LottieFigur';
import {LOTTIE_MANN} from '../figuren/lottieMann';
import {NACHT, NachtHinten, NachtSymbole, NachtVorn, type NachtZustand} from '../NachtStudio';
import {Kopfzeile, Textzeile} from './teile';
import {Z} from './zeit';

const T = Z.tuer;
const BODEN = 1760;
const HOEHE = 856;
const L = (f: number) => f - T.start;

export const TUER_GANG = macheGang({
	frames: Z.tour.start - T.start + 2,
	start: {frame: 0, x: -120},
	halt: {frame: L(T.halt), x: 492},
	bremsen: 20,
	schliessen: 16,
	weiter: {frame: L(T.weiter), anlauf: 16},
	ende: 1320,
});

const smooth = (a: number, b: number, x: number) => {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};

/** Mitte der Türöffnung: dort hinein fährt die Kamera */
const TUER_MITTE = {x: NACHT.tuer.x + NACHT.tuer.w / 2, y: 1210};

export const TuerSzene: React.FC<{frame: number}> = ({frame}) => {
	if (frame < T.start - 1 || frame >= Z.tour.start + 1) return null;
	const lf = L(frame);
	const x = TUER_GANG.hueftX(lf);
	const rein = smooth(700, 960, x);
	const tiefe = 1 - 0.06 * rein;
	const boden = BODEN - 48 * rein;
	const scanAb = L(T.scan);
	const erfolgAb = L(T.erfolg);
	const z: NachtZustand = {
		tuer: interpolate(lf, [L(T.tuerAuf), L(T.weiter)], [0, 1], {...clamp, easing: easeInOut}),
		scanAn: interpolate(lf, [scanAb, scanAb + 6, erfolgAb - 4, erfolgAb + 2], [0, 1, 1, 0], clamp),
		scanPos: (lf - scanAb) / 20,
		erfolg: interpolate(lf, [erfolgAb, erfolgAb + 14], [0, 1], clamp),
		gesicht: lottieGesicht(LOTTIE_MANN, x, boden, HOEHE, tiefe),
	};
	// Kamerafahrt in die offene Tür, am Ende warmes Licht über alles
	const fahrt = interpolate(frame, [T.raus, Z.tour.start], [0, 1], {...clamp, easing: EASE.exit});
	const zoom = 1 + 4 * fahrt;
	const licht = interpolate(frame, [T.raus + 8, Z.tour.start], [0, 1], clamp);
	return (
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
			<div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: `${TUER_MITTE.x}px ${TUER_MITTE.y}px`}}>
				<NachtHinten z={z} />
				<LottieFigur figur={LOTTIE_MANN} gang={TUER_GANG} frame={lf} x={x} boden={boden} hoehe={HOEHE} tiefe={tiefe} />
				<NachtVorn z={z} />
				<NachtSymbole z={z} />
			</div>
			<div style={{opacity: 1 - fahrt}}>
				<Kopfzeile frame={frame} y={338} text="03:17 Uhr." ab={T.uhr} />
				<Kopfzeile frame={frame} y={460} text="Tür auf." ab={T.erfolg} gold />
				<Textzeile frame={frame} y={566} text="Zugang per Face-ID · 24/7 an den meisten Standorten" ab={T.erfolg + 10} maxSize={34} />
			</div>
			<div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 60%, ${COLORS.goldLight}, #6B5020)`, opacity: licht}} />
		</div>
	);
};
