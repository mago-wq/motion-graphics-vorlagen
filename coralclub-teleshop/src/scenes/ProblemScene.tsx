// Szene 2: "Kennen Sie das? Drei Uhr nachmittags – und Sie sind platt wie ein
// Pfannkuchen? Der vierte Kaffee – und immer noch nix?"
// Schwarzweiß wie das "Vorher" in jeder Teleshopping-Werbung: Die Uhr springt
// auf 15:00, "PLATT" wird zum Pfannkuchen gequetscht, vier Kaffeetassen, und
// "NIX?" sackt mit jedem Ton der traurigen Posaune weiter ab.
import {AbsoluteFill, interpolate} from 'remotion';
import {At} from '../components/At';
import {ChromeText} from '../components/ChromeText';
import {Clock, CoffeeCup} from '../components/Icons';
import {config} from '../config';
import {framesToLand, ramp, shakeAt, SPRINGS, springFrom} from '../motion';
import {FONT, NARROW} from '../theme';
import {line, POSAUNE_NOTES, word} from '../timing';
import {SAFE} from '../video';

const POP = framesToLand(SPRINGS.pop);
const STAMP = framesToLand(SPRINGS.stamp);

const kaffeeStart = line('kaffee').start;
const tasseVier = word('kaffee', 'Kaffee').start;

export const PROBLEM_T = {
	frage: line('kennen').start,
	uhr: word('kennen', 'Drei').start,
	platt: word('kennen', 'platt').start,
	pfannkuchen: word('kennen', 'Pfannkuchen').start,
	kaffee: kaffeeStart,
	/** Tassen 1–3 kurz nacheinander, die vierte auf "Kaffee" */
	tassen: [kaffeeStart + 1, kaffeeStart + 5, kaffeeStart + 9, tasseVier],
	nix: word('kaffee', 'nix').start,
};
/** Sichtbare Einschläge (Ton) */
export const PROBLEM_IMPACTS = {
	uhr: PROBLEM_T.uhr + POP,
	platt: PROBLEM_T.platt + STAMP,
	tassen: PROBLEM_T.tassen.map((t) => t + POP),
	nix: PROBLEM_T.nix + STAMP,
};

const Caption: React.FC<{text: string; size: number}> = ({text, size}) => (
	<div
		style={{
			fontFamily: FONT,
			fontWeight: 800,
			fontStyle: 'italic',
			fontStretch: NARROW,
			fontSize: size,
			color: '#F2F2F2',
			textTransform: 'uppercase',
			letterSpacing: '0.04em',
			whiteSpace: 'nowrap',
			textShadow: '0 4px 0 #000',
		}}
	>
		{text}
	</div>
);

export const ProblemScene: React.FC<{frame: number}> = ({frame}) => {
	const T = PROBLEM_T;
	// --- Frage oben
	const q = ramp(frame, T.frage, T.frage + 10);
	const qUp = springFrom(frame, T.uhr - 3, SPRINGS.snap);

	// --- Teil 1: Uhr + Platt (bis "Kaffee"), dann nach unten weg
	const part1Out = ramp(frame, T.kaffee - 2, T.kaffee + 6);
	const clockIn = springFrom(frame, T.uhr, SPRINGS.pop);
	const hands = springFrom(frame, T.uhr + 2, {damping: 18, stiffness: 120, mass: 0.7});
	const hours = interpolate(hands, [0, 1], [0, 3]);
	const minutes = interpolate(hands, [0, 1], [-180, 0]);

	const plattDrop = springFrom(frame, T.platt, SPRINGS.stamp);
	const squash = springFrom(frame, T.platt + STAMP - 1, {damping: 12, stiffness: 260, mass: 0.5});
	const plattY = interpolate(plattDrop, [0, 1], [700, 1210]);
	const sx = interpolate(squash, [0, 1], [1, 1.4]);
	const sy = interpolate(squash, [0, 1], [1, 0.3]);

	// --- Teil 2: Tassen + NIX
	const nixIn = springFrom(frame, T.nix, SPRINGS.stamp);
	// Jeder Posaunenton lässt "NIX?" weiter absacken, der letzte am stärksten
	const droop = POSAUNE_NOTES.reduce((acc, at, i) => acc + springFrom(frame, at, {damping: 14, stiffness: 160, mass: 0.6}) * (i === 3 ? 2.2 : 1), 0);
	const sad = ramp(frame, POSAUNE_NOTES[0], POSAUNE_NOTES[3] + 12);

	const shake = shakeAt(frame, [{frame: PROBLEM_IMPACTS.platt, strength: 10}, {frame: PROBLEM_IMPACTS.nix, strength: 8}], 'problem');

	return (
		<AbsoluteFill style={{filter: 'grayscale(1) contrast(1.12)'}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 65% at 50% 48%, #3A3A3A 0%, #161616 70%, #050505 100%)'}} />
			<AbsoluteFill style={{transform: shake}}>
				<At x={540} y={interpolate(qUp, [0, 1], [interpolate(q, [0, 1], [900, 870]), 420])} opacity={q} transform={`scale(${interpolate(qUp, [0, 1], [1.35, 1])})`}>
					<ChromeText text={config.problem.frage} size={112} maxWidth={SAFE.width / 1.35} variant="white" />
				</At>

				{frame < T.kaffee + 8 ? (
					<AbsoluteFill style={{transform: `translateY(${part1Out * 900}px)`, opacity: 1 - part1Out}}>
						{frame >= T.uhr ? (
							<At x={540} y={800} transform={`scale(${clockIn}) rotate(${(1 - clockIn) * -20}deg)`}>
								<Clock size={430} hours={hours} minutes={minutes} />
							</At>
						) : null}
						{frame >= T.uhr + 6 ? (
							<At x={540} y={1060} opacity={ramp(frame, T.uhr + 6, T.uhr + 12)}>
								<Caption text={`${config.problem.uhrzeit} Uhr`} size={84} />
							</At>
						) : null}
						{frame >= T.platt ? (
							<At x={540} y={plattY} transform={`scale(${sx}, ${sy})`} origin="50% 100%">
								<ChromeText text={config.problem.platt} size={240} maxWidth={SAFE.width / 1.4} variant="white" depth={0.05} />
							</At>
						) : null}
						{frame >= T.pfannkuchen ? (
							<At x={540} y={1400} opacity={ramp(frame, T.pfannkuchen, T.pfannkuchen + 6)}>
								<Caption text={config.problem.plattZusatz} size={56} />
							</At>
						) : null}
					</AbsoluteFill>
				) : null}

				{frame >= T.kaffee ? (
					<AbsoluteFill>
						{T.tassen.map((at, i) => {
							const s = springFrom(frame, at, SPRINGS.pop);
							const big = i === 3;
							const tilt = sad * (i % 2 === 0 ? -8 : 8);
							return frame >= at ? (
								<At key={i} x={540 + (i - 1.5) * 222} y={big ? 800 : 820} transform={`scale(${s * (big ? 1.18 : 1)}) rotate(${tilt}deg)`}>
									<CoffeeCup size={200} frame={frame} />
								</At>
							) : null;
						})}
						{frame >= T.tassen[3] ? (
							<At x={540} y={1010} opacity={ramp(frame, T.tassen[3], T.tassen[3] + 6)}>
								<Caption text={config.problem.kaffee} size={64} />
							</At>
						) : null}
						{frame >= T.nix ? (
							<At
								x={540}
								y={interpolate(nixIn, [0, 1], [1500, 1260]) + droop * 18}
								transform={`rotate(${droop * 7}deg) scale(${1 - droop * 0.04}, ${1 - droop * 0.07})`}
								origin="0% 100%"
							>
								<ChromeText text={config.problem.nix} size={250} maxWidth={SAFE.width * 0.8} variant="white" />
							</At>
						) : null}
					</AbsoluteFill>
				) : null}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
