import React from 'react';
import {Fallblatt, Kinetik, Neon} from './Typo';
import {Ascii, Matrix, Pixel, Vhs} from './Retro';
import {Blaupause, Drahtgitter, Voxel} from './Linien3D';
import {Cel, Holo, Knete, Raymarch} from './Raymarch';
import {Glas, Kaleido, Lichtstrahlen, Polarlicht, Tinte, Warp} from './Licht';
import {Baender, Magnet, Topo} from './Linie';
import {Comic, Kreide, Origami, SumiE} from './Papier';
import {Bauhaus, Brutal, Deco} from './Design';

/** Einstellung je id aus timing.ts. */
export const SHOT_COMPONENTS: Record<string, React.FC> = {
	fallblatt: Fallblatt,
	kinetik: Kinetik,
	neon: Neon,
	vhs: Vhs,
	pixel: Pixel,
	ascii: Ascii,
	matrix: Matrix,
	drahtgitter: Drahtgitter,
	blaupause: Blaupause,
	voxel: Voxel,
	knete: Knete,
	cel: Cel,
	raymarch: Raymarch,
	holo: Holo,
	glas: Glas,
	polarlicht: Polarlicht,
	tinte: Tinte,
	kaleido: Kaleido,
	lichtstrahlen: Lichtstrahlen,
	warp: Warp,
	baender: Baender,
	magnet: Magnet,
	topo: Topo,
	origami: Origami,
	sumie: SumiE,
	kreide: Kreide,
	comic: Comic,
	bauhaus: Bauhaus,
	deco: Deco,
	brutal: Brutal,
};
