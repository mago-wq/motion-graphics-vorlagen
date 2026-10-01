// Die Texttafeln: ein Wort pro Zeile, jedes Wort erscheint, wenn es gesprochen wird.
// Stile wie im Vorbild: weiß mit leichtem 3D-Kippen, Neon (flackert beim Zünden,
// wirft farbiges Licht in den Himmel), Glitch (gedehnt, RGB-Versatz) und Umriss
// (zeichnet sich nach, beim letzten Wort füllt er sich langsam).
import {measureText} from '@remotion/layout-utils';
import {noise2D} from '@remotion/noise';
import {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {hash, SPRINGS, springFrom} from '../motion';
import {COLORS, FONT, isNeon, mix, NEON, withAlpha} from '../theme';
import {ALLE_WOERTER, TAFEL_OUT_FRAMES, TAFELN, type Tafel, type TafelWort} from '../timing';
import {SAFE, WIDTH} from '../video';
import {fitFontSize} from './FitText';

const MAX_FONT = 168;
const MAX_WIDTH = SAFE.width * 0.94;
const LETTER_SPACING = 0.01;
/** Mitte des Textblocks: im Himmel, über Baum und Person */
const CENTER_Y = 700;
const LINE_HEIGHT = 1.02;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Neonröhre zündet: an, aus, an ... (pro Frame) */
const FLICKER = [1, 0.12, 0.95, 0.3, 1, 0.7, 1];
const LAST_INDEX = ALLE_WOERTER.length - 1;

export type Zeile = {wort: TafelWort; size: number; y: number};

export const layout = (tafel: Tafel): Zeile[] => {
	const sizes = tafel.woerter.map((w) =>
		fitFontSize({
			text: w.text,
			maxWidth: MAX_WIDTH,
			maxFontSize: MAX_FONT,
			fontFamily: FONT,
			fontWeight: 900,
			letterSpacing: LETTER_SPACING,
			uppercase: true,
		}),
	);
	const total = sizes.reduce((sum, s) => sum + s * LINE_HEIGHT, 0);
	let y = Math.max(SAFE.top, Math.min(SAFE.bottom - total, CENTER_Y - total / 2));
	return tafel.woerter.map((wort, i) => {
		const zeile = {wort, size: sizes[i], y};
		y += sizes[i] * LINE_HEIGHT;
		return zeile;
	});
};

const baseText = (size: number): React.CSSProperties => ({
	fontFamily: FONT,
	fontWeight: 900,
	fontSize: size,
	lineHeight: 1,
	letterSpacing: `${LETTER_SPACING}em`,
	textTransform: 'uppercase',
	whiteSpace: 'nowrap',
	color: COLORS.text,
});

const SHADOW = `0 6px 26px ${COLORS.textShadow}, 0 2px 5px rgba(0, 0, 0, 0.35)`;

// ---------------------------------------------------------------- Stile

const Normal: React.FC<{z: Zeile; frame: number}> = ({z, frame}) => {
	const p = springFrom(frame, z.wort.frame, SPRINGS.wort);
	return (
		<div
			style={{
				...baseText(z.size),
				textShadow: SHADOW,
				opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
				filter: `blur(${(1 - p) * 10}px)`,
				transform: `perspective(900px) translateY(${(1 - p) * 20}px) rotateX(${(1 - p) * 38}deg) scale(${1.3 - 0.3 * p})`,
			}}
		>
			{z.wort.text}
		</div>
	);
};

const neonLevel = (frame: number, start: number, index: number): number => {
	const t = frame - start;
	if (t < 0) return 0;
	if (t < FLICKER.length) return FLICKER[t];
	// Danach brennt die Röhre ruhig, mit kaum sichtbarem Summen
	return 0.95 + 0.05 * noise2D('neon', index, frame / 6);
};

const Neon: React.FC<{z: Zeile; frame: number}> = ({z, frame}) => {
	const color = NEON[z.wort.akzent as keyof typeof NEON];
	const level = neonLevel(frame, z.wort.frame, z.wort.index);
	const p = springFrom(frame, z.wort.frame, SPRINGS.wort);
	return (
		<div
			style={{
				...baseText(z.size),
				color: mix('#ffffff', color, 0.35),
				textShadow: [
					`0 0 3px ${color}`,
					`0 0 10px ${color}`,
					`0 0 22px ${withAlpha(color, 0.9)}`,
					`0 0 46px ${withAlpha(color, 0.65)}`,
					`0 0 92px ${withAlpha(color, 0.45)}`,
				].join(', '),
				opacity: level,
				transform: `scale(${1.1 - 0.1 * p})`,
			}}
		>
			{z.wort.text}
		</div>
	);
};

const Glitch: React.FC<{z: Zeile; frame: number}> = ({z, frame}) => {
	const t = frame - z.wort.frame;
	const p = springFrom(frame, z.wort.frame, SPRINGS.stauchen);
	// Stark beim Erscheinen, danach kurze Aussetzer alle 24 Frames
	let g = t < 0 ? 0 : t < 10 ? 1 - t / 10 : 0;
	const burst = Math.floor(t / 24);
	if (t >= 24 && t % 24 < 3 && hash(z.wort.index * 13 + burst) > 0.35) g = 0.6;
	const shift = (k: number) => g * 16 * (hash(frame * 7.3 + k) * 2 - 1);
	const style = baseText(z.size);
	// Gedehnt starten, aber nie breiter als das Bild
	const natural = measureText({
		text: z.wort.text.toLocaleUpperCase('de'),
		fontFamily: FONT,
		fontSize: z.size,
		fontWeight: 900,
		letterSpacing: `${LETTER_SPACING}em`,
	}).width;
	const stretch = Math.min(1.9, (WIDTH - 40) / natural);
	const band = (top: number, bottom: number, k: number) => (
		<div
			style={{
				...style,
				position: 'absolute',
				inset: 0,
				clipPath: `inset(${top}% 0 ${100 - bottom}% 0)`,
				transform: `translateX(${shift(k) * 1.8}px)`,
			}}
		>
			{z.wort.text}
		</div>
	);
	return (
		<div
			style={{
				position: 'relative',
				opacity: t < 0 ? 0 : 1,
				transform: `scale(${stretch - (stretch - 1) * p}, ${0.55 + 0.45 * p})`,
			}}
		>
			<div style={{...style, textShadow: SHADOW, opacity: g > 0.05 ? 0.85 : 1}}>{z.wort.text}</div>
			{g > 0.05 ? (
				<>
					<div style={{...style, position: 'absolute', inset: 0, color: '#ff2a55', mixBlendMode: 'screen', opacity: 0.9 * g, transform: `translateX(${shift(1)}px)`}}>
						{z.wort.text}
					</div>
					<div style={{...style, position: 'absolute', inset: 0, color: '#2af6ff', mixBlendMode: 'screen', opacity: 0.9 * g, transform: `translateX(${-shift(2)}px)`}}>
						{z.wort.text}
					</div>
					{band(18, 34, 3)}
					{band(58, 70, 4)}
				</>
			) : null}
		</div>
	);
};

const Umriss: React.FC<{z: Zeile; frame: number}> = ({z, frame}) => {
	const t = frame - z.wort.frame;
	const draw = interpolate(t, [0, 18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	// Nur das letzte Wort des Videos füllt sich danach langsam
	const fill = z.wort.index === LAST_INDEX ? interpolate(t, [20, 60], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)}) : 0;
	const dash = z.size * z.wort.text.length * 3.4;
	const width = MAX_WIDTH;
	const height = z.size * 1.2;
	return (
		<svg
			width={width}
			height={height}
			style={{overflow: 'visible', opacity: t < 0 ? 0 : 1, filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.35)) drop-shadow(0 4px 18px rgba(0, 0, 0, 0.45))'}}
		>
			<text
				x={width / 2}
				y={height / 2}
				textAnchor="middle"
				dominantBaseline="central"
				fontFamily={FONT}
				fontWeight={900}
				fontSize={z.size}
				letterSpacing={`${LETTER_SPACING}em`}
				fill={COLORS.text}
				fillOpacity={fill}
				stroke={COLORS.text}
				strokeWidth={Math.max(2.5, z.size * 0.022)}
				strokeLinejoin="round"
				strokeDasharray={`${dash} ${dash}`}
				strokeDashoffset={dash * (1 - draw)}
			>
				{z.wort.text.toLocaleUpperCase('de')}
			</text>
		</svg>
	);
};

const Wort: React.FC<{z: Zeile; frame: number}> = ({z, frame}) => {
	const a = z.wort.akzent;
	if (isNeon(a)) return <Neon z={z} frame={frame} />;
	if (a === 'glitch') return <Glitch z={z} frame={frame} />;
	if (a === 'umriss') return <Umriss z={z} frame={frame} />;
	return <Normal z={z} frame={frame} />;
};

// ---------------------------------------------------------------- Tafel

/** Farbiges Licht, das ein Neon-Wort in den Himmel wirft (liegt unter dem Text, Modus "screen") */
const NeonSchein: React.FC<{z: Zeile; frame: number; out: number}> = ({z, frame, out}) => {
	const color = NEON[z.wort.akzent as keyof typeof NEON];
	const level = neonLevel(frame, z.wort.frame, z.wort.index) * (1 - out);
	return (
		<div
			style={{
				position: 'absolute',
				left: '50%',
				top: z.y + z.size / 2,
				width: 1100,
				height: z.size * 4.2,
				transform: 'translate(-50%, -50%)',
				background: `radial-gradient(ellipse at center, ${withAlpha(color, 0.42)} 0%, ${withAlpha(color, 0.12)} 45%, transparent 70%)`,
				mixBlendMode: 'screen',
				opacity: level,
			}}
		/>
	);
};

const TafelView: React.FC<{zeilen: Zeile[]; tafel: Tafel; frame: number}> = ({zeilen, tafel, frame}) => {
	const out = interpolate(frame, [tafel.outFrame, tafel.outFrame + TAFEL_OUT_FRAMES], [0, 1], clamp);
	const float = Math.sin(frame / 38) * 5;
	return (
		<>
			{zeilen.filter((z) => isNeon(z.wort.akzent)).map((z) => (
				<NeonSchein key={`schein-${z.wort.index}`} z={z} frame={frame} out={out} />
			))}
			<AbsoluteFill
				style={{
					opacity: 1 - out,
					filter: out > 0 ? `blur(${out * 12}px)` : undefined,
					transform: `translateY(${float}px) scale(${1 + out * 0.1})`,
				}}
			>
				{zeilen.map((z) => (
					<div
						key={z.wort.index}
						style={{position: 'absolute', left: SAFE.left, width: SAFE.width, top: z.y, height: z.size, display: 'flex', justifyContent: 'center', alignItems: 'center'}}
					>
						<Wort z={z} frame={frame} />
					</div>
				))}
			</AbsoluteFill>
		</>
	);
};

export const Tafeln: React.FC = () => {
	const frame = useCurrentFrame();
	// Erst hier messen: FontGate hat Montserrat schon geladen
	const layouts = useMemo(() => TAFELN.map(layout), []);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{TAFELN.map((tafel, i) =>
				frame >= tafel.inFrame - 1 && frame < tafel.outFrame + TAFEL_OUT_FRAMES ? (
					<TafelView key={i} zeilen={layouts[i]} tafel={tafel} frame={frame} />
				) : null,
			)}
		</AbsoluteFill>
	);
};
