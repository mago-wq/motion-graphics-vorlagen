// Pfade und Seitenverhältnisse der Bilder und Clips (aus scripts/bake_looks.py → assets.json).
import {staticFile} from 'remotion';
import assets from './assets.json';
import type {Look} from './look';

type ImgInfo = {aspect: number; cut: boolean; half: boolean};
type ClipInfo = {aspect: number; duration: number};

const IMG = assets.img as Record<string, ImgInfo>;
const CLIP = assets.clip as Record<string, ClipInfo>;

export const isClip = (key: string) => key in CLIP;
export const hasImg = (key: string) => key in IMG;
export const aspectOf = (key: string) => IMG[key]?.aspect ?? CLIP[key]?.aspect ?? 1;
export const clipDuration = (key: string) => CLIP[key]?.duration ?? 0;
export const hasCut = (key: string) => Boolean(IMG[key]?.cut);

/** Datei für einen Look: „red“/„half“ sind vorgerechnet, alles andere filtert das Grundbild */
export const imgSrc = (key: string, look: Look): string => {
	if (look === 'red') return staticFile(`img/red/${key}.jpg`);
	if (look === 'half' && IMG[key]?.half) return staticFile(`img/half/${key}.png`);
	return staticFile(`img/${key}.jpg`);
};
export const cutSrc = (key: string) => staticFile(`img/cut/${key}.png`);
export const clipSrc = (key: string) => staticFile(`clips/${key}.mp4`);
