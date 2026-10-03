// Alle Zeitpunkte in Frames (30 fps). Szenen lesen nur von hier.
//
// Rhythmus aus den Referenzen: eine Zeile steht 5-6 s (lang genug, um sie zweimal
// zu lesen), Original zuerst, Übersetzung kurz danach. Erster Text schon nach
// 0,3 s – kein schwarzer Vorlauf, der Daumen scrollt sonst weiter.

export type LineTiming = {in: number; translationIn: number; out: number};

export const LINES: LineTiming[] = [
	{in: 9, translationIn: 24, out: 192},
	{in: 207, translationIn: 222, out: 372},
];

/**
 * Einsatz der Rezitation je Zeile (Frame). Die Stimme setzt kurz nach dem
 * Original ein: Man sieht das Wort, dann hört man es.
 * Alafasy 94:5 = 4,4 s (bis Frame 148), 94:6 = 4,1 s (bis Frame 336).
 */
export const RECITATION = [15, 213];

/**
 * Das Leuchtwort der zweiten Zeile glüht auf, wenn „yusrā“ gesprochen wird:
 * in 94:6 bei ca. 2,5 s (Whisper-Wortzeiten + Pegelverlauf gemessen).
 */
export const HIGHLIGHT_AT = 213 + 75;

export const SOURCE = {in: 384, out: 438};

/** Dauer von Ein- und Ausblenden einer Zeile. */
export const FADE_IN = 22;
export const FADE_OUT = 14;
