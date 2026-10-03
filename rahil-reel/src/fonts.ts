// Schriften lokal aus public/fonts (keine Netzabfrage beim Rendern).
// Scheherazade New Bold: kräftiges Naskh, sauber verbunden, verträgt die
// Kashida-Dehnung (ـ) wie im Original. Amiri: Buchschrift mit Times-artigem
// Latin-Teil für die deutsche Zeile. Beide SIL OFL.
//
// Aref Ruqaa wurde verworfen: Ruqaa staffelt Buchstaben schräg übereinander
// („النجوم“) und zieht die Punkte des ق zu einem Strich zusammen („فوق“ sah wie
// „فوه“ aus). Das wirkte für Zuschauer wie verrutschte, abgeschnittene Zeichen.
import {continueRender, delayRender, staticFile} from 'remotion';

export const ARABIC_FONT = 'ScheherazadeNewBold';
export const LATIN_FONT = 'AmiriLatin';

const faces = [
	new FontFace(ARABIC_FONT, `url(${staticFile('fonts/ScheherazadeNew-Bold.ttf')})`, {
		weight: '700',
	}),
	new FontFace(LATIN_FONT, `url(${staticFile('fonts/Amiri-Regular.ttf')})`, {weight: '400'}),
];

const handle = delayRender('Schriften laden');
/** Erfüllt, sobald beide Schriften geladen sind. Vorher nichts messen (fitText). */
export const fontsReady: Promise<void> = Promise.all(faces.map((f) => f.load()))
	.then((loaded) => {
		loaded.forEach((f) => document.fonts.add(f));
		continueRender(handle);
	})
	.catch((err) => {
		console.error(err);
		continueRender(handle);
	});
