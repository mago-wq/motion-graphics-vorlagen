// Selbst gezeichnete Linien-Icons (viewBox 0 0 100 100). Jeder Pfad ist ein
// einzelner Linienzug, damit sich die Icons per Strich-Animation zeichnen lassen.
import {evolvePath, getLength} from '@remotion/paths';
import type {CSSProperties} from 'react';
import {interpolate} from 'remotion';
import type {IconName} from '../config';
import {COLORS} from '../theme';

type Dot = {cx: number; cy: number; r: number};
/** rotate: Drehung des ganzen Icons um die Mitte (Grad) */
type IconDef = {paths: string[]; dots?: Dot[]; rotate?: number};

const circlePath = (cx: number, cy: number, r: number, sweep: 0 | 1 = 1) =>
	`M ${cx + r} ${cy} A ${r} ${r} 0 1 ${sweep} ${cx - r} ${cy} A ${r} ${r} 0 1 ${sweep} ${cx + r} ${cy}`;

/**
 * Schere, senkrecht: Griffe unten, Klingen oben, Drehpunkt bei (50|52).
 * Hälfte A: Griff links unten, Klinge nach rechts oben. Hälfte B gespiegelt.
 * In dieser Form ist die Schere geöffnet; zum Schließen dreht A um
 * -SCISSORS_CLOSE_DEG und B um +SCISSORS_CLOSE_DEG um den Drehpunkt.
 */
export const SCISSORS_SHAPE = {
	pivot: {x: 50, y: 52},
	halfA: [circlePath(33, 78, 11, 1), 'M 38 68.3 L 58.5 8.5 Q 64 32 43.5 71.5'],
	halfB: [
		'M 56 78 A 11 11 0 1 0 78 78 A 11 11 0 1 0 56 78',
		'M 62 68.3 L 41.5 8.5 Q 36 32 56.5 71.5',
	],
};
export const SCISSORS_CLOSE_DEG = 11;

const ICONS: Record<IconName | 'pin' | 'kamera', IconDef> = {
	schere: {
		paths: [...SCISSORS_SHAPE.halfA, ...SCISSORS_SHAPE.halfB],
		dots: [{cx: SCISSORS_SHAPE.pivot.x, cy: SCISSORS_SHAPE.pivot.y, r: 2.6}],
	},
	// Rasierhobel: Kopf mit Klinge, Hals, Griff mit Rillen – schräg gestellt
	rasierer: {
		paths: [
			'M 27 12 H 73 A 6 6 0 0 1 79 18 V 22 A 6 6 0 0 1 73 28 H 27 A 6 6 0 0 1 21 22 V 18 A 6 6 0 0 1 27 12 Z',
			'M 19 35 H 81',
			'M 50 35 V 44',
			'M 44 50 A 6 6 0 0 1 56 50 V 88 A 6 6 0 0 1 44 88 Z',
			'M 44 61 H 56',
			'M 44 70 H 56',
			'M 44 79 H 56',
		],
		rotate: -32,
	},
	// Kamm: links grobe, lange Zinken, rechts feine, kurze – diagonal
	kamm: {
		paths: [
			'M 14 30 H 86 A 4 4 0 0 1 90 34 V 40 A 4 4 0 0 1 86 44 H 14 A 4 4 0 0 1 10 40 V 34 A 4 4 0 0 1 14 30 Z',
			...[17, 25, 33, 41].map((x) => `M ${x} 44 V 76`),
			...[50, 56, 62, 68, 74, 80].map((x) => `M ${x} 44 V 66`),
		],
		rotate: -35,
	},
	pin: {
		paths: ['M 50 91 C 50 91 24 62 24 40 A 26 26 0 0 1 76 40 C 76 62 50 91 50 91 Z', circlePath(50, 40, 9.5)],
	},
	kamera: {
		paths: [
			'M 32 14 H 68 A 18 18 0 0 1 86 32 V 68 A 18 18 0 0 1 68 86 H 32 A 18 18 0 0 1 14 68 V 32 A 18 18 0 0 1 32 14 Z',
			circlePath(50, 50, 16),
		],
		dots: [{cx: 70, cy: 30, r: 4}],
	},
};

/**
 * Strich-Fortschritt für mehrere Pfade, die nacheinander gezeichnet werden
 * (wie ein Stift, der ohne abzusetzen weiterzieht).
 */
export const sequentialStroke = (paths: string[], progress: number) => {
	const lengths = paths.map((d) => getLength(d));
	const total = lengths.reduce((a, b) => a + b, 0);
	let offset = 0;
	return paths.map((d, i) => {
		const local = Math.min(1, Math.max(0, (progress * total - offset) / lengths[i]));
		offset += lengths[i];
		return {d, local};
	});
};

export type StrokeProps = {color: string; strokeWidth: number};

/** Einzelner Pfad mit Zeichen-Fortschritt 0..1 */
export const StrokePath: React.FC<{d: string; progress: number} & StrokeProps> = ({d, progress, color, strokeWidth}) => {
	if (progress <= 0) return null;
	const dash = progress < 1 ? evolvePath(progress, d) : null;
	return (
		<path
			d={d}
			fill="none"
			stroke={color}
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeDasharray={dash?.strokeDasharray}
			strokeDashoffset={dash?.strokeDashoffset}
		/>
	);
};

export const Icon: React.FC<{
	name: keyof typeof ICONS;
	size: number;
	color?: string;
	strokeWidth?: number;
	/** 0 = unsichtbar, 1 = fertig gezeichnet */
	progress?: number;
	style?: CSSProperties;
}> = ({name, size, color = COLORS.accent, strokeWidth = 4.5, progress = 1, style}) => {
	const def = ICONS[name];
	const dotOpacity = interpolate(progress, [0.85, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<svg viewBox="0 0 100 100" width={size} height={size} style={{overflow: 'visible', ...style}}>
			<g transform={def.rotate ? `rotate(${def.rotate} 50 50)` : undefined}>
				{sequentialStroke(def.paths, progress).map(({d, local}) => (
					<StrokePath key={d} d={d} progress={local} color={color} strokeWidth={strokeWidth} />
				))}
				{def.dots?.map((dot) => (
					<circle key={`${dot.cx}-${dot.cy}`} {...dot} fill={color} opacity={dotOpacity} />
				))}
			</g>
		</svg>
	);
};
