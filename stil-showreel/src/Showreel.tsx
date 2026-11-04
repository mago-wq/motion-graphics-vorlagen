import React from 'react';
import {AbsoluteFill, Audio, Freeze, getStaticFiles, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FontGate} from './fonts';
import {Hud} from './Hud';
import {easeIn, easeOut} from './lib/motion';
import {FLIP, SHOTS, STILL_FROM} from './timing';
import {SHOT_COMPONENTS} from './shots';

/** Match-Cuts ohne Ruck: dieselbe Szene läuft weiter, nur der Stil wechselt. */
const NO_PUNCH = new Set(['pixel', 'ascii', 'matrix', 'blaupause', 'cel', 'brutal', 'deco']);
const FLIP_OUT = new Set(['bauhaus', 'deco']);
const FLIP_IN = new Set(['deco', 'brutal']);

const ShotFrame: React.FC<{id: string; dur: number; children: React.ReactNode}> = ({id, dur, children}) => {
	const f = useCurrentFrame();
	let rotY = 0;
	if (FLIP_OUT.has(id) && f >= dur - FLIP.out) {
		rotY = interpolate(f, [dur - FLIP.out, dur], [0, 90], {easing: easeIn});
	}
	if (FLIP_IN.has(id) && f < FLIP.in) {
		rotY = interpolate(f, [-1, FLIP.in], [-90, 0], {easing: easeOut, extrapolateRight: 'clamp'});
	}
	const flipping = rotY !== 0;
	const punch = NO_PUNCH.has(id) ? 1 : interpolate(f, [0, 3], [1.04, 1], {extrapolateRight: 'clamp', easing: easeOut});
	const card = flipping ? 0.9 + 0.1 * Math.cos((rotY * Math.PI) / 180) : 1;
	return (
		<AbsoluteFill style={{background: flipping ? '#0e0e10' : undefined, perspective: 2200}}>
			<AbsoluteFill
				style={{
					transform: `scale(${punch * card}) rotateY(${rotY}deg)`,
					borderRadius: flipping ? 40 : 0,
					overflow: 'hidden',
					boxShadow: flipping ? '0 40px 80px rgba(0,0,0,0.6)' : undefined,
					backfaceVisibility: 'hidden',
				}}
			>
				{children}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const hasMix = () => getStaticFiles().some((f) => f.name === 'ton/mix.wav');

export const Showreel: React.FC = () => {
	const g = useCurrentFrame();
	const content = (
		<>
			{SHOTS.map((s) => {
				const C = SHOT_COMPONENTS[s.id];
				return (
					<Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id} layout="none">
						<ShotFrame id={s.id} dur={s.dur}>
							<C />
						</ShotFrame>
					</Sequence>
				);
			})}
			<Hud />
		</>
	);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<FontGate>{g >= STILL_FROM ? <Freeze frame={STILL_FROM}>{content}</Freeze> : content}</FontGate>
			{hasMix() ? <Audio src={staticFile('ton/mix.wav')} /> : null}
		</AbsoluteFill>
	);
};
