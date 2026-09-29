// Schrift-Bausteine: Zeilen, die sich an die Breite anpassen, Metallic-Gold mit
// Glanz, Masken-Einblendung. Alle Maße in Pixeln des 1080×1920-Bildes.
import {fitText} from '@remotion/layout-utils';
import type {CSSProperties} from 'react';
import {COLORS, DISPLAY_FONT, GOLD_GRADIENT, TEXT_FONT} from '../theme';

type FitOptions = {
	text: string;
	maxWidth: number;
	maxSize: number;
	font?: string;
	weight?: number;
	/** Laufweite in em */
	tracking?: number;
	uppercase?: boolean;
};

const cache = new Map<string, number>();

/** Größte Schriftgröße ≤ maxSize, bei der `text` in `maxWidth` passt (mit der geladenen Schrift gemessen). */
export const fitSize = ({text, maxWidth, maxSize, font = DISPLAY_FONT, weight = 400, tracking = 0, uppercase = true}: FitOptions): number => {
	const key = [text, maxWidth, maxSize, font, weight, tracking, uppercase].join('|');
	const hit = cache.get(key);
	if (hit !== undefined) return hit;
	const {fontSize} = fitText({
		text,
		// 2 % Luft gegen Rundungsfehler beim Rastern
		withinWidth: maxWidth * 0.98,
		fontFamily: font,
		fontWeight: String(weight),
		letterSpacing: `${tracking}em`,
		textTransform: uppercase ? 'uppercase' : undefined,
		validateFontIsLoaded: true,
	});
	const size = Math.min(maxSize, Math.floor(fontSize));
	cache.set(key, size);
	return size;
};

/** Glanzlicht, das über goldene Schrift wandert: `sheen` 0 → 1 = einmal von links nach rechts. */
const sheenLayer = (sheen: number | undefined): string | null => {
	if (sheen === undefined || sheen <= 0 || sheen >= 1) return null;
	const pos = -30 + sheen * 160; // Prozent der Breite
	return `linear-gradient(105deg, transparent ${pos - 14}%, rgba(255, 250, 230, 0.95) ${pos}%, transparent ${pos + 14}%)`;
};

export const goldTextStyle = (sheen?: number): CSSProperties => {
	const layer = sheenLayer(sheen);
	return {
		backgroundImage: layer ? `${layer}, ${GOLD_GRADIENT}` : GOLD_GRADIENT,
		backgroundSize: '100% 100%',
		WebkitBackgroundClip: 'text',
		backgroundClip: 'text',
		color: 'transparent',
		WebkitTextFillColor: 'transparent',
	};
};

export type LineProps = FitOptions & {
	gold?: boolean;
	sheen?: number;
	color?: string;
	/** Zeilenhöhe als Faktor der Schriftgröße */
	leading?: number;
	style?: CSSProperties;
};

/** Eine einzelne Zeile, automatisch in die Breite gesetzt. */
export const Line: React.FC<LineProps> = ({gold, sheen, color = COLORS.text, leading = 1, style, ...fit}) => {
	const {text, font = DISPLAY_FONT, weight = 400, tracking = 0, uppercase = true} = fit;
	const size = fitSize({...fit, font, weight, tracking, uppercase});
	return (
		<div
			style={{
				fontFamily: font,
				fontWeight: weight,
				fontSize: size,
				lineHeight: leading,
				letterSpacing: `${tracking}em`,
				textTransform: uppercase ? 'uppercase' : undefined,
				whiteSpace: 'nowrap',
				color,
				// Laufweite hängt auch hinter dem letzten Zeichen an: für saubere Zentrierung ausgleichen
				marginRight: tracking > 0 ? `-${tracking}em` : undefined,
				...(gold ? goldTextStyle(sheen) : null),
				...style,
			}}
		>
			{text}
		</div>
	);
};

/** Fließtext-Zeile in Rubik (Unterzeilen, Fußnoten, Listen). */
export const TextLine: React.FC<Omit<LineProps, 'font'>> = ({weight = 500, uppercase = false, ...rest}) => (
	<Line font={TEXT_FONT} weight={weight} uppercase={uppercase} {...rest} />
);

/**
 * Masken-Einblendung: der Inhalt schiebt sich von unten aus einer unsichtbaren
 * Kante ins Bild (`p` 0 → 1). `out` 0 → 1 schiebt ihn nach oben wieder hinaus.
 * `bleed`: zusätzlicher Rand der Maske in px, damit Umlaute, Akzente und
 * Unterlängen nicht abgeschnitten werden.
 */
export const MaskReveal: React.FC<{
	p: number;
	out?: number;
	bleed?: number;
	children: React.ReactNode;
	style?: CSSProperties;
}> = ({p, out = 0, bleed = 36, children, style}) => {
	const down = 1 - p;
	return (
		<div style={{overflow: 'hidden', padding: `${bleed}px 16px`, margin: `-${bleed}px -16px`, ...style}}>
			<div
				style={{
					transform: `translateY(calc(${(down - out) * 100}% + ${(down - out) * bleed}px))`,
					visibility: p > 0 && out < 1 ? 'visible' : 'hidden',
				}}
			>
				{children}
			</div>
		</div>
	);
};

export type HeadRow = {
	text: string;
	/** Mitte der Zeile im Bild */
	y: number;
	maxSize: number;
	gold?: boolean;
	font?: string;
};

/**
 * Mehrzeilige Überschrift, die als EIN Block rollt – wie ein Zählwerk: der alte Block
 * geht nach oben hinaus, der neue kommt von unten, im selben Takt. So liegen Zeilen
 * zweier Überschriften nie übereinander, auch wenn die Zeilen eng stehen.
 */
export const RollBlock: React.FC<{rows: HeadRow[]; p: number; out?: number; bleed?: number}> = ({rows, p, out = 0, bleed = 30}) => {
	const sized = rows.map((r) => ({...r, size: fitSize({text: r.text, maxWidth: 900, maxSize: r.maxSize, font: r.font})}));
	const top = Math.min(...sized.map((r) => r.y - r.size / 2));
	const bottom = Math.max(...sized.map((r) => r.y + r.size / 2));
	if (p <= 0 || out >= 1) return null;
	return (
		<div style={{position: 'absolute', left: 0, width: 1080, top, display: 'flex', justifyContent: 'center'}}>
			<MaskReveal p={p} out={out} bleed={bleed}>
				<div style={{position: 'relative', width: 1000, height: bottom - top}}>
					{sized.map((r) => (
						<div
							key={r.text + r.y}
							style={{position: 'absolute', left: 0, right: 0, top: r.y - top - r.size / 2, display: 'flex', justifyContent: 'center'}}
						>
							<Line text={r.text} maxWidth={900} maxSize={r.maxSize} gold={r.gold} font={r.font} />
						</div>
					))}
				</div>
			</MaskReveal>
		</div>
	);
};
