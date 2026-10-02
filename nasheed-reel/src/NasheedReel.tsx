import {fitText} from '@remotion/layout-utils';
import React, {useEffect, useState} from 'react';
import {
	AbsoluteFill,
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
import {FPS, Line, LINES, RETRO, Scene, SCENES, STYLE} from './config';
import {ARABIC_FONT, fontsReady, LATIN_FONT} from './fonts';

/** Überblendung zwischen Szenen (Frames). */
const XF = 10;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---------- Bild ----------

const SceneLayer: React.FC<{scene: Scene; isFirst: boolean; length: number}> = ({
	scene,
	isFirst,
	length,
}) => {
	const frame = useCurrentFrame();
	const opacity = isFirst ? 1 : interpolate(frame, [0, XF], [0, 1], {...clamp, easing: ease});
	// Langsames Hineinzoomen, wie eine Kamera, die näher an die Blüte geht
	const scale = scene.zoom * interpolate(frame, [0, length], [1.0, 1.09], clamp);
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
		<AbsoluteFill style={{opacity, transform: `translateY(${scene.shiftY ?? 0}px) scale(${scale})`}}>
			<OffthreadVideo
				{...video}
				style={{...fill, filter: 'contrast(1.12) saturate(1.18) brightness(0.92)'}}
			/>
			{/* Bloom: weichgezeichnete, aufgehellte Kopie im Screen-Modus */}
			<OffthreadVideo
				{...video}
				style={{
					...fill,
					position: 'absolute',
					inset: 0,
					filter: 'blur(26px) brightness(1.35) saturate(1.3)',
					mixBlendMode: 'screen',
					opacity: scene.glow,
				}}
			/>
		</AbsoluteFill>
	);
};

/** Kurzes, weiches Aufleuchten an jedem Szenenwechsel. */
const Flash: React.FC = () => {
	const frame = useCurrentFrame();
	let v = 0;
	for (const s of SCENES.slice(1)) {
		const c = s.from * FPS;
		v = Math.max(v, interpolate(frame, [c - 6, c, c + 9], [0, 0.42, 0], clamp));
	}
	return (
		<AbsoluteFill
			style={{
				opacity: v,
				background:
					'radial-gradient(ellipse at 50% 45%, rgba(225,235,255,1) 0%, rgba(150,180,255,0.55) 45%, rgba(0,0,0,0) 80%)',
				mixBlendMode: 'screen',
			}}
		/>
	);
};

/** Schwebende Lichtpunkte: das „Traumwelt“-Licht über allen Szenen. */
const Motes: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill style={{mixBlendMode: 'screen'}}>
			{new Array(46).fill(0).map((_, i) => {
				const x0 = random(`x${i}`) * width;
				const y0 = random(`y${i}`) * height;
				const speed = 0.4 + random(`s${i}`) * 1.1;
				const size = 3 + random(`r${i}`) * 9;
				const y = (((y0 - frame * speed) % height) + height) % height;
				const x = x0 + Math.sin(frame / (40 + i) + i) * 28;
				const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame / (9 + (i % 7)) + i * 1.7));
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
							background: 'rgba(255,240,220,0.95)',
							boxShadow: `0 0 ${size * 2}px ${size}px rgba(255,200,170,0.35)`,
							opacity: tw * 0.75,
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
		<AbsoluteFill style={{opacity: 0.09, mixBlendMode: 'overlay'}}>
			<svg width="100%" height="100%">
				<filter id="g">
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 24} />
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
				'radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.92) 100%)',
		}}
	/>
);

// ---------- Retro (VHS) ----------

/**
 * Bildfilter wie im Original: Farbkanäle gegeneinander versetzt (rot nach links,
 * blau nach rechts unten) und leichte Farbstufen (Posterize).
 */
const RetroDefs: React.FC = () => {
	const steps = (n: number) =>
		new Array(n)
			.fill(0)
			.map((_, i) => (i / (n - 1)).toFixed(3))
			.join(' ');
	return (
		<svg style={{position: 'absolute', width: 0, height: 0}}>
			<defs>
				<filter id="retro" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={-RETRO.imageSplit} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={RETRO.imageSplit} dy={RETRO.imageSplit * 0.4} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" result="rgb" />
					<feComponentTransfer in="rgb">
						<feFuncR type="discrete" tableValues={steps(RETRO.levels)} />
						<feFuncG type="discrete" tableValues={steps(RETRO.levels)} />
						<feFuncB type="discrete" tableValues={steps(RETRO.levels)} />
					</feComponentTransfer>
				</filter>
			</defs>
		</svg>
	);
};

/** Zeilenraster über allem, auch über der Schrift (die gestreiften Buchstaben im Original). */
const Scanlines: React.FC = () => (
	<AbsoluteFill
		style={{
			opacity: RETRO.scanlines,
			mixBlendMode: 'multiply',
			background: 'repeating-linear-gradient(to bottom, #000 0px, #000 2px, #fff 2px, #fff 6px)',
		}}
	/>
);

// ---------- Text ----------

/** Harte Farbsäume (rot links oben, blau rechts unten) plus weiches blaues Leuchten. */
const retroShadow = (k: number) =>
	[
		`${-RETRO.textSplit * k}px ${-1 * k}px 0 rgba(255,45,110,0.9)`,
		`${RETRO.textSplit * k}px ${RETRO.textSplit * 0.6 * k}px 0 rgba(35,105,255,1)`,
		`0 0 ${8 * k}px rgba(175,205,255,0.95)`,
		`0 0 ${24 * k}px rgba(70,120,255,0.95)`,
		`0 0 ${56 * k}px rgba(45,75,255,0.75)`,
	].join(', ');

/** Der Textblock. `halo` zeichnet die weichgezeichnete Leuchtkopie dahinter. */
const LyricText: React.FC<{line: Line; halo?: boolean}> = ({line, halo}) => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const first = line.words[0];
	// Englisch schreibt sich von links ein, fertig kurz nach dem letzten arabischen Wort
	const enEnd = line.words[line.words.length - 1] + 0.45;
	const enP = interpolate(t, [first, enEnd], [0, 118], {...clamp, easing: Easing.out(Easing.quad)});
	const color = halo ? 'rgb(150,185,255)' : STYLE.textColor;
	// Jede Zeile einzeilig wie im Original: Schrift schrumpft, wenn die Zeile zu breit ist
	const arabicSize = Math.min(
		STYLE.arabicSize,
		fitText({
			text: line.ar.join(' '),
			withinWidth: STYLE.textWidth,
			fontFamily: ARABIC_FONT,
			fontWeight: 700,
		}).fontSize,
	);

	return (
		<div
			style={{
				position: 'absolute',
				left: 60,
				right: 60,
				top: STYLE.textY - 140,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 0,
			}}
		>
			<div
				lang="ar"
				dir="rtl"
				style={{
					display: 'flex',
					flexWrap: 'nowrap',
					justifyContent: 'center',
					columnGap: '0.24em',
					fontFamily: ARABIC_FONT,
					fontWeight: 700,
					fontSize: arabicSize,
					lineHeight: 1.55,
					color,
					textShadow: halo ? undefined : retroShadow(1),
				}}
			>
				{line.ar.map((w, i) => {
					const f = frame - line.words[i] * FPS;
					const p = interpolate(f, [0, 12], [0, 1], {...clamp, easing: ease});
					return (
						<span
							key={i}
							style={{
								display: 'inline-block',
								padding: '0 0.08em',
								opacity: p,
								// Bei p = 1 kein Filter mehr, damit nichts am Wortrand beschnitten wird
								filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined,
								transform: `translateY(${(1 - p) * 22}px) scale(${1.1 - 0.1 * p})`,
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
					fontSize: STYLE.englishSize,
					lineHeight: 1.25,
					marginTop: 12,
					color,
					textAlign: 'center',
					textShadow: halo ? undefined : retroShadow(0.55),
					WebkitMaskImage: `linear-gradient(to right, black ${enP - 18}%, transparent ${enP}%)`,
					maskImage: `linear-gradient(to right, black ${enP - 18}%, transparent ${enP}%)`,
				}}
			>
				{line.en}
			</div>
		</div>
	);
};

const LyricLine: React.FC<{line: Line}> = ({line}) => {
	const frame = useCurrentFrame();
	const outF = line.out * FPS;
	const out = interpolate(frame, [outF, outF + 9], [1, 0], {...clamp, easing: Easing.in(Easing.quad)});
	const outBlur = interpolate(frame, [outF, outF + 9], [0, 10], clamp);
	const breathe = Math.sin(frame / 22) * 4;
	// VHS-Zittern: alle 3 Frames ein kleiner Querversatz, selten ein stärkerer Ruck
	const tick = Math.floor(frame / 3);
	const glitch = random(`gl${tick}`) < 0.06 ? 1 : 0;
	const jitter = (random(`j${tick}`) - 0.5) * (RETRO.jitter + glitch * 14);

	return (
		<AbsoluteFill
			style={{
				opacity: out,
				transform: `translate(${jitter}px, ${breathe}px)`,
			}}
		>
			{/* Leuchtschleier: weichgezeichnete Kopie hinter dem Text */}
			<AbsoluteFill
				style={{filter: `blur(${18 + outBlur}px)`, opacity: RETRO.halo, mixBlendMode: 'screen'}}
			>
				<LyricText line={line} halo />
			</AbsoluteFill>
			<AbsoluteFill style={{filter: `blur(${RETRO.textSoftness + outBlur}px)`}}>
				<LyricText line={line} />
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** Dunkler Hof hinter dem Text, damit er auf hellen Szenen lesbar bleibt. */
const TextShade: React.FC = () => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse 70% 14% at 50% ${STYLE.textY}px, rgba(0,0,10,0.45) 0%, rgba(0,0,10,0) 100%)`,
		}}
	/>
);

export const NasheedReel: React.FC = () => {
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
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<RetroDefs />
			<AbsoluteFill style={{filter: 'url(#retro)'}}>
				{SCENES.map((s, i) => {
					const start = Math.max(0, Math.round(s.from * FPS) - (i === 0 ? 0 : XF / 2));
					const next = SCENES[i + 1];
					const end = next ? Math.round(next.from * FPS) + XF : durationInFrames;
					return (
						<Sequence key={i} from={start} durationInFrames={end - start} name={s.clip}>
							<SceneLayer scene={s} isFirst={i === 0} length={end - start} />
						</Sequence>
					);
				})}
			</AbsoluteFill>
			<Flash />
			<Motes />
			<Vignette />
			<TextShade />
			{LINES.map((l, i) => {
				const from = Math.round((l.words[0] - 0.1) * FPS);
				const to = Math.round((l.out + 0.45) * FPS);
				return fontsOk && frame >= from && frame < to ? <LyricLine key={i} line={l} /> : null;
			})}
			<Scanlines />
			<Grain />
		</AbsoluteFill>
	);
};
