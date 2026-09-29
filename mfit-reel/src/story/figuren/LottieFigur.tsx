// Lottie-Figur in einer Szene: umgefärbt und mit gebackener Choreografie aus einem Gangplan
// (Gehen am Weg gekoppelt, Beiziehschritt, Stehen mit leichtem Wiegen, Anlaufen).
import {useMemo} from 'react';
import {easeInOut, type Gang} from './gang';
import {bake, recolor, type Choreography, type GroupPose} from './lottie';
import type {LottieFigurDef} from './lottieMann';
import {LottiePlayer, useLottieFile} from './LottiePlayer';

/** px im Bild pro Lottie-Einheit bei gegebener Figurenhöhe */
export const lottieSkala = (figur: LottieFigurDef, hoehe: number) => hoehe / (figur.sohle - figur.oben);
/** Weg pro Doppelschritt im Bild */
export const pxProZyklus = (figur: LottieFigurDef, hoehe: number) => figur.wegProZyklus * lottieSkala(figur, hoehe);

const choreografie = (figur: LottieFigurDef, gang: Gang, hoehe: number): Choreography => {
	const Z = figur.zyklus;
	const P = figur.phasen;
	const wrap = (p: number) => ((p % Z) + Z) % Z;
	const zyklusPx = pxProZyklus(figur, hoehe);
	const haltFrame = gang.plan.halt?.frame ?? 0;
	const weiterFrame = gang.plan.weiter?.frame ?? Infinity;
	// Leichtes Wiegen im Stand: Oberkörper pendelt minimal um die Haltephase
	const wiegen = (f: number) => {
		const g = f - haltFrame;
		const ein = Math.min(1, Math.max(0, g / 20));
		return P.halt + ein * 1.1 * Math.sin((g / 84) * Math.PI * 2);
	};
	const phase = (weg: number) => P.halt + (weg / zyklusPx) * Z;
	return (f) => {
		const z = gang.zustand(f);
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
		const rest = f < weiterFrame + 12 ? {a: wiegen(f), b: wrap(p), t: easeInOut((f - weiterFrame) / 12)} : wrap(p);
		const nah: GroupPose = p < P.schwungMitte ? {a: P.nahStand, b: P.schwungMitte, t: easeInOut((p - P.halt) / (P.schwungMitte - P.halt))} : wrap(p);
		return {rest, fern: wrap(p), nah};
	};
};

/** Gebackene Animationsdaten für Figur + Gangplan (einmal je Szene) */
export const useLottieGang = (figur: LottieFigurDef, gang: Gang, hoehe: number, fps: number) => {
	const roh = useLottieFile(figur.datei);
	return useMemo(
		() => (roh ? bake(recolor(roh, figur.farben), figur.gruppen, gang.plan.frames, choreografie(figur, gang, hoehe), fps) : null),
		[roh, figur, gang, hoehe, fps],
	);
};

/**
 * Zeichnet die Figur mit der Hüfte bei `x` und den Sohlen auf `boden`. `frame` ist das
 * Szenenbild (0 … plan.frames − 1), `tiefe` skaliert zusätzlich (Figur geht in die Tiefe).
 */
export const LottieFigur: React.FC<{
	figur: LottieFigurDef;
	gang: Gang;
	frame: number;
	x: number;
	boden: number;
	hoehe: number;
	tiefe?: number;
	fps?: number;
	spiegeln?: boolean;
}> = ({figur, gang, frame, x, boden, hoehe, tiefe = 1, fps = 30, spiegeln = false}) => {
	const daten = useLottieGang(figur, gang, hoehe, fps);
	if (!daten) return null;
	const s = lottieSkala(figur, hoehe) * tiefe;
	return (
		<div
			style={{
				position: 'absolute',
				left: x - figur.mitteX * s,
				top: boden - figur.sohle * s,
				transform: spiegeln ? 'scaleX(-1)' : undefined,
				transformOrigin: `${figur.mitteX * s}px 0`,
			}}
		>
			<LottiePlayer data={daten} frame={Math.max(0, Math.min(gang.plan.frames - 1, Math.round(frame)))} width={figur.leinwand.w * s} height={figur.leinwand.h * s} />
		</div>
	);
};

/** Gesichtsmitte im Bild (für Lichtkegel und Scanlinie) */
export const lottieGesicht = (figur: LottieFigurDef, x: number, boden: number, hoehe: number, tiefe = 1) => {
	const s = lottieSkala(figur, hoehe) * tiefe;
	return {x: x + (figur.gesicht.x - figur.mitteX) * s, y: boden - (figur.sohle - figur.gesicht.y) * s};
};
