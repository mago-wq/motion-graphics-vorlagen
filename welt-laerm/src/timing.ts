// Alle Zeitpunkte in Frames, abgeleitet aus den Sekunden in config.ts.
import {CONFIG, type Line} from './config';
import {sec} from './video';

export type SceneTiming = {from: number; to: number; voiceFrom: number; voiceTo: number};

const toFrames = (l: Line): SceneTiming => ({
	from: sec(l.scene[0]),
	to: sec(l.scene[1]),
	voiceFrom: sec(l.voice[0]),
	voiceTo: sec(l.voice[1]),
});

export const T = {
	laerm: toFrames(CONFIG.lines.laerm),
	satt: toFrames(CONFIG.lines.satt),
	muede: toFrames(CONFIG.lines.muede),
	kruemel: toFrames(CONFIG.lines.kruemel),
	paradies: toFrames(CONFIG.lines.paradies),
};

/** Licht flackert so viele Frames lang an bzw. aus. */
export const FLICKER_ON = 9;
export const FLICKER_OFF = 7;
/** Ende: Das Paradies-Bild verwischt seitlich bis zum Szenenende, danach bleibt ein Lichtpunkt. */
export const SMEAR = {from: T.paradies.to - sec(0.7), to: T.paradies.to};
export const STAR_OUT = {from: T.paradies.to, to: T.paradies.to + sec(1.3)};
