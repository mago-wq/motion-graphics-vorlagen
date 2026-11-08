// Der ganze Schnitt als Daten: Einstellungen, Blitzbilder, Wörter, Effekt-Fenster.
// Alle Zeitpunkte kommen aus der Tonspur (timeline.ts) – nichts ist von Hand in Frames gesetzt.
//
// Regeln aus der Bild-für-Bild-Analyse der TikTok-Referenz 1 (Kaneki-Edit, siehe README):
// - Jedes Wort erscheint 2–4 Frames VOR dem gesungenen Wort (LEAD_TXT) – man liest, während man hört.
//   Betonte Treffer („NEIN.“, Namen im Drop) sitzen dagegen genau auf dem Schlag.
// - Jede Zweiwort-Phrase bekommt ein eigenes Bild; es kommt 4–7 Frames vor dem ersten Wort, noch ohne
//   Text (LEAD_SHOT). Bildwechsel zwischen „ihnen“ (Heere) und der Antwort (Krieger, Land).
// - Drop: dunkel (Referenz: mittlere Helligkeit 47/255, 74 % Schwarz) – Motive weiß auf Schwarz,
//   vor fast jedem Schlag 2 Frames Negativ des nächsten Bildes, der Schnitt landet auf dem Schlag.
//   Einstellungen halten 8–20 Frames und flackern in sich; am Schluss Schwarz, während der Ton ausklingt.
import type {Cam, ShotSpec} from './components/Media';
import type {WordSpec} from './components/Word';
import type {Look} from './look';
import {beat, SEC, SHAN, SHI, W} from './timeline';
import {DURATION} from './video';

export type Flash = {at: number; len: number; kind: 'white' | 'black' | 'red'};
export type Plan = {
	shots: ShotSpec[];
	/** Blitzbilder über den Einstellungen (Negativ, Raster …) */
	tops: ShotSpec[];
	words: WordSpec[];
	flashes: Flash[];
	blobs: [number, number][];
	scans: [number, number][];
};

const LEAD_TXT = 3;
const LEAD_SHOT = 5;
const FLICKER: Look[] = ['ice', 'hard', 'blood'];

const cam = (z0: number, z1: number, x0: number, y0: number, x1 = x0, y1 = y0, r0 = 0, r1 = r0, ease: Cam['ease'] = 'out'): Cam => ({
	z0, z1, x0, y0, x1, y1, r0, r1, ease,
});
const shot = (from: number, to: number, key: string, look: Look, c: Cam, extra: Partial<ShotSpec> = {}): ShotSpec => ({
	from, to, key, look, cam: c, ...extra,
});

export const buildPlan = (): Plan => {
	const shots: ShotSpec[] = [];
	const tops: ShotSpec[] = [];
	const words: WordSpec[] = [];
	const flashes: Flash[] = [];
	const blobs: [number, number][] = [];
	const scans: [number, number][] = [];
	const black = (at: number, len = 1) => flashes.push({at, len, kind: 'black'});
	const white = (at: number, len = 2) => flashes.push({at, len, kind: 'white'});
	const red = (at: number, len = 1) => flashes.push({at, len, kind: 'red'});
	/** 2 Frames Negativ des kommenden Bildes direkt vor dem Schnitt (Referenz: Median −2 Frames) */
	const preNeg = (s: ShotSpec, len = 2) =>
		tops.push({...s, from: s.from - len, to: s.from, look: 'neg', alt: undefined, fg: false, layout: s.layout === 'triple' ? 'full' : s.layout});
	const add = (s: ShotSpec, neg = true) => {
		shots.push(s);
		if (neg) preNeg(s);
		return s;
	};

	const sie = W('sie');
	const dachten = W('dachten');
	const dich = W('dich');
	const stuermen = W('stuermen');
	const sei = W('sei');
	const spazier = W('spaziergang');
	const fuer = W('fuer');
	const heere = W('heere');
	const nein = W('nein');
	const dasist = W('dasist');
	const revier = W('revier');
	const der = W('der');
	const tapfer = W('tapferen');
	const end = SEC.end.from;
	const D = SHAN;
	const P = SHI;
	const B = beat;

	// ================================================================ INTRO (Frage: „Sie dachten …“)
	// Kalter Einstieg (Wind, Wolf): ein Wolfsauge blitzt auf
	tops.push(shot(3, 8, 'wolf_loup', 'ice', cam(3.1, 3.4, 0.635, 0.405)));
	// „SIE DACHTEN,“ – die Heere des Zaren (Gefecht 1836, Schlucht voller Truppen)
	shots.push(shot(10, dich - LEAD_SHOT, 'war_faesi_1836', 'crush', cam(1.25, 1.55, 0.5, 0.8, 0.45, 0.78)));
	// „DICH“ – das Land
	shots.push(shot(dich - LEAD_SHOT, stuermen - 3, 'lake_nokhchkeloy', 'ink', cam(1.05, 1.24, 0.5, 0.42), {burn: 0.6}));
	// „ZU STÜRMEN“ – Nahkampf (Lermontow, Walerik 1840)
	shots.push(shot(stuermen - 3, sei - LEAD_SHOT, 'war_valerik_lermontov', 'red', cam(1.35, 1.62, 0.55, 0.45, 0.6, 0.5, -1.5, 1.5)));
	// „SEI EIN SPAZIERGANG“ – ruhiger Schwenk über die Berge (wie ein Spaziergang)
	shots.push(shot(sei - LEAD_SHOT, fuer - LEAD_SHOT, 'mountains_kezenoyam', 'crush', cam(1.05, 1.15, 0.22, 0.5, 0.42, 0.5, 0, 0, 'lin'), {burn: 0.5}));
	// „FÜR IHRE HEERE.“ – Truppen im verschneiten Wald (Roubaud), ferne Marschschritte im Ton
	shots.push(shot(fuer - LEAD_SHOT, nein, 'war_dargo_roubaud', 'crush', cam(1.1, 1.42, 0.5, 0.42, 0.5, 0.5)));

	// ================================================================ ANTWORT („NEIN. Das ist das Revier der Tapferen.“)
	// „NEIN.“ – der Krieger (Foto Jermakow, 19. Jh.) rechts, Schrift läuft HINTER ihn; Schnitt genau auf dem Donner
	shots.push(shot(nein, dasist - LEAD_SHOT, 'chechen_yermakov', 'ink', cam(1.3, 1.16, 0.3, 0.3), {fg: true, flicker: 0.05}));
	// „DAS IST“ – Turmmauer, „DAS REVIER“ – Wehrtürme im Fels (Uschkaloi)
	shots.push(shot(dasist - LEAD_SHOT, revier - 3, 'tower_khambetar', 'crush', cam(1.35, 1.6, 0.5, 0.42)));
	shots.push(shot(revier - 3, der - LEAD_SHOT, 'towers_ushkaloy', 'crush', cam(1.15, 1.42, 0.42, 0.55)));
	// „DER TAPFEREN.“ – Tschetschenen um 1880 (Kennan), Fahrt auf die Gesichter
	shots.push(shot(der - LEAD_SHOT, P[0], 'chechens_kennan', 'red', cam(1.15, 1.62, 0.5, 0.33, 0.5, 0.27)));

	// Blitzbilder im Intro (Negativ / Raster) und schwarze Einzelbilder wie in der Referenz
	tops.push(shot(dachten + 9, dachten + 11, 'war_faesi_1836', 'neg', cam(1.4, 1.4, 0.48, 0.79)));
	tops.push(shot(spazier + 12, spazier + 14, 'mountains_kezenoyam', 'neg', cam(1.1, 1.1, 0.33, 0.5)));
	tops.push(shot(heere + 22, heere + 24, 'war_dargo_roubaud', 'neg', cam(1.3, 1.3, 0.5, 0.46)));
	tops.push(shot(revier + 10, revier + 12, 'towers_ushkaloy', 'half', cam(1.25, 1.25, 0.42, 0.55)));
	tops.push(shot(tapfer + 14, tapfer + 16, 'chechens_kennan', 'half', cam(1.4, 1.4, 0.5, 0.3)));
	for (const t of [sie + 14, dich + 18, stuermen + 10, spazier + 22, heere + 14, dasist + 9, der + 4, tapfer + 24]) black(t);
	// Anlauf auf „NEIN.“: Negativ des Kriegers, drei Frames Schwarz, Treffer: Weiß, dann ein Frame Blutrot
	tops.push(shot(nein - 6, nein - 3, 'chechen_yermakov', 'neg', cam(1.45, 1.45, 0.4, 0.28)));
	black(nein - 3, 3);
	white(nein, 2);
	red(nein + 2);
	// Anlauf auf den Drop: Flackern wird dichter, zuletzt Schwarz
	for (const t of [tapfer + 30, tapfer + 34, tapfer + 37, tapfer + 39]) black(t);
	blobs.push([dich - LEAD_SHOT - 3, dich - LEAD_SHOT + 1], [sei - LEAD_SHOT - 2, sei - LEAD_SHOT + 2], [nein + 8, nein + 11], [der - LEAD_SHOT - 3, der - LEAD_SHOT]);
	scans.push([stuermen + 14, stuermen + 17], [revier - 6, revier - 3]);

	// ================================================================ DROP – sechs Rufe „شيشان“
	// Auftakt des ersten Rufs („Shi“): Stroboskop bis zum Hauptton
	white(P[0], 2);
	tops.push(shot(P[0] + 2, P[0] + 5, 'wolf_face', 'neg', cam(2.9, 3.1, 0.54, 0.455)));
	black(P[0] + 5, 2);
	tops.push(shot(P[0] + 7, P[0] + 10, 'mansur_1787', 'half', cam(1.3, 1.3, 0.55, 0.45)));
	black(P[0] + 10, 2);
	tops.push(shot(P[0] + 12, P[0] + 15, 'weapons_platz', 'neg', cam(1.3, 1.3, 0.5, 0.5)));
	black(P[0] + 15, D[0] - P[0] - 15);

	// Ruf 1: شيشان → НОХЧИЙЧОЬ → TSCHETSCHENIEN (der Name in drei Schriften, je ein Schlag)
	add(shot(D[0], B(0, 1), 'mist_vertical', 'crush', cam(1.3, 1.0, 0.5, 0.45), {clipAt: 1.0}), false);
	add(shot(B(0, 1), B(0, 2), 'tower_shatoy_stairs', 'crush', cam(1.32, 1.48, 0.45, 0.4), {alt: FLICKER, altP: 0.2, burn: 0.6}));
	add(shot(B(0, 2), B(0, 2) + 15, 'orga', 'crush', cam(1.12, 1.32, 0.5, 0.5)));
	add(shot(B(0, 2) + 15, B(0, 2) + 19, 'kinjal_met_a', 'inv', cam(1.8, 1.95, 0.48, 0.16)), false);
	add(shot(B(0, 2) + 19, B(0, 2) + 23, 'wolf_loup', 'hard', cam(3.1, 3.35, 0.635, 0.405)), false); // dasselbe Auge wie im Einstieg
	add(shot(B(0, 2) + 23, P[1], 'hooves', 'crush', cam(1.0, 1.08, 0.42, 0.6), {clipAt: 4.0}), false);

	// Ruf 2: Reiter im Gebirge (dreifach), Reiterangriff (Roubaud), Waffen, Mann mit Papacha
	tops.push(shot(P[1], P[1] + 3, 'horses_mountain', 'neg', cam(1.0, 1.0, 0.5, 0.55), {clipAt: 0.2}));
	black(P[1] + 3, 2);
	add(shot(P[1] + 5, D[1], 'horses_mountain', 'crush', cam(1.05, 1.0, 0.5, 0.55), {clipAt: 0.4}), false);
	add(shot(D[1], B(1, 1), 'horses_mountain', 'crush', cam(1.0, 1.0, 0.5, 0.55), {layout: 'triple', clipAt: 0.7}), false);
	add(shot(B(1, 1), B(1, 2), 'war_roubaud_scene', 'ink', cam(1.55, 1.75, 0.66, 0.44), {alt: FLICKER, altP: 0.25}));
	add(shot(B(1, 2), B(1, 2) + 7, 'weapons_platz', 'inv', cam(1.2, 1.38, 0.5, 0.5, 0.5, 0.5, -3, 3)));
	add(shot(B(1, 2) + 7, B(1, 2) + 14, 'sparks_fall', 'color', cam(1.0, 1.0, 0.5, 0.5), {clipAt: 3.0}), false);
	add(shot(B(1, 2) + 14, P[2], 'papakha_painting', 'crush', cam(0.95, 1.05, 0.5, 0.42), {cutOnly: true}), false);

	// Ruf 3: die Gesichter des Widerstands – Scheich Mansur (Medaillon 1787), Baisangur, Selimchan.
	// Namen stehen HINTER den Köpfen (Freisteller auf Schwarz, Schrift dazwischen).
	add(shot(P[2], D[2], 'mansur_1787', 'half', cam(1.3, 1.32, 0.55, 0.45)), false);
	add(shot(D[2], B(2, 1), 'mansur_1787', 'crush', cam(0.6, 0.7, 0.5, 0.48), {cutOnly: true}), false);
	add(shot(B(2, 1), B(2, 2), 'baysangur', 'crush', cam(0.8, 0.86, 0.5, 0.3275), {cutOnly: true, fg: true}));
	add(shot(B(2, 2), P[3] - 7, 'zelimkhan', 'crush', cam(0.8, 0.86, 0.49, 0.308), {cutOnly: true, fg: true}));
	red(D[2] + 2);
	black(P[3] - 7, 7); // Atempause vor der tiefen Dreiergruppe (auch im Ton fast still)

	// Ruf 4 (eine Oktave tiefer, Donner): Gewitter, heulender Wolf, Herde, Schmiede, Dolch, Funken
	add(shot(P[3], D[3], 'storm_peaks', 'ink', cam(1.0, 1.05, 0.35, 0.45), {clipAt: 0.25}), false);
	add(shot(D[3], B(3, 1), 'wolf_howl_zoo', 'crush', cam(1.0, 1.04, 0.585, 0.3), {alt: FLICKER, altP: 0.2}), false);
	red(D[3] + 2, 2);
	add(shot(B(3, 1), B(3, 2), 'horses_herd', 'hard', cam(1.0, 1.06, 0.5, 0.55), {clipAt: 2.0}));
	add(shot(B(3, 2), B(3, 2) + 12, 'forge_blade', 'color', cam(1.0, 1.1, 0.64, 0.55), {clipAt: 2.0}));
	add(shot(B(3, 2) + 12, B(3, 2) + 20, 'kinjal_met_b', 'inv', cam(1.55, 1.75, 0.48, 0.3)), false);
	add(shot(B(3, 2) + 20, P[4], 'sparks_black', 'color', cam(1.0, 1.0, 0.5, 0.5), {clipAt: 4.5}), false);

	// Ruf 5: Adler, Turm, Augen des Kriegers, Wolf, heulender Wolf auf dem Fels
	tops.push(shot(P[4], P[4] + 3, 'eagle_stare', 'neg', cam(1.0, 1.0, 0.38, 0.45), {clipAt: 8.0}));
	add(shot(P[4], D[4], 'eagle_stare', 'crush', cam(1.05, 1.0, 0.38, 0.45), {clipAt: 8.1}), false);
	add(shot(D[4], B(4, 1), 'eagle_stare', 'crush', cam(1.0, 1.08, 0.38, 0.45), {clipAt: 8.5}), false);
	add(shot(B(4, 1), B(4, 2), 'tower_itumkale', 'crush', cam(1.2, 1.4, 0.4, 0.33), {alt: FLICKER, altP: 0.2, burn: 0.7}));
	add(shot(B(4, 2), B(4, 2) + 9, 'chechen_yermakov', 'crush', cam(2.4, 2.6, 0.43, 0.2)));
	add(shot(B(4, 2) + 9, B(4, 2) + 19, 'wolf_portrait_v', 'crush', cam(1.2, 1.35, 0.6, 0.38)), false);
	add(shot(B(4, 2) + 19, P[5], 'wolf_howl_rock', 'crush', cam(1.9, 2.2, 0.4, 0.3)), false);

	// Ruf 6 (der letzte): МАРШО → FREIHEIT. – der Wolf auf dem Fels vor den Schneebergen
	white(P[5], 2);
	tops.push(shot(P[5] + 2, P[5] + 5, 'orga', 'neg', cam(1.2, 1.2, 0.5, 0.5)));
	black(P[5] + 5, D[5] - P[5] - 5);
	add(shot(D[5], B(5, 1), 'lake_nokhchkeloy', 'crush', cam(1.32, 1.12, 0.5, 0.4), {burn: 0.6}), false);
	add(shot(B(5, 1), Math.min(DURATION, end + 56), 'wolves_vicart', 'crush', cam(1.0, 1.06, 0.42, 0.6), {clipAt: 16.0, flicker: 0.06}));

	// Treffer: weiße Blitze auf den schweren Rufen, kurze auf den anderen
	for (const k of [0, 3, 5]) white(D[k], 2);
	for (const k of [1, 2, 4]) white(D[k], 1);
	blobs.push([D[2] - 3, D[2]], [B(4, 2) + 6, B(4, 2) + 9]);
	scans.push([D[1] - 4, D[1] - 2], [D[3] - 5, D[3] - 3], [D[4] - 3, D[4] - 1], [B(0, 2) + 19, B(0, 2) + 23]);

	// ================================================================ WÖRTER
	const wd = (x: WordSpec) => words.push(x);
	const L = LEAD_TXT;
	// Intro: „SIE DACHTEN, DICH ZU STÜRMEN SEI EIN SPAZIERGANG FÜR IHRE HEERE.“ (حسبوا اقتحامك نزهة لجيوشهم)
	wd({id: 'sie', text: 'SIE', at: sie - L, until: dich - LEAD_SHOT, x: 0.3, y: 0.33, size: 300, tone: 'white', entry: 'type'});
	wd({id: 'dachten', text: 'DACHTEN,', at: dachten - L, until: dich - LEAD_SHOT, x: 0.52, y: 0.47, size: 640, maxW: 1000, tone: 'red'});
	wd({id: 'dich', text: 'DICH', at: dich - L, until: sei - LEAD_SHOT, x: 0.5, y: 0.33, size: 640, maxW: 960, tone: 'white'});
	wd({id: 'stuermen', text: 'ZU STÜRMEN', at: stuermen - L, until: sei - LEAD_SHOT, x: 0.5, y: 0.6, size: 520, maxW: 990, tone: 'red'});
	wd({id: 'sei', text: 'SEI EIN', at: sei - L, until: fuer - LEAD_SHOT, x: 0.5, y: 0.31, size: 300, tone: 'white', entry: 'type'});
	wd({id: 'spazier', text: 'SPAZIERGANG', at: spazier - L, until: fuer - LEAD_SHOT, x: 0.5, y: 0.475, size: 560, maxW: 1020, tone: 'mix'});
	wd({id: 'fuer', text: 'FÜR IHRE', at: fuer - L, until: nein - 3, x: 0.5, y: 0.27, size: 300, tone: 'white', entry: 'type'});
	wd({id: 'heere', text: 'HEERE.', at: heere - L, until: nein - 3, x: 0.5, y: 0.52, size: 760, maxW: 1000, tone: 'red'});
	// „NEIN. DAS IST DAS REVIER DER TAPFEREN.“ (كلا فتلك عرائن الشجعان)
	wd({id: 'nein', text: 'NEIN.', at: nein, until: dasist - LEAD_SHOT, x: 0.34, y: 0.43, size: 900, maxW: 620, tone: 'red', layer: 'back'});
	wd({id: 'dasist', text: 'DAS IST', at: dasist - L, until: der - LEAD_SHOT, x: 0.5, y: 0.31, size: 300, tone: 'white', entry: 'type'});
	wd({id: 'revier', text: 'DAS REVIER', at: revier - L, until: der - LEAD_SHOT, x: 0.5, y: 0.48, size: 560, maxW: 1010, tone: 'red'});
	wd({id: 'der', text: 'DER', at: der - L, until: P[0], x: 0.5, y: 0.3, size: 300, tone: 'white', entry: 'type'});
	wd({id: 'tapfer', text: 'TAPFEREN.', at: tapfer - L, until: P[0], x: 0.5, y: 0.5, size: 700, maxW: 990, tone: 'red', glitch: 1.4});
	// Drop: der Name in drei Schriften (genau auf den Schlägen), Namen hinter den Köpfen, am Ende Freiheit
	wd({id: 'shishan', text: 'شيشان', at: D[0], until: B(0, 1), x: 0.5, y: 0.44, size: 640, maxW: 820, font: 'arabic', tone: 'red'});
	wd({id: 'nokhchiychoe', text: 'НОХЧИЙЧОЬ', at: B(0, 1), until: B(0, 2), x: 0.5, y: 0.45, size: 640, maxW: 980, tone: 'white'});
	wd({id: 'tschetschenien', text: 'TSCHETSCHENIEN', at: B(0, 2), until: B(0, 2) + 15, x: 0.5, y: 0.45, size: 560, maxW: 970, tone: 'red'});
	wd({id: 'baysangur', text: 'BAYSANGUR', at: B(2, 1), until: B(2, 2), x: 0.5, y: 0.235, size: 420, maxW: 1000, tone: 'red', layer: 'back', glitch: 0.7});
	wd({id: 'zelimkhan', text: 'ZELIMKHAN', at: B(2, 2), until: P[3] - 7, x: 0.5, y: 0.235, size: 420, maxW: 1000, tone: 'white', layer: 'back', glitch: 0.7});
	wd({id: 'marsho', text: 'МАРШО', at: D[5], until: B(5, 1), x: 0.5, y: 0.42, size: 820, maxW: 1000, tone: 'red'});
	wd({id: 'freiheit', text: 'FREIHEIT.', at: B(5, 1), until: end + 26, x: 0.5, y: 0.25, size: 720, maxW: 1000, tone: 'red', glitch: 0.6});

	return {shots, tops, words, flashes, blobs, scans};
};
