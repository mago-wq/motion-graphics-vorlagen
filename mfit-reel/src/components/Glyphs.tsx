// Haken und Häkchen: das zentrale Motiv. Ein Angelhaken ist im Grunde ein
// gerundetes Häkchen (kurzer linker Arm, Bogen unten, langer rechter Arm),
// deshalb lässt er sich sauber in ein Häkchen verwandeln.
// Beide Formen liegen im selben lokalen Raum (etwa 100 Einheiten breit).
import {getLength, getPointAtLength} from '@remotion/paths';
import {interpolate} from 'remotion';
import {clamp} from '../motion';

/** Angelhaken, gezeichnet von der Spitze über den Bogen bis zur Öse. */
export const HOOK_PATH = 'M 22 86 L 22 108 A 25 25 0 0 0 72 108 L 72 9';
/** Widerhaken an der Spitze */
export const HOOK_BARB = 'M 22 86 L 31 98';
/** Öse oben am Schaft */
export const HOOK_EYE = {cx: 72, cy: 1, r: 7.5};
/** Häkchen, gleiche Laufrichtung wie der Haken: links oben → unten → rechts oben */
export const TICK_PATH = 'M 20 52 L 42 74 L 84 24';

const SAMPLES = 56;

const sample = (d: string): [number, number][] => {
	const length = getLength(d);
	return Array.from({length: SAMPLES}, (_, i) => {
		const p = getPointAtLength(d, (length * i) / (SAMPLES - 1));
		if (!p) throw new Error(`Punkt ${i} auf Pfad nicht gefunden: ${d}`);
		return [p.x, p.y];
	});
};

const HOOK_POINTS = sample(HOOK_PATH);
const TICK_POINTS = sample(TICK_PATH);

/** Pfad zwischen Haken (t = 0) und Häkchen (t = 1). */
export const morphPath = (t: number): string => {
	if (t <= 0) return HOOK_PATH;
	if (t >= 1) return TICK_PATH;
	return HOOK_POINTS.map(([hx, hy], i) => {
		const [tx, ty] = TICK_POINTS[i];
		const x = hx + (tx - hx) * t;
		const y = hy + (ty - hy) * t;
		return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
	}).join(' ');
};

/** Gemeinsame Verläufe für alle SVGs (einmal im Video eingebunden). */
export const GoldDefs: React.FC = () => (
	<svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
		<defs>
			{/* Bewegungsunschärfe in Stufen: senkrecht (rollende Ziffern), waagrecht (Karussell) */}
			{Array.from({length: 24}, (_, i) => (
				<filter key={`v${i}`} id={`vblur-${i + 1}`} x="-10%" y="-60%" width="120%" height="220%">
					<feGaussianBlur stdDeviation={`0 ${i + 1}`} />
				</filter>
			))}
			{Array.from({length: 24}, (_, i) => (
				<filter key={`h${i}`} id={`hblur-${i + 1}`} x="-40%" y="-10%" width="180%" height="120%">
					<feGaussianBlur stdDeviation={`${i + 1} 0`} />
				</filter>
			))}
			<linearGradient id="gold-stroke" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stopColor="#f3d98a" />
				<stop offset="35%" stopColor="#d4a83d" />
				<stop offset="55%" stopColor="#f8e39c" />
				<stop offset="80%" stopColor="#c69837" />
				<stop offset="100%" stopColor="#9a7426" />
			</linearGradient>
			<linearGradient id="gold-fill" x1="0" y1="0" x2="1" y2="0.35">
				<stop offset="0%" stopColor="#9a7426" />
				<stop offset="16%" stopColor="#d4a83d" />
				<stop offset="33%" stopColor="#f8e39c" />
				<stop offset="50%" stopColor="#c69837" />
				<stop offset="66%" stopColor="#e2b94f" />
				<stop offset="83%" stopColor="#f3d98a" />
				<stop offset="100%" stopColor="#b08530" />
			</linearGradient>
		</defs>
	</svg>
);

/**
 * Haken ↔ Häkchen als SVG-Gruppe im lokalen Raum. `t` 0 = Haken, 1 = Häkchen.
 * Öse und Widerhaken blenden während der ersten 40 % der Verwandlung aus.
 */
export const HookTick: React.FC<{t: number; strokeWidth: number; stroke?: string; opacity?: number}> = ({
	t,
	strokeWidth,
	stroke = 'url(#gold-stroke)',
	opacity = 1,
}) => {
	const extras = interpolate(t, [0, 0.4], [1, 0], clamp);
	return (
		<g opacity={opacity}>
			<path d={morphPath(t)} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
			{extras > 0 ? (
				<>
					<path d={HOOK_BARB} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" opacity={extras} />
					<circle {...HOOK_EYE} fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.75} opacity={extras} />
				</>
			) : null}
		</g>
	);
};
