// Das komplette Video: sechs Szenen, harte Schnitte auf den Drops der Musik.
// Bewegungssprache nach Apple: Wörter blenden mit Unschärfe ein (kritisch gedämpfte
// Feder, kein Überschwingen), schnelle Bewegungen tragen echte Bewegungsunschärfe,
// Überschwingen nur bei Landungen mit Schwung (Punkt, Button).
import {AbsoluteFill, Easing, Html5Audio, interpolate, interpolateColors, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {config} from './config';
import {fitFontSize} from './components/FitText';
import {FontGate} from './components/FontGate';
import {SoundTrack} from './components/SoundTrack';
import {SPRINGS, springFrom} from './motion';
import {C, FONT, tracking, withAlpha} from './theme';
import {BEISPIEL, BEWEIS, CTA, HOOK, PROBLEM, REVEAL, SCENE, STILL_FROM} from './timing';
import {FPS, SAFE, WIDTH} from './video';

const T = config.texte;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
/** Heller Text auf Dunkel, dunkler Text auf Hell: nie reines Schwarz/Weiß */
const INK_ON_DARK = '#F4F4F2';
const INK_ON_LIGHT = C.dunkel;

/** Globaler Frame, eingefroren ab STILL_FROM */
const useFrame = () => Math.min(useCurrentFrame(), STILL_FROM);

/** Eine gemeinsame Größe für mehrere Zeilen: die längste bestimmt */
const fitLines = (lines: string[], maxSize: number, weight: number, maxWidth: number = SAFE.width) =>
	Math.min(
		...lines.map((text) =>
			fitFontSize({text, maxWidth, maxFontSize: maxSize, fontFamily: FONT, fontWeight: weight, letterSpacing: tracking(maxSize)}),
		),
	);

// ---------------------------------------------------------------- Bausteine

/** Wort: steigt aus der Unschärfe auf */
const Word: React.FC<{text: string; start: number; color: string}> = ({text, start, color}) => {
	const frame = useFrame();
	const p = springFrom(frame, start, SPRINGS.text);
	return (
		<span
			style={{
				display: 'inline-block',
				color,
				opacity: interpolate(p, [0, 0.45], [0, 1], clamp),
				transform: `translateY(${(1 - p) * 0.32}em)`,
				filter: p < 0.999 ? `blur(${(1 - p) * 18}px)` : undefined,
			}}
		>
			{text}
		</span>
	);
};

type LinesProps = {
	lines: string[];
	starts: number[];
	colors: string[];
	maxSize: number;
	weight?: number;
	stagger?: number;
	lineHeight?: number;
	align?: 'left' | 'center';
};

/** Mehrzeilige Überschrift, Wort für Wort, jede Zeile mit eigenem Start */
const Lines: React.FC<LinesProps> = ({lines, starts, colors, maxSize, weight = 700, stagger = 3, lineHeight = 1.06, align = 'left'}) => {
	const size = fitLines(lines, maxSize, weight);
	return (
		<div style={{fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight, letterSpacing: `${tracking(size)}em`, textAlign: align}}>
			{lines.map((line, li) => (
				<div key={li} style={{whiteSpace: 'nowrap'}}>
					{line.split(' ').map((w, wi) => (
						<span key={wi}>
							{wi > 0 ? ' ' : null}
							<Word text={w} start={starts[li] + wi * stagger} color={colors[li] ?? colors[0]} />
						</span>
					))}
				</div>
			))}
		</div>
	);
};

/** Absolut platzierter Block in der Sicherheitszone */
const Block: React.FC<{top: number; children: React.ReactNode; style?: React.CSSProperties}> = ({top, children, style}) => (
	<div style={{position: 'absolute', top, left: SAFE.left, width: SAFE.width, ...style}}>{children}</div>
);

/** Richtungsgebundene Bewegungsunschärfe (nur vertikal), per SVG-Filter */
const VerticalBlur: React.FC<{id: string; amount: number}> = ({id, amount}) => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<filter id={id} x="-5%" y="-20%" width="110%" height="140%">
			<feGaussianBlur stdDeviation={`0 ${amount.toFixed(2)}`} />
		</filter>
	</svg>
);

/** Szene: Grundfarbe + langsames Heranfahren (links verankert, bleibt in der Sicherheitszone) */
const Scene: React.FC<{from: number; to: number; bg: string; children: React.ReactNode}> = ({from, to, bg, children}) => {
	const frame = useFrame();
	const s = interpolate(frame, [from, to], [1, 1.025], clamp);
	return (
		<AbsoluteFill style={{backgroundColor: bg}}>
			<AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `${SAFE.left}px 50%`}}>{children}</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 1 Hook: der Feed bleibt stehen

const LINE = 112;
const FEED_SIZE = 64;
const TARGET = 34;
const HOOK_LINES = Array.from({length: TARGET + 9}, (_, i) => (i === TARGET ? T.stopp : T.feed[i % T.feed.length]));

/** Scroll-Abbremsung: schnell, dann weich auf den Punkt (wie ein iPhone-Feed) */
const hookOffset = (frame: number) => HOOK.rushFrom * (1 - Math.min(1, Math.max(0, frame) / HOOK.stop)) ** 4;

const HookScene: React.FC = () => {
	const frame = useFrame();
	// Vorwärts-Differenz: auch Frame 0 zeigt schon die volle Unschärfe
	const speed = Math.abs(hookOffset(frame + 1) - hookOffset(frame));
	const blur = Math.min(34, speed * 0.13);
	const others = interpolate(frame, [HOOK.stop + 2, HOOK.stop + 14], [1, 0], clamp);
	const up = springFrom(frame, HOOK.targetUp, SPRINGS.move);
	const columnTop = 960 - (TARGET * LINE + LINE / 2) + hookOffset(frame);
	return (
		<>
			<VerticalBlur id="hook-blur" amount={blur} />
			<div style={{position: 'absolute', left: SAFE.left, top: columnTop, width: SAFE.width, filter: blur > 0.2 ? 'url(#hook-blur)' : undefined}}>
				{HOOK_LINES.map((text, i) => {
					const isTarget = i === TARGET;
					const top = i * LINE;
					// Nur Zeilen zeichnen, die im Bild sein können
					if (columnTop + top > 2000 || columnTop + top < -LINE) return null;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								top,
								height: LINE,
								display: 'flex',
								alignItems: 'center',
								whiteSpace: 'nowrap',
								fontFamily: FONT,
								fontWeight: 600,
								fontSize: FEED_SIZE,
								letterSpacing: `${tracking(FEED_SIZE)}em`,
								color: isTarget ? interpolateColors(frame, [HOOK.stop - 3, HOOK.stop + 2], [C.feed, INK_ON_DARK]) : C.feed,
								opacity: isTarget ? 1 : others,
								filter: !isTarget && others < 1 ? `blur(${(1 - others) * 10}px)` : undefined,
								transform: isTarget ? `translateY(${-up * 270}px) scale(${1 + up * 0.42})` : undefined,
								transformOrigin: 'left center',
							}}
						>
							{text}
						</div>
					);
				})}
			</div>
			<Block top={840}>
				<Lines lines={T.keinZufall} starts={HOOK.keinZufall} colors={[C.grauAufDunkel, INK_ON_DARK]} maxSize={132} />
			</Block>
		</>
	);
};

// ---------------------------------------------------------------- 2 Reveal: Motion Design.

/** Wort, dessen Buchstaben einzeln erscheinen und dabei zusammenrücken */
const TrackedWord: React.FC<{text: string; start: number; size: number; children?: React.ReactNode}> = ({text, start, size, children}) => {
	const frame = useFrame();
	const squeeze = springFrom(frame, start, SPRINGS.letters);
	return (
		<div
			style={{
				fontFamily: FONT,
				fontWeight: 800,
				fontSize: size,
				lineHeight: 0.98,
				whiteSpace: 'nowrap',
				color: INK_ON_LIGHT,
				letterSpacing: `${interpolate(squeeze, [0, 1], [0.32, tracking(size)])}em`,
			}}
		>
			{text.split('').map((ch, i) => {
				const p = springFrom(frame, start + i * 1.5, SPRINGS.text);
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
							transform: `translateY(${(1 - p) * 0.25}em)`,
							filter: p < 0.999 ? `blur(${(1 - p) * 22}px)` : undefined,
						}}
					>
						{ch}
					</span>
				);
			})}
			{children}
		</div>
	);
};

const RevealScene: React.FC = () => {
	const frame = useFrame();
	const size = fitLines([T.motionDesign[0], `${T.motionDesign[1]}.`], 270, 800);
	const land = springFrom(frame, REVEAL.dotLand, SPRINGS.land);
	const grow = interpolate(frame, REVEAL.dotGrow, [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	return (
		<>
			<Block top={560}>
				<Lines lines={[T.dasIst]} starts={[REVEAL.dasIst]} colors={[C.grauAufHell]} maxSize={78} weight={600} />
			</Block>
			<Block top={670}>
				<TrackedWord text={T.motionDesign[0]} start={REVEAL.motion} size={size} />
				<TrackedWord text={T.motionDesign[1]} start={REVEAL.design} size={size}>
					<span
						style={{
							display: 'inline-block',
							width: '0.2em',
							height: '0.2em',
							marginLeft: '0.06em',
							borderRadius: '50%',
							backgroundColor: C.akzent,
							transform: `scale(${land * (1 + grow * 130)})`,
						}}
					/>
				</TrackedWord>
			</Block>
		</>
	);
};

// ---------------------------------------------------------------- 3 Problem: weggewischt

const FeedBackdrop: React.FC<{speedBoostAt: number}> = ({speedBoostAt}) => {
	const frame = useFrame();
	const local = frame - SCENE.problem;
	const boost = frame > speedBoostAt ? 1100 * (1 - Math.exp(-(frame - speedBoostAt) / 7)) : 0;
	const pos = local * 4 + boost;
	const prev = (local - 1) * 4 + (frame - 1 > speedBoostAt ? 1100 * (1 - Math.exp(-(frame - 1 - speedBoostAt) / 7)) : 0);
	const blur = Math.min(30, Math.abs(pos - prev) * 0.14);
	const cycle = LINE * T.feed.length;
	return (
		<>
			<VerticalBlur id="feed-blur" amount={blur} />
			{/* Zur Bildmitte hin ausgeblendet: der Satz steht frei, der Feed rauscht oben und unten */}
			<AbsoluteFill style={{maskImage: 'linear-gradient(180deg, black 0%, black 22%, transparent 38%, transparent 68%, black 84%, black 100%)'}}>
			<div style={{position: 'absolute', left: SAFE.left, top: -(pos % cycle), filter: blur > 0.2 ? 'url(#feed-blur)' : undefined}}>
				{Array.from({length: 3 * T.feed.length}, (_, i) => (
					<div
						key={i}
						style={{
							height: LINE,
							display: 'flex',
							alignItems: 'center',
							whiteSpace: 'nowrap',
							fontFamily: FONT,
							fontWeight: 600,
							fontSize: FEED_SIZE,
							letterSpacing: `${tracking(FEED_SIZE)}em`,
							color: C.feedLeise,
						}}
					>
						{T.feed[i % T.feed.length]}
					</div>
				))}
			</div>
			</AbsoluteFill>
		</>
	);
};

const ProblemScene: React.FC = () => {
	const frame = useFrame();
	const t = interpolate(frame, [PROBLEM.flick, PROBLEM.flick + PROBLEM.flickFrames], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	const tPrev = interpolate(frame - 1, [PROBLEM.flick, PROBLEM.flick + PROBLEM.flickFrames], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	const y = -1700 * t;
	const blur = Math.min(40, Math.abs(y + 1700 * tPrev) * 0.12);
	return (
		<>
			<FeedBackdrop speedBoostAt={PROBLEM.flick} />
			{t < 1 ? (
				<>
					<VerticalBlur id="flick-blur" amount={blur} />
					<Block top={800} style={{transform: `translateY(${y}px)`, filter: blur > 0.2 ? 'url(#flick-blur)' : undefined}}>
						<Lines lines={T.problem} starts={PROBLEM.lines} colors={[C.grauAufDunkel, INK_ON_DARK]} maxSize={92} />
					</Block>
				</>
			) : null}
			<Block top={800}>
				<Lines lines={T.grund} starts={PROBLEM.grund} colors={[C.grauAufDunkel, INK_ON_DARK]} maxSize={108} />
			</Block>
		</>
	);
};

// ---------------------------------------------------------------- 4 Beispiel: echte Arbeit statt Behauptung

const CARD = {w: 540, h: 960, top: 500};

const BeispielScene: React.FC = () => {
	const frame = useFrame();
	const p = springFrom(frame, BEISPIEL.card, SPRINGS.move);
	return (
		<>
			<Block top={262}>
				<Lines lines={T.beispielTitel} starts={[BEISPIEL.title, BEISPIEL.title + 8]} colors={[C.grauAufHell, INK_ON_LIGHT]} maxSize={80} />
			</Block>
			<div style={{position: 'absolute', left: (WIDTH - CARD.w) / 2, top: CARD.top, width: CARD.w, height: CARD.h, perspective: 1800}}>
				<div
					style={{
						width: '100%',
						height: '100%',
						borderRadius: 44,
						overflow: 'hidden',
						backgroundColor: '#0E0E0E',
						opacity: interpolate(p, [0, 0.2], [0, 1], clamp),
						transform: `translateY(${(1 - p) * 900}px) rotateX(${(1 - p) * 24}deg)`,
						transformOrigin: '50% 100%',
						boxShadow: `0 60px 120px -30px ${withAlpha(C.dunkel, 0.45)}, 0 0 0 1px ${withAlpha(C.dunkel, 0.08)}`,
					}}
				>
					<Sequence from={BEISPIEL.video} layout="none">
						<OffthreadVideo src={staticFile(config.beispielVideo)} muted style={{width: '100%', height: '100%'}} />
					</Sequence>
				</div>
			</div>
		</>
	);
};

// ---------------------------------------------------------------- 5 Beweis: die echte Zuschauzeit

const DIGIT_SIZE = 400;

const Odometer: React.FC = () => {
	const frame = useFrame();
	const secs = Math.floor(frame / FPS);
	const p = springFrom(frame, secs * FPS, SPRINGS.digit);
	const cur = String(secs).padStart(2, '0');
	const old = String(secs - 1).padStart(2, '0');
	return (
		<div style={{display: 'flex', fontFamily: FONT, fontWeight: 800, fontSize: DIGIT_SIZE, lineHeight: 1.1, letterSpacing: `${tracking(DIGIT_SIZE)}em`, fontFeatureSettings: '"tnum"', color: INK_ON_DARK}}>
			{cur.split('').map((d, i) => {
				const rolling = old[i] !== d && p < 0.999;
				return (
					<span key={i} style={{position: 'relative', display: 'inline-block', height: '1.1em', overflow: 'hidden'}}>
						<span style={{visibility: 'hidden'}}>0</span>
						{rolling ? (
							<span style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${-p * 100}%)`, opacity: 1 - p, filter: `blur(${(1 - Math.abs(0.5 - p) * 2) * 8}px)`}}>
								{old[i]}
							</span>
						) : null}
						<span style={{position: 'absolute', left: 0, top: 0, transform: rolling ? `translateY(${(1 - p) * 100}%)` : undefined, filter: rolling ? `blur(${(1 - Math.abs(0.5 - p) * 2) * 8}px)` : undefined}}>
							{d}
						</span>
					</span>
				);
			})}
		</div>
	);
};

const BeweisScene: React.FC = () => {
	const frame = useFrame();
	const u = springFrom(frame, BEWEIS.blockUp, SPRINGS.move);
	return (
		<>
			<Block top={430} style={{transform: `translateY(${-u * 180}px) scale(${1 - u * 0.14})`, transformOrigin: 'left top', opacity: 1 - u * 0.55}}>
				<Lines lines={[T.beweisVor]} starts={[BEWEIS.label]} colors={[C.grauAufDunkel]} maxSize={68} weight={600} />
				<Odometer />
				<Lines lines={[T.beweisNach]} starts={[BEWEIS.nach]} colors={[C.grauAufDunkel]} maxSize={68} weight={600} />
			</Block>
			<Block top={1000}>
				<Lines lines={T.vorstellen} starts={BEWEIS.vorstellen} colors={[INK_ON_DARK, INK_ON_DARK, C.akzent]} maxSize={112} />
			</Block>
		</>
	);
};

// ---------------------------------------------------------------- 6 CTA

const PILL = {w: SAFE.width, h: 168, cy: 1030, startW: 150, startH: 48};

const CtaScene: React.FC = () => {
	const frame = useFrame();
	const appear = springFrom(frame, CTA.pillIn, SPRINGS.text);
	const e = springFrom(frame, CTA.pillExpand, SPRINGS.land);
	const w = PILL.startW + e * (PILL.w - PILL.startW);
	const h = PILL.startH + e * (PILL.h - PILL.startH);
	const q = springFrom(frame, CTA.pillText, SPRINGS.text);
	const sheen = interpolate(frame, CTA.sheen, [-0.35, 1.25], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const unter = springFrom(frame, CTA.unter, SPRINGS.text);
	return (
		<>
			<Block top={330}>
				<Lines lines={T.cta} starts={CTA.lines} colors={[C.grauAufHell, INK_ON_LIGHT, INK_ON_LIGHT]} maxSize={120} />
			</Block>
			{frame >= CTA.pillIn ? (
				<div
					style={{
						position: 'absolute',
						left: WIDTH / 2 - w / 2,
						top: PILL.cy - h / 2,
						width: w,
						height: h,
						borderRadius: h / 2,
						backgroundColor: C.dunkel,
						overflow: 'hidden',
						opacity: appear,
						transform: `scale(${0.7 + appear * 0.3})`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: `0 30px 60px -20px ${withAlpha(C.dunkel, 0.5)}`,
					}}
				>
					<div
						style={{
							fontFamily: FONT,
							fontWeight: 600,
							fontSize: 62,
							letterSpacing: `${tracking(62)}em`,
							whiteSpace: 'nowrap',
							color: INK_ON_DARK,
							opacity: q,
							transform: `translateY(${(1 - q) * 20}px)`,
							filter: q < 0.999 ? `blur(${(1 - q) * 14}px)` : undefined,
						}}
					>
						{T.button} <span style={{color: C.akzent}}>„{config.stichwort}“</span>
					</div>
					<div
						style={{
							position: 'absolute',
							top: 0,
							bottom: 0,
							left: `${sheen * 100}%`,
							width: 200,
							transform: 'skewX(-20deg)',
							background: `linear-gradient(90deg, transparent, ${withAlpha('#FFFFFF', 0.16)}, transparent)`,
						}}
					/>
				</div>
			) : null}
			<div
				style={{
					position: 'absolute',
					top: PILL.cy + PILL.h / 2 + 44,
					width: WIDTH,
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 500,
					fontSize: 46,
					letterSpacing: `${tracking(46)}em`,
					color: C.grauAufHell,
					opacity: unter,
					transform: `translateY(${(1 - unter) * 16}px)`,
					filter: unter < 0.999 ? `blur(${(1 - unter) * 12}px)` : undefined,
				}}
			>
				{T.unterButton} <span style={{color: INK_ON_LIGHT, fontWeight: 600}}>{config.handle}</span>
			</div>
		</>
	);
};

// ---------------------------------------------------------------- Gesamt

const SCENES: {from: number; to: number; bg: string; C: React.FC}[] = [
	{from: SCENE.hook, to: SCENE.reveal, bg: C.dunkel, C: HookScene},
	{from: SCENE.reveal, to: SCENE.problem, bg: C.hell, C: RevealScene},
	{from: SCENE.problem, to: SCENE.beispiel, bg: C.dunkel, C: ProblemScene},
	{from: SCENE.beispiel, to: SCENE.beweis, bg: C.hell, C: BeispielScene},
	{from: SCENE.beweis, to: SCENE.cta, bg: C.dunkel, C: BeweisScene},
	{from: SCENE.cta, to: SCENE.ende, bg: C.hell, C: CtaScene},
];

const Scenes: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<>
			{SCENES.filter((s) => frame >= s.from && frame < s.to).map(({from, to, bg, C: Content}) => (
				<Scene key={from} from={from} to={to} bg={bg}>
					<Content />
				</Scene>
			))}
		</>
	);
};

export const AgenturAd: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: C.dunkel}}>
		<FontGate>
			<Scenes />
		</FontGate>
		<Html5Audio src={staticFile('musik.wav')} />
		<SoundTrack />
	</AbsoluteFill>
);
