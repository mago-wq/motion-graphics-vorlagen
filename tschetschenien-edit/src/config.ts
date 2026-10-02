// Inhalt des Edits. NUR hier Bilder, Texte und Schnittlängen ändern.
// Schnittlängen in Beats des Nasheeds (140 BPM → 1 Beat ≈ 0,43 s).
// Bildquellen und Lizenzen: CREDITS.md (Pflicht bei CC BY / CC BY-SA: Urheber nennen).

export type Move = 'in' | 'out' | 'left' | 'right' | 'up' | 'down';

export type Shot = {
	/** Datei in public/img */
	img: string;
	beats: number;
	/** cover = bildfüllend (Standard), contain = ganzes Bild auf unscharfem Hintergrund (Karten) */
	fit?: 'cover' | 'contain';
	/** CSS object-position für den 9:16-Ausschnitt */
	focus?: string;
	move?: Move;
	/** kleine Zeile über dem Titel (Jahr, Epoche) */
	kicker?: string;
	/** Großer Titel; \n bricht die Zeile (jede Zeile wird einzeln auf Breite gesetzt) */
	title?: string;
	/** Zeile unter dem Titel */
	sub?: string;
};

export const SHOTS: Shot[] = [
	// ---------- Intro: laut, mit Bass (Beat 0–9) ----------
	{img: 'hoy-petroglyphen.jpg', beats: 4, move: 'in', kicker: 'НОХЧИЙ', title: 'NOXÇIY', sub: 'Die Geschichte der Tschetschenen'},
	{img: 'hoy-siedlung.jpg', beats: 2, move: 'left', focus: '40% 50%'},
	{img: 'hoy-turm.jpg', beats: 2, move: 'up'},
	{img: 'mozkaroy.jpg', beats: 1, move: 'in'},

	// ---------- Leise: die alte Zeit (Beat 9–28) ----------
	{img: 'vakhushti-karte.jpg', beats: 4, fit: 'contain', move: 'in', kicker: 'Antike · Mittelalter', title: 'DZURDZUKETIEN', sub: 'So nennen georgische Chroniken das Land der Vorfahren'},
	{img: 'dzurdzuketien-1843.jpg', beats: 3, move: 'right', focus: '60% 35%', kicker: '3. Jh. v. Chr.', title: 'DIE KÖNIGE VON\nDZURDZUKETIEN', sub: 'Verbündete des ersten Königs Georgiens'},
	{img: 'nikaroi-turm.jpg', beats: 4, move: 'up', kicker: '14. Jahrhundert', title: 'SIMSIR', sub: 'Fürstentum der Wainachen – gegen Timur, 1395'},
	{img: 'ushkaloy.jpg', beats: 4, move: 'in', focus: '35% 50%', kicker: 'Die Berge', title: 'TÜRME\nDER TEIPS', sub: 'Jede Sippe ihre Festung'},
	{img: 'nikar-palmin.jpg', beats: 2, move: 'out'},
	{img: 'tuerme.jpg', beats: 2, move: 'up', focus: '50% 60%'},

	// ---------- Drop: die Krieger (ab Beat 28) ----------
	{img: 'mansur-1787.jpg', beats: 3, move: 'in', focus: '50% 55%', kicker: '1785', title: 'SCHEICH MANSUR', sub: 'Erster Imam des Kaukasus'},
	{img: 'mansur-pferd.jpg', beats: 1, move: 'left', focus: '45% 50%'},
	{img: 'mansur-gemaelde.jpg', beats: 1, move: 'in', focus: '50% 30%'},
	{img: 'mansur-haus-1838.jpg', beats: 1, move: 'right'},
	{img: 'beibulat.jpg', beats: 3, move: 'in', focus: '50% 25%', kicker: '1779 – 1832', title: 'BEIBULAT\nTAIMIEV', sub: 'Taymi Bibolt'},
	{img: 'gruzinsky-aul.jpg', beats: 1, move: 'left', focus: '30% 50%'},
	{img: 'schmerling-reiter.jpg', beats: 1, move: 'right', focus: '50% 50%'},
	{img: 'valerik-1840.jpg', beats: 3, move: 'in', focus: '40% 50%', kicker: '11. Juli 1840', title: 'VALERIK', sub: 'Der Fluss des Todes'},
	{img: 'kennan-hochzeit.jpg', beats: 1, move: 'in', focus: '50% 40%'},
	{img: 'baisangur.jpg', beats: 4, move: 'in', focus: '50% 25%', kicker: '1794 – 1861', title: 'BAISANGUR\nVON BENOY', sub: 'Ein Auge, ein Arm, ein Bein – nie gebeugt'},
	{img: 'baisangur-chuert.jpg', beats: 2, move: 'up', focus: '50% 40%'},
	{img: 'zelimkhan.jpg', beats: 3, move: 'in', focus: '50% 30%', kicker: '1872 – 1913', title: 'ZELIMKHAN', sub: 'Abrek von Kharachoy'},
	// Rückblende: ein Beat pro Held
	{img: 'beibulat.jpg', beats: 1, move: 'in', focus: '50% 20%'},
	{img: 'mansur-gemaelde.jpg', beats: 1, move: 'in', focus: '50% 25%'},
	{img: 'baisangur.jpg', beats: 1, move: 'in', focus: '50% 20%'},

	// ---------- Schluss (Beat 55–59) ----------
	{img: 'ushkaloy.jpg', beats: 4, move: 'out', focus: '60% 50%', kicker: 'Нохчийчоь', title: 'DAS ERBE\nDER BERGE'},
];

/** Beats Abspann (Schwarz mit Quellenhinweis) nach dem letzten Bild. */
export const END_BEATS = 4;
export const END_TEXT = {
	title: 'НОХЧИЙ',
	line: 'Bilder: Wikimedia Commons · Quellen in der Beschreibung',
};

/** Farbstimmung über allen Bildern */
export const GRADE = 'grayscale(0.35) sepia(0.28) contrast(1.22) brightness(0.92) saturate(1.1)';
export const ACCENT = '#c9a14a';
