// Amiri Quran (SIL OFL) für den Koran-Text, Cormorant Garamond (SIL OFL) für das Deutsche.
// Beide liegen lokal in public/fonts – kein Abruf bei Google beim Rendern.
// FontGate wartet auf das Laden, bevor gezeichnet wird.
import {staticFile} from 'remotion';

export const QURAN_FONT = 'Amiri Quran';
export const DE_FONT = 'Cormorant Garamond';

const faces = [
	new FontFace(QURAN_FONT, `url(${staticFile('fonts/AmiriQuran.ttf')}) format('truetype')`),
	new FontFace(DE_FONT, `url(${staticFile('fonts/CormorantGaramond.ttf')}) format('truetype')`, {weight: '300 700'}),
];

export const fontsReady = Promise.all(faces.map((f) => f.load())).then((loaded) => {
	for (const f of loaded) document.fonts.add(f);
});
