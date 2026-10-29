// Zeichnet das Etikett der Dose auf ein Canvas. Es wird als Textur um den Mantel gelegt:
// Bildmitte (x = 1024) ist die Vorderseite, die linke und rechte Kante treffen sich hinten.
// Die Wellen haben eine ganze Zahl von Perioden auf der Breite, damit hinten keine Naht sichtbar wird.
import {CanvasTexture, SRGBColorSpace} from 'three';
import type {ProduktConfig} from '../config';
import {BODY_FONT, HEADLINE_FONT} from '../fonts';

export const ETIKETT_W = 2048;
export const ETIKETT_H = 940;

const welle = (
	ctx: CanvasRenderingContext2D,
	y: number,
	amplitude: number,
	perioden: number,
	phase: number,
	breite: number,
	farbe: string,
) => {
	ctx.beginPath();
	for (let x = 0; x <= ETIKETT_W; x += 8) {
		const t = (x / ETIKETT_W) * Math.PI * 2;
		const yy = y + Math.sin(t * perioden + phase) * amplitude + Math.sin(t * perioden * 2 + phase * 1.7) * amplitude * 0.3;
		if (x === 0) ctx.moveTo(x, yy);
		else ctx.lineTo(x, yy);
	}
	ctx.strokeStyle = farbe;
	ctx.lineWidth = breite;
	ctx.stroke();
};

export const zeichneEtikett = (c: ProduktConfig): CanvasTexture => {
	const canvas = document.createElement('canvas');
	canvas.width = ETIKETT_W;
	canvas.height = ETIKETT_H;
	const ctx = canvas.getContext('2d')!;
	const {farben} = c;

	// Grund: oben etwas heller, unten dunkler
	const grund = ctx.createLinearGradient(0, 0, 0, ETIKETT_H);
	grund.addColorStop(0, farben.etikett);
	grund.addColorStop(1, '#050A10');
	ctx.fillStyle = grund;
	ctx.fillRect(0, 0, ETIKETT_W, ETIKETT_H);

	// Nordlicht-Wellen, weich leuchtend
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	ctx.shadowBlur = 40;
	for (let i = 0; i < 5; i++) {
		const farbe = i % 2 === 0 ? farben.akzent2 : farben.akzent;
		ctx.shadowColor = farbe;
		ctx.globalAlpha = 0.55 - i * 0.07;
		welle(ctx, 640 + i * 34, 40 + i * 6, 3, i * 0.9, 10 - i, farbe);
	}
	ctx.restore();

	ctx.textAlign = 'center';
	ctx.textBaseline = 'alphabetic';

	// Vorderseite: Sorte, Marke, Füllmenge
	ctx.fillStyle = farben.akzent;
	ctx.font = `400 64px "${HEADLINE_FONT}"`;
	ctx.letterSpacing = '18px';
	ctx.fillText(c.sorte.toUpperCase(), ETIKETT_W / 2, 250);

	ctx.fillStyle = farben.text;
	ctx.letterSpacing = '6px';
	let groesse = 230;
	ctx.font = `400 ${groesse}px "${HEADLINE_FONT}"`;
	// Auf der Rundung bleibt nur die Mitte lesbar: Marke höchstens ~560 px breit
	while (ctx.measureText(c.marke.toUpperCase()).width > 560 && groesse > 80) {
		groesse -= 6;
		ctx.font = `400 ${groesse}px "${HEADLINE_FONT}"`;
	}
	ctx.fillText(c.marke.toUpperCase(), ETIKETT_W / 2, 250 + 30 + groesse * 0.82);

	ctx.fillStyle = farben.text;
	ctx.globalAlpha = 0.75;
	ctx.font = `500 40px "${BODY_FONT}"`;
	ctx.letterSpacing = '4px';
	ctx.fillText(c.inhalt, ETIKETT_W / 2, ETIKETT_H - 70);
	ctx.globalAlpha = 1;

	// Rückseite (Kanten links und rechts): Merkmale untereinander, mittig bei x = 0 bzw. 2048
	ctx.font = `400 56px "${HEADLINE_FONT}"`;
	ctx.letterSpacing = '6px';
	c.merkmale.forEach((m, i) => {
		const y = 230 + i * 92;
		ctx.fillStyle = i === 1 ? farben.akzent : farben.text;
		for (const x of [0, ETIKETT_W]) ctx.fillText(m.toUpperCase(), x, y);
	});

	// dünne Zierlinien oben und unten
	ctx.fillStyle = farben.akzent;
	ctx.globalAlpha = 0.8;
	ctx.fillRect(0, 34, ETIKETT_W, 4);
	ctx.fillRect(0, ETIKETT_H - 38, ETIKETT_W, 4);
	ctx.globalAlpha = 1;

	const tex = new CanvasTexture(canvas);
	tex.colorSpace = SRGBColorSpace;
	tex.anisotropy = 8;
	return tex;
};
