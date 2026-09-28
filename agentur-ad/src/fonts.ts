// Geist (OFL) über @remotion/google-fonts. Wird beim Rendern geladen und ins Video
// gebrannt; FontGate wartet darauf, bevor irgendetwas gemessen wird.
import {loadFont} from '@remotion/google-fonts/Geist';

const geist = loadFont('normal', {weights: ['500', '600', '700', '800'], subsets: ['latin', 'latin-ext']});

export const FONT = geist.fontFamily;
export const fontsReady = geist.waitUntilDone();
