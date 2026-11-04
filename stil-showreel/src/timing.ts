// Alle Zeitpunkte des Showreels. Szenen, HUD und Ton (scripts/cues.mjs → audio/cues.json)
// lesen nur diese Datei. Wer eine Einstellung verschiebt, verschiebt den Ton automatisch mit.
// Keine Importe: scripts/cues.mjs lädt die Datei direkt mit Node.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 450; // 15,0 s
/** Ab hier steht alles still, kein Ton mehr (letzte halbe Sekunde). */
export const STILL_FROM = 435;

/** Stil-Nummern (1–40) und ab welchem Frame der Einstellung sie im HUD erscheinen. */
type StyleAt = [nr: number, at: number];

export type Shot = {id: string; from: number; dur: number; styles: StyleAt[]};

// Schnitte im 6-Frame-Raster (150 BPM): 12 Frames = 0,4 s, 18 = 0,6 s.
const LIST: [string, number, StyleAt[]][] = [
	['fallblatt', 24, [[1, 0]]],
	['kinetik', 12, [[2, 0]]],
	['neon', 12, [[3, 0]]],
	['vhs', 18, [[4, 0]]],
	['pixel', 12, [[5, 0]]],
	['ascii', 12, [[6, 0]]],
	['matrix', 12, [[7, 0]]],
	['drahtgitter', 12, [[8, 0]]],
	['blaupause', 12, [[9, 0]]],
	['voxel', 18, [[10, 0], [11, 5]]],
	['knete', 12, [[12, 0]]],
	['cel', 12, [[13, 0]]],
	['raymarch', 12, [[14, 0]]],
	['holo', 18, [[15, 0], [16, 6]]],
	['glas', 12, [[17, 0], [18, 4]]],
	['polarlicht', 12, [[19, 0]]],
	['tinte', 12, [[20, 0], [21, 5]]],
	['kaleido', 18, [[22, 0], [23, 8]]],
	['lichtstrahlen', 12, [[24, 0]]],
	['warp', 18, [[25, 0], [26, 9]]],
	['baender', 12, [[27, 0]]],
	['magnet', 18, [[28, 0], [29, 9]]],
	['topo', 18, [[30, 0], [31, 9]]],
	['origami', 12, [[32, 0]]],
	['sumie', 12, [[33, 0]]],
	['kreide', 12, [[34, 0]]],
	['comic', 12, [[35, 0], [36, 3]]],
	['bauhaus', 12, [[37, 0]]],
	['deco', 12, [[38, 0], [39, 9]]],
	['brutal', 48, [[40, 2]]],
];

export const SHOTS: Shot[] = (() => {
	let from = 0;
	return LIST.map(([id, dur, styles]) => {
		const s = {id, from, dur, styles};
		from += dur;
		return s;
	});
})();

export const shot = (id: string): Shot => {
	const s = SHOTS.find((x) => x.id === id);
	if (!s) throw new Error(`Unbekannte Einstellung: ${id}`);
	return s;
};

/** Globaler Frame eines Frames innerhalb einer Einstellung. */
export const at = (id: string, local: number) => shot(id).from + local;

/** Kartenflip zwischen Bauhaus → Art déco → Neo-Brutalismus: Frames vor und nach dem Schnitt. */
export const FLIP = {out: 3, in: 3};

// Bauhaus-Formen landen (lokale Frames), Neo-Brutalismus-Elemente landen.
export const BAUHAUS_LAND = [2, 4, 6, 8];
export const BRUTAL_LAND = {main: 4, second: 7, third: 10, sticker: 13, button: 16, hint: 18, press: 25};
export const VOXEL_WAVE = [0, 2, 4, 6]; // Lagen der Insel fallen nacheinander
export const KNETE_LAND = [2, 4, 6]; // Frame, an dem die Form aufsetzt (Feder startet 2 Frames früher)
export const FLAP_LAST = 17; // letztes Fallblatt rastet ein

/**
 * Ton-Einsätze. f = globaler Frame. Bei align 'peak' liegt der lauteste Moment des Geräuschs
 * auf f (Whooshes), bei 'onset' der Beginn (Treffer, Klicks), bei 'end' das Ende (Riser).
 * gain in dB relativ zur Rolle.
 */
export type Cue = {f: number; role: string; gain?: number};

export const CUES: Cue[] = (() => {
	const c: Cue[] = [];
	const add = (id: string, local: number, role: string, gain = 0) =>
		c.push({f: at(id, local), role, gain});

	// Fallblatt: Klappern wird langsamer, dann rastet das letzte Blatt ein.
	[0, 1, 2, 3, 4, 5, 6, 7, 9, 11, 13, 15].forEach((l, i) => add('fallblatt', l, 'flap', -i * 0.4));
	add('fallblatt', FLAP_LAST, 'flap.land');
	add('kinetik', 0, 'punch');
	add('kinetik', 5, 'punch', -2);
	add('neon', 0, 'buzz');
	add('neon', 4, 'switch');
	add('vhs', 0, 'tape');
	add('pixel', 0, 'glitch'); // Höhepunkt des Glitches auf dem Schnitt
	add('pixel', 1, 'coin');
	[0, 2, 4, 6, 8, 10].forEach((l) => add('ascii', l, 'key', -2));
	add('matrix', 0, 'data');
	add('drahtgitter', 2, 'whoosh');
	add('blaupause', 0, 'pen');
	add('blaupause', 6, 'pen', -3);
	add('voxel', 1, 'whoosh', -3); // Blöcke fallen
	VOXEL_WAVE.forEach((l, i) => add('voxel', l + 3, 'pop', -i));
	KNETE_LAND.forEach((l, i) => add('knete', l, 'plop', -i * 1.5));
	add('cel', 1, 'swish');
	add('raymarch', 0, 'sub');
	add('holo', 0, 'drip');
	add('holo', 6, 'shimmer');
	add('glas', 1, 'glide');
	add('glas', 6, 'toggle');
	add('polarlicht', 0, 'tine');
	add('polarlicht', 0, 'shimmer.aurora');
	add('tinte', 0, 'drop');
	add('tinte', 5, 'drop', -4);
	add('kaleido', 0, 'glass');
	add('kaleido', 8, 'chime');
	add('lichtstrahlen', 2, 'swell');
	add('warp', 9, 'jet');
	add('baender', 1, 'whoosh', -2);
	add('baender', 7, 'zing', -3);
	[0, 2, 3, 5, 6, 8].forEach((l, i) => add('magnet', l, 'hover', -i * 0.5));
	add('magnet', 9, 'burst');
	add('topo', 1, 'paper');
	add('topo', 10, 'soft');
	add('origami', 2, 'fold');
	add('origami', 7, 'fold', -2);
	add('sumie', 3, 'brush');
	add('sumie', 9, 'stamp');
	add('kreide', 0, 'chalk');
	add('kreide', 3, 'chalk', -2);
	add('kreide', 8, 'idea');
	add('comic', 1, 'whip');
	add('comic', 3, 'punch');
	BAUHAUS_LAND.forEach((l, i) => add('bauhaus', l, 'knock', -i * 0.8));
	add('bauhaus', 12 - FLIP.out + 2, 'flip'); // Mitte des Flips liegt auf dem Schnitt
	add('deco', 3, 'deco');
	add('deco', 12 - FLIP.out + 2, 'flip', -1);
	// Spannung vor der Endkarte, endet auf dem Aufprall.
	add('brutal', BRUTAL_LAND.main, 'riser');
	add('brutal', BRUTAL_LAND.main, 'kick');
	add('brutal', BRUTAL_LAND.second, 'popin');
	add('brutal', BRUTAL_LAND.third, 'popin', -1);
	add('brutal', BRUTAL_LAND.sticker, 'sticker');
	add('brutal', BRUTAL_LAND.button, 'popin', -2);
	add('brutal', BRUTAL_LAND.press, 'press');
	return c.sort((a, b) => a.f - b.f);
})();
