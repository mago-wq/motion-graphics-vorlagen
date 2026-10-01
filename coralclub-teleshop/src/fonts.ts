// Archivo (SIL OFL, public/fonts/OFL.txt) liegt als Datei im Projekt: variable
// Schrift mit Stärke 100–900 und Breite 62–125 %, normal und kursiv.
// Beim Rendern wird nichts aus dem Netz geladen. FontGate wartet auf fontsReady,
// bevor irgendetwas gemessen oder gezeichnet wird.
import {staticFile} from 'remotion';
import {FONT} from './theme';

const LATIN =
	'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT =
	'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';

const FILES = [
	{file: 'fonts/Archivo-latin.woff2', style: 'normal', unicodeRange: LATIN},
	{file: 'fonts/Archivo-latin-ext.woff2', style: 'normal', unicodeRange: LATIN_EXT},
	{file: 'fonts/Archivo-italic-latin.woff2', style: 'italic', unicodeRange: LATIN},
	{file: 'fonts/Archivo-italic-latin-ext.woff2', style: 'italic', unicodeRange: LATIN_EXT},
];

const faces = FILES.map(
	({file, style, unicodeRange}) =>
		new FontFace(FONT, `url(${staticFile(file)}) format('woff2')`, {
			weight: '100 900',
			stretch: '62% 125%',
			style,
			unicodeRange,
		}),
);
faces.forEach((face) => document.fonts.add(face));

export const fontsReady = Promise.all(faces.map((face) => face.load()));
