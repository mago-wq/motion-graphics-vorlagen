// Schriften über @remotion/google-fonts (nur beim Rendern geladen).
// Playfair Display Black: hohe Didone wie in der Referenz – schmal gestaucht (scaleX), mit Kyrillisch (МАРШО).
// Rakkas: arabische Display-Schrift im Didone-Kontrast, passt zu Playfair (شيشان).
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadRakkas} from '@remotion/google-fonts/Rakkas';

const playfair = loadPlayfair('normal', {weights: ['900'], subsets: ['latin', 'latin-ext', 'cyrillic']});
const rakkas = loadRakkas('normal', {weights: ['400'], subsets: ['arabic']});

export const F = {
	serif: playfair.fontFamily,
	arabic: rakkas.fontFamily,
} as const;

export const fontsReady = Promise.all([playfair.waitUntilDone(), rakkas.waitUntilDone()]);
