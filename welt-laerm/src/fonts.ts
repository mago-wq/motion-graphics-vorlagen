// Unbounded (SIL Open Font License): breite, fette Groteske für die Untertitel.
// Liegt lokal in public/fonts – kein Abruf bei Google beim Rendern.
// FontGate wartet auf das Laden, bevor gezeichnet wird.
import {staticFile} from 'remotion';

export const TITLE_FONT = 'Unbounded';

const face = new FontFace(TITLE_FONT, `url(${staticFile('fonts/unbounded-latin.woff2')}) format('woff2')`, {
	weight: '200 900',
});

export const fontsReady = face.load().then((loaded) => {
	document.fonts.add(loaded);
});
