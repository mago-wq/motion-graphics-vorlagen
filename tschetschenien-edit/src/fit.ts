// Schriftgröße so wählen, dass ein Text in eine Breite passt. Misst mit der echten,
// bereits geladenen Schrift (FontGate), daher erst im gerenderten Baum aufrufen.
let ctx: CanvasRenderingContext2D | null = null;

export const fitFontSize = (text: string, font: string, weight: number, maxWidth: number, maxSize: number, letterSpacingEm = 0): number => {
	ctx ??= document.createElement('canvas').getContext('2d');
	if (!ctx) return maxSize;
	ctx.font = `${weight} 100px "${font}"`;
	const width100 = ctx.measureText(text).width + letterSpacingEm * 100 * text.length;
	return Math.min(maxSize, Math.floor((maxWidth / width100) * 100));
};
