// Schriften liegen lokal in public/fonts (OFL, aus @fontsource kopiert) –
// kein Google-Server beim Rendern. Latein + Kyrillisch, damit "НОХЧИЙ" sauber steht.
import {staticFile} from 'remotion';

export const HEADLINE_FONT = 'Oswald Edit';
export const SERIF_FONT = 'PT Serif Edit';

const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const CYR = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116';
const CYR_EXT = 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F';

const faces: [string, string, string, string, string][] = [
	[HEADLINE_FONT, 'oswald-latin-700-normal', '700', 'normal', LATIN],
	[HEADLINE_FONT, 'oswald-cyrillic-700-normal', '700', 'normal', CYR],
	[HEADLINE_FONT, 'oswald-cyrillic-ext-700-normal', '700', 'normal', CYR_EXT],
	[HEADLINE_FONT, 'oswald-latin-300-normal', '300', 'normal', LATIN],
	[HEADLINE_FONT, 'oswald-cyrillic-300-normal', '300', 'normal', CYR],
	[SERIF_FONT, 'pt-serif-latin-400-italic', '400', 'italic', LATIN],
	[SERIF_FONT, 'pt-serif-cyrillic-400-italic', '400', 'italic', CYR],
];

export const fontsReady: Promise<unknown> = Promise.all(
	faces.map(([family, file, weight, style, unicodeRange]) => {
		const face = new FontFace(family, `url(${staticFile(`fonts/${file}.woff2`)}) format('woff2')`, {weight, style, unicodeRange});
		document.fonts.add(face);
		return face.load();
	}),
);
