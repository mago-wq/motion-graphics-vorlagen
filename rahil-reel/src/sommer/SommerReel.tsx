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
import {ARABIC_FONT, fontsReady, SERIF_FONT} from '../fonts';
import {clamp, env, noise, punchAt} from '../fx';
import {MUSIC} from '../config';
import {Block, BLOCKS, FINALE, FPS, FX, IMPACT, LOOK, MEMORY, Scene, SCENES, Sfx, SFX, STYLE} from './config';

/** Überblendung zwischen Szenen (Frames). */
const XF = 12;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

const ONSETS = [...BLOCKS.flatMap((b) => b.phrases.map((p) => p.at)), ...FINALE.words];
const punch = (frame: number) => Math.max(punchAt(frame, FPS, ONSETS), punchAt(frame, FPS, [IMPACT]) * 1.6);

/** 0 = normaler Look, 1 = ausgeblichene Erinnerung (Sepia). */
const memory = (t: number) =>
	interpolate(t, [MEMORY.at, MEMORY.full, MEMORY.hold, MEMORY.gone], [0, 1, 1, 0], {...clamp, easing: ease});

// ---------- Bild ----------

const SceneLayer: React.FC<{scene: Scene; isFirst: boolean; length: number}> = ({scene, isFirst, length}) => {
	const frame = useCurrentFrame();
	const opacity = isFirst ? 1 : interpolate(frame, [0, XF], [0, 1], {...clamp, easing: ease});
	const scale = scene.zoom * interpolate(frame, [0, length], [1, scene.push], clamp);
	const video = {
		src: staticFile(`clips/${scene.clip}`),
		trimBefore: Math.round(scene.clipStart * FPS),
		playbackRate: scene.rate,
		muted: true,
	};
	const fill: React.CSSProperties = {
		position: 'absolute',
		inset: 0,
		width: '100%',
		height: '100%',
		objectFit: 'cover',
		objectPosition: `${scene.focusX}% 50%`,
	};
	return (
		<AbsoluteFill style={{opacity, transform: `scale(${scale})`}}>
			<OffthreadVideo {...video} style={{...fill, filter: scene.filter}} />
			{/* Film-Halation: rot getönter, weichgezeichneter Schein um helle Stellen */}
			<OffthreadVideo
				{...video}
				style={{
					...fill,
					filter: `${scene.filter} brightness(0.9) contrast(1.8) blur(26px) sepia(1) saturate(5) hue-rotate(-25deg)`,
					mixBlendMode: 'screen',
					opacity: LOOK.halation,
				}}
			/>
		</AbsoluteFill>
	);
};

/** Warmes Lichtleck an jedem Schnitt, mal von links, mal von rechts. */
const LightLeak: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<>
			{SCENES.slice(1).map((s, i) => {
				const c = s.from * FPS;
				const v = interpolate(frame, [c - 8, c, c + 16], [0, 0.55, 0], clamp);
				if (v <= 0) return null;
				const x = i % 2 ? 85 : 15;
				return (
					<AbsoluteFill
						key={i}
						style={{
							opacity: v,
							mixBlendMode: 'screen',
							background: `radial-gradient(ellipse 70% 55% at ${x}% ${30 + (i % 3) * 15}%, rgba(255,150,70,1) 0%, rgba(200,60,30,0.6) 40%, rgba(0,0,0,0) 75%)`,
						}}
					/>
				);
			})}
		</>
	);
};

/** Staub und gelegentliche Kratzer wie auf altem Film. */
const Dust: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const specks = new Array(7).fill(0).map((_, i) => {
		const on = random(`d${frame}-${i}`) < 0.45;
		if (!on) return null;
		const s = 2 + random(`ds${frame}-${i}`) * 5;
		return (
			<div
				key={i}
				style={{
					position: 'absolute',
					left: random(`dx${frame}-${i}`) * width,
					top: random(`dy${frame}-${i}`) * height,
					width: s,
					height: s * (0.6 + random(`dh${frame}-${i}`)),
					borderRadius: '50%',
					background: random(`dc${frame}-${i}`) < 0.5 ? 'rgba(255,240,220,0.5)' : 'rgba(0,0,0,0.6)',
				}}
			/>
		);
	});
	// Kratzer: hält ein paar Frames, wandert leicht
	const block = Math.floor(frame / 6);
	const scratch = random(`sc${block}`) < 0.35;
	const sx = (0.15 + random(`sx${block}`) * 0.7) * width + (frame % 6) * 1.5;
	return (
		<AbsoluteFill>
			{specks}
			{scratch && (
				<div
					style={{
						position: 'absolute',
						left: sx,
						top: 0,
						width: 1.5,
						height: '100%',
						background: 'linear-gradient(180deg, rgba(255,240,220,0) 0%, rgba(255,240,220,0.22) 40%, rgba(255,240,220,0.05) 100%)',
					}}
				/>
			)}
		</AbsoluteFill>
	);
};

const Grain: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: LOOK.grain, mixBlendMode: 'overlay'}}>
			<svg width="100%" height="100%">
				<filter id="g">
					<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={frame % 24} />
				</filter>
				<rect width="100%" height="100%" filter="url(#g)" />
			</svg>
		</AbsoluteFill>
	);
};

/** Gemeinsamer Bildlook: angehobene braune Schwärzen, Petrol-Schatten, Bernstein-Lichter, Vignette. */
const Grade: React.FC = () => (
	<>
		<AbsoluteFill style={{background: LOOK.blackLift, mixBlendMode: 'lighten'}} />
		<AbsoluteFill
			style={{
				opacity: LOOK.shadowTint,
				mixBlendMode: 'soft-light',
				background: 'linear-gradient(180deg, #0b2233 0%, #14202c 55%, #1c1020 100%)',
			}}
		/>
		<AbsoluteFill
			style={{
				opacity: LOOK.highlightTint,
				mixBlendMode: 'soft-light',
				background: 'radial-gradient(ellipse 90% 60% at 50% 40%, #ffb060 0%, #a04010 60%, #000 100%)',
			}}
		/>
		<AbsoluteFill
			style={{
				background:
					'radial-gradient(ellipse 85% 65% at 50% 46%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.94) 100%)',
			}}
		/>
	</>
);

/** Dunkler Hof hinter dem Text, damit er auf hellen Szenen lesbar bleibt. */
const TextShade: React.FC = () => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse 85% 17% at 50% ${STYLE.textY}px, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)`,
		}}
	/>
);

// ---------- Text ----------

const glowShadow = (k: number) =>
	[
		`0 0 ${8 * k}px rgba(255,200,140,0.75)`,
		`0 0 ${30 * k}px rgba(255,150,80,0.45)`,
		`0 ${3 * k}px ${14 * k}px rgba(0,0,0,0.75)`,
	].join(', ');

/** Zittern, Ruck und Farbversatz – alles an der Stimme. */
const useTremor = () => {
	const frame = useCurrentFrame();
	const e = env(frame);
	const pu = punch(frame);
	const tremor = FX.tremorBase + FX.tremor * Math.pow(e, 2.2) + FX.punchShake * pu;
	const tick = Math.floor(frame / 2);
	const jx = (random(`tx${tick}`) - 0.5) * 2 * tremor;
	const jy = (random(`ty${tick}`) - 0.5) * 2 * tremor;
	const rot = (random(`tr${tick}`) - 0.5) * tremor * 0.12;
	const split = FX.split * Math.max(Math.pow(Math.max(0, e - 0.6) / 0.4, 1.5), pu * 0.7);
	const splitShadow =
		split > 0.3 ? `, ${-split}px 0 0 rgba(255,60,60,0.5), ${split}px 0 0 rgba(60,220,255,0.5)` : '';
	const breathe = Math.sin(frame / 26) * 3;
	return {
		transform: `translate(${jx}px, ${breathe + jy}px) rotate(${rot}deg) scale(${1 + pu * FX.punchScale})`,
		splitShadow,
	};
};

const reveal = (frame: number, at: number) => {
	const f = frame - at * FPS;
	const p = interpolate(f, [0, 16], [0, 1], {...clamp, easing: ease});
	const flare = interpolate(f, [0, 6, 24], [0, 1, 0], clamp);
	return {p, flare};
};

const StatementBlock: React.FC<{block: Block}> = ({block}) => {
	const frame = useCurrentFrame();
	const outF = block.out * FPS;
	const out = interpolate(frame, [outF, outF + 12], [1, 0], clamp);
	const outBlur = interpolate(frame, [outF, outF + 12], [0, 14], clamp);
	const {transform, splitShadow} = useTremor();
	return (
		<AbsoluteFill style={{opacity: out, filter: outBlur ? `blur(${outBlur}px)` : undefined}}>
			<div
				style={{
					position: 'absolute',
					left: 40,
					right: 40,
					top: STYLE.textY,
					transform: `translateY(-50%) ${transform}`,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					fontFamily: SERIF_FONT,
					color: STYLE.textColor,
					textAlign: 'center',
				}}
			>
				{block.phrases.map((ph, i) => {
					const {p, flare} = reveal(frame, ph.at);
					const blur = (1 - p) * 16;
					return (
						<div
							key={i}
							style={{
								fontSize: ph.size,
								fontStyle: ph.italic ? 'italic' : 'normal',
								fontWeight: ph.italic ? 500 : 500,
								lineHeight: 1.08,
								letterSpacing: ph.italic ? '0' : '0.01em',
								whiteSpace: 'nowrap',
								marginTop: ph.italic ? 10 : 0,
								opacity: p,
								textShadow: glowShadow(ph.italic ? 1.2 : 0.9) + splitShadow,
								filter: blur > 0.01 || flare > 0.01 ? `blur(${blur}px) brightness(${1 + flare * 0.5})` : undefined,
								transform: `translateY(${(1 - p) * 26}px) scale(${1.06 - 0.06 * p})`,
							}}
						>
							{ph.text}
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

/** Schluss: „يا راحلًا…“ mit deutscher Zeile, löst sich wie Rauch nach oben auf. */
const Finale: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const outF = FINALE.out * FPS;
	const {transform, splitShadow} = useTremor();
	const arabicSize = Math.min(
		STYLE.arabicSize,
		fitText({text: FINALE.ar.join(' '), withinWidth: 900, fontFamily: ARABIC_FONT, fontWeight: 700}).fontSize,
	);
	const deP = interpolate(t, [FINALE.words[0] + 0.15, FINALE.words[0] + 1.1], [0, 1], {...clamp, easing: ease});
	const deSmoke = interpolate(frame, [outF, outF + 26], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left: 50,
					right: 50,
					top: STYLE.textY,
					transform: `translateY(-50%) ${transform}`,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<div
					lang="ar"
					dir="rtl"
					style={{
						display: 'flex',
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
					{FINALE.ar.map((w, i) => {
						const {p, flare} = reveal(frame, FINALE.words[i]);
						const s = interpolate(frame, [outF + i * 5, outF + i * 5 + 26], [0, 1], {
							...clamp,
							easing: Easing.in(Easing.quad),
						});
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
						fontFamily: SERIF_FONT,
						fontStyle: 'italic',
						fontWeight: 500,
						fontSize: STYLE.subSize,
						whiteSpace: 'nowrap',
						marginTop: 0,
						color: 'rgba(255,240,222,0.95)',
						textShadow: glowShadow(0.6),
						opacity: deP * (1 - deSmoke),
						filter: deP < 1 || deSmoke > 0 ? `blur(${(1 - deP) * 8 + deSmoke * 14}px)` : undefined,
						transform: `translateY(${(1 - deP) * 12 - deSmoke * 80}px)`,
					}}
				>
					{FINALE.de}
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

export const SommerReel: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const {durationInFrames} = useVideoConfig();
	const [fontsOk, setFontsOk] = useState(false);
	const [gate] = useState(() => delayRender('FontGate'));
	useEffect(() => {
		fontsReady.then(() => {
			setFontsOk(true);
			continueRender(gate);
		});
	}, [gate]);

	// Handkamera + Bildstand-Wackeln wie im Projektor
	const e = env(frame);
	const amp = FX.camDrift + FX.camShake * (Math.pow(e, 3) + punch(frame) * 0.6);
	const weaveX = (random(`wx${frame}`) - 0.5) * LOOK.weave;
	const weaveY = (random(`wy${frame}`) - 0.5) * LOOK.weave * 1.5;
	const cam = `translate(${noise('cx', frame / 9) * amp + weaveX}px, ${noise('cy', frame / 9) * amp + weaveY}px) rotate(${noise('cr', frame / 14) * amp * 0.03}deg) scale(1.04)`;
	// Projektorflackern, bei „Vergangenheit“ stärker; dort läuft auch die Farbe aus
	const m = memory(t);
	const flick = (random(`fl${frame}`) - 0.5) * 2 * LOOK.flicker * (1 + m * 1.5);
	const sceneFilter = `brightness(${1 + flick - m * 0.08}) saturate(${1 - 0.75 * m}) sepia(${0.6 * m}) contrast(${1 + 0.1 * m})`;
	const endFade = interpolate(frame, [durationInFrames - 14, durationInFrames - 1], [0, 1], clamp);

	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<AbsoluteFill style={{transform: cam, filter: sceneFilter}}>
				{SCENES.map((s, i) => {
					const start = Math.max(0, Math.round(s.from * FPS) - (i === 0 ? 0 : XF / 2));
					const next = SCENES[i + 1];
					const end = next ? Math.round(next.from * FPS) + XF / 2 : durationInFrames;
					return (
						<Sequence key={i} from={start} durationInFrames={end - start} name={s.clip}>
							<SceneLayer scene={s} isFirst={i === 0} length={end - start} />
						</Sequence>
					);
				})}
				<LightLeak />
			</AbsoluteFill>
			<Grade />
			<TextShade />
			{fontsOk &&
				BLOCKS.map((b, i) => {
					const from = Math.round((b.phrases[0].at - 0.1) * FPS);
					const to = Math.round((b.out + 0.5) * FPS);
					return frame >= from && frame < to ? <StatementBlock key={i} block={b} /> : null;
				})}
			{fontsOk && frame >= Math.round((FINALE.words[0] - 0.1) * FPS) && <Finale />}
			<Dust />
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
