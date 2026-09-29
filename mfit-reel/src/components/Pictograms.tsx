// Goldene Linien-Piktogramme für die sieben Häkchen. Alle im Raum 0–200,
// gezeichnet mit runden Enden; `draw` 0 → 1 zeichnet sie wie mit einem Stift.
import {evolvePath} from '@remotion/paths';
import {interpolate} from 'remotion';
import {clamp} from '../motion';
import {COLORS, DISPLAY_FONT} from '../theme';
import {goldTextStyle} from './Type';

const GOLD = COLORS.gold;

type StrokeProps = {d: string; draw: number; width: number; color?: string; opacity?: number};

/** Pfad, der sich mit `draw` 0 → 1 zeichnet. */
export const Stroke: React.FC<StrokeProps> = ({d, draw, width, color = GOLD, opacity = 1}) => {
	if (draw <= 0) return null;
	const dash = draw < 1 ? evolvePath(draw, d) : null;
	return (
		<path
			d={d}
			fill="none"
			stroke={color}
			strokeWidth={width}
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeDasharray={dash?.strokeDasharray}
			strokeDashoffset={dash?.strokeDashoffset}
			opacity={opacity}
		/>
	);
};

/** Mehrere Pfade nacheinander zeichnen: `draw` läuft über alle, jeder bekommt seinen Anteil. */
const stagger = (draw: number, index: number, count: number, overlap = 0.35): number => {
	const span = 1 / (count - (count - 1) * overlap);
	const start = index * span * (1 - overlap);
	return interpolate(draw, [start, start + span], [0, 1], clamp);
};

const Frame: React.FC<{size: number; children: React.ReactNode}> = ({size, children}) => (
	<svg viewBox="0 0 200 200" width={size} height={size} style={{overflow: 'visible'}}>
		{children}
	</svg>
);

// ------------------------------------------------------------ Kette (monatlich kündbar)

const LINK_L = 112;
const LINK_R = 25;
/** Glied als "C", offen an der +x-Seite (Innenseite zur Nachbarglied) */
const LINK_C = `M ${LINK_L / 2 - LINK_R} ${-LINK_R} H ${-LINK_L / 2 + LINK_R} A ${LINK_R} ${LINK_R} 0 0 0 ${-LINK_L / 2 + LINK_R} ${LINK_R} H ${LINK_L / 2 - LINK_R}`;
/** Der Bogen, der das Glied schließt (fällt beim Bruch weg) */
const LINK_CLOSE = `M ${LINK_L / 2 - LINK_R} ${LINK_R} A ${LINK_R} ${LINK_R} 0 0 0 ${LINK_L / 2 - LINK_R} ${-LINK_R}`;

/**
 * Zwei verhakte Kettenglieder. `brk` 0 → 1: die Glieder öffnen sich an der
 * Innenseite, springen auseinander, drei Funken im Spalt.
 */
export const ChainPicto: React.FC<{size: number; draw: number; brk: number}> = ({size, draw, brk}) => {
	const open = interpolate(brk, [0, 0.25], [0, 1], clamp);
	const apart = interpolate(brk, [0, 0.45], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
	const spark = interpolate(brk, [0.05, 0.2, 0.7], [0, 1, 0], clamp);
	const sparkLen = interpolate(brk, [0.05, 0.4], [0, 1], clamp);
	const w = 7;
	// Abstand jedes Glieds von der Mitte, entlang der Diagonale (unten links ↔ oben rechts)
	const shift = 31 + apart * 33;
	const d = shift * Math.SQRT1_2;
	const link = (index: 0 | 1) => {
		// Glied 0 unten links, Innenseite zeigt nach oben rechts; Glied 1 um 180° gedreht
		const cx = index === 0 ? 100 - d : 100 + d;
		const cy = index === 0 ? 100 + d : 100 - d;
		const rot = -45 + index * 180 + (index === 0 ? -1 : 1) * apart * 9;
		const drawn = stagger(draw, index, 2);
		return (
			<g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
				<Stroke d={LINK_C} draw={drawn} width={w} />
				<Stroke d={LINK_CLOSE} draw={Math.min(interpolate(drawn, [0.7, 1], [0, 1], clamp), 1 - open)} width={w} />
			</g>
		);
	};
	// Funken quer zur Kette, je drei nach unten rechts und oben links
	const sparks = [45, 225].flatMap((base) =>
		[-35, 0, 35].map((off) => {
			const a = ((base + off) * Math.PI) / 180;
			const r0 = 10;
			const r1 = 10 + 22 * sparkLen;
			return `M ${100 + Math.cos(a) * r0} ${100 + Math.sin(a) * r0} L ${100 + Math.cos(a) * r1} ${100 + Math.sin(a) * r1}`;
		}),
	);
	return (
		<Frame size={size}>
			{link(0)}
			{link(1)}
			{spark > 0
				? sparks.map((p) => <path key={p} d={p} stroke={COLORS.goldLight} strokeWidth={4.5} strokeLinecap="round" opacity={spark} />)
				: null}
		</Frame>
	);
};

// ------------------------------------------------------------ Uhr (24/7)

/**
 * Zifferblatt: 24 Stundenstriche, ein goldener Ring, der sich einmal ganz
 * herum schließt (`sweep` 0 → 1), in der Mitte "24/7".
 */
export const ClockPicto: React.FC<{size: number; draw: number; sweep: number; label: string; sheen?: number}> = ({
	size,
	draw,
	sweep,
	label,
	sheen,
}) => {
	const r = 88;
	const angle = -90 + 360 * sweep;
	const rad = (angle * Math.PI) / 180;
	const head = {x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad)};
	const large = sweep > 0.5 ? 1 : 0;
	const arc = sweep >= 0.999 ? `M 100 ${100 - r} A ${r} ${r} 0 1 1 99.99 ${100 - r}` : `M 100 ${100 - r} A ${r} ${r} 0 ${large} 1 ${head.x} ${head.y}`;
	const marks = Array.from({length: 24}, (_, i) => {
		const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
		const long = i % 6 === 0;
		const r0 = long ? 66 : 72;
		const r1 = 79;
		const lit = sweep * 24 >= i;
		return {d: `M ${100 + r0 * Math.cos(a)} ${100 + r0 * Math.sin(a)} L ${100 + r1 * Math.cos(a)} ${100 + r1 * Math.sin(a)}`, long, lit, i};
	});
	const labelSize = size * 0.27;
	return (
		<div style={{position: 'relative', width: size, height: size}}>
			<Frame size={size}>
				<circle cx={100} cy={100} r={r} fill="none" stroke={GOLD} strokeWidth={2.5} opacity={0.28 * draw} />
				{marks.map((m) => (
					<Stroke
						key={m.i}
						d={m.d}
						draw={stagger(draw, m.i, 24, 0.8)}
						width={m.long ? 3.6 : 2.4}
						opacity={m.lit ? 1 : 0.4}
					/>
				))}
				{sweep > 0 ? <path d={arc} fill="none" stroke={GOLD} strokeWidth={6} strokeLinecap="round" /> : null}
				{sweep > 0 && sweep < 1 ? <circle cx={head.x} cy={head.y} r={7} fill={COLORS.goldLight} /> : null}
			</Frame>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: DISPLAY_FONT,
					fontSize: labelSize,
					lineHeight: 1,
					opacity: interpolate(draw, [0.3, 0.8], [0, 1], clamp),
					transform: `scale(${interpolate(draw, [0.3, 1], [0.86, 1], clamp)})`,
				}}
			>
				<span style={goldTextStyle(sheen)}>{label}</span>
			</div>
		</div>
	);
};

// ------------------------------------------------------------ Gesicht (Face-ID)

const CORNER = 16;
const ARM = 38;
const brackets = [
	`M 22 ${22 + ARM} V ${22 + CORNER} A ${CORNER} ${CORNER} 0 0 1 ${22 + CORNER} 22 H ${22 + ARM}`,
	`M ${178 - ARM} 22 H ${178 - CORNER} A ${CORNER} ${CORNER} 0 0 1 178 ${22 + CORNER} V ${22 + ARM}`,
	`M 178 ${178 - ARM} V ${178 - CORNER} A ${CORNER} ${CORNER} 0 0 1 ${178 - CORNER} 178 H ${178 - ARM}`,
	`M ${22 + ARM} 178 H ${22 + CORNER} A ${CORNER} ${CORNER} 0 0 1 22 ${178 - CORNER} V ${178 - ARM}`,
];
const faceParts = ['M 74 76 V 92', 'M 126 76 V 92', 'M 101 78 V 112 H 92', 'M 72 128 Q 100 150 128 128'];

/**
 * Face-ID-Symbol: vier Ecken, stilisiertes Gesicht, Scanlinie (`scan` 0 → 1 = einmal
 * von oben nach unten, Werte > 1 laufen weiter), `success` 0 → 1 = erkannt.
 */
export const FacePicto: React.FC<{size: number; draw: number; scan: number; scanOn: number; success: number}> = ({
	size,
	draw,
	scan,
	scanOn,
	success,
}) => {
	const y = 30 + (scan % 1) * 140;
	const pop = interpolate(success, [0, 0.35, 1], [1, 0.9, 1], clamp);
	const faceDraw = interpolate(draw, [0.35, 1], [0, 1], clamp);
	const faceColor = success > 0 ? COLORS.goldLight : GOLD;
	return (
		<Frame size={size}>
			<defs>
				<linearGradient id="scan-trail" x1="0" y1="1" x2="0" y2="0">
					<stop offset="0%" stopColor={GOLD} stopOpacity={0.4} />
					<stop offset="100%" stopColor={GOLD} stopOpacity={0} />
				</linearGradient>
				<clipPath id="scan-feld">
					<rect x={26} y={26} width={148} height={148} rx={12} />
				</clipPath>
			</defs>
			<g transform={`translate(100 100) scale(${pop}) translate(-100 -100)`}>
				{brackets.map((d, i) => (
					<Stroke key={d} d={d} draw={stagger(interpolate(draw, [0, 0.6], [0, 1], clamp), i, 4, 0.5)} width={7} />
				))}
			</g>
			{faceParts.map((d, i) => (
				<Stroke key={d} d={d} draw={stagger(faceDraw, i, 4, 0.4)} width={6.5} color={faceColor} />
			))}
			{scanOn > 0 ? (
				<g clipPath="url(#scan-feld)" opacity={scanOn}>
					<rect x={26} y={y - 46} width={148} height={46} fill="url(#scan-trail)" />
					<path d={`M 30 ${y} H 170`} stroke={COLORS.goldLight} strokeWidth={3.5} strokeLinecap="round" />
				</g>
			) : null}
		</Frame>
	);
};

// ------------------------------------------------------------ Flasche (Getränke)

const BOTTLE = 'M 88 56 C 88 66 66 70 66 90 V 168 Q 66 182 80 182 H 120 Q 134 182 134 168 V 90 C 134 70 112 66 112 56';
const BOTTLE_TOP = 'M 88 56 V 42 M 112 56 V 42 M 84 42 H 116 M 84 42 V 26 Q 84 22 88 22 H 112 Q 116 22 116 26 V 42';

/** Trinkflasche, die sich mit goldenem Getränk füllt (`fill` 0 → 1). */
export const BottlePicto: React.FC<{size: number; draw: number; fill: number; wave: number}> = ({size, draw, fill, wave}) => {
	const top = 178 - fill * 96;
	const amp = 5 * (1 - fill * 0.6);
	const surface = `M 60 ${top} Q 77 ${top - amp * Math.sin(wave)} 100 ${top} T 140 ${top} V 190 H 60 Z`;
	return (
		<Frame size={size}>
			<defs>
				<clipPath id="flasche-innen">
					<path d={`${BOTTLE} Z`} />
				</clipPath>
			</defs>
			{fill > 0 ? (
				<g clipPath="url(#flasche-innen)">
					<path d={surface} fill="url(#gold-fill)" opacity={0.92} />
				</g>
			) : null}
			<Stroke d={BOTTLE} draw={interpolate(draw, [0, 0.75], [0, 1], clamp)} width={7} />
			<Stroke d={BOTTLE_TOP} draw={interpolate(draw, [0.4, 1], [0, 1], clamp)} width={7} />
		</Frame>
	);
};

// ------------------------------------------------------------ Parken

const SIGN = 'M 62 36 H 138 A 26 26 0 0 1 164 62 V 138 A 26 26 0 0 1 138 164 H 62 A 26 26 0 0 1 36 138 V 62 A 26 26 0 0 1 62 36 Z';
const LETTER_P = 'M 84 140 V 62 H 108 A 22 22 0 0 1 108 106 H 84';

/** Parkschild: Rahmen zeichnet sich, das P springt hinein. */
export const ParkingPicto: React.FC<{size: number; draw: number; pop: number}> = ({size, draw, pop}) => (
	<Frame size={size}>
		<Stroke d={SIGN} draw={draw} width={7} />
		<g transform={`translate(100 100) scale(${pop}) translate(-100 -100)`} opacity={pop > 0 ? 1 : 0}>
			<path d={LETTER_P} fill="none" stroke={COLORS.goldLight} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
		</g>
	</Frame>
);
