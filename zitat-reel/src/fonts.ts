// Schriften liegen als .woff2 in public/fonts (aus @fontsource, SIL OFL 1.1) –
// kein Netzwerkzugriff beim Rendern. FontGate wartet auf fontsReady.
import {staticFile} from 'remotion';

const LATIN =
	'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
// latin-ext enthält u. a. das Ḥ aus „ash-Sharḥ“ (Umschrift arabischer Namen)
const LATIN_EXT =
	'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

export const ARABIC_FONT = 'Amiri';
export const LATIN_FONT = 'EB Garamond';

const face = (family: string, file: string, descriptors: FontFaceDescriptors) =>
	new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, descriptors);

const FACES = [
	face(ARABIC_FONT, 'amiri-arabic-700-normal.woff2', {weight: '700'}),
	face(LATIN_FONT, 'eb-garamond-latin-400-italic.woff2', {weight: '400', style: 'italic', unicodeRange: LATIN}),
	face(LATIN_FONT, 'eb-garamond-latin-ext-400-italic.woff2', {weight: '400', style: 'italic', unicodeRange: LATIN_EXT}),
	face(LATIN_FONT, 'eb-garamond-latin-500-normal.woff2', {weight: '500', unicodeRange: LATIN}),
	face(LATIN_FONT, 'eb-garamond-latin-ext-500-normal.woff2', {weight: '500', unicodeRange: LATIN_EXT}),
];

export const fontsReady = Promise.all(
	FACES.map((f) =>
		f.load().then((loaded) => {
			document.fonts.add(loaded);
		}),
	),
);
