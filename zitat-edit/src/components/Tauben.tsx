// Weiße Tauben, per Code gezeichnet: Körper, Kopf, Schwanzfächer und zwei Flügel,
// die mit der Schlagphase auf und ab gehen. Nähe (z) bestimmt Größe und Unschärfe,
// drei blasse Nachbilder ergeben die Bewegungsunschärfe wie bei echter Kamera.
// Platzhalter, bis echte Tauben-Aufnahmen (KI-Video) vorliegen.
import {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {hash} from '../motion';
import {FLUEGE, type Flug} from '../timing';
import {FPS} from '../video';

/** Pixel pro Einheit bei z = 1 (Spannweite = 2 Einheiten = 170 px) */
const UNIT = 85;
const GHOSTS = [
	{back: 0, opacity: 1},
	{back: 0.35, opacity: 0.32},
	{back: 0.7, opacity: 0.18},
	{back: 1.05, opacity: 0.09},
];

const f = (n: number) => n.toFixed(3);

/** Ein Flügel (rechts) als Pfad; links wird gespiegelt. e = Flügelhöhe -1 (unten) .. 1 (oben) */
const wingPath = (e: number): string => {
	const tx = 0.98 - 0.22 * Math.abs(e);
	const ty = -0.05 - 0.62 * e;
	const mx = 0.46;
	const my = -0.12 - 0.36 * e;
	let d = `M 0.07 -0.07 Q 0.24 ${f(-0.2 - 0.3 * e)} ${f(mx)} ${f(my)} Q ${f(tx * 0.8)} ${f(ty - 0.1)} ${f(tx)} ${f(ty)}`;
	// Hinterkante mit Federn: vom Flügelende zurück zum Körper, jede Feder eine kleine Wölbung
	const back = {x: 0.08, y: 0.17};
	const n = 5;
	let px = tx;
	let py = ty;
	for (let k = 1; k <= n; k++) {
		const t = k / n;
		const chord = 0.13 * Math.sin(Math.PI * Math.min(1, t * 1.15));
		const x = tx + (back.x - tx) * t;
		const y = ty + (back.y - ty) * t + chord;
		const cx = (px + x) / 2 + 0.02;
		const cy = (py + y) / 2 + 0.05;
		d += ` Q ${f(cx)} ${f(cy)} ${f(x)} ${f(y)}`;
		px = x;
		py = y;
	}
	return `${d} Z`;
};

const Dove: React.FC<{e: number; id: string}> = ({e, id}) => (
	<g>
		<defs>
			<radialGradient id={id} cx="0.5" cy="0.4" r="0.7">
				<stop offset="0" stopColor="#ffffff" />
				<stop offset="0.7" stopColor="#eef1f5" />
				<stop offset="1" stopColor="#c9d0da" />
			</radialGradient>
		</defs>
		<g fill={`url(#${id})`}>
			<path d={wingPath(e)} />
			<path d={wingPath(e)} transform="scale(-1 1)" />
			<path d="M -0.05 0.24 L -0.14 0.52 Q 0 0.6 0.14 0.52 L 0.05 0.24 Z" />
			<ellipse cx="0" cy="0.04" rx="0.088" ry="0.27" />
			<circle cx="0" cy="-0.27" r="0.072" />
		</g>
	</g>
);

const position = (flug: Flug, p: number) => {
	const [x0, y0, z0] = flug.von;
	const [x1, y1, z1] = flug.nach;
	// Leichter Bogen quer zur Flugrichtung
	const arc = (hash(flug.seed * 3.1) - 0.5) * 260 * Math.sin(Math.PI * p);
	const len = Math.hypot(x1 - x0, y1 - y0) || 1;
	const nx = -(y1 - y0) / len;
	const ny = (x1 - x0) / len;
	return {
		x: x0 + (x1 - x0) * p + nx * arc,
		y: y0 + (y1 - y0) * p + ny * arc,
		z: z0 + (z1 - z0) * p,
	};
};

const Flight: React.FC<{flug: Flug; frame: number}> = ({flug, frame}) => {
	const p = (frame - flug.start) / flug.dauer;
	if (p < -0.05 || p > 1.05) return null;
	const step = 1 / flug.dauer;

	return (
		<>
			{GHOSTS.map((g, i) => {
				const q = p - g.back * step;
				const pos = position(flug, q);
				const ahead = position(flug, q + step);
				const angle = (Math.atan2(ahead.y - pos.y, ahead.x - pos.x) * 180) / Math.PI + 90;
				const t = (frame - g.back) / FPS;
				const e = Math.sin(2 * Math.PI * flug.schlag * t + flug.seed * 1.7) * (0.85 + 0.15 * Math.sin(t * 2.3 + flug.seed));
				const scale = UNIT * pos.z;
				const blur = 1 + 4 * Math.max(0, pos.z - 1) + 2.5 * Math.max(0, 0.7 - pos.z);
				const fade = interpolate(q, [0, 0.08, 0.92, 1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
				const size = scale * 2.4;
				return (
					<svg
						key={i}
						width={size}
						height={size}
						viewBox="-1.2 -1.2 2.4 2.4"
						style={{
							position: 'absolute',
							left: pos.x - size / 2,
							top: pos.y - size / 2,
							transform: `rotate(${angle}deg)`,
							opacity: 0.92 * fade * g.opacity,
							filter: `blur(${blur}px) drop-shadow(0 0 ${3 + pos.z * 3}px rgba(255, 255, 255, 0.35))`,
							overflow: 'visible',
						}}
					>
						<Dove e={e} id={`taube-${flug.seed}-${i}`} />
					</svg>
				);
			})}
		</>
	);
};

export const Tauben: React.FC = () => {
	const frame = useCurrentFrame();
	// Ferne Tauben zuerst zeichnen, nahe darüber
	const order = useMemo(() => [...FLUEGE].sort((a, b) => Math.max(a.von[2], a.nach[2]) - Math.max(b.von[2], b.nach[2])), []);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{order.map((flug) => (
				<Flight key={flug.seed} flug={flug} frame={frame} />
			))}
		</AbsoluteFill>
	);
};
