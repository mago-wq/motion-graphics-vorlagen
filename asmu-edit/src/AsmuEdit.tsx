// Hauptkomposition: Kamera (Ruck, Stoß), Bilder, Funken, Licht, Text, Ton.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ShotLayer} from './components/Shot';
import {VorbildEbene} from './components/Portraet';
import {Blitz, Funken, Grain, Strahlen, Vignette} from './components/Overlays';
import {LiedView, VersView} from './components/Lied';
import {TafelView} from './components/Tafel';
import {BUESTEN, COLORS, LIED, SFX, Sfx, SHOTS, TAFELN, VERS} from './config';
import {fontsReady} from './fonts';
import {hits, noise} from './fx';
import {FPS, fr} from './timing';

const SfxTrack: React.FC<{sfx: Sfx; len: number; skip: number}> = ({sfx, len, skip}) => {
	const fi = (sfx.fadeIn ?? 0) * FPS;
	const fo = (sfx.fadeOut ?? 0.12) * FPS;
	return (
		<Audio
			src={staticFile(`sfx/${sfx.file}.mp3`)}
			trimBefore={skip}
			volume={(f) => sfx.vol * Math.min(fi > 0 ? Math.min(1, f / fi) : 1, Math.max(0, Math.min(1, (len - f) / fo)))}
		/>
	);
};

export const AsmuEdit: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	// FontGate: Text erst zeichnen (und messen), wenn die Schriften geladen sind
	const [fontsOk, setFontsOk] = useState(false);
	const [gate] = useState(() => delayRender('FontGate'));
	useEffect(() => {
		fontsReady.then(() => {
			setFontsOk(true);
			continueRender(gate);
		});
	}, [gate]);

	const h = hits(frame);
	const sx = noise('cx', frame / 1.7) * h.shake;
	const sy = noise('cy', frame / 1.7) * h.shake;
	const rot = noise('cr', frame / 2.5) * h.shake * 0.05;
	// ruhiges Schweben, darüber Ruck und Stoß der Treffer
	const drift = `translate(${noise('dx', frame / 40) * 6}px, ${noise('dy', frame / 40) * 6}px)`;
	const cam = `${drift} translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(${1.03 + h.punch * 0.07})`;
	const textCam = `translate(${sx * 0.35}px, ${sy * 0.35}px) scale(${1 + h.punch * 0.025})`;
	const t = frame / FPS;

	return (
		<AbsoluteFill style={{backgroundColor: COLORS.nacht}}>
			<AbsoluteFill style={{transform: cam}}>
				{SHOTS.map((s, i) => {
					const from = fr(s.from);
					const to = Math.min(fr(s.to), durationInFrames);
					return (
						<Sequence key={i} from={from} durationInFrames={to - from} name={s.name}>
							<ShotLayer shot={s} />
						</Sequence>
					);
				})}
				{/* Sinan und al-Chwarizmi als Büsten über ihren Einstellungen (Augen immer abgedeckt) */}
				{BUESTEN.map((b) => (
					<Sequence key={b.vorbild} from={fr(b.von)} durationInFrames={fr(b.bis) - fr(b.von)} name={`Büste ${b.vorbild}`}>
						<VorbildEbene bueste={b} />
					</Sequence>
				))}
				<Funken />
			</AbsoluteFill>
			<Vignette />
			{/* Grundstimmung: Gold oben, Glut unten, weich eingerechnet */}
			<AbsoluteFill
				style={{
					background: 'linear-gradient(180deg, rgba(226,184,92,0.16), rgba(0,0,0,0) 38%, rgba(0,0,0,0) 62%, rgba(232,118,58,0.12))',
					mixBlendMode: 'soft-light',
				}}
			/>
			<Strahlen />
			<Blitz />
			{fontsOk ? (
				<AbsoluteFill style={{transform: textCam}}>
					{TAFELN.map((tf, i) => {
						const von = tf.zeilen[0].at - 0.05;
						return t >= von && t < tf.out + 0.05 ? <TafelView key={i} tafel={tf} /> : null;
					})}
					{LIED.map((z, i) => (t >= z.t[0] - 0.05 && t < z.out + 0.05 ? <LiedView key={`l${i}`} zeile={z} /> : null))}
				</AbsoluteFill>
			) : null}
			{fontsOk && t >= VERS.at - 0.1 ? <VersView ende={durationInFrames} /> : null}
			<Grain />
			{/* kurzes Aufblenden aus Schwarz */}
			<AbsoluteFill style={{background: '#000', opacity: interpolate(frame, [0, 6], [1, 0], {extrapolateRight: 'clamp'})}} />

			<Audio src={staticFile('ton/asmu-schnitt.wav')} />
			{SFX.map((x, i) => {
				const start = x.at - (x.peak ?? 0);
				const skip = Math.max(0, -start);
				const len = fr(x.len ?? 6) - fr(skip);
				return (
					<Sequence key={`sfx${i}`} from={fr(Math.max(0, start))} durationInFrames={Math.max(1, len)} name={`Ton ${x.file}`} layout="none">
						<SfxTrack sfx={x} len={len} skip={fr(skip)} />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};
