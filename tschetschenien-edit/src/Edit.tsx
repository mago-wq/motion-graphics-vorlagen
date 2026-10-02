// Das ganze Edit: Bilder auf dem Beat, Titel, Blitze, Wackeln, Korn – und der Nasheed darunter.
import {AbsoluteFill, Html5Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import audio from './audio.json';
import {ACCENT, END_TEXT, GRADE, type Move} from './config';
import {FontGate} from './components/FontGate';
import {fitFontSize} from './fit';
import {HEADLINE_FONT, SERIF_FONT} from './fonts';
import {SPRINGS, decay, noise, springAt} from './motion';
import {DROP_FRAME, DURATION, END_FROM, TIMED_SHOTS, TOTAL_BEATS, beatFrame, type TimedShot} from './timing';
import {HEIGHT, SAFE, WIDTH} from './video';

/** Frames aller Beats ab dem Drop – hier pulsiert das Bild mit. */
const DROP_BEATS = Array.from({length: TOTAL_BEATS - audio.dynamics.quietUntilBeat + 1}, (_, i) => beatFrame(audio.dynamics.quietUntilBeat + i));
const PUNCH_FRAMES = audio.dynamics.punchBeats.map(beatFrame);

/** Frames seit dem letzten Ereignis in `frames` (oder -1, wenn noch keins war). */
const sinceLast = (frame: number, frames: number[]) => {
	let since = -1;
	for (const f of frames) if (f <= frame) since = frame - f;
	return since;
};

// ---------- Ken Burns ----------
const kenBurns = (move: Move | undefined, p: number) => {
	switch (move) {
		case 'out':
			return {scale: 1.24 - 0.14 * p, x: 0, y: 0};
		case 'left':
			return {scale: 1.16, x: 45 - 90 * p, y: 0};
		case 'right':
			return {scale: 1.16, x: -45 + 90 * p, y: 0};
		case 'up':
			return {scale: 1.16, x: 0, y: 50 - 100 * p};
		case 'down':
			return {scale: 1.16, x: 0, y: -50 + 100 * p};
		case 'in':
		default:
			return {scale: 1.08 + 0.16 * p, x: 0, y: 0};
	}
};

// ---------- Ein Bild ----------
const ShotImage: React.FC<{shot: TimedShot}> = ({shot}) => {
	const f = useCurrentFrame();
	const inDrop = shot.from >= DROP_FRAME;
	const p = f / shot.duration;
	const kb = kenBurns(shot.move, p);

	// Einschlag: das Bild kommt groß herein und rastet ein
	const s = springAt(f, SPRINGS.slam, inDrop ? 7 : 10);
	const punch = 1 + (inDrop ? 0.22 : 0.08) * (1 - s);

	// Peitschen-Übergang bei seitlicher Bewegung im Drop: hereinziehen mit Bewegungsunschärfe
	const whipDir = inDrop && (shot.move === 'left' || shot.move === 'right') ? (shot.move === 'left' ? 1 : -1) : 0;
	const whipX = whipDir * 420 * (1 - s);
	const whipBlur = whipDir ? 40 * (1 - s) : 0;

	// RGB-Versatz in den ersten Frames der Titel-Bilder im Drop
	const rgb = inDrop && shot.title ? 22 * decay(f, 7) : 0;

	// In der leisen Phase weich aus Schwarz
	const fadeIn = inDrop || shot.index === 0 ? 1 : interpolate(f, [0, 4], [0, 1], {extrapolateRight: 'clamp'});

	const id = `fx-${shot.index}`;
	const transform = `translate(${kb.x + whipX}px, ${kb.y}px) scale(${kb.scale * punch})`;
	const src = staticFile(`img/${shot.img}`);

	return (
		<AbsoluteFill style={{opacity: fadeIn, backgroundColor: '#000'}}>
			<svg width="0" height="0" style={{position: 'absolute'}}>
				<filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
					<feGaussianBlur in="SourceGraphic" stdDeviation={`${whipBlur} 0`} result="b" />
					<feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={rgb} dy={0} result="ro" />
					<feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="bl" />
					<feOffset in="bl" dx={-rgb} dy={0} result="bo" />
					<feBlend in="ro" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="bo" mode="screen" />
				</filter>
			</svg>
			<AbsoluteFill style={{transform, filter: whipBlur > 0.5 || rgb > 0.5 ? `url(#${id})` : undefined}}>
				{shot.fit === 'contain' ? (
					<>
						<Img src={src} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(38px) brightness(0.45)', transform: 'scale(1.2)'}} />
						<Img src={src} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain'}} />
					</>
				) : (
					<Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: shot.focus ?? '50% 50%'}} />
				)}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------- Titel ----------
const Title: React.FC<{shot: TimedShot}> = ({shot}) => {
	const f = useCurrentFrame();
	const isIntro = shot.index === 0;
	const maxWidth = SAFE.right - SAFE.left;
	const title = shot.title ?? '';
	const lines = title ? title.split('\n') : [];
	const size = Math.min(...lines.map((l) => fitFontSize(l, HEADLINE_FONT, 700, maxWidth, isIntro ? 250 : 168, 0.02)));
	const kickerIn = interpolate(f, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
	const subS = springAt(f - (title ? 7 : 1), SPRINGS.soft, 10);

	return (
		<AbsoluteFill
			style={{
				justifyContent: isIntro ? 'center' : 'flex-end',
				alignItems: 'center',
				paddingBottom: isIntro ? 0 : HEIGHT - SAFE.bottom + 40,
				paddingLeft: SAFE.left,
				paddingRight: WIDTH - SAFE.right,
				textAlign: 'center',
			}}
		>
			{shot.kicker ? (
				<div style={{display: 'flex', alignItems: 'center', gap: 22, opacity: kickerIn, transform: `translateY(${(1 - kickerIn) * 14}px)`, marginBottom: 6}}>
					<div style={{width: 70 * kickerIn, height: 3, background: ACCENT}} />
					<div style={{fontFamily: HEADLINE_FONT, fontWeight: 700, fontSize: 42, letterSpacing: '0.3em', color: ACCENT, textTransform: 'uppercase', paddingLeft: '0.3em', textShadow: '0 2px 14px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.8)'}}>
						{shot.kicker}
					</div>
					<div style={{width: 70 * kickerIn, height: 3, background: ACCENT}} />
				</div>
			) : null}
			{lines.map((line, li) => (
				<div key={li} style={{fontFamily: HEADLINE_FONT, fontWeight: 700, fontSize: size, lineHeight: 1.02, letterSpacing: '0.02em', color: '#f4efe4', whiteSpace: 'nowrap', textShadow: '0 6px 30px rgba(0,0,0,0.85)'}}>
					{[...line].map((ch, i) => {
						// Buchstaben schlagen nacheinander ein, zweite Zeile direkt im Anschluss
						const s = springAt(f - 1 - (li * 4 + i * 0.5), SPRINGS.letter, 8);
						return (
							<span
								key={i}
								style={{
									display: 'inline-block',
									opacity: Math.min(1, s * 1.6),
									transform: `translateY(${(1 - s) * -60}px) scale(${1.9 - 0.9 * s})`,
									filter: `blur(${(1 - s) * 10}px)`,
									whiteSpace: 'pre',
								}}
							>
								{ch}
							</span>
						);
					})}
				</div>
			))}
			{shot.sub ? (
				<div style={{fontFamily: SERIF_FONT, fontStyle: 'italic', fontSize: 46, lineHeight: 1.25, color: '#efe7d6', marginTop: 14, opacity: subS, transform: `translateY(${(1 - subS) * 24}px)`, textShadow: '0 3px 18px rgba(0,0,0,0.9)', maxWidth}}>
					{shot.sub}
				</div>
			) : null}
		</AbsoluteFill>
	);
};

// ---------- Overlays ----------
const Grain: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.22, pointerEvents: 'none'}}>
			<svg width={WIDTH} height={HEIGHT}>
				<filter id="grain">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 24} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#grain)" />
			</svg>
		</AbsoluteFill>
	);
};

const Vignette: React.FC = () => (
	<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.78) 100%)'}} />
);

/** Dunkler Verlauf unten, damit Titel immer lesbar sind. */
const TitleShade: React.FC<{intro: boolean}> = ({intro}) => (
	<AbsoluteFill
		style={{
			background: intro
				? 'radial-gradient(ellipse 90% 30% at 50% 50%, rgba(0,0,0,0.55), rgba(0,0,0,0) 100%)'
				: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0) 55%)',
		}}
	/>
);

// ---------- Abspann ----------
const EndCard: React.FC = () => {
	const f = useCurrentFrame();
	const a = interpolate(f, [2, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
			<div style={{fontFamily: HEADLINE_FONT, fontWeight: 700, fontSize: 150, letterSpacing: '0.12em', color: ACCENT, opacity: a, transform: `scale(${1.06 - 0.06 * a})`}}>
				{END_TEXT.title}
			</div>
			<div style={{position: 'absolute', bottom: HEIGHT - SAFE.bottom, left: SAFE.left, right: WIDTH - SAFE.right, fontFamily: SERIF_FONT, fontStyle: 'italic', fontSize: 30, color: '#9b937f', opacity: a}}>
				{END_TEXT.line}
			</div>
		</AbsoluteFill>
	);
};

// ---------- Gesamt ----------
export const Edit: React.FC = () => {
	const frame = useCurrentFrame();

	// Beat-Puls ab dem Drop: kurzer Zoom und Aufhellen auf jedem Beat
	const sinceBeat = frame >= DROP_FRAME && frame < END_FROM ? sinceLast(frame, DROP_BEATS) : -1;
	const pulse = sinceBeat >= 0 ? decay(sinceBeat, 6) : 0;

	// Wackeln auf den Bass-Schlägen
	const sincePunch = frame < END_FROM ? sinceLast(frame, PUNCH_FRAMES) : -1;
	const shake = sincePunch >= 0 ? 26 * decay(sincePunch, 11) : 0;
	const shakeX = noise(frame + 1) * shake;
	const shakeY = noise(frame + 101) * shake;
	const shakeR = noise(frame + 211) * shake * 0.04;

	// Weißer Blitz auf den Bass-Schlägen, kurzer Blitz auf jedem Schnitt im Drop
	const sinceCut = sinceLast(frame, TIMED_SHOTS.filter((s) => s.from >= DROP_FRAME).map((s) => s.from));
	const flash = Math.max(sincePunch >= 0 ? 0.9 * decay(sincePunch, 6) : 0, sinceCut >= 0 && frame < END_FROM ? 0.28 * decay(sinceCut, 3) : 0);

	return (
		<FontGate>
			<AbsoluteFill style={{backgroundColor: '#000'}}>
				<AbsoluteFill
					style={{
						transform: `translate(${shakeX}px, ${shakeY}px) rotate(${shakeR}deg) scale(${1 + 0.04 * pulse + (shake > 0 ? 0.03 : 0)})`,
						filter: `${GRADE} brightness(${1 + 0.22 * pulse})`,
					}}
				>
					{TIMED_SHOTS.map((shot) => (
						<Sequence key={shot.index} from={shot.from} durationInFrames={shot.duration} name={`${shot.index + 1}: ${shot.title ?? shot.img}`}>
							<ShotImage shot={shot} />
						</Sequence>
					))}
				</AbsoluteFill>
				<Vignette />
				{TIMED_SHOTS.filter((s) => s.title || s.sub).map((shot) => (
					<Sequence key={`t${shot.index}`} from={shot.from} durationInFrames={shot.duration} name={`Titel: ${shot.title ?? shot.sub}`}>
						<TitleShade intro={shot.index === 0} />
						<AbsoluteFill style={{transform: `translate(${shakeX * 0.4}px, ${shakeY * 0.4}px)`}}>
							<Title shot={shot} />
						</AbsoluteFill>
					</Sequence>
				))}
				<Sequence from={END_FROM} durationInFrames={DURATION - END_FROM} name="Abspann">
					<EndCard />
				</Sequence>
				<AbsoluteFill style={{backgroundColor: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
				<Grain />
				<Html5Audio src={staticFile(audio.output)} />
			</AbsoluteFill>
		</FontGate>
	);
};
