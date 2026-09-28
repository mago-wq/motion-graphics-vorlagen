// Das komplette Video: Hintergrund, sechs Szenen mit harten Schnitten, Zuschau-Zähler, Tonspur.
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {config} from './config';
import {FitText} from './components/FitText';
import {FontGate} from './components/FontGate';
import {SoundTrack} from './components/SoundTrack';
import {SPRINGS, softIn, springFrom} from './motion';
import {BODY_FONT, COLORS, HEADLINE_FONT, withAlpha} from './theme';
import {BEWEIS, CTA, CUTS, HOOK, IMPACTS, LOESUNG, PROBLEM, SCENE_STARTS, SLAM_LAND, STILL_FROM, ZUFALL} from './timing';
import {FPS, SAFE, WIDTH} from './video';

const T = config.texte;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Globaler Frame, eingefroren ab STILL_FROM */
const useFrame = () => Math.min(useCurrentFrame(), STILL_FROM);

/** Zuschauzeit als "07,4 s" */
const watchTime = (frame: number) => (frame / FPS).toFixed(1).replace('.', ',').padStart(4, '0');

// ---------------------------------------------------------------- Bausteine

/** Wort/Zeile, die mit Überschwingen aus großer Skalierung einschlägt. Landet auf `at`. */
const Slam: React.FC<{at: number; text: string; size: number; color?: string; y?: number}> = ({at, text, size, color = COLORS.text, y = 0}) => {
	const frame = useFrame();
	const p = springFrom(frame, at - SLAM_LAND, SPRINGS.slam);
	if (frame < at - SLAM_LAND) return null;
	return (
		<div style={{transform: `translateY(${y}px) scale(${interpolate(p, [0, 1], [2.6, 1])})`, opacity: interpolate(p, [0, 0.35], [0, 1], clamp), filter: `blur(${interpolate(p, [0, 0.8], [14, 0], clamp)}px)`}}>
			<FitText text={text} maxWidth={SAFE.width} maxFontSize={size} fontFamily={HEADLINE_FONT} uppercase style={{color, textAlign: 'center'}} />
		</div>
	);
};

const Body: React.FC<{text: string; at: number; size?: number; color?: string}> = ({text, at, size = 54, color = COLORS.textMuted}) => {
	const frame = useFrame();
	const p = softIn(frame, at, 14);
	return (
		<div style={{opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
			<FitText text={text} maxWidth={SAFE.width} maxFontSize={size} fontFamily={BODY_FONT} fontWeight={600} style={{color, textAlign: 'center'}} />
		</div>
	);
};

const Stack: React.FC<{children: React.ReactNode; gap?: number; top?: number}> = ({children, gap = 10, top}) => (
	<AbsoluteFill style={{alignItems: 'center', justifyContent: top === undefined ? 'center' : 'flex-start', paddingTop: top, flexDirection: 'column', gap}}>
		{children}
	</AbsoluteFill>
);

/** Bewegter Hintergrund: Raster, das langsam wandert, und ein Lichtfleck im Akzent */
const Background: React.FC = () => {
	const frame = useFrame();
	const drift = (frame * 0.8) % 90;
	const gx = 540 + Math.sin(frame / 50) * 260;
	const gy = 900 + Math.cos(frame / 70) * 380;
	return (
		<AbsoluteFill>
			<AbsoluteFill
				style={{
					backgroundImage: `linear-gradient(${COLORS.hairline} 2px, transparent 2px), linear-gradient(90deg, ${COLORS.hairline} 2px, transparent 2px)`,
					backgroundSize: '90px 90px',
					backgroundPosition: `0 ${drift}px`,
					maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
				}}
			/>
			<AbsoluteFill style={{background: `radial-gradient(circle 620px at ${gx}px ${gy}px, ${withAlpha(config.akzentfarbe, 0.13)}, transparent)`}} />
		</AbsoluteFill>
	);
};

/** Bildwackler bei jedem Einschlag, klingt über 7 Frames ab */
const useShake = () => {
	const frame = useFrame();
	let x = 0;
	let y = 0;
	for (const at of IMPACTS) {
		const d = frame - at;
		if (d >= 0 && d < 7) {
			const k = (1 - d / 7) * 14;
			x += Math.sin(at * 7.3 + d * 2.1) * k;
			y += Math.cos(at * 3.1 + d * 2.7) * k;
		}
	}
	return `translate(${x}px, ${y}px)`;
};

/** Blitz + leichter Zoom bei jedem harten Schnitt */
const CutFlash: React.FC = () => {
	const frame = useFrame();
	const cut = CUTS.find((c) => frame >= c && frame < c + 6);
	if (cut === undefined) return null;
	return <AbsoluteFill style={{backgroundColor: config.akzentfarbe, opacity: interpolate(frame - cut, [0, 5], [0.45, 0], clamp), mixBlendMode: 'screen'}} />;
};

/** Szenen-Hülle: kurzer Zoom-Einstieg nach dem Schnitt */
const Scene: React.FC<{children: React.ReactNode; from: number}> = ({children, from}) => {
	const frame = useFrame() - from;
	const s = interpolate(frame, [0, 8], [1.08, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return <AbsoluteFill style={{transform: `scale(${s})`}}>{children}</AbsoluteFill>;
};

/** Kleiner Zähler oben: "● DU SCHAUST SEIT 07,4 s" – die Zahl ist die echte Zuschauzeit */
const WatchHud: React.FC = () => {
	const frame = useFrame();
	if (frame >= SCENE_STARTS.beweis && frame < SCENE_STARTS.cta) return null;
	const blink = frame >= STILL_FROM || Math.floor(frame / 15) % 2 === 0;
	return (
		<div style={{position: 'absolute', top: SAFE.top + 10, left: 0, width: WIDTH, display: 'flex', justifyContent: 'center'}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '14px 28px', borderRadius: 999, border: `2px solid ${COLORS.hairline}`, backgroundColor: withAlpha(config.hauptfarbe, 0.7), fontFamily: BODY_FONT, fontWeight: 600, fontSize: 30, color: COLORS.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase'}}>
				<div style={{width: 16, height: 16, borderRadius: 8, backgroundColor: config.warnfarbe, opacity: blink ? 1 : 0.25}} />
				{T.hudLabel}
				<span style={{color: config.akzentfarbe, fontVariantNumeric: 'tabular-nums', minWidth: 110}}>{watchTime(frame)} s</span>
			</div>
		</div>
	);
};

// ---------------------------------------------------------------- Szenen

const HookScene: React.FC = () => (
	<Stack gap={0}>
		<Slam at={HOOK.stopp} text={T.stopp} size={330} color={config.akzentfarbe} />
		<div style={{height: 30}} />
		{T.hook.map((line, i) => (
			<Slam key={line} at={HOOK.lines[i]} text={line} size={i === 1 ? 190 : 120} />
		))}
	</Stack>
);

const ZufallScene: React.FC = () => {
	const frame = useFrame();
	const up = softIn(frame, ZUFALL.shiftUp, 12);
	const bar = interpolate(frame, [ZUFALL.barStart, ZUFALL.barStart + 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<Stack gap={0}>
			<div style={{transform: `translateY(${-up * 60}px)`, opacity: 1 - up * 0.65}}>
				{T.keinZufall.map((line, i) => (
					<Slam key={line} at={ZUFALL.lines[i]} text={line} size={i === 0 ? 130 : 170} />
				))}
			</div>
			<div style={{height: 40}} />
			<Slam at={ZUFALL.reveal[0]} text={T.aufloesung[0]} size={110} />
			<div style={{position: 'relative', padding: '6px 24px'}}>
				<div style={{position: 'absolute', inset: 0, backgroundColor: config.akzentfarbe, transformOrigin: 'left', transform: `scaleX(${bar}) skewX(-8deg)`}} />
				<div style={{position: 'relative'}}>
					<Slam at={ZUFALL.reveal[1]} text={T.aufloesung[1]} size={170} color={bar > 0.5 ? config.hauptfarbe : COLORS.text} />
				</div>
			</div>
		</Stack>
	);
};

/** Graue Standard-Anzeige, wie sie jeder im Feed überwischt */
const BoringCard: React.FC<{titel: string; zeile: string; inAt: number; outAt: number}> = ({titel, zeile, inAt, outAt}) => {
	const frame = useFrame();
	const pin = springFrom(frame, inAt, SPRINGS.snap);
	const out = interpolate(frame, [outAt, outAt + PROBLEM.swipeFrames], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	if (frame < inAt || out >= 1) return null;
	const y = interpolate(pin, [0, 1], [900, 0]) - out * 1500;
	const muted = withAlpha(config.textfarbe, 0.35);
	return (
		<div style={{position: 'absolute', left: 170, top: 520, width: 740, transform: `translateY(${y}px) rotate(${out * -6}deg)`, borderRadius: 36, backgroundColor: '#1C1C1E', border: `2px solid ${COLORS.hairline}`, padding: 36, filter: 'grayscale(1)'}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 26}}>
				<div style={{width: 64, height: 64, borderRadius: 32, backgroundColor: '#2C2C2E'}} />
				<div style={{fontFamily: BODY_FONT, fontSize: 28, color: muted}}>Gesponsert</div>
			</div>
			<div style={{height: 420, borderRadius: 20, background: 'linear-gradient(135deg, #2A2A2C, #202022)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BODY_FONT, fontSize: 30, color: muted}}>Stockfoto</div>
			<div style={{fontFamily: BODY_FONT, fontWeight: 600, fontSize: 44, color: withAlpha(config.textfarbe, 0.6), marginTop: 30}}>{titel}</div>
			<div style={{fontFamily: BODY_FONT, fontSize: 32, color: muted, marginTop: 10}}>{zeile}</div>
		</div>
	);
};

/** Finger-Punkt, der nach oben wischt */
const SwipeFinger: React.FC<{at: number}> = ({at}) => {
	const frame = useFrame();
	const t = interpolate(frame, [at - 4, at + PROBLEM.swipeFrames], [0, 1], clamp);
	if (t <= 0 || t >= 1) return null;
	return <div style={{position: 'absolute', left: 740, top: 1250 - t * 600, width: 90, height: 90, borderRadius: 45, backgroundColor: withAlpha('#FFFFFF', 0.35 * Math.sin(t * Math.PI)), border: '3px solid rgba(255,255,255,0.6)'}} />;
};

const ProblemScene: React.FC = () => {
	const frame = useFrame();
	const done = frame >= PROBLEM.weggewischt - SLAM_LAND;
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', top: 390, width: WIDTH, opacity: done ? 0 : 1}}>
				<Body text={T.problemTitel} at={PROBLEM.titleIn} size={60} color={COLORS.text} />
			</div>
			{T.langweiligeAnzeigen.map((a, i) => (
				<BoringCard key={a.titel} {...a} inAt={PROBLEM.cards[i].in} outAt={PROBLEM.cards[i].out} />
			))}
			{PROBLEM.cards.map((c) => (
				<SwipeFinger key={c.out} at={c.out} />
			))}
			<Stack gap={24}>
				<Slam at={PROBLEM.weggewischt} text={T.weggewischt} size={210} color={config.warnfarbe} />
				<Body text={T.keinerSchaut} at={PROBLEM.keinerSchaut} size={64} />
			</Stack>
		</AbsoluteFill>
	);
};

const LoesungScene: React.FC = () => {
	const frame = useFrame();
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', top: 420, width: WIDTH}}>
				<Body text={T.loesungTitel} at={LOESUNG.titleIn} size={60} color={COLORS.text} />
			</div>
			<div style={{position: 'absolute', top: 560, left: SAFE.left, width: SAFE.width, display: 'flex', flexDirection: 'column', gap: 34}}>
				{T.punkte.map((p, i) => {
					const s = springFrom(frame, LOESUNG.rows[i], SPRINGS.snap);
					if (frame < LOESUNG.rows[i]) return <div key={p} style={{height: 150}} />;
					return (
						<div key={p} style={{height: 150, display: 'flex', alignItems: 'center', gap: 30, padding: '0 36px', borderRadius: 28, backgroundColor: COLORS.surface, border: `2px solid ${withAlpha(config.akzentfarbe, 0.35)}`, transform: `translateX(${(1 - s) * (i % 2 ? 1 : -1) * 1100}px)`}}>
							<div style={{fontFamily: HEADLINE_FONT, fontSize: 110, color: config.akzentfarbe, lineHeight: 1}}>{`0${i + 1}`}</div>
							<FitText text={p} maxWidth={SAFE.width - 230} maxFontSize={72} fontFamily={HEADLINE_FONT} uppercase style={{color: COLORS.text}} />
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', top: 1180, width: WIDTH, transform: 'rotate(-4deg)'}}>
				<Slam at={LOESUNG.fuerDich} text={T.fuerDich} size={170} color={config.akzentfarbe} />
			</div>
		</AbsoluteFill>
	);
};

const BeweisScene: React.FC = () => {
	const frame = useFrame();
	const grow = springFrom(frame, SCENE_STARTS.beweis, SPRINGS.snap);
	const dim = softIn(frame, BEWEIS.vorstellen[0] - 8, 10);
	return (
		<Stack gap={0}>
			<div style={{opacity: 1 - dim * 0.35, transform: `translateY(${-dim * 230}px) scale(${1 - dim * 0.15})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
				<Body text={T.beweisVor} at={BEWEIS.labelIn} size={64} color={COLORS.text} />
				<div style={{fontFamily: HEADLINE_FONT, fontSize: 400, lineHeight: 1, color: config.akzentfarbe, fontVariantNumeric: 'tabular-nums', transform: `scale(${interpolate(grow, [0, 1], [0.3, 1])})`, textShadow: `0 0 80px ${withAlpha(config.akzentfarbe, 0.35)}`}}>
					{watchTime(frame)}
					<span style={{fontSize: 160}}> s</span>
				</div>
				<Body text={T.beweisNach} at={BEWEIS.zuIn} size={64} color={COLORS.text} />
			</div>
			<div style={{position: 'absolute', top: 1140, width: WIDTH}}>
				{T.vorstellen.map((line, i) => (
					<Slam key={line} at={BEWEIS.vorstellen[i]} text={line} size={i === 0 ? 90 : 110} color={i === 1 ? config.akzentfarbe : COLORS.text} />
				))}
			</div>
		</Stack>
	);
};

const CtaScene: React.FC = () => {
	const frame = useFrame();
	const b = springFrom(frame, CTA.buttonIn, SPRINGS.snap);
	let pulse = 1;
	for (const p of CTA.pulses) {
		const d = frame - p;
		if (d >= 0 && d < CTA.pulseLength) pulse += Math.sin((d / CTA.pulseLength) * Math.PI) * 0.06;
	}
	const arrow = frame >= CTA.buttonIn ? Math.abs(Math.sin(((frame - CTA.buttonIn) / 20) * Math.PI)) * 20 : 0;
	return (
		<Stack gap={0} top={420}>
			{T.cta.map((line, i) => (
				<Slam key={line} at={CTA.lines[i]} text={line} size={i === 1 ? 180 : 120} color={i === 1 ? config.akzentfarbe : COLORS.text} />
			))}
			<div style={{height: 70}} />
			{frame >= CTA.buttonIn ? (
				<div style={{transform: `scale(${b * pulse})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
					<div style={{backgroundColor: config.akzentfarbe, color: config.hauptfarbe, borderRadius: 999, padding: '34px 64px', fontFamily: BODY_FONT, fontWeight: 800, fontSize: 60, boxShadow: `0 0 ${60 * pulse}px ${withAlpha(config.akzentfarbe, 0.5)}`, whiteSpace: 'nowrap'}}>
						{T.buttonVor} „{config.stichwort}“
					</div>
					<div style={{fontFamily: BODY_FONT, fontWeight: 600, fontSize: 44, color: COLORS.textMuted}}>
						{T.buttonUnter} · <span style={{color: COLORS.text}}>{config.handle}</span>
					</div>
					<div style={{fontSize: 70, color: config.akzentfarbe, transform: `translateY(${frame >= STILL_FROM ? 0 : arrow}px)`}}>↓</div>
				</div>
			) : null}
		</Stack>
	);
};

// ---------------------------------------------------------------- Gesamt

const SCENES: [number, number, React.FC, string][] = [
	[SCENE_STARTS.hook, SCENE_STARTS.zufall, HookScene, '1 Hook'],
	[SCENE_STARTS.zufall, SCENE_STARTS.problem, ZufallScene, '2 Kein Zufall'],
	[SCENE_STARTS.problem, SCENE_STARTS.loesung, ProblemScene, '3 Problem'],
	[SCENE_STARTS.loesung, SCENE_STARTS.beweis, LoesungScene, '4 Lösung'],
	[SCENE_STARTS.beweis, SCENE_STARTS.cta, BeweisScene, '5 Beweis'],
	[SCENE_STARTS.cta, SCENE_STARTS.ende, CtaScene, '6 CTA'],
];

/** Zeigt nur die aktuelle Szene. Keine <Sequence>, damit alle Szenen mit globalen Frames aus timing.ts rechnen. */
const Shaken: React.FC = () => {
	const frame = useCurrentFrame();
	const transform = useShake();
	return (
		<AbsoluteFill style={{transform}}>
			{SCENES.filter(([from, to]) => frame >= from && frame < to).map(([from, , C, name]) => (
				<Scene key={name} from={from}>
					<C />
				</Scene>
			))}
		</AbsoluteFill>
	);
};

export const AgenturAd: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: COLORS.bg}}>
		<Background />
		<FontGate>
			<Shaken />
			<WatchHud />
			<CutFlash />
		</FontGate>
		<SoundTrack />
	</AbsoluteFill>
);
