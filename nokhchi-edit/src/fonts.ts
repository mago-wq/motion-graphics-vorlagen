// Schriften über @remotion/google-fonts (nur beim Rendern geladen, nicht Teil einer Website).
// Anton: schwere Namen (nur lateinisch). Oswald: Kyrillisch (НОХЧИ, МАРШО …).
// Cormorant Garamond: Zitate. IBM Plex Mono: Daten, Schreibmaschine.
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadCormorant} from '@remotion/google-fonts/CormorantGaramond';
import {loadFont as loadMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as loadOswald} from '@remotion/google-fonts/Oswald';

const anton = loadAnton('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']});
const oswald = loadOswald('normal', {weights: ['500', '700'], subsets: ['latin', 'latin-ext', 'cyrillic']});
const cormorant = loadCormorant('italic', {weights: ['500', '600'], subsets: ['latin', 'latin-ext', 'cyrillic']});
const cormorantUp = loadCormorant('normal', {weights: ['600', '700'], subsets: ['latin', 'latin-ext', 'cyrillic']});
const mono = loadMono('normal', {weights: ['400', '500'], subsets: ['latin', 'latin-ext', 'cyrillic']});

export const F = {
	slam: anton.fontFamily,
	cyr: oswald.fontFamily,
	serif: cormorant.fontFamily,
	mono: mono.fontFamily,
} as const;

export const fontsReady = Promise.all([
	anton.waitUntilDone(),
	oswald.waitUntilDone(),
	cormorant.waitUntilDone(),
	cormorantUp.waitUntilDone(),
	mono.waitUntilDone(),
]);
