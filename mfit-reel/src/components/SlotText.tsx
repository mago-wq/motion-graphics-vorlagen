// Zahl wie auf einer Walze: jede Ziffer rollt und rastet zu ihrem eigenen
// Zeitpunkt ein (bremst weich ab). Andere Zeichen (Komma, €, ?) stehen fest.
import type {CSSProperties} from 'react';
import {Easing, interpolate} from 'remotion';
import {clamp} from '../motion';

type SlotTextProps = {
	text: string;
	frame: number;
	/** Frame, ab dem die Walzen laufen */
	rollFrom: number;
	/** Einrast-Frame je Ziffer, in Lesereihenfolge (Nicht-Ziffern zählen nicht mit) */
	lockAt: number[];
	/** Umdrehungen, die jede Walze bis zum Einrasten läuft */
	turns?: number;
	style?: CSSProperties;
	/** Stil für die Ziffern (z. B. Goldverlauf) */
	digitStyle?: CSSProperties;
};

export const SlotText: React.FC<SlotTextProps> = ({text, frame, rollFrom, lockAt, turns = 2, style, digitStyle}) => {
	let digitIndex = 0;
	return (
		<div style={{display: 'flex', alignItems: 'flex-start', whiteSpace: 'pre', lineHeight: 1, ...style}}>
			{[...text].map((char, i) => {
				// Alle Zeichen in gleich hohen Kästen: oben bündig = gleiche Grundlinie
				if (!/\d/.test(char)) {
					return (
						<span key={i} style={{display: 'inline-block', height: '1em', ...digitStyle, opacity: frame < rollFrom ? 0 : 1}}>
							{char}
						</span>
					);
				}
				const lock = lockAt[Math.min(digitIndex, lockAt.length - 1)];
				digitIndex++;
				const target = Number(char);
				if (frame < rollFrom) {
					return (
						<span key={i} style={{display: 'inline-block', height: '1em', ...digitStyle, opacity: 0}}>
							{char}
						</span>
					);
				}
				// Walzenposition in Ziffern: läuft rückwärts auf das Ziel zu und bremst ab
				const p = interpolate(frame, [rollFrom, lock], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
				const offset = (1 - p) * turns * 10 + (i % 3) * 3 * (1 - p);
				const speed = frame < lock ? (turns * 10 * 3) / Math.max(1, lock - rollFrom) * (1 - p) : 0;
				const pos = target + offset;
				const low = Math.floor(pos);
				const frac = pos - low;
				const blur = Math.min(24, Math.round(speed * 40));
				// Nachfedern beim Einrasten (kleiner Überschwinger von oben)
				const settle = frame >= lock ? interpolate(frame, [lock, lock + 5], [-0.07, 0], {...clamp, easing: Easing.out(Easing.back(3))}) : 0;
				return (
					<span
						key={i}
						style={{position: 'relative', display: 'inline-block', overflow: 'hidden', height: '1em'}}
					>
						{/* Platzhalter bestimmt die Breite: Rubik One hat gleich breite Ziffern */}
						<span style={{visibility: 'hidden', ...digitStyle}}>{char}</span>
						{[0, 1].map((k) => (
							<span
								key={k}
								style={{
									position: 'absolute',
									left: 0,
									top: 0,
									transform: `translateY(${(k - frac + settle) * 100}%)`,
									filter: blur >= 1 ? `url(#vblur-${blur})` : undefined,
									...digitStyle,
								}}
							>
								{(low + k) % 10}
							</span>
						))}
					</span>
				);
			})}
		</div>
	);
};
