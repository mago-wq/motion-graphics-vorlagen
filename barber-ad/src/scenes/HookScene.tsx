// Szene 1 (0,0–1,5 s): Hook. Riesige Wörter schlagen einzeln ein, mit Screenshake.
import {Fragment, useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {fitFontSize} from '../components/FitText';
import {SafeArea} from '../components/SafeArea';
import {config} from '../config';
import {springFrom, SPRINGS} from '../motion';
import {COLORS, HEADLINE_FONT} from '../theme';
import {HOOK, SCENES} from '../timing';
import {SAFE} from '../video';

const MAX_LINE_SIZE = 380;
const LINE_HEIGHT = 0.9;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Kurzer Screenshake nach jedem Einschlag, beim letzten Wort stärker und mit leichter Drehung. */
const shakeAt = (frame: number) => {
	let x = 0;
	let y = 0;
	let rotate = 0;
	HOOK.impacts.forEach((impact, i) => {
		const t = frame - impact;
		if (t < 0 || t > 8) return;
		const last = i === HOOK.impacts.length - 1;
		const decay = Math.exp(-t / 2.2);
		const amplitude = (last ? 28 : 13) * decay;
		const angle = random(`shake-${i}-${t}`) * Math.PI * 2;
		x += Math.cos(angle) * amplitude;
		y += Math.sin(angle) * amplitude;
		if (last) rotate += (random(`tilt-${t}`) - 0.5) * 2.2 * decay;
	});
	return {x, y, rotate};
};

const Word: React.FC<{word: string; index: number; frame: number}> = ({word, index, frame}) => {
	const start = HOOK.impacts[index] - HOOK.slamLand;
	const t = frame - start;
	const slam = springFrom(frame, start, SPRINGS.slam);
	const scale = interpolate(slam, [0, 1], [2.1, 1]);
	const opacity = interpolate(t, [0, 1.5], [0, 1], clamp);
	const blur = interpolate(t, [0, HOOK.slamLand], [14, 0], clamp);

	// Satzzeichen am Ende des letzten Worts in Akzentfarbe ("HAARSCHNITT?")
	const last = index === HOOK.impacts.length - 1;
	const split = last ? word.match(/^(.*?)([?!.]+)$/) : null;

	return (
		<span
			style={{
				display: 'inline-block',
				transform: `scale(${scale})`,
				transformOrigin: '50% 60%',
				opacity,
				filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
			}}
		>
			{split ? (
				<>
					{split[1]}
					<span style={{color: COLORS.accent}}>{split[2]}</span>
				</>
			) : (
				word
			)}
		</span>
	);
};

export const HookScene: React.FC = () => {
	const frame = useCurrentFrame() + SCENES.hook.from;
	const lines = config.texte.hook;

	// Plakatsatz: jede Zeile füllt die sichere Breite, gedeckelt nach oben.
	// Würde der Block zu hoch, schrumpfen alle Zeilen gemeinsam.
	const sizes = useMemo(() => {
		const raw = lines.map((line) =>
			fitFontSize({text: line, maxWidth: SAFE.width, maxFontSize: MAX_LINE_SIZE, fontFamily: HEADLINE_FONT, uppercase: true}),
		);
		const blockHeight = raw.reduce((sum, size) => sum + size * LINE_HEIGHT, 0);
		const k = Math.min(1, (SAFE.height * 0.9) / blockHeight);
		return raw.map((size) => Math.floor(size * k));
	}, [lines]);

	const shake = shakeAt(frame);
	let wordIndex = 0;

	return (
		<AbsoluteFill>
			<SafeArea
				style={{
					alignItems: 'flex-start',
					transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.rotate}deg)`,
				}}
			>
				{lines.map((line, li) => (
					<div
						key={line}
						style={{
							fontFamily: HEADLINE_FONT,
							fontSize: sizes[li],
							lineHeight: LINE_HEIGHT,
							color: COLORS.text,
							textTransform: 'uppercase',
							whiteSpace: 'pre',
						}}
					>
						{line
							.split(' ')
							.filter(Boolean)
							.map((word, wi) => {
								const index = wordIndex++;
								return (
									<Fragment key={word + wi}>
										{wi > 0 ? ' ' : null}
										<Word word={word} index={index} frame={frame} />
									</Fragment>
								);
							})}
					</div>
				))}
			</SafeArea>
		</AbsoluteFill>
	);
};
