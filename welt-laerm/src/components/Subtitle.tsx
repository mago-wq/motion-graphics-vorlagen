// Deutscher Untertitel: Wörter erscheinen nacheinander, verteilt über die Sprechzeit
// des Satzes (nach Wortlänge gewichtet), und tauchen aus der Unschärfe auf.
// Schlüsselwörter glühen danach stärker nach.
import {useCurrentFrame} from 'remotion';
import type {Line} from '../config';
import {TITLE_FONT} from '../fonts';
import {clamp, easeOut, tween} from '../motion';
import type {SceneTiming} from '../timing';
import {SAFE} from '../video';
import {glowFilter} from './Glow';
import {interpolate} from 'remotion';

const WORD_IN = 9;
const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}]/gu, '');

export const wordStarts = (words: string[], t: SceneTiming) => {
	const weights = words.map((w) => 2 + norm(w).length);
	const total = weights.reduce((a, b) => a + b, 0);
	const span = Math.max(1, t.voiceTo - t.voiceFrom - 6);
	let acc = 0;
	return weights.map((w) => {
		const start = t.voiceFrom + Math.round((acc / total) * span);
		acc += w;
		return start;
	});
};

export const Subtitle: React.FC<{line: Line; timing: SceneTiming; level: number; color: string; top?: number; fontSize?: number}> = ({
	line,
	timing,
	level,
	color,
	top = 330,
	fontSize = 66,
}) => {
	const frame = useCurrentFrame();
	const words = line.text.split(' ');
	const starts = wordStarts(words, timing);
	const emph = new Set(line.emphasis.map(norm));

	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE.left,
				width: SAFE.width,
				top,
				height: 470,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				alignContent: 'center',
				columnGap: fontSize * 0.32,
				rowGap: fontSize * 0.18,
				fontFamily: TITLE_FONT,
				fontWeight: 900,
				fontSize,
				lineHeight: 1.1,
				textTransform: 'uppercase',
				textAlign: 'center',
				color,
				opacity: level,
			}}
		>
			{words.map((w, i) => {
				const s = starts[i];
				const p = tween(frame, s, s + WORD_IN, 0, 1);
				const isEmph = emph.has(norm(w));
				// Schlüsselwort: kurz aufblähen, dann sanft weiter pulsieren
				const pulse = isEmph ? interpolate(frame - s - WORD_IN, [0, 6, 30], [1.14, 1.06, 1], {...clamp, easing: easeOut}) : 1;
				const breath = isEmph && frame > s + WORD_IN ? 1 + 0.25 * Math.sin((frame - s) / 7) : 1;
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							opacity: p,
							transform: `translateY(${(1 - p) * 26}px) scale(${pulse})`,
							filter: `blur(${(1 - p) * 14}px) ${glowFilter(color, isEmph ? 1.15 * breath : 0.55)}`,
						}}
					>
						{w}
					</span>
				);
			})}
		</div>
	);
};
