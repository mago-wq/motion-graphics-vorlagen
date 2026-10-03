// Koranvers oben, deutsche Übersetzung darunter.
// Arabisch: Wörter tauchen von rechts nach links nacheinander aus der Unschärfe auf.
// Deutsch: Wort für Wort über die Sprechzeit des Teils verteilt (nach Wortlänge gewichtet).
// Leuchten nur per text-shadow – CSS-Filter auf fertigen Wörtern können Glyphen beschneiden.
import {useCurrentFrame} from 'remotion';
import {CONFIG, type TextBlock as Block} from '../config';
import {DE_FONT, QURAN_FONT} from '../fonts';
import {lightLevel, tween} from '../motion';
import {SAFE, sec} from '../video';

const AR_STAGGER = 5;
const WORD_IN = 10;

const glow = (c: string, s = 1) => `0 0 ${6 * s}px ${c}, 0 0 ${20 * s}px ${c}aa, 0 0 ${48 * s}px ${c}55`;

const reveal = (frame: number, start: number) => {
	const p = tween(frame, start, start + WORD_IN, 0, 1);
	return {opacity: p, transform: `translateY(${(1 - p) * 18}px)`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined};
};

const deStarts = (words: string[], [a, b]: [number, number]) => {
	const w = words.map((x) => 2 + x.replace(/[^\p{L}]/gu, '').length);
	const total = w.reduce((x, y) => x + y, 0);
	let acc = 0;
	return w.map((x) => {
		const s = sec(a) + Math.round((acc / total) * (sec(b) - sec(a)));
		acc += x;
		return s;
	});
};

export const TextBlock: React.FC<{block: Block}> = ({block}) => {
	const frame = useCurrentFrame();
	const level = lightLevel(frame, sec(block.on), sec(block.off));
	if (level === 0) return null;
	const ink = CONFIG.colors.ink;
	const arCount = block.parts.reduce((n, p) => n + p.ar.length, 0);
	const arSize = arCount > 6 ? 80 : 94;
	const deSize = 58;

	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE.left,
				width: SAFE.width,
				top: 270,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 20,
				opacity: level,
			}}
		>
			<div
				dir="rtl"
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					columnGap: arSize * 0.32,
					fontFamily: QURAN_FONT,
					fontSize: arSize,
					lineHeight: 1.85,
					color: ink,
					textShadow: glow('#ffffff', 0.9),
				}}
			>
				{block.parts.flatMap((part, pi) =>
					part.ar.map((w, i) => (
						<span key={`${pi}-${i}`} style={{display: 'inline-block', padding: '0 4px', ...reveal(frame, sec(part.at) + i * AR_STAGGER)}}>
							{w}
						</span>
					)),
				)}
				{block.ayah && (
					<span
						style={{
							display: 'inline-block',
							color: CONFIG.colors.warm,
							textShadow: glow(CONFIG.colors.warm, 0.7),
							...reveal(frame, sec(block.parts[block.parts.length - 1].at) + arCount * AR_STAGGER),
						}}
					>
						{'۝' + block.ayah}
					</span>
				)}
			</div>
			<div
				style={{
					width: 70,
					height: 2,
					background: `linear-gradient(90deg, transparent, ${CONFIG.colors.warm}, transparent)`,
					opacity: tween(frame, sec(block.on), sec(block.on) + 20, 0, 0.8),
				}}
			/>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					columnGap: deSize * 0.26,
					rowGap: 2,
					fontFamily: DE_FONT,
					fontWeight: 600,
					fontSize: deSize,
					lineHeight: 1.2,
					color: '#eef1ff',
					textAlign: 'center',
					textShadow: glow('#ffffff', 0.45),
				}}
			>
				{block.parts.flatMap((part, pi) => {
					const words = part.de.split(' ');
					const starts = deStarts(words, part.deSpan);
					return words.map((w, i) => (
						<span key={`${pi}-${i}`} style={{display: 'inline-block', ...reveal(frame, starts[i])}}>
							{w}
						</span>
					));
				})}
			</div>
		</div>
	);
};
