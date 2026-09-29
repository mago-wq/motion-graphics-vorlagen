// Figuren-Vergleich: dieselbe Szene zweimal nebeneinander (2160 × 1920) – links die fertige
// Lottie-Figur, rechts die Baukasten-Figur (Humaaans, selbst geriggt). Gleicher Weg, gleiche
// Zeitpunkte: Figur kommt nachts zum Studio, Face-ID-Scan, Tür öffnet, Figur geht hinein.
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FontGate} from '../components/FontGate';
import {GoldDefs} from '../components/Glyphs';
import {At} from '../components/Layout';
import {Line, TextLine} from '../components/Type';
import {clamp, EASE} from '../motion';
import {COLORS, TEXT_FONT, withAlpha} from '../theme';
import {TYPE_WIDTH} from '../video';
import {easeInOut, VERGLEICH, VERGLEICH_GANG} from './figuren/gang';
import {KIT_OBEN, KIT_SOHLE, KitFigur, kitPose} from './figuren/KitFigur';
import {LottieFigur, lottieGesicht, pxProZyklus} from './figuren/LottieFigur';
import {LOTTIE_MANN} from './figuren/lottieMann';
import {NachtHinten, NachtSymbole, NachtVorn, type NachtZustand} from './NachtStudio';

export type Variante = 'lottie' | 'kit';

const V = VERGLEICH;
const KIT_SKALA = V.hoehe / (KIT_SOHLE - KIT_OBEN);
/** Gesichtsmitte der Baukasten-Figur in Hüft-Koordinaten */
const KIT_GESICHT = {x: 22, y: -150};

const smooth = (a: number, b: number, x: number) => {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};

/** Zustand der Szene für ein Videobild (ohne Gesichtsposition) */
const szene = (f: number): Omit<NachtZustand, 'gesicht'> => ({
	tuer:
		interpolate(f, [V.tuer.auf, V.tuer.offen], [0, 1], {...clamp, easing: easeInOut}) -
		interpolate(f, [V.tuer.zu, V.tuer.geschlossen - 2], [0, 1], {...clamp, easing: easeInOut}),
	scanAn: interpolate(f, [V.scan.start, V.scan.start + 6, V.scan.ende - 4, V.scan.ende + 2], [0, 1, 1, 0], clamp),
	scanPos: (f - V.scan.start) / 20,
	erfolg: interpolate(f, [V.scan.ende, V.scan.ende + 14], [0, 1], clamp),
});

const Einblenden: React.FC<{frame: number; ab: number; children: React.ReactNode}> = ({frame, ab, children}) => {
	const t = interpolate(frame, [ab, ab + 14], [0, 1], {...clamp, easing: EASE.out});
	return <div style={{opacity: t, transform: `translateY(${(1 - t) * 26}px)`}}>{children}</div>;
};

const Texte: React.FC<{frame: number}> = ({frame}) => (
	<FontGate>
		<At y={338}>
			<Einblenden frame={frame} ab={2}>
				<Line text="03:17 Uhr." maxWidth={TYPE_WIDTH} maxSize={124} />
			</Einblenden>
		</At>
		<At y={460}>
			<Einblenden frame={frame} ab={V.scan.ende}>
				<Line text="Tür auf." maxWidth={TYPE_WIDTH} maxSize={124} gold />
			</Einblenden>
		</At>
		<At y={566}>
			<Einblenden frame={frame} ab={V.scan.ende + 10}>
				<TextLine text="Zugang per Face-ID · 24/7 an den meisten Standorten" maxWidth={TYPE_WIDTH} maxSize={34} weight={500} color={COLORS.textMuted} />
			</Einblenden>
		</At>
	</FontGate>
);

const ETIKETT: Record<Variante, {nr: string; titel: string; zeile: string}> = {
	lottie: {nr: '1', titel: 'Lottie-Figur', zeile: 'fertig animiert · in MFit-Farben umgefärbt'},
	kit: {nr: '2', titel: 'Baukasten (Humaaans)', zeile: 'Bauteile kombiniert · selbst geriggt'},
};

const Etikett: React.FC<{variante: Variante}> = ({variante}) => {
	const e = ETIKETT[variante];
	return (
		<div style={{position: 'absolute', top: 92, left: 0, width: 1080, display: 'flex', justifyContent: 'center', fontFamily: TEXT_FONT}}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					padding: '14px 30px 14px 16px',
					borderRadius: 999,
					background: withAlpha('#000000', 0.55),
					border: `2px solid ${withAlpha(COLORS.gold, 0.5)}`,
				}}
			>
				<span
					style={{
						width: 52,
						height: 52,
						borderRadius: 26,
						background: COLORS.gold,
						color: COLORS.bg,
						fontSize: 30,
						fontWeight: 800,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					{e.nr}
				</span>
				<span style={{display: 'flex', flexDirection: 'column', gap: 2}}>
					<span style={{fontSize: 32, fontWeight: 700, color: COLORS.text}}>{e.titel}</span>
					<span style={{fontSize: 22, fontWeight: 500, color: COLORS.textMuted}}>{e.zeile}</span>
				</span>
			</div>
		</div>
	);
};

/** Eine Hälfte des Vergleichs: komplette Szene mit einer Figur (1080 × 1920) */
export const VergleichPanel: React.FC<{variante: Variante; frame: number; etikett: boolean}> = ({variante, frame, etikett}) => {
	const x = VERGLEICH_GANG.hueftX(frame);
	// Beim Hineingehen etwas kleiner und höher: die Figur geht in die Tiefe
	const rein = smooth(700, 960, x);
	const tiefe = 1 - 0.06 * rein;
	const boden = V.boden - 48 * rein;
	const kitS = KIT_SKALA * tiefe;
	const gesicht =
		variante === 'lottie'
			? lottieGesicht(LOTTIE_MANN, x, boden, V.hoehe, tiefe)
			: {x: x + KIT_GESICHT.x * kitS, y: boden - (KIT_SOHLE - KIT_GESICHT.y) * kitS};
	const z: NachtZustand = {...szene(frame), gesicht};
	return (
		<AbsoluteFill style={{backgroundColor: COLORS.bg, overflow: 'hidden'}}>
			<GoldDefs />
			<NachtHinten z={z} />
			{variante === 'lottie' ? (
				<LottieFigur figur={LOTTIE_MANN} gang={VERGLEICH_GANG} frame={frame} x={x} boden={boden} hoehe={V.hoehe} tiefe={tiefe} />
			) : (
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					<ellipse cx={x + 6 * kitS} cy={boden + 4} rx={62 * kitS} ry={9 * kitS} fill="#000000" opacity={0.38} />
					<g transform={`translate(${x} ${boden}) scale(${kitS}) translate(0 ${-KIT_SOHLE})`}>
						<KitFigur pose={kitPose(VERGLEICH_GANG, frame, pxProZyklus(LOTTIE_MANN, V.hoehe), kitS)} />
					</g>
				</svg>
			)}
			<NachtVorn z={z} />
			<NachtSymbole z={z} />
			<Texte frame={frame} />
			{etikett ? <Etikett variante={variante} /> : null}
		</AbsoluteFill>
	);
};

export const FigurenVergleich: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{backgroundColor: '#000000'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}>
				<VergleichPanel variante="lottie" frame={frame} etikett />
			</div>
			<div style={{position: 'absolute', left: 1080, top: 0, width: 1080, height: 1920}}>
				<VergleichPanel variante="kit" frame={frame} etikett />
			</div>
			<div style={{position: 'absolute', left: 1077, top: 0, width: 6, height: 1920, background: '#000000'}} />
		</AbsoluteFill>
	);
};

/** Eine Variante allein im Reel-Format (zum Ansehen im Vollbild) */
export const FigurEinzeln: React.FC<{variante: Variante}> = ({variante}) => {
	const frame = useCurrentFrame();
	return <VergleichPanel variante={variante} frame={frame} etikett={false} />;
};
