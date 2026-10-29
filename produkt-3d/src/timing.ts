// Alle Zeitpunkte in Frames (30 fps). Szenen lesen nur diese Werte.

/** Dose fällt herein und dreht sich aus */
export const DROP = {start: 0, landed: 40, spinEnd: 70} as const;
/** Hook-Zeilen oben */
export const HOOK = {zeilen: [8, 26], aus: 78} as const;
/** Merkmal-Leisten unten, Dose zeigt dabei die Rückseite */
export const MERKMALE = {start: 92, abstand: 20, aus: 168} as const;
/** Schwenk von unten, danach Heldenbild mit Bohnen */
export const HELD = {schwenk: 172, steht: 210, bohnen: 182} as const;
/** Schlussbild */
export const MARKE = {name: 206, sorte: 218, slogan: 228, button: 244, web: 256} as const;
/** Ab hier steht alles still (letzte halbe Sekunde) */
export const STILL_FROM = 285;
