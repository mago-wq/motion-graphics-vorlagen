// Teleshopping-Schrift der 2000er: breite, kursive Archivo Black mit
// Chrom- (oder Gold-/Rot-)Verlauf, dicker Kontur und hartem Schlagschatten.
// Drei Lagen übereinander: Schatten, Kontur, Füllung.
import type {CSSProperties} from 'react';
import {FONT, WIDE} from '../theme';
import {fitSize} from './FitText';

export type ChromeVariant = 'chrome' | 'gold' | 'red' | 'white';

const LOOK: Record<ChromeVariant, {fill: string; outline: string; shadow: string}> = {
	chrome: {
		// Der harte Sprung bei 50 % ist der "Horizont" im Chrom
		fill: 'linear-gradient(180deg, #FFFFFF 0%, #EEF4FF 36%, #A9BEE8 49%, #5671B5 51%, #C9D8FA 72%, #FFFFFF 100%)',
		outline: '#06124A',
		shadow: '#030A2E',
	},
	gold: {
		fill: 'linear-gradient(180deg, #FFF8C4 0%, #FFE04A 38%, #FFC400 49%, #E87E00 51%, #FFD43A 74%, #FFF4A8 100%)',
		outline: '#7A1300',
		shadow: '#3D0900',
	},
	red: {
		fill: 'linear-gradient(180deg, #FF8A8A 0%, #FF2A3A 40%, #E2081C 50%, #B00012 52%, #F01C2E 78%, #FF6670 100%)',
		outline: '#FFFFFF',
		shadow: '#06124A',
	},
	white: {
		fill: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)',
		outline: '#06124A',
		shadow: '#030A2E',
	},
};

export const ChromeText: React.FC<{
	text: string;
	size: number;
	/** Wenn gesetzt: Schrift schrumpft, bis der Text samt Kontur hineinpasst */
	maxWidth?: number;
	/** Text, nach dem die Größe bemessen wird (z. B. Endstand eines Zählers), Standard: text */
	fitTo?: string;
	variant?: ChromeVariant;
	/** Stärke der Kontur relativ zur Schriftgröße */
	outline?: number;
	/** Schlagschatten relativ zur Schriftgröße */
	depth?: number;
	italic?: boolean;
	stretch?: string;
	weight?: number;
	uppercase?: boolean;
	style?: CSSProperties;
}> = ({
	text,
	size: maxSize,
	maxWidth,
	fitTo,
	variant = 'chrome',
	outline = 0.1,
	depth = 0.07,
	italic = true,
	stretch = WIDE,
	weight = 900,
	uppercase = true,
	style,
}) => {
	const look = LOOK[variant];
	// Innenabstand (2 × 0,12 em), Kontur und Schatten wachsen mit der Schriftgröße
	// mit: Breite = s · (a + k), mit a = Textbreite pro px und k = Zuschlag in em.
	const k = 0.24 + outline * 1.6 + depth * 0.7;
	let size = maxSize;
	if (maxWidth) {
		const s0 = fitSize({text: fitTo ?? text, maxWidth, maxSize: 10000, weight, stretch, italic, uppercase});
		size = Math.min(maxSize, Math.floor(s0 / (1 + (k * s0) / maxWidth)));
	}
	const base: CSSProperties = {
		fontFamily: FONT,
		fontSize: size,
		fontWeight: weight,
		fontStyle: italic ? 'italic' : 'normal',
		fontStretch: stretch,
		lineHeight: 1.04,
		whiteSpace: 'nowrap',
		letterSpacing: '-0.01em',
		textTransform: uppercase ? 'uppercase' : undefined,
		// Kursive Endbuchstaben ragen sonst aus der Box
		padding: `0 ${size * 0.12}px`,
	};
	const layer: CSSProperties = {...base, position: 'absolute', left: 0, top: 0};
	return (
		<div style={{position: 'relative', display: 'inline-block', ...style}}>
			<span
				aria-hidden
				style={{
					...layer,
					color: look.shadow,
					WebkitTextStroke: `${size * outline * 1.6}px ${look.shadow}`,
					transform: `translate(${size * depth * 0.7}px, ${size * depth}px)`,
				}}
			>
				{text}
			</span>
			<span aria-hidden style={{...layer, color: look.outline, WebkitTextStroke: `${size * outline * 1.6}px ${look.outline}`}}>
				{text}
			</span>
			<span
				style={{
					...base,
					position: 'relative',
					display: 'block',
					backgroundImage: look.fill,
					WebkitBackgroundClip: 'text',
					backgroundClip: 'text',
					color: 'transparent',
				}}
			>
				{text}
			</span>
		</div>
	);
};
