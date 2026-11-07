// Oswald (kräftig, schmal, mit Kyrillisch) für Sprichwörter und Einzelwörter – kommt der
// schmalen Groteskschrift des Vorbilds am nächsten. Nur beim Rendern geladen.
import {loadFont as loadOswald} from '@remotion/google-fonts/Oswald';

const oswald = loadOswald('normal', {weights: ['500', '700'], subsets: ['latin', 'latin-ext', 'cyrillic']});

export const F = {cond: oswald.fontFamily} as const;

export const fontsReady = Promise.all([oswald.waitUntilDone()]);
