// Montserrat (SIL Open Font License, public/fonts/OFL-Montserrat.txt) liegt lokal in
// public/fonts. Beim Rendern wird nichts aus dem Netz geladen. FontGate wartet auf
// fontsReady, bevor irgendetwas gemessen oder gezeichnet wird.
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const FONT = 'Montserrat';

// Zeichenbereiche wie bei Google Fonts: "latin" deckt Deutsch komplett ab, "latin-ext" z. B. ẞ.
const SUBSETS = {
	latin:
		'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
	'latin-ext':
		'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
};

export const fontsReady = Promise.all(
	[600, 900].flatMap((weight) =>
		Object.entries(SUBSETS).map(([subset, unicodeRange]) =>
			loadFont({
				family: FONT,
				url: staticFile(`fonts/montserrat-${subset}-${weight}-normal.woff2`),
				weight: String(weight),
				unicodeRange,
				format: 'woff2',
			}),
		),
	),
);
