import React from 'react';
import {
	AbsoluteFill,
	Easing,
	interpolate,
	OffthreadVideo,
	random,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {FPS, Line, LINES, Scene, SCENES, STYLE} from './config';
import {ARABIC_FONT, LATIN_FONT} from './fonts';

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
		<AbsoluteFill style={{opacity, transform: `scale(${scale})`}}>
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

// ---------- Text ----------

const glow = (strength: number) =>
	[
		`-1.5px 0 rgba(255,90,170,${0.35 * strength})`,
		`1.5px 0 rgba(90,210,255,${0.35 * strength})`,
		`0 0 6px rgba(190,215,255,${0.95 * strength})`,
		`0 0 22px ${STYLE.glowColor}`,
		`0 0 54px rgba(70,110,255,${0.65 * strength})`,
	].join(', ');

const LyricLine: React.FC<{line: Line}> = ({line}) => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const first = line.words[0];
	const outF = line.out * FPS;
	const out = interpolate(frame, [outF, outF + 9], [1, 0], {...clamp, easing: Easing.in(Easing.quad)});
	const outBlur = interpolate(frame, [outF, outF + 9], [0, 10], clamp);
	// Englisch schreibt sich von links ein, fertig kurz nach dem letzten arabischen Wort
	const enEnd = line.words[line.words.length - 1] + 0.45;
	const enP = interpolate(t, [first, enEnd], [0, 118], {...clamp, easing: Easing.out(Easing.quad)});
	const breathe = Math.sin(frame / 22) * 4;

	return (
		<AbsoluteFill
			style={{
				opacity: out,
				filter: `blur(${outBlur}px)`,
				transform: `translateY(${breathe}px)`,
			}}
		>
			<div
				style={{
					position: 'absolute',
					left: 70,
					right: 70,
					top: STYLE.textY - 150,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 6,
				}}
			>
				<div
					lang="ar"
					dir="rtl"
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						justifyContent: 'center',
						columnGap: '0.28em',
						fontFamily: ARABIC_FONT,
						fontWeight: 700,
						fontSize: STYLE.arabicSize,
						lineHeight: 1.5,
						color: STYLE.textColor,
						textShadow: glow(1),
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
									opacity: p,
									filter: `blur(${(1 - p) * 14}px)`,
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
						fontStyle: 'italic',
						fontSize: STYLE.englishSize,
						lineHeight: 1.25,
						color: STYLE.textColor,
						textAlign: 'center',
						textShadow: glow(0.75),
						WebkitMaskImage: `linear-gradient(to right, black ${enP - 18}%, transparent ${enP}%)`,
						maskImage: `linear-gradient(to right, black ${enP - 18}%, transparent ${enP}%)`,
					}}
				>
					{line.en}
				</div>
			</div>
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
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
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
			<Flash />
			<Motes />
			<Vignette />
			<TextShade />
			{LINES.map((l, i) => {
				const from = Math.round((l.words[0] - 0.1) * FPS);
				const to = Math.round((l.out + 0.45) * FPS);
				return frame >= from && frame < to ? <LyricLine key={i} line={l} /> : null;
			})}
			<Grain />
		</AbsoluteFill>
	);
};
