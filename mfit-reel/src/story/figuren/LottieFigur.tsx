// Variante 1 in der Szene: Lottie-Figur umgefärbt und mit gebackener Choreografie
// (Gehen am Weg gekoppelt, Beiziehschritt, Stehen mit leichtem Wiegen, Anlaufen).
import {useMemo} from 'react';
import {easeInOut, gangzustand, VERGLEICH} from './gang';
import {bake, recolor, type Choreography, type GroupPose} from './lottie';
import {LOTTIE_MANN} from './lottieMann';
import {LottiePlayer, useLottieFile} from './LottiePlayer';

const M = LOTTIE_MANN;
const Z = M.zyklus;
const P = M.phasen;

/** px im Bild pro Lottie-Einheit */
export const LOTTIE_SKALA = VERGLEICH.hoehe / (M.sohle - M.oben);
/** Weg pro Doppelschritt im Bild – gilt für beide Varianten, damit sie gleich schnell schreiten */
export const PX_PRO_ZYKLUS = M.wegProZyklus * LOTTIE_SKALA;

const wrap = (p: number) => ((p % Z) + Z) % Z;

/** Leichtes Wiegen im Stand: Oberkörper pendelt minimal um die Haltephase */
const wiegen = (f: number) => {
	const g = f - VERGLEICH.halt.frame;
	const ein = Math.min(1, Math.max(0, g / 20));
	return P.halt + ein * 1.1 * Math.sin((g / 84) * Math.PI * 2);
};

const choreografie: Choreography = (f) => {
	const z = gangzustand(f);
	const phase = (weg: number) => P.halt + (weg / PX_PRO_ZYKLUS) * Z;
	if (z.art === 'gehen') {
		const p = wrap(phase(z.weg));
		return {rest: p, nah: p, fern: p};
	}
	if (z.art === 'schliessen') {
		// naher Fuß schwingt nach vorn unter die Hüfte und setzt neben dem fernen auf
		const split = 0.6;
		const nah: GroupPose =
			z.u < split
				? P.halt + (P.schwungMitte - P.halt) * easeInOut(z.u / split)
				: {a: P.schwungMitte, b: P.nahStand, t: easeInOut((z.u - split) / (1 - split))};
		return {rest: wiegen(f), fern: P.halt, nah};
	}
	if (z.art === 'stehen') return {rest: wiegen(f), fern: P.halt, nah: P.nahStand};
	// Anlaufen: Standbein und Oberkörper laufen ab der Haltephase weiter, der nahe Fuß hebt ab
	const p = phase(z.weg);
	const rest = f < VERGLEICH.weiter.frame + 12 ? {a: wiegen(f), b: wrap(p), t: easeInOut((f - VERGLEICH.weiter.frame) / 12)} : wrap(p);
	const nah: GroupPose = p < P.schwungMitte ? {a: P.nahStand, b: P.schwungMitte, t: easeInOut((p - P.halt) / (P.schwungMitte - P.halt))} : wrap(p);
	return {rest, fern: wrap(p), nah};
};

export const LottieFigur: React.FC<{frame: number; x: number; boden: number; tiefe: number}> = ({frame, x, boden, tiefe}) => {
	const roh = useLottieFile(M.datei);
	const daten = useMemo(() => (roh ? bake(recolor(roh, M.farben), M.gruppen, VERGLEICH.frames, choreografie, 30) : null), [roh]);
	if (!daten) return null;
	const s = LOTTIE_SKALA * tiefe;
	return (
		<div style={{position: 'absolute', left: x - M.mitteX * s, top: boden - M.sohle * s}}>
			<LottiePlayer data={daten} frame={frame} width={M.leinwand.w * s} height={M.leinwand.h * s} />
		</div>
	);
};

/** Gesichtsmitte im Bild (für Lichtkegel und Scanlinie) */
export const lottieGesicht = (x: number, boden: number, tiefe: number) => {
	const s = LOTTIE_SKALA * tiefe;
	return {x: x + (M.gesicht.x - M.mitteX) * s, y: boden - (M.sohle - M.gesicht.y) * s};
};
