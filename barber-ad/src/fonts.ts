// Schriften über @remotion/google-fonts. Werden beim Rendern geladen,
// FontGate wartet darauf, bevor irgendetwas gemessen oder gezeichnet wird.
import {loadFont as loadBebas} from '@remotion/google-fonts/BebasNeue';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';

const bebas = loadBebas('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']});
const inter = loadInter('normal', {
	weights: ['400', '500', '600', '800'],
	subsets: ['latin', 'latin-ext'],
});

export const HEADLINE_FONT = bebas.fontFamily;
export const BODY_FONT = inter.fontFamily;

export const fontsReady = Promise.all([bebas.waitUntilDone(), inter.waitUntilDone()]);
