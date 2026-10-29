import {Easing, interpolate} from 'remotion';

export const easeInOut = Easing.inOut(Easing.cubic);
export const easeOut = Easing.out(Easing.cubic);

/**
 * Wert aus Stützstellen [frame, wert], jedes Teilstück mit eigener Kurve
 * (Standard: ein- und ausschwingend). Außerhalb wird festgehalten.
 */
export const keyframes = (
	frame: number,
	punkte: [number, number][],
	kurve: (t: number) => number = easeInOut,
): number => {
	if (frame <= punkte[0][0]) return punkte[0][1];
	for (let i = 1; i < punkte.length; i++) {
		const [f1, w1] = punkte[i];
		const [f0, w0] = punkte[i - 1];
		if (frame <= f1) {
			return interpolate(frame, [f0, f1], [w0, w1], {easing: kurve});
		}
	}
	return punkte[punkte.length - 1][1];
};
