// Nachts hinter einer nassen Scheibe: unscharfe Stadtlichter, Nebel, Tropfen auf
// dem Glas, ablaufende Rinnsale, feiner Regen draußen, Filmkorn.
//
// Vorbild ist der stärkste Referenzclip (896k Aufrufe, Regen an der Autoscheibe
// bei Nacht). Kein Footage nötig, alles ist gerechnet. Damit gibt es keine
// Lizenzfrage und keinen Repost-Abgleich mit fremdem Material.
//
// LOOP-REGEL: Jede Bewegung ist periodisch in DURATION (Phase = 2π·k·frame/DURATION,
// k ganzzahlig). Frame 450 ist damit identisch mit Frame 0, TikTok spielt nahtlos
// weiter, und jede Wiederholung zählt als neue Wiedergabe.
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {BAND, DURATION} from '../video';

const TAU = Math.PI * 2;
/** Phase für eine Bewegung, die sich k-mal pro Video wiederholt. */
const cyc = (frame: number, k: number, offset = 0) => TAU * ((k * frame) / DURATION + offset);

const W = BAND.width;
const H = BAND.height;

type Light = {x: number; y: number; r: number; color: string; base: number; k: number; phase: number; drift: number};

const LIGHT_COLORS = ['#ffb35c', '#ff9a3d', '#ff4433', '#ffe4bd', '#ffd08a', '#ff5a3c', '#7fd4e0'];

// Lichter liegen gehäuft im unteren Drittel (Straße), wenige oben (Fenster gegenüber)
const LIGHTS: Light[] = Array.from({length: 46}, (_, i) => {
	const s = `light-${i}`;
	const street = random(`${s}-z`) < 0.72;
	return {
		x: random(`${s}-x`) * W,
		y: street ? H * (0.52 + random(`${s}-y`) * 0.3) : H * (0.12 + random(`${s}-y`) * 0.35),
		r: 26 + random(`${s}-r`) ** 2 * (street ? 120 : 70),
		color: LIGHT_COLORS[Math.floor(random(`${s}-c`) * (street ? LIGHT_COLORS.length : 5))],
		base: 0.35 + random(`${s}-o`) * 0.55,
		k: 1 + Math.floor(random(`${s}-k`) * 3),
		phase: random(`${s}-p`),
		drift: street ? 10 + random(`${s}-d`) * 40 : 4,
	};
});

type Drop = {x: number; y: number; r: number};
const DROPS: Drop[] = Array.from({length: 340}, (_, i) => ({
	x: random(`drop-x-${i}`) * W,
	y: random(`drop-y-${i}`) * H,
	r: 1.2 + random(`drop-r-${i}`) ** 3 * 7,
}));

type Runner = {x: number; k: number; phase: number; r: number; wobble: number; trail: number};
const RUNNERS: Runner[] = Array.from({length: 9}, (_, i) => ({
	x: 60 + random(`run-x-${i}`) * (W - 120),
	k: 1 + Math.floor(random(`run-k-${i}`) * 2),
	phase: random(`run-p-${i}`),
	r: 4 + random(`run-r-${i}`) * 4,
	wobble: 4 + random(`run-w-${i}`) * 10,
	trail: 160 + random(`run-t-${i}`) * 320,
}));

type Streak = {x: number; y: number; len: number; m: number};
// m = wie oft ein Strich pro Video durchs Bild fällt (ganzzahlig -> Loop)
const STREAKS: Streak[] = Array.from({length: 120}, (_, i) => ({
	x: random(`st-x-${i}`) * (W + 300) - 150,
	y: random(`st-y-${i}`) * H,
	len: 40 + random(`st-l-${i}`) * 70,
	m: 14 + Math.floor(random(`st-m-${i}`) * 10),
}));

const Lights: React.FC<{frame: number}> = ({frame}) => (
	<AbsoluteFill style={{filter: 'blur(26px)'}}>
		{LIGHTS.map((l, i) => {
			const flicker = 0.82 + 0.18 * Math.sin(cyc(frame, l.k * 3, l.phase));
			const dx = Math.sin(cyc(frame, 1, l.phase)) * l.drift;
			return (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: l.x + dx - l.r,
						top: l.y - l.r,
						width: l.r * 2,
						height: l.r * 2,
						borderRadius: '50%',
						background: `radial-gradient(circle, ${l.color} 0%, ${l.color}cc 35%, transparent 70%)`,
						opacity: l.base * flicker,
					}}
				/>
			);
		})}
	</AbsoluteFill>
);

const Rain: React.FC<{frame: number}> = ({frame}) => (
	<svg width={W} height={H} style={{position: 'absolute', filter: 'blur(1.2px)', opacity: 0.5}}>
		{STREAKS.map((s, i) => {
			const travel = H + s.len;
			const y = ((s.y + (frame * s.m * travel) / DURATION) % travel) - s.len;
			const x = s.x + y * 0.12; // leichter Wind
			return (
				<line
					key={i}
					x1={x}
					y1={y}
					x2={x + s.len * 0.12}
					y2={y + s.len}
					stroke="rgba(200,215,235,0.35)"
					strokeWidth={1.4}
					strokeLinecap="round"
				/>
			);
		})}
	</svg>
);

const Glass: React.FC<{frame: number}> = ({frame}) => (
	<svg width={W} height={H} style={{position: 'absolute'}}>
		<defs>
			{/* Tropfen bricht Licht: dunkler Kern, helle Kante unten, Glanzpunkt oben */}
			<radialGradient id="drop" cx="50%" cy="62%" r="55%">
				<stop offset="0%" stopColor="rgba(30,34,48,0.32)" />
				<stop offset="70%" stopColor="rgba(60,60,75,0.28)" />
				<stop offset="92%" stopColor="rgba(255,214,170,0.55)" />
				<stop offset="100%" stopColor="rgba(255,214,170,0)" />
			</radialGradient>
			<linearGradient id="trail" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stopColor="rgba(255,220,190,0)" />
				<stop offset="100%" stopColor="rgba(255,220,190,0.13)" />
			</linearGradient>
		</defs>
		{DROPS.map((d, i) => (
			<g key={i}>
				<ellipse cx={d.x} cy={d.y} rx={d.r} ry={d.r * 1.15} fill="url(#drop)" />
				{d.r > 3.5 ? (
					<circle cx={d.x - d.r * 0.3} cy={d.y - d.r * 0.4} r={d.r * 0.22} fill="rgba(255,240,220,0.7)" />
				) : null}
			</g>
		))}
		{RUNNERS.map((r, i) => {
			// Rinnsal: läuft k-mal pro Video von oben nach unten, mit kleinem Schlenker
			const p = ((frame * r.k) / DURATION + r.phase) % 1;
			// stockend wie echtes Wasser: schneller, langsamer, schneller
			const eased = p + 0.035 * Math.sin(TAU * p * 5);
			const y = -60 + eased * (H + 120 + r.trail);
			const x = r.x + Math.sin(eased * 9 + i) * r.wobble;
			const top = y - r.trail;
			return (
				<g key={`run-${i}`}>
					<path
						d={`M ${r.x + Math.sin((top + 60) / (H + 120 + r.trail) * 9 + i) * r.wobble} ${top} Q ${x - r.wobble * 0.5} ${(top + y) / 2} ${x} ${y}`}
						stroke="url(#trail)"
						strokeWidth={r.r * 0.9}
						fill="none"
						strokeLinecap="round"
					/>
					<ellipse cx={x} cy={y} rx={r.r} ry={r.r * 1.35} fill="url(#drop)" />
					<circle cx={x - r.r * 0.3} cy={y - r.r * 0.45} r={r.r * 0.25} fill="rgba(255,240,220,0.8)" />
				</g>
			);
		})}
	</svg>
);

/** Filmkorn: neues Rauschen jedes Frame, Seed periodisch -> Loop bleibt sauber. */
const Grain: React.FC<{frame: number}> = ({frame}) => (
	<svg width={W} height={H} style={{position: 'absolute', mixBlendMode: 'overlay', opacity: 0.32}}>
		<filter id="grain">
			<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % DURATION} />
			<feColorMatrix type="saturate" values="0" />
		</filter>
		<rect width="100%" height="100%" filter="url(#grain)" />
	</svg>
);

export const RainWindow: React.FC = () => {
	const frame = useCurrentFrame();
	// Atmender Zoom statt Push-in: ein Push-in springt beim Loop zurück, das hier nicht.
	const scale = 1.05 + 0.025 * Math.sin(cyc(frame, 1, 0.75));
	const pan = Math.sin(cyc(frame, 1)) * 14;

	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#05070d'}}>
			<AbsoluteFill style={{transform: `scale(${scale}) translateX(${pan}px)`}}>
				{/* Nachthimmel / Stadtdunst */}
				<AbsoluteFill
					style={{
						background:
							'linear-gradient(180deg, #070a14 0%, #0d1322 38%, #1a1520 62%, #120c10 100%)',
					}}
				/>
				<Lights frame={frame} />
				{/* Nebel vor den Lichtern */}
				<AbsoluteFill
					style={{
						background:
							'radial-gradient(ellipse 90% 40% at 50% 70%, rgba(255,150,90,0.10), transparent 70%), radial-gradient(ellipse 80% 50% at 30% 30%, rgba(90,120,170,0.10), transparent 70%)',
					}}
				/>
				<Rain frame={frame} />
			</AbsoluteFill>
			<Glass frame={frame} />
			{/* Fensterrahmen unten: gibt Tiefe und einen festen Halt im Bild */}
			<AbsoluteFill
				style={{
					background: 'linear-gradient(180deg, transparent 86%, rgba(3,3,6,0.85) 93%, #020203 100%)',
				}}
			/>
			<Grain frame={frame} />
			{/* Vignette */}
			<AbsoluteFill
				style={{background: 'radial-gradient(ellipse 75% 65% at 50% 45%, transparent 40%, rgba(0,0,0,0.75) 100%)'}}
			/>
		</AbsoluteFill>
	);
};
