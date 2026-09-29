// Variante 1: fertige Lottie-Figur "The guy walks and smiles" von konstaner (LottieFiles,
// Lottie Simple License: kommerzielle Nutzung und Bearbeitung erlaubt, ohne Namensnennung;
// Weitergabe der Datei nur unter derselben Lizenz). Deshalb nicht eingecheckt, sondern mit
// `npm run figuren` geholt (scripts/figuren.sh).
// Alle Maße unten sind in Lottie-Einheiten (Leinwand 500 × 1000) aus der Datei gemessen.
import type {ColorRule} from './lottie';

export const LOTTIE_MANN = {
	datei: 'figuren/lottie-mann.json',
	quelle: 'https://lottiefiles.com/animations/the-guy-walks-and-smiles-GRgWC964Ud',
	leinwand: {w: 500, h: 1000},
	/** Frames pro Doppelschritt im Original (30 fps) */
	zyklus: 40,
	/** So weit gleitet der Standfuß pro Doppelschritt nach hinten = Weg pro Zyklus */
	wegProZyklus: 448,
	/** Oberkante Haar und Sohle des vorderen Fußes */
	oben: 105,
	sohle: 898,
	/** Hüftmitte (zwischen beiden Hüftgelenken) */
	mitteX: 225,
	/** Gesichtsmitte in der Standpose */
	gesicht: {x: 262, y: 205},
	/** Ebenen je Bein; alles andere (Oberkörper, Arme, Kopf) läuft als "rest" */
	gruppen: {
		nah: ['Vector 17', 'Vector 19', 'Vector 21', 'Vector 24', 'foot-right', '▽ leg-basic-right', 'leg-right-up', 'leg-right-down'],
		fern: ['Vector 26', 'Vector 28', 'Vector 30', 'Vector 33', 'foot-left', 'leg-left-up', 'leg-left-down'],
	},
	/**
	 * Phasen (Lottie-Frames) für Anhalten und Stehen:
	 * - halt: hier steht der ferne Fuß senkrecht unter seiner Hüfte (Frame 6)
	 * - schwungMitte: der nahe Fuß schwingt gerade unter der Hüfte durch (angehoben)
	 * - nahStand: der nahe Fuß steht unter seiner Hüfte (Frame 31) – mit `halt` zusammen die Standpose
	 */
	phasen: {halt: 6, schwungMitte: 14.7, nahStand: 31},
	/** Umfärbung in MFit-Farben: helle Jacke, dunkles Shirt mit Goldstreifen, goldene Sneaker */
	farben: [
		{from: '#7B6ACF', to: '#D4A83D', layers: ['foot-right', 'foot-left']},
		{from: '#FFFFFF', to: '#F4F1EA', layers: ['Vector 17', 'Vector 19', 'Vector 21', 'Vector 26', 'Vector 28', 'Vector 30']},
		{from: '#FCFAF7', to: '#F4F1EA'},
		{from: '#FFFFFF', to: '#D4A83D', layers: ['t-shirt']},
		{from: '#E3DEF4', to: '#24262C'},
		{from: '#7B6ACF', to: '#E9E2D2'},
		{from: '#6959B9', to: '#C9BFA9'},
		{from: '#2C2C2C', to: '#3D4250'},
		{from: '#050705', to: '#2A2E38'},
		{from: '#32324C', to: '#000000', layers: ['shadow'], opacity: 38},
	] satisfies ColorRule[],
};
