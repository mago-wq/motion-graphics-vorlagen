// Vorbilder als Büsten: Ibn Battuta im Einstieg, Sinan und al-Chwarizmi über ihren Einstellungen.
// Die Augen deckt IMMER ein Balken mit dem Namen ab (Vorgabe: bei jedem Gesicht die Augen
// verdecken). Der Balken sitzt im selben Container wie das Bild, folgt also jeder Bewegung,
// und wird nie ohne das Bild ein- oder ausgeblendet.
import React from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Bueste as BuesteDef, COLORS, PORTRAET, Vorbild, VORBILDER} from '../config';
import {ARABIC} from '../fonts';
import {clamp, easeIn, easeOut, noise} from '../fx';
import {FPS} from '../timing';
import {sourceTime} from '../rampe';

/** Bild + Augenbalken; Größe in Bildschirmpixeln. */
export const Bueste: React.FC<{vorbild: Vorbild; breite: number}> = ({vorbild, breite}) => {
	const hoehe = (breite * vorbild.h) / vorbild.w;
	const a = vorbild.augen;
	const balkenH = a.h * hoehe;
	// Schriftgröße: so groß wie der Balken hoch ist, aber nie breiter als der Balken (~0,45 em je Zeichen)
	const schrift = Math.min(balkenH * 0.66, (a.w * breite * 0.86) / (vorbild.name.length * 0.45));
	return (
		<div style={{position: 'relative', width: breite, height: hoehe}}>
			<Img
				src={staticFile(vorbild.bild)}
				style={{
					width: '100%',
					height: '100%',
					filter: `${vorbild.look ?? 'contrast(1.15) brightness(0.95) sepia(0.35)'} drop-shadow(0 0 26px rgba(226,184,92,0.45)) drop-shadow(0 30px 60px rgba(0,0,0,0.8))`,
				}}
			/>
			{/* Augenbalken: deckend schwarz, Goldkanten, darauf der Name */}
			<div
				style={{
					position: 'absolute',
					left: `${a.x * 100}%`,
					top: `${a.y * 100}%`,
					width: `${a.w * 100}%`,
					height: balkenH,
					transform: `rotate(${a.drehung}deg)`,
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
						fontSize: schrift,
						lineHeight: 1,
						paddingBottom: balkenH * 0.08,
						color: COLORS.goldHell,
						whiteSpace: 'nowrap',
						textShadow: '0 0 18px rgba(226,184,92,0.8), 0 0 40px rgba(226,184,92,0.4)',
					}}
				>
					{vorbild.name}
				</div>
			</div>
		</div>
	);
};

/** Einstieg: Ibn Battuta steigt aus dem Dunkel ins Bild, dahinter bricht auf „أسمو“ der Morgen an. */
export const Portraet: React.FC<{t: number; still?: boolean}> = ({t, still}) => {
	const frame = useCurrentFrame();
	const vorbild = VORBILDER.ibn_battuta;
	const breite = PORTRAET.breite;
	const hoehe = (breite * vorbild.h) / vorbild.w;
	const left = 540 - vorbild.mitteX * breite;
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
					transformOrigin: `${vorbild.mitteX * 100}% 45%`,
				}}
			>
				<Bueste vorbild={vorbild} breite={breite} />
			</div>
			{/* unten abdunkeln, damit der Text auf Bart und Gewand lesbar bleibt */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.8))'}} />
		</AbsoluteFill>
	);
};

/**
 * Büste über einer laufenden Einstellung (Sinan, al-Chwarizmi): steigt ins Bild, schwebt,
 * verschwindet am Ende unscharf. Lokale Zeit (in einer Sequence ab `von`).
 */
export const VorbildEbene: React.FC<{bueste: BuesteDef}> = ({bueste}) => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const dauer = bueste.bis - bueste.von;
	const vorbild = VORBILDER[bueste.vorbild];
	const breite = bueste.breite;
	const hoehe = (breite * vorbild.h) / vorbild.w;
	const augenMitte = vorbild.augen.y + vorbild.augen.h / 2;
	const left = 540 - vorbild.mitteX * breite;
	const top = bueste.augenY - augenMitte * hoehe;
	const ein = interpolate(t, [0, 0.55], [0, 1], {...clamp, easing: easeOut});
	const aus = interpolate(t, [dauer - 0.22, dauer], [0, 1], {...clamp, easing: easeIn});
	const sicht = ein * (1 - aus);
	const p = t / dauer;
	const scale = (1.08 - 0.08 * ein) * (1 + 0.04 * p) * (1 + 0.05 * aus);
	const y = (1 - ein) * 150;
	const x = noise(`vx${bueste.vorbild}`, t * 0.9) * 8;
	const rot = Math.sin(t * 1.3) * 0.6;
	const [f0, f1] = bueste.ausblenden;
	const oben = bueste.obenAus ? `transparent 0%, #000 ${bueste.obenAus * 100}%, ` : '';
	const maske =
		`linear-gradient(180deg, ${oben}#000 ${f0 * 100}%, transparent ${f1 * 100}%)` +
		(bueste.linksAus ? `, linear-gradient(90deg, transparent 0%, #000 ${bueste.linksAus * 100}%)` : '');
	return (
		<AbsoluteFill>
			{/* dunkler Hof hinter der Büste, trennt sie vom unruhigen Hintergrund */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 62% 34% at 50% ${bueste.augenY + 120}px, rgba(0,0,0,${0.62 * sicht}), rgba(0,0,0,0) 72%)`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left,
					top,
					opacity: sicht,
					filter: sicht < 0.98 ? `blur(${(1 - sicht) * 12}px)` : undefined,
					transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
					transformOrigin: `${vorbild.mitteX * 100}% ${augenMitte * 100}%`,
					maskImage: maske,
					WebkitMaskImage: maske,
					// beide Verläufe gelten zugleich (Schnittmenge)
					maskComposite: 'intersect',
					WebkitMaskComposite: 'source-in',
				}}
			>
				<Bueste vorbild={vorbild} breite={breite} />
			</div>
		</AbsoluteFill>
	);
};
