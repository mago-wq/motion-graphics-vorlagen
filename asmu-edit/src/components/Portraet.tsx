// Einstieg: Büste von Ibn Battuta steigt aus dem Dunkel ins Bild und bewegt sich leicht,
// dahinter bricht der Morgen an. Die Augen deckt IMMER ein Balken mit seinem Namen ab
// (Vorgabe: bei jedem Gesicht die Augen verdecken). Der Balken sitzt im selben Container
// wie das Bild, folgt also jeder Bewegung, und wird nie ohne das Bild ein- oder ausgeblendet.
import React from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {AUGEN, COLORS, PORTRAET} from '../config';
import {ARABIC} from '../fonts';
import {clamp, easeOut, noise} from '../fx';
import {FPS} from '../timing';
import {sourceTime} from '../rampe';

const IMG_W = 2000;
const IMG_H = 2572;

/** Bild + Augenbalken; Größe und Lage in Bildschirmpixeln. */
export const Bueste: React.FC<{breite: number}> = ({breite}) => {
	const hoehe = (breite * IMG_H) / IMG_W;
	const balkenH = AUGEN.h * hoehe;
	return (
		<div style={{position: 'relative', width: breite, height: hoehe}}>
			<Img
				src={staticFile('bilder/ibn_battuta_frei.png')}
				style={{
					width: '100%',
					height: '100%',
					filter: `contrast(1.15) brightness(0.95) sepia(0.35) drop-shadow(0 0 26px rgba(226,184,92,0.45)) drop-shadow(0 30px 60px rgba(0,0,0,0.8))`,
				}}
			/>
			{/* Augenbalken: deckend schwarz, Goldkanten, darauf der Name */}
			<div
				style={{
					position: 'absolute',
					left: `${AUGEN.x * 100}%`,
					top: `${AUGEN.y * 100}%`,
					width: `${AUGEN.w * 100}%`,
					height: balkenH,
					transform: `rotate(${AUGEN.drehung}deg)`,
					background: '#050505',
					borderTop: `3px solid ${COLORS.gold}`,
					borderBottom: `3px solid ${COLORS.gold}`,
					boxShadow: `0 0 28px rgba(226,184,92,0.55), 0 8px 30px rgba(0,0,0,0.85)`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<div
					lang="ar"
					dir="rtl"
					style={{
						fontFamily: ARABIC,
						fontWeight: 700,
						fontSize: balkenH * 0.66,
						lineHeight: 1,
						paddingBottom: balkenH * 0.08,
						color: COLORS.goldHell,
						whiteSpace: 'nowrap',
						textShadow: '0 0 18px rgba(226,184,92,0.8), 0 0 40px rgba(226,184,92,0.4)',
					}}
				>
					{PORTRAET.name}
				</div>
			</div>
		</div>
	);
};

export const Portraet: React.FC<{t: number; still?: boolean}> = ({t, still}) => {
	const frame = useCurrentFrame();
	const breite = PORTRAET.breite;
	const hoehe = (breite * IMG_H) / IMG_W;
	const left = 540 - AUGEN.mitteX * breite;
	const top = 1920 - hoehe + PORTRAET.unten;
	// Erscheinen: steigt aus dem Dunkel, wird scharf (0,7 s); danach leichtes Schweben
	const ein = still ? 1 : interpolate(t, [0, 0.7], [0, 1], {...clamp, easing: easeOut});
	const p = t / PORTRAET.dauer;
	const scale = (1.09 - 0.09 * ein) * (1 + 0.05 * p);
	const y = (1 - ein) * 170;
	const x = noise('px', t * 0.9) * 10;
	const rot = Math.sin(t * 1.4) * 0.7;
	// Morgenlicht hinter ihm, ab „أسمو“
	const licht = interpolate(t, [PORTRAET.licht, PORTRAET.licht + 0.9], [0, 1], {...clamp, easing: easeOut});
	return (
		<AbsoluteFill>
			{/* Hintergrund: Berg, Nacht -> Dämmerung, unscharf (Tiefe) */}
			<AbsoluteFill style={{transform: `scale(${1.12 + 0.06 * p})`}}>
				{still ? (
					<OffthreadVideo src={staticFile('clips/4357.mp4')} trimBefore={Math.round(4.2 * FPS)} muted
						style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(7px) brightness(0.7)'}} />
				) : (
					<Sequence from={frame} name="Rampe">
						<OffthreadVideo
							src={staticFile('clips/4357.mp4')}
							trimBefore={Math.round(sourceTime({from: 0, to: 0, src: '', name: '', ramp: PORTRAET.ramp}, t) * FPS)}
							muted
							style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(7px) brightness(0.72) saturate(0.85)'}}
						/>
					</Sequence>
				)}
			</AbsoluteFill>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 60% 38% at 50% 50%, rgba(246,220,151,${0.55 * licht}), rgba(232,118,58,${0.18 * licht}) 45%, rgba(0,0,0,0) 75%)`,
					mixBlendMode: 'screen',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left,
					top,
					opacity: ein,
					filter: ein < 0.98 ? `blur(${(1 - ein) * 12}px)` : undefined,
					transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
					transformOrigin: `${AUGEN.mitteX * 100}% 45%`,
				}}
			>
				<Bueste breite={breite} />
			</div>
			{/* unten abdunkeln, damit der Text auf Bart und Gewand lesbar bleibt */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.8))'}} />
		</AbsoluteFill>
	);
};
