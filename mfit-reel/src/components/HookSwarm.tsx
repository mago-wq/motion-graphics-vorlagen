// Alle sieben Haken als ein durchgehender Ablauf, damit es keine Übergabe-Sprünge gibt:
// Haken fällt an der Schnur ins Bild → vermehrt sich auf sieben → auf dem Drop
// verwandeln sich alle in Häkchen und rasten in der Leiste ein → jedes Häkchen
// leuchtet auf, sobald sein Vorteil gezeigt wird → im Recap werden sie zur Liste.
import {interpolate} from 'remotion';
import {spring} from 'remotion';
import {clamp, EASE, impulse, progress, springFrom} from '../motion';
import {FPS} from '../video';
import {ANKER, HAKEN, ITEMS, RECAP} from '../timing';
import {HookTick} from './Glyphs';

/** Reihenfolge der Plätze (links → rechts) je Haken: der erste hängt in der Mitte, die übrigen abwechselnd außen. */
const HOOK_SLOT = [3, 2, 4, 1, 5, 0, 6];
const APPEAR = [HAKEN.faellt, ...HAKEN.vermehren];

/** Lokale Drehpunkte: Öse des Hakens, Mitte des Häkchens */
const EYE = {x: 72, y: 1};
const TICK_CENTER = {x: 52, y: 49};
/** Abstand Öse → optische Mitte des Hakens (in lokalen Einheiten) */
const EYE_TO_BODY_X = 25;

const BIG_SCALE = 2.6;
const BIG_EYE = {x: 540 + EYE_TO_BODY_X * BIG_SCALE, y: 236};
const SWARM_SCALE = 1.1;
const SWARM_EYE_Y = [262, 212, 288, 232, 300, 222, 276];
const swarmEye = (slot: number) => ({x: 540 + (slot - 3) * 132 + EYE_TO_BODY_X * SWARM_SCALE, y: SWARM_EYE_Y[slot]});

/** Häkchen-Leiste unter dem Logo */
export const ROW = {y: 448, spacing: 100, scale: 0.8};
export const rowX = (slot: number) => 540 + (slot - 3) * ROW.spacing;

/** Liste im Recap: Häkchen links, Text rechts daneben (siehe RecapScene) */
export const LIST = {x: 196, y0: 746, step: 70, scale: 0.6};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Fall an der Schnur: federt wie ein Jo-Jo ein */
const DROP_SPRING = {damping: 9, stiffness: 150, mass: 0.7};
/**
 * Frames vom Loslassen bis zum tiefsten Punkt (Schnur straff). Der Fall beginnt so
 * viel früher, dass der Haken genau auf seinem Beat einrastet – dort liegt auch der Ton.
 */
export const DROP_PEAK = (() => {
	let best = 0;
	let max = 0;
	for (let f = 0; f < 40; f++) {
		const v = spring({frame: f, fps: FPS, config: DROP_SPRING});
		if (v > max) {
			max = v;
			best = f;
		}
	}
	return best;
})();

export const HookSwarm: React.FC<{frame: number}> = ({frame}) => {
	if (frame < HAKEN.faellt - DROP_PEAK || frame >= ANKER.start + 8) return null;
	const reel = progress(frame, HAKEN.einholen, ITEMS[0].start - HAKEN.einholen, EASE.inOut);
	const ropeGone = progress(frame, HAKEN.einholen, 7, EASE.exit);
	const toSwarm = progress(frame, HAKEN.vermehren[0], 12, EASE.inOut);
	const exit = progress(frame, ANKER.start - 8, 6, EASE.inOut);

	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			{APPEAR.map((appearAt, hook) => {
				if (frame < appearAt - DROP_PEAK) return null;
				const slot = HOOK_SLOT[hook];

				// ---- hängende Pose (Schnur von oben, Pendel)
				const target = hook === 0 ? {
					x: lerp(BIG_EYE.x, swarmEye(slot).x, toSwarm),
					y: lerp(BIG_EYE.y, swarmEye(slot).y, toSwarm),
				} : swarmEye(slot);
				const scale0 = hook === 0 ? lerp(BIG_SCALE, SWARM_SCALE, toSwarm) : SWARM_SCALE;
				const drop = springFrom(frame, appearAt - DROP_PEAK, DROP_SPRING);
				const eyeY = lerp(-240, target.y, drop);
				const t0 = frame - (appearAt - DROP_PEAK);
				const amp = hook === 0 ? 15 : 11;
				const swing =
					amp * Math.exp(-t0 / 42) * Math.sin(t0 * ((2 * Math.PI) / 38) + hook * 0.9) +
					2.2 * Math.sin(frame * 0.075 + hook * 1.7) +
					// kleine Stöße, wenn "HAKEN?" und "ES GIBT 7." einschlagen
					7 * impulse(frame, HAKEN.haken, 20) * Math.sin((frame - HAKEN.haken) * 0.35) +
					5 * impulse(frame, HAKEN.esGibt, 20) * Math.sin((frame - HAKEN.esGibt) * 0.35 + hook);

				// ---- Leiste und Liste
				const item = ITEMS[slot];
				const inList = progress(frame, RECAP.zeilen[slot], 9, EASE.out);
				const rest = {
					x: lerp(rowX(slot), LIST.x, inList),
					y: lerp(ROW.y, LIST.y0 + slot * LIST.step, inList),
					scale: lerp(ROW.scale, LIST.scale, inList),
				};

				// ---- Mischung: hängend → Leiste (auf dem Drop)
				const t = reel;
				const x = lerp(target.x, rest.x, t);
				const y = lerp(eyeY, rest.y, t);
				const angle = lerp(swing, 0, t);
				const scale = lerp(scale0, rest.scale, t);
				const pivotX = lerp(EYE.x, TICK_CENTER.x, t);
				const pivotY = lerp(EYE.y, TICK_CENTER.y, t);

				// ---- eingesammelt: aufleuchten mit kleinem Pop und Ring
				const collected = frame >= item.tick;
				const popScale = collected ? 1 + 0.45 * Math.max(0, Math.sin(Math.min(1, (frame - item.tick) / 9) * Math.PI)) : 1;
				const ring = collected ? interpolate(frame - item.tick, [0, 14], [0, 1], clamp) : 0;
				const pending = t >= 1 && !collected;
				const opacity = (pending ? 0.3 : 1) * (1 - exit);
				const strokeWidth = lerp(8, 11, t);

				const ropeEndY = lerp(y, -20, ropeGone);
				const ropeX = target.x;
				return (
					<g key={hook}>
						{ropeGone < 1 ? (
							<line
								x1={ropeX}
								y1={-10}
								x2={lerp(x, ropeX, ropeGone)}
								y2={ropeEndY - 7 * scale0}
								stroke="rgba(244, 241, 234, 0.55)"
								strokeWidth={2}
							/>
						) : null}
						{ring > 0 && ring < 1 && inList === 0 ? (
							<circle
								cx={rest.x}
								cy={rest.y}
								r={20 + ring * 44}
								fill="none"
								stroke="#F8E39C"
								strokeWidth={3 * (1 - ring)}
								opacity={(1 - ring) * (1 - exit)}
							/>
						) : null}
						<g
							transform={`translate(${x} ${y - exit * 60}) rotate(${angle}) scale(${scale * popScale}) translate(${-pivotX} ${-pivotY})`}
						>
							<HookTick t={t} strokeWidth={strokeWidth} opacity={opacity} stroke={collected || t < 1 ? 'url(#gold-stroke)' : '#D4A83D'} />
						</g>
					</g>
				);
			})}
		</svg>
	);
};
