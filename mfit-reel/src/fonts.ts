// Schriften der MFit-Website (Rubik One für Überschriften, Rubik für Text),
// lokal aus public/fonts geladen: kein Netzwerk beim Rendern nötig.
// Beide unter SIL Open Font License, siehe public/fonts/OFL-*.txt.
import {staticFile} from 'remotion';

export const DISPLAY_FONT = 'MFit Rubik One';
export const TEXT_FONT = 'MFit Rubik';

const faces = [
	new FontFace(DISPLAY_FONT, `url('${staticFile('fonts/RubikOne-Regular.woff2')}') format('woff2')`, {weight: '400'}),
	new FontFace(TEXT_FONT, `url('${staticFile('fonts/Rubik-Variable.woff2')}') format('woff2')`, {weight: '300 900'}),
];

export const fontsReady = Promise.all(
	faces.map(async (face) => {
		await face.load();
		document.fonts.add(face);
	}),
);
