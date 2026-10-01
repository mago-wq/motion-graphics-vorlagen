// Schriftgröße so wählen, dass ein Text in eine Breite passt (gemessen mit der
// geladenen Archivo, inklusive Breite und Kursiv). So bleiben auch längere
// Texte nach einer Änderung in config.ts in der Sicherheitszone.
import {fitText} from '@remotion/layout-utils';
import {FONT, WIDE} from '../theme';

export type FitOptions = {
	text: string;
	maxWidth: number;
	maxSize: number;
	weight?: number;
	stretch?: string;
	italic?: boolean;
	uppercase?: boolean;
};

const cache = new Map<string, number>();

export const fitSize = ({text, maxWidth, maxSize, weight = 900, stretch = WIDE, italic = true, uppercase = true}: FitOptions): number => {
	const key = JSON.stringify([text, maxWidth, weight, stretch, italic, uppercase]);
	let size = cache.get(key);
	if (size === undefined) {
		size = fitText({
			text,
			// 2 % Luft gegen Rundungsfehler beim Rastern
			withinWidth: maxWidth * 0.98,
			fontFamily: FONT,
			fontWeight: String(weight),
			textTransform: uppercase ? 'uppercase' : undefined,
			validateFontIsLoaded: true,
			additionalStyles: {fontStyle: italic ? 'italic' : 'normal', fontStretch: stretch},
		}).fontSize;
		cache.set(key, size);
	}
	return Math.min(maxSize, Math.floor(size));
};
