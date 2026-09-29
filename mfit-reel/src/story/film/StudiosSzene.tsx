// Szene 5 (28–32 s): Eine Mitgliedschaft, alle Studios. Stilisierte Karte (Weser, Autobahnen,
// nicht maßstäblich) – die sechs Studios fallen als goldene Pins nacheinander ein, Neueröffnungen
// mit NEU-Schild. Zum Schluss leuchten alle gemeinsam auf.
import {interpolate} from 'remotion';
import {config} from '../../config';
import {clamp, EASE, impulse, progress, SPRINGS, springFrom} from '../../motion';
import {COLORS, TEXT_FONT, withAlpha} from '../../theme';
import {Kopfzeile, schieben} from './teile';
import {Z} from './zeit';

const S = Z.studios;

/** Lage auf der Karte (grob nach Himmelsrichtung, Stolzenau liegt weit im Süden) und Seite der Beschriftung */
const LAGE: {x: number; y: number; seite: 'links' | 'rechts'}[] = [
	{x: 790, y: 1500, seite: 'links'}, // Stolzenau
	{x: 450, y: 770, seite: 'links'}, // Ritterhude
	{x: 410, y: 940, seite: 'links'}, // Bremen-Gröpelingen
	{x: 640, y: 1100, seite: 'links'}, // Bremen-Hemelingen
	{x: 830, y: 1020, seite: 'links'}, // Bremen-Weserpark
	{x: 720, y: 720, seite: 'rechts'}, // Grasberg
];

const WESER = 'M 860 1650 C 800 1480 760 1320 700 1180 S 560 1000 470 900 S 330 720 250 560';
const STRASSEN = [
	'M 120 1230 C 380 1110 560 1030 1000 860', // A1
	'M 900 1330 C 760 1150 620 980 560 560', // A27
	'M 820 1640 C 800 1450 720 1250 640 1100', // nach Süden
];

const Pin: React.FC<{frame: number; ab: number; x: number; y: number; name: string; neu: boolean; seite: 'links' | 'rechts'; leuchten: number}> = ({
	frame,
	ab,
	x,
	y,
	name,
	neu,
	seite,
	leuchten,
}) => {
	if (frame < ab - 4) return null;
	const fall = springFrom(frame, ab - 4, SPRINGS.pop);
	const dy = (1 - fall) * -120;
	const text = progress(frame, ab + 1, 8);
	const welle = interpolate(frame - ab, [0, 16], [0, 1], clamp);
	const links = seite === 'links';
	return (
		<>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{welle < 1 ? <circle cx={x} cy={y} r={20 + 60 * welle} fill="none" stroke={COLORS.goldLight} strokeWidth={4 * (1 - welle)} opacity={1 - welle} /> : null}
				<ellipse cx={x} cy={y + 4} rx={16 * fall} ry={5 * fall} fill="#000000" opacity={0.5} />
				{leuchten > 0.02 ? <circle cx={x} cy={y - 58} r={40 + 50 * (1 - leuchten)} fill="none" stroke={COLORS.goldLight} strokeWidth={5 * leuchten} opacity={leuchten} /> : null}
				<g transform={`translate(${x} ${y + dy}) scale(${0.6 + 0.4 * fall})`}>
					<path d="M 0 0 C -10 -22 -30 -34 -30 -58 A 30 30 0 1 1 30 -58 C 30 -34 10 -22 0 0 Z" fill={COLORS.gold} />
					<circle cx={0} cy={-58} r={12} fill={COLORS.bg} />
				</g>
			</svg>
			<div
				style={{
					position: 'absolute',
					top: y - 80,
					...(links ? {right: 1080 - x + 42} : {left: x + 42}),
					display: 'flex',
					flexDirection: links ? 'row-reverse' : 'row',
					alignItems: 'center',
					gap: 12,
					fontFamily: TEXT_FONT,
					opacity: text,
					transform: `translateX(${(1 - text) * (links ? 20 : -20)}px)`,
					whiteSpace: 'nowrap',
				}}
			>
				<span style={{fontSize: 32, fontWeight: 700, color: COLORS.text}}>{name}</span>
				{neu ? (
					<span style={{fontSize: 20, fontWeight: 800, letterSpacing: '0.12em', padding: '6px 12px', borderRadius: 999, background: COLORS.gold, color: COLORS.bg}}>
						{config.neuSchild.toUpperCase()}
					</span>
				) : null}
			</div>
		</>
	);
};

export const StudiosSzene: React.FC<{frame: number}> = ({frame}) => {
	if (frame < Z.tour.raus || frame >= Z.preis.start + 6) return null;
	const rein = 1 - schieben(frame, Z.tour.raus, 15);
	const raus = interpolate(frame, [S.raus, Z.preis.start + 4], [0, 1], {...clamp, easing: EASE.exit});
	const karte = progress(frame, S.start - 6, 16, EASE.out);
	const alle = S.pins[S.pins.length - 1] + 12;
	const leuchten = impulse(frame, alle, 18);
	const [z1, z2] = config.haekchen[6].zeilen;
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				transform: `translateX(${rein * 1080}px) scale(${1 - 0.15 * raus})`,
				opacity: 1 - raus,
				background: COLORS.bg,
			}}
		>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<defs>
					<radialGradient id="st-glow" cx="0.55" cy="0.5" r="0.55">
						<stop offset="0%" stopColor="#1D1810" />
						<stop offset="100%" stopColor={COLORS.bg} />
					</radialGradient>
				</defs>
				<rect x={0} y={560} width={1080} height={1200} fill="url(#st-glow)" />
				{/* Raster wie auf einer Karte */}
				{Array.from({length: 12}, (_, i) => (
					<rect key={`h${i}`} x={0} y={600 + i * 100} width={1080} height={1} fill="#FFFFFF" opacity={0.035} />
				))}
				{Array.from({length: 11}, (_, i) => (
					<rect key={`v${i}`} x={40 + i * 100} y={560} width={1} height={1200} fill="#FFFFFF" opacity={0.035} />
				))}
				<path d={WESER} fill="none" stroke="#18233A" strokeWidth={34} strokeLinecap="round" opacity={karte} />
				<path d={WESER} fill="none" stroke="#2A3A5C" strokeWidth={6} strokeLinecap="round" opacity={karte} />
				{STRASSEN.map((d, i) => (
					<path key={d} d={d} fill="none" stroke={COLORS.gold} strokeWidth={i === 2 ? 3 : 4} strokeDasharray={i === 2 ? '10 12' : undefined} opacity={0.22 * karte} />
				))}
			</svg>
			{config.studios.map((s, i) => (
				<Pin key={s.name} frame={frame} ab={S.pins[i]} x={LAGE[i].x} y={LAGE[i].y} name={s.name} neu={s.neu} seite={LAGE[i].seite} leuchten={leuchten} />
			))}
			<Kopfzeile frame={frame} y={338} text={z1} ab={S.titel} maxSize={96} />
			<Kopfzeile frame={frame} y={450} text={z2} ab={S.titel + 6} gold maxSize={96} />
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 1600,
					textAlign: 'center',
					fontFamily: TEXT_FONT,
					fontSize: 24,
					color: withAlpha(COLORS.text, 0.4),
					opacity: karte,
				}}
			>
				Karte vereinfacht, nicht maßstäblich
			</div>
		</div>
	);
};
