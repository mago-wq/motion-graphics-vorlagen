// Kurzer Screenshake nach Einschlägen: klingt in ~8 Frames ab.
import {random} from 'remotion';

export type Impact = {frame: number; strength: number};

export const shakeAt = (frame: number, impacts: Impact[], seed: string) => {
	let x = 0;
	let y = 0;
	let rotate = 0;
	impacts.forEach(({frame: at, strength}, i) => {
		const t = frame - at;
		if (t < 0 || t > 8) return;
		const decay = Math.exp(-t / 2.2);
		const angle = random(`${seed}-${i}-${t}`) * Math.PI * 2;
		x += Math.cos(angle) * strength * decay;
		y += Math.sin(angle) * strength * decay;
		rotate += (random(`${seed}-r-${i}-${t}`) - 0.5) * 0.06 * strength * decay;
	});
	return {transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`};
};
