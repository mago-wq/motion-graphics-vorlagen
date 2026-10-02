// Schriften lokal aus public/fonts (keine Netzabfrage beim Rendern).
// Aref Ruqaa: Ruqaa-Kalligrafie für den arabischen Text. Amiri: Buchschrift
// mit Latin-Teil für die englische Zeile. Beide SIL OFL.
import {continueRender, delayRender, staticFile} from 'remotion';

export const ARABIC_FONT = 'ArefRuqaa';
export const LATIN_FONT = 'AmiriLatin';

const faces = [
	new FontFace(ARABIC_FONT, `url(${staticFile('fonts/ArefRuqaa-Bold.ttf')})`, {weight: '700'}),
	new FontFace(LATIN_FONT, `url(${staticFile('fonts/Amiri-Regular.ttf')})`, {weight: '400'}),
	new FontFace(LATIN_FONT, `url(${staticFile('fonts/Amiri-Italic.ttf')})`, {
		weight: '400',
		style: 'italic',
	}),
];

const handle = delayRender('Schriften laden');
Promise.all(faces.map((f) => f.load()))
	.then((loaded) => {
		loaded.forEach((f) => document.fonts.add(f));
		continueRender(handle);
	})
	.catch((err) => {
		console.error(err);
		continueRender(handle);
	});
