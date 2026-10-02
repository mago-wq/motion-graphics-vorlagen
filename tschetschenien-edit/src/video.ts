// Feste Eckdaten des Formats (9:16, 30 fps). Die Länge ergibt sich aus den Beats (timing.ts).
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Sicherheitszone für TikTok/Reels/Shorts: Text nur hier. */
export const SAFE = {top: 250, bottom: 1500, left: 80, right: WIDTH - 80} as const;
