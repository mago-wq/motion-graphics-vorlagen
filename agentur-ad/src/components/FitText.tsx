// Text, der sich automatisch so klein setzt, dass er in eine Breite passt.
// So bleiben lange Namen echter Betriebe in der Sicherheitszone.
import {fitText} from '@remotion/layout-utils';
import {useMemo, type CSSProperties} from 'react';

export type FitOptions = {
	text: string;
	maxWidth: number;
	maxFontSize: number;
	fontFamily: string;
	fontWeight?: number;
	/** Laufweite in em */
	letterSpacing?: number;
	uppercase?: boolean;
};

export const fitFontSize = ({
	text,
	maxWidth,
	maxFontSize,
	fontFamily,
	fontWeight = 400,
	letterSpacing = 0,
	uppercase = false,
}: FitOptions): number => {
	const {fontSize} = fitText({
		text,
		// 2 % Luft gegen Rundungsfehler beim Rastern
		withinWidth: maxWidth * 0.98,
		fontFamily,
		fontWeight: String(fontWeight),
		letterSpacing: `${letterSpacing}em`,
		textTransform: uppercase ? 'uppercase' : undefined,
		validateFontIsLoaded: true,
	});
	return Math.min(maxFontSize, Math.floor(fontSize));
};

export const FitText: React.FC<FitOptions & {style?: CSSProperties}> = ({style, ...options}) => {
	const {text, maxWidth, maxFontSize, fontFamily, fontWeight = 400, letterSpacing = 0, uppercase = false} = options;
	const fontSize = useMemo(
		() => fitFontSize({text, maxWidth, maxFontSize, fontFamily, fontWeight, letterSpacing, uppercase}),
		[text, maxWidth, maxFontSize, fontFamily, fontWeight, letterSpacing, uppercase],
	);
	return (
		<div
			style={{
				fontFamily,
				fontWeight,
				fontSize,
				letterSpacing: `${letterSpacing}em`,
				textTransform: uppercase ? 'uppercase' : undefined,
				whiteSpace: 'nowrap',
				lineHeight: 1,
				// Laufweite hängt auch hinter dem letzten Zeichen an – für saubere Zentrierung ausgleichen
				marginRight: letterSpacing > 0 ? `-${letterSpacing}em` : undefined,
				...style,
			}}
		>
			{text}
		</div>
	);
};
