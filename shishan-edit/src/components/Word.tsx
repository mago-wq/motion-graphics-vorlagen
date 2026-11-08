// Wort-Einblendung im Stil der Referenz 1: hohe, schmal gestauchte Didone, flackert pro 2–3 Frames
// zwischen Rot, Weiß und Eisblau, harter 3D-Schatten nach rechts unten, Geisterbild, Streifen-Versatz,
// RGB-Versatz und gelegentlich senkrechtes Strecken. Zufall ist deterministisch (random(seed)).
import {measureText} from '@remotion/layout-utils';
import {random} from 'remotion';
import {F} from '../fonts';
import {C} from '../look';
import {HEIGHT, WIDTH} from '../video';

export type WordSpec = {
	id: string;
	text: string;
	at: number;
	until: number;
	/** Mittelpunkt (Anteil der Bildbreite/-höhe) */
	x: number;
	y: number;
	/** Größte Schriftgröße in px – verkleinert, falls das Wort breiter als maxW wäre */
	size: number;
	maxW?: number;
	/** Stauchung in der Breite (Referenz: sehr schmale Didone) */
	sx?: number;
	/** Streckung in der Höhe */
	sy?: number;
	font?: 'serif' | 'arabic';
	tone?: 'red' | 'white' | 'ice' | 'mix';
	entry?: 'slam' | 'type' | 'cut';
	layer?: 'back' | 'front';
	rotate?: number;
	/** Glitch-Stärke 0–1 (Wahrscheinlichkeiten der Effekte) */
	glitch?: number;
};

const EXTRUDE = [
	...Array.from({length: 8}, (_, i) => `${(i + 1) * 2}px ${(i + 1) * 2.3}px 0 rgba(0,0,0,0.93)`),
	'22px 26px 26px rgba(0,0,0,0.55)',
].join(', ');

const fitCache = new Map<string, number>();
const fit = (text: string, family: string, weight: string, size: number, maxW: number, sx: number) => {
	const k = `${text}|${family}|${size}|${maxW}|${sx}`;
	const hit = fitCache.get(k);
	if (hit) return hit;
	const w = measureText({text, fontFamily: family, fontWeight: weight, fontSize: 100, letterSpacing: '-0.01em'}).width;
	const s = Math.min(size, (maxW / ((w / 100) * sx)));
	fitCache.set(k, s);
	return s;
};

const pick = (tone: WordSpec['tone'], r: number) => {
	switch (tone) {
		case 'red':
			return r < 0.7 ? C.red : r < 0.93 ? C.white : C.ice;
		case 'white':
			return r < 0.64 ? C.white : r < 0.9 ? C.red : C.ice;
		case 'ice':
			return r < 0.6 ? C.ice : r < 0.85 ? C.white : C.red;
		default:
			return r < 0.48 ? C.red : r < 0.88 ? C.white : C.ice;
	}
};

export const Word: React.FC<{w: WordSpec; frame: number}> = ({w, frame}) => {
	if (frame < w.at || frame >= w.until) return null;
	const age = frame - w.at;
	const left = w.until - frame;
	const sx = w.sx ?? (w.font === 'arabic' ? 0.9 : 0.54);
	const sy = w.sy ?? (w.font === 'arabic' ? 1.05 : 1.24);
	const family = w.font === 'arabic' ? F.arabic : F.serif;
	const weight = w.font === 'arabic' ? '400' : '900';
	const fontSize = fit(w.text, family, weight, w.size, w.maxW ?? 1000, sx);
	const glitch = w.glitch ?? 1;

	// Farbe wechselt in Schritten von 2–3 Frames; im ersten Frame immer kräftig
	const hold = 2 + Math.floor(random(`h-${w.id}`) * 2);
	const color = age === 0 ? (w.tone === 'white' ? C.white : C.red) : pick(w.tone, random(`c-${w.id}-${Math.floor(age / hold)}`));

	// Einstieg
	let scale = 1;
	let text = w.text;
	if (w.entry === 'slam' || w.entry === undefined) scale = [1.42, 1.12, 1.03][age] ?? 1;
	if (w.entry === 'type' && w.font !== 'arabic') {
		const n = Math.max(1, Math.ceil(w.text.length * Math.min(1, (age + 1) / 4)));
		text = w.text.slice(0, n);
	}

	// Glitch-Würfel pro Frame
	const g = random(`g-${w.id}-${frame}`);
	const exiting = left <= 2;
	const slices = exiting || age === 1 || g > 1 - 0.2 * glitch;
	const ghost = !slices && g < 0.22 * glitch;
	const split = age === 0 || random(`s-${w.id}-${frame}`) < 0.18 * glitch;
	const stretch = random(`y-${w.id}-${frame}`) < 0.07 * glitch ? 1.32 : 1;
	const blink = !exiting && age > 3 && random(`blink-${frame}`) < 0.035; // ein Frame weg – für alle Wörter zugleich

	const base: React.CSSProperties = {
		fontFamily: family,
		fontWeight: Number(weight),
		fontSize,
		lineHeight: 0.84,
		letterSpacing: w.font === 'arabic' ? 0 : '-0.01em',
		whiteSpace: 'nowrap',
		display: 'block',
		direction: w.font === 'arabic' ? 'rtl' : 'ltr',
	};
	const pos: React.CSSProperties = {
		position: 'absolute',
		left: w.x * WIDTH,
		top: w.y * HEIGHT,
		transform: `translate(-50%, -50%) rotate(${w.rotate ?? 0}deg) scale(${sx * scale}, ${sy * scale * stretch})`,
		transformOrigin: 'center center',
	};
	if (blink) return null;

	const layer = (style: React.CSSProperties, key: string, extra?: React.CSSProperties) => (
		<div key={key} style={{...pos, ...extra}}>
			<span style={{...base, ...style}}>{text}</span>
		</div>
	);

	const out: React.ReactNode[] = [];
	if (ghost) {
		const dx = (random(`gx-${w.id}-${frame}`) - 0.5) * 160;
		const dy = (random(`gy-${w.id}-${frame}`) - 0.5) * 70;
		const gc = color === C.red ? C.white : C.red;
		out.push(layer({color: gc, opacity: 0.5}, 'ghost', {marginLeft: dx, marginTop: dy}));
	}
	if (split) {
		const d = 6 + random(`sd-${w.id}-${frame}`) * 10;
		out.push(layer({color: '#ff1d2b', opacity: 0.85}, 'sr', {marginLeft: -d, mixBlendMode: 'screen'}));
		out.push(layer({color: '#27f0ff', opacity: 0.85}, 'sc', {marginLeft: d, mixBlendMode: 'screen'}));
	}
	if (slices) {
		const bands = [0, 0.3, 0.62, 1];
		for (let i = 0; i < 3; i++) {
			const off = (random(`sl-${w.id}-${frame}-${i}`) - 0.5) * (exiting ? 150 : 80);
			out.push(
				layer({color, textShadow: EXTRUDE}, `slice${i}`, {
					marginLeft: off,
					clipPath: `inset(${bands[i] * 100}% -20% ${(1 - bands[i + 1]) * 100}% -20%)`,
				}),
			);
		}
	} else {
		out.push(layer({color, textShadow: EXTRUDE}, 'main'));
	}
	return <>{out}</>;
};
