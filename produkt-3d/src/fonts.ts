// Schriften lokal aus public/fonts (SIL OFL, Lizenztexte daneben), keine Netzabfrage beim
// Rendern. FontGate wartet darauf, bevor gemessen oder das Etikett gezeichnet wird,
// sonst stünde die Ersatzschrift auf der Dose.
import {staticFile} from 'remotion';

export const HEADLINE_FONT = 'BebasNeue';
export const BODY_FONT = 'InterVar';

const faces = [
	new FontFace(HEADLINE_FONT, `url(${staticFile('fonts/BebasNeue-Regular.ttf')})`, {weight: '400'}),
	new FontFace(BODY_FONT, `url(${staticFile('fonts/Inter.ttf')})`, {weight: '100 900'}),
];

export const fontsReady = Promise.all(
	faces.map(async (f) => {
		document.fonts.add(await f.load());
	}),
);
