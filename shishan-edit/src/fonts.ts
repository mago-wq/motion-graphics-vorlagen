// Schriften über @remotion/google-fonts (nur beim Rendern geladen).
// Playfair Display Black: hohe Didone wie in der Referenz – schmal gestaucht (scaleX), mit Kyrillisch (МАРШО).
// Lalezar: kräftige arabische Display-Schrift mit klaren Punkten (الشيشان). Rakkas zeichnete das „ش“ falsch
// (Punkte fehlten, es stand „الـيتـان“) – im Vergleich aller Google-Fonts nicht mehr verwenden.
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadLalezar} from '@remotion/google-fonts/Lalezar';

const playfair = loadPlayfair('normal', {weights: ['900'], subsets: ['latin', 'latin-ext', 'cyrillic']});
const lalezar = loadLalezar('normal', {weights: ['400'], subsets: ['arabic']});

export const F = {
	serif: playfair.fontFamily,
	arabic: lalezar.fontFamily,
} as const;

export const fontsReady = Promise.all([playfair.waitUntilDone(), lalezar.waitUntilDone()]);
