// Schriften lokal aus public/fonts (keine Netzabfrage beim Rendern), alle SIL OFL.
// Anton: schmale, schwere Versalien für die Aussagen. Barlow Condensed: Namen,
// Unterzeilen, Übersetzungen. Scheherazade New Bold: Arabisch (klares Naskh –
// Ruqaa wurde in nasheed-reel als „verrutscht“ gelesen, deshalb nicht).
import {continueRender, delayRender, staticFile} from 'remotion';

export const DISPLAY = 'AntonAsmu';
export const COND = 'BarlowCondAsmu';
export const ARABIC = 'ScheherazadeAsmu';

const faces = [
	new FontFace(DISPLAY, `url(${staticFile('fonts/Anton-Regular.woff2')})`, {weight: '400'}),
	new FontFace(COND, `url(${staticFile('fonts/BarlowCondensed-SemiBold.woff2')})`, {weight: '600'}),
	new FontFace(COND, `url(${staticFile('fonts/BarlowCondensed-Bold.woff2')})`, {weight: '700'}),
	new FontFace(ARABIC, `url(${staticFile('fonts/ScheherazadeNew-Bold.ttf')})`, {weight: '700'}),
];

const handle = delayRender('Schriften laden');
/** Erfüllt, sobald alle Schriften geladen sind. Vorher nichts messen (fitText). */
export const fontsReady: Promise<void> = Promise.all(faces.map((f) => f.load()))
	.then((loaded) => {
		loaded.forEach((f) => document.fonts.add(f));
		continueRender(handle);
	})
	.catch((err) => {
		console.error(err);
		continueRender(handle);
	});
