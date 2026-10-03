import {fitText} from '@remotion/layout-utils';
import React, {useEffect, useState} from 'react';
import {
	AbsoluteFill,
	Audio,
	continueRender,
	delayRender,
	Easing,
	interpolate,
	OffthreadVideo,
	random,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {FPS, FX, Line, LINES, MUSIC, Scene, SCENES, Sfx, SFX, STYLE, TINTS} from './config';
import {ENVELOPE} from './envelope';
import {ARABIC_FONT, fontsReady, LATIN_FONT} from './fonts';

/** Überblendung zwischen Szenen (Frames). Lang und weich: der Gesang fließt auch. */
const XF = 16;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Lautstärke des Gesangs an Frame f, 0–1 (vorberechnet, siehe envelope.ts). */
const env = (f: number) => ENVELOPE[Math.max(0, Math.min(ENVELOPE.length - 1, Math.round(f)))] ?? 0;

/** Weiches Zufallsrauschen (-1…1): zwischen zufälligen Stützwerten interpoliert, kein hartes Flackern. */
const noise = (seed: string, x: number) => {
	const i = Math.floor(x);
	const t = x - i;
	const k = t * t * (3 - 2 * t);
	return (random(`${seed}${i}`) * 2 - 1) * (1 - k) + (random(`${seed}${i + 1}`) * 2 - 1) * k;
};

/** Stoß bei jedem Worteinsatz: schnell an, gedämpft abklingend (0–1). */
const punch = (frame: number) => {
	let v = 0;
	for (const l of LINES)
		for (const w of l.words) {
			const d = frame - w * FPS;
			if (d >= 0 && d < 20) v = Math.max(v, Math.exp(-d / 5));
		}
	return v;
};

const sceneBounds = (i: number, total: number) => {
	const s = SCENES[i];
	const start = Math.max(0, Math.round(s.from * FPS) - (i === 0 ? 0 : XF / 2));
	const next = SCENES[i + 1];
	const end = next ? Math.round(next.from * FPS) + XF / 2 : total;
	return {start, end};
};

// ---------- Bild ----------

const SceneLayer: React.FC<{scene: Scene; index: number; length: number}> = ({scene, index, length}) => {
	const frame = useCurrentFrame();
	const opacity = index === 0 ? 1 : interpolate(frame, [0, XF], [0, 1], {...clamp, easing: ease});
	const scale = scene.zoom * interpolate(frame, [0, length], [1, scene.push], clamp);
	const video = {
		src: staticFile(`clips/${scene.clip}`),
		trimBefore: Math.round(scene.clipStart * FPS),
		playbackRate: scene.rate,
		muted: true,
	};
	const fill: React.CSSProperties = {
		width: '100%',
		height: '100%',
		objectFit: 'cover',
		objectPosition: `${scene.focusX}% 50%`,
	};
	return (
		<AbsoluteFill style={{opacity, transform: `scale(${scale})`}}>
			<OffthreadVideo {...video} style={{...fill, filter: scene.filter}} />
			{/* Bloom: weichgezeichnete, aufgehellte Kopie im Screen-Modus */}
			<OffthreadVideo
				{...video}
				style={{
					...fill,
					position: 'absolute',
					inset: 0,
					filter: `${scene.filter} blur(30px) brightness(1.6)`,
					mixBlendMode: 'screen',
					opacity: scene.glow,
				}}
			/>
			<AbsoluteFill style={{background: TINTS[index], mixBlendMode: 'soft-light', opacity: 0.7}} />
		</AbsoluteFill>
	);
};

/** Glut, die von der Flamme aufsteigt – nur in der Kerzenszene. */
const Embers: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const candle = SCENES[2];
	const moon = SCENES[3];
	const env = interpolate(
		frame / FPS,
		[candle.from - 0.2, candle.from + 0.8, moon.from - 0.2, moon.from + 0.6],
		[0, 1, 1, 0.25],
		clamp,
	);
	if (env <= 0) return null;
	return (
		<AbsoluteFill style={{mixBlendMode: 'screen', opacity: env}}>
			{new Array(34).fill(0).map((_, i) => {
				const life = 70 + random(`l${i}`) * 90;
				const t = ((frame + random(`o${i}`) * life) % life) / life;
				const x0 = width * (0.3 + random(`x${i}`) * 0.4);
				const x = x0 + Math.sin(t * 6 + i) * (20 + random(`w${i}`) * 50) + (x0 - width / 2) * t * 0.8;
				const y = height * (0.62 - t * (0.45 + random(`h${i}`) * 0.35));
				const size = 2.5 + random(`r${i}`) * 5;
				const a = Math.sin(Math.PI * t) * (0.5 + random(`a${i}`) * 0.5);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x,
							top: y,
							width: size,
							height: size,
							borderRadius: '50%',
							background: 'rgba(255,214,150,1)',
							boxShadow: `0 0 ${size * 3}px ${size}px rgba(255,140,40,0.55)`,
							opacity: a,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

const Grain: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay'}}>
			<svg width="100%" height="100%">
				<filter id="g">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 24} />
				</filter>
				<rect width="100%" height="100%" filter="url(#g)" />
			</svg>
		</AbsoluteFill>
	);
};

const Vignette: React.FC = () => (
	<AbsoluteFill
		style={{
			background:
				'radial-gradient(ellipse 80% 62% at 50% 48%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.5) 76%, rgba(0,0,0,0.9) 100%)',
		}}
	/>
);

/** Dunkler Hof hinter dem Text, damit er auch auf der hellen Flamme lesbar bleibt. */
const TextShade: React.FC = () => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse 75% 13% at 50% ${STYLE.textY + 20}px, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)`,
		}}
	/>
);

// ---------- Text ----------

const glowShadow = (k: number) =>
	[
		`0 0 ${6 * k}px ${STYLE.glow}0.9)`,
		`0 0 ${22 * k}px ${STYLE.glow}0.65)`,
		`0 0 ${60 * k}px ${STYLE.glow}0.45)`,
		`0 ${3 * k}px ${10 * k}px rgba(0,0,0,0.6)`,
	].join(', ');

const LyricLine: React.FC<{line: Line}> = ({line}) => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const outF = line.out * FPS;
	const arabicSize = Math.min(
		STYLE.arabicSize,
		fitText({text: line.ar.join(' '), withinWidth: STYLE.textWidth, fontFamily: ARABIC_FONT, fontWeight: 700})
			.fontSize,
	);
	const subSize = Math.min(
		STYLE.subSize,
		fitText({text: line.de, withinWidth: STYLE.subWidth, fontFamily: LATIN_FONT}).fontSize,
	);
	// Normales Ende: weich unscharf werden und verblassen
	const fadeOut = line.smoke ? 1 : interpolate(frame, [outF, outF + 12], [1, 0], clamp);
	const fadeBlur = line.smoke ? 0 : interpolate(frame, [outF, outF + 12], [0, 12], clamp);
	// Deutsch erscheint mit dem ersten Wort, langsam
	const deP = interpolate(t, [line.words[0] + 0.15, line.words[0] + 1.1], [0, 1], {...clamp, easing: ease});
	// Rauch-Ende: auch die deutsche Zeile steigt auf
	const deSmoke = line.smoke ? interpolate(frame, [outF, outF + 26], [0, 1], {...clamp, easing: Easing.in(Easing.quad)}) : 0;
	const breathe = Math.sin(frame / 26) * 3;
	// Zittern der Schrift mit der Stimme: feines Dauerzittern + Ausschlag bei lauten Stellen und Worteinsätzen
	const e = env(frame);
	const pu = punch(frame);
	const tremor = FX.tremorBase + FX.tremor * Math.pow(e, 2.2) + FX.punchShake * pu;
	const tick = Math.floor(frame / 2);
	const jx = (random(`tx${tick}`) - 0.5) * 2 * tremor;
	const jy = (random(`ty${tick}`) - 0.5) * 2 * tremor;
	const rot = (random(`tr${tick}`) - 0.5) * tremor * 0.12;
	// Farbversatz rot/cyan nur auf Höhepunkten und kurz beim Worteinsatz
	const split = FX.split * Math.max(Math.pow(Math.max(0, e - 0.6) / 0.4, 1.5), pu * 0.7);
	const splitShadow = split > 0.3 ? `, ${-split}px 0 0 rgba(255,60,60,0.55), ${split}px 0 0 rgba(60,220,255,0.55)` : '';

	return (
		<AbsoluteFill style={{opacity: fadeOut, filter: fadeBlur ? `blur(${fadeBlur}px)` : undefined}}>
			<div
				style={{
					position: 'absolute',
					left: 50,
					right: 50,
					top: STYLE.textY - 150,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					transform: `translate(${jx}px, ${breathe + jy}px) rotate(${rot}deg) scale(${1 + pu * FX.punchScale})`,
				}}
			>
				<div
					lang="ar"
					dir="rtl"
					style={{
						display: 'flex',
						flexWrap: 'nowrap',
						justifyContent: 'center',
						columnGap: '0.22em',
						fontFamily: ARABIC_FONT,
						fontWeight: 700,
						fontSize: arabicSize,
						lineHeight: 1.6,
						color: STYLE.textColor,
						textShadow: glowShadow(1) + splitShadow,
					}}
				>
					{line.ar.map((w, i) => {
						const f = frame - line.words[i] * FPS;
						const p = interpolate(f, [0, 16], [0, 1], {...clamp, easing: ease});
						// Aufglühen beim Erscheinen: kurz heller als danach
						const flare = interpolate(f, [0, 6, 24], [0, 1, 0], clamp);
						// Rauch: Wörter steigen in Lesereihenfolge versetzt auf und lösen sich auf
						const s = line.smoke
							? interpolate(frame, [outF + i * 5, outF + i * 5 + 26], [0, 1], {...clamp, easing: Easing.in(Easing.quad)})
							: 0;
						const blur = (1 - p) * 16 + s * 22;
						return (
							<span
								key={i}
								style={{
									display: 'inline-block',
									padding: '0 0.08em',
									opacity: p * (1 - s),
									filter: blur > 0.01 || flare > 0.01 ? `blur(${blur}px) brightness(${1 + flare * 0.6})` : undefined,
									transform: `translateY(${(1 - p) * 26 - s * 140}px) scale(${1.08 - 0.08 * p + s * 0.15})`,
								}}
							>
								{w}
							</span>
						);
					})}
				</div>
				<div
					style={{
						fontFamily: LATIN_FONT,
						fontSize: subSize,
						whiteSpace: 'nowrap',
						lineHeight: 1.3,
						marginTop: 6,
						letterSpacing: '0.02em',
						color: 'rgba(255,240,222,0.92)',
						textShadow: glowShadow(0.45),
						opacity: deP * (1 - deSmoke),
						filter: deP < 1 || deSmoke > 0 ? `blur(${(1 - deP) * 8 + deSmoke * 14}px)` : undefined,
						transform: `translateY(${(1 - deP) * 12 - deSmoke * 80}px)`,
					}}
				>
					{line.de}
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------- Ton ----------

const SfxTrack: React.FC<{sfx: Sfx}> = ({sfx}) => {
	const len = (sfx.until - sfx.at) * FPS;
	const fi = (sfx.fadeIn ?? 0) * FPS;
	const fo = (sfx.fadeOut ?? 0.15) * FPS;
	return (
		<Audio
			src={staticFile(`sfx/${sfx.file}`)}
			volume={(f) =>
				sfx.volume * Math.min(fi > 0 ? Math.min(1, f / fi) : 1, Math.max(0, Math.min(1, (len - f) / fo)))
			}
		/>
	);
};

export const RahilReel: React.FC = () => {
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
	// Ende: kurz ins Schwarz, dann setzt die Schleife wieder mit dem Regen ein
	const e = env(frame);
	const amp = FX.camDrift + FX.camShake * (Math.pow(e, 3) + punch(frame) * 0.6);
	const cam = `translate(${noise('cx', frame / 9) * amp}px, ${noise('cy', frame / 9) * amp}px) rotate(${noise('cr', frame / 14) * amp * 0.03}deg) scale(1.04)`;
	const endFade = interpolate(frame, [durationInFrames - 14, durationInFrames - 1], [0, 1], clamp);
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			{/* Handkamera: leichtes Schweben, bei lauten Stellen und Worteinsätzen stärker */}
			<AbsoluteFill style={{transform: cam}}>
				{SCENES.map((s, i) => {
					const {start, end} = sceneBounds(i, durationInFrames);
					return (
						<Sequence key={i} from={start} durationInFrames={end - start} name={s.clip}>
							<SceneLayer scene={s} index={i} length={end - start} />
						</Sequence>
					);
				})}
			</AbsoluteFill>
			<Embers />
			<Vignette />
			<TextShade />
			{LINES.map((l, i) => {
				const from = Math.round((l.words[0] - 0.1) * FPS);
				const to = Math.round((l.out + 1.3) * FPS);
				return fontsOk && frame >= from && frame < to ? (
					<LyricLine key={i} line={l} />
				) : null;
			})}
			<Grain />
			<AbsoluteFill style={{background: '#000', opacity: endFade}} />
			<Audio src={staticFile(MUSIC.file)} volume={MUSIC.volume} />
			{SFX.map((x, i) => (
				<Sequence
					key={`sfx${i}`}
					from={Math.round(x.at * FPS)}
					durationInFrames={Math.round((x.until - x.at) * FPS)}
					name={`SFX ${x.file}`}
					layout="none"
				>
					<SfxTrack sfx={x} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
