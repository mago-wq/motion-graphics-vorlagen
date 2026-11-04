import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLOR, TEXT} from '../config';
import {F} from '../fonts';
import {Canvas2D} from '../lib/canvas';
import {hash2, mulberry} from '../lib/rand';
import {easeOut, lerp, pop, ramp} from '../lib/motion';

// ── 32 Origami ───────────────────────────────────────────────────────────────
type P3 = [number, number, number];
const rotAxis = (p: P3, o: P3, axis: P3, ang: number): P3 => {
	// Rodrigues: p um die Achse durch o drehen
	const [kx, ky, kz] = axis;
	const v: P3 = [p[0] - o[0], p[1] - o[1], p[2] - o[2]];
	const c = Math.cos(ang);
	const s = Math.sin(ang);
	const dot = kx * v[0] + ky * v[1] + kz * v[2];
	const cr: P3 = [ky * v[2] - kz * v[1], kz * v[0] - kx * v[2], kx * v[1] - ky * v[0]];
	return [
		o[0] + v[0] * c + cr[0] * s + kx * dot * (1 - c),
		o[1] + v[1] * c + cr[1] * s + ky * dot * (1 - c),
		o[2] + v[2] * c + cr[2] * s + kz * dot * (1 - c),
	];
};

export const Origami: React.FC = () => {
	const f = useCurrentFrame();
	const fold1 = ramp(f, 0, 5);
	const fold2 = ramp(f, 5, 10);
	const spin = interpolate(f, [0, 12], [-0.35, 0.25]);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(#ffe9e4, #f6d6de)'}}>
			<Canvas2D
				draw={(ctx) => {
					const S = 350;
					// Quadrat A B C D (A oben links). Falz 1: Dreieck B-C-D klappt über die Diagonale B–D,
					// C landet auf A. Falz 2: die doppelte Spitze bei A klappt entlang x + y = −S nach vorn.
					const A: P3 = [-S, -S, 0];
					const B: P3 = [S, -S, 0];
					const C: P3 = [S, S, 0];
					const D: P3 = [-S, S, 0];
					const M1: P3 = [-S, 0, 0];
					const M2: P3 = [0, -S, 0];
					const F1: P3 = [0, S, 0]; // Spiegelbild von M1 an B–D
					const F2: P3 = [S, 0, 0]; // Spiegelbild von M2 an B–D
					const axis: P3 = [-Math.SQRT1_2, Math.SQRT1_2, 0];
					const R1 = (q: P3) => rotAxis(q, B, axis, Math.PI * 0.985 * fold1);
					const R2 = (q: P3) => rotAxis(q, M1, axis, -Math.PI * 0.95 * fold2);
					const polys: {pts: P3[]; front: string; back: string}[] = [
						{pts: [B, M2, M1, D], front: '#f7a48b', back: '#fde1d6'},
						{pts: [M1, M2, A].map(R2), front: '#f7a48b', back: '#fde1d6'},
						{pts: [B, F2, F1, D].map(R1), front: '#f7a48b', back: '#fff1ea'},
						{pts: [F1, F2, C].map(R1).map(R2), front: '#f7a48b', back: '#fff1ea'},
					];
					const view = (p: P3) => {
						// leichte Drehung um y und Kippung um x, dann Perspektive
						const cy = Math.cos(spin);
						const sy = Math.sin(spin);
						const x1 = p[0] * cy + p[2] * sy;
						const z1 = -p[0] * sy + p[2] * cy;
						const tilt = 0.5;
						const y2 = p[1] * Math.cos(tilt) - z1 * Math.sin(tilt);
						const z2 = p[1] * Math.sin(tilt) + z1 * Math.cos(tilt);
						const k = 1600 / (1600 + z2);
						return {x: 540 + x1 * k, y: 1000 + y2 * k, z: z2};
					};
					// Schatten
					ctx.fillStyle = 'rgba(120,40,60,0.12)';
					ctx.beginPath();
					ctx.ellipse(560, 1330, 400, 90, 0, 0, Math.PI * 2);
					ctx.fill();
					const drawn = polys
						.map((poly) => {
							const v = poly.pts.map(view);
							const z = v.reduce((s, q) => s + q.z, 0) / v.length;
							const area = v.reduce((s, q, i) => {
								const n = v[(i + 1) % v.length];
								return s + (q.x * n.y - n.x * q.y);
							}, 0);
							// Helligkeit aus der Flächennormalen (vor der Projektion)
							const [p0, p1, p2] = poly.pts;
							const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
							const w = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
							const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
							const nl = Math.hypot(n[0], n[1], n[2]) || 1;
							const light = 0.78 + 0.22 * Math.abs((n[0] * -0.3 + n[1] * -0.5 + n[2] * -0.8) / nl);
							return {v, z, area, poly, light};
						})
						.sort((a, b) => b.z - a.z);
					for (const d of drawn) {
						ctx.fillStyle = d.area < 0 ? d.poly.front : d.poly.back;
						ctx.filter = `brightness(${d.light.toFixed(3)})`;
						ctx.strokeStyle = 'rgba(150,60,50,0.22)';
						ctx.lineWidth = 2.5;
						ctx.beginPath();
						d.v.forEach((q, i) => (i === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y)));
						ctx.closePath();
						ctx.fill();
						ctx.filter = 'none';
						ctx.stroke();
					}
				}}
			/>
		</AbsoluteFill>
	);
};

// ── 33 Sumi-e ────────────────────────────────────────────────────────────────
const FIBERS = (() => {
	const r = mulberry(21);
	return Array.from({length: 260}, () => ({x: r() * 1080, y: r() * 1920, a: r() * Math.PI, l: 20 + r() * 60}));
})();
const BRISTLES = Array.from({length: 18}, (_, i) => ({off: (i / 17 - 0.5) * 2, dry: hash2(i, 3), w: 0.6 + hash2(i, 9) * 0.8}));

export const SumiE: React.FC = () => {
	const f = useCurrentFrame();
	const draw = ramp(f, 0, 8, easeOut);
	const seal = pop(f, 9, {damping: 12, stiffness: 400});
	return (
		<AbsoluteFill style={{background: '#f2ece0'}}>
			<Canvas2D
				draw={(ctx) => {
					ctx.strokeStyle = 'rgba(150,130,100,0.14)';
					ctx.lineWidth = 1.2;
					for (const fb of FIBERS) {
						ctx.beginPath();
						ctx.moveTo(fb.x, fb.y);
						ctx.lineTo(fb.x + Math.cos(fb.a) * fb.l, fb.y + Math.sin(fb.a) * fb.l);
						ctx.stroke();
					}
					const cx = 540;
					const cy = 930;
					const R = 300;
					const a0 = -Math.PI * 0.62;
					const sweep = Math.PI * 1.82;
					const N = 160;
					const end = Math.floor(N * draw);
					for (const b of BRISTLES) {
						ctx.beginPath();
						let started = false;
						for (let i = 0; i <= end; i++) {
							const s = i / N;
							const ang = a0 + s * sweep;
							// Pinsel: dick am Anfang, dünn und trocken am Ende
							const width = 52 * (s < 0.08 ? lerp(0.5, 1, s / 0.08) : lerp(1, 0.25, (s - 0.08) / 0.92));
							const wob = Math.sin(s * 9) * 6;
							const rr = R + wob + b.off * width * 0.5;
							const x = cx + Math.cos(ang) * rr;
							const y = cy + Math.sin(ang) * rr;
							const gap = s > 0.55 && hash2(Math.floor(s * 60), Math.floor(b.dry * 100)) < (s - 0.55) * 1.3 * b.dry;
							if (gap) {
								started = false;
								continue;
							}
							if (!started) {
								ctx.moveTo(x, y);
								started = true;
							} else ctx.lineTo(x, y);
						}
						ctx.strokeStyle = `rgba(18,16,14,${0.55 + b.w * 0.3})`;
						ctx.lineWidth = 6 * b.w;
						ctx.lineCap = 'round';
						ctx.stroke();
					}
					// Spritzer am Ansatz
					if (draw > 0.05) {
						ctx.fillStyle = 'rgba(18,16,14,0.8)';
						for (let i = 0; i < 9; i++) {
							const ang = a0 - 0.2 + hash2(i, 1) * 0.5;
							const rr = R + (hash2(i, 2) - 0.5) * 140;
							ctx.beginPath();
							ctx.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, 2 + hash2(i, 4) * 7, 0, Math.PI * 2);
							ctx.fill();
						}
					}
					// Siegel
					if (seal > 0.01) {
						const sc = lerp(1.6, 1, seal);
						ctx.save();
						ctx.translate(790, 1330);
						ctx.scale(sc, sc);
						ctx.rotate(-0.04);
						ctx.globalAlpha = Math.min(1, seal * 1.5);
						ctx.fillStyle = COLOR.sumiRed;
						ctx.fillRect(-70, -70, 140, 140);
						ctx.fillStyle = '#f2ece0';
						ctx.font = `92px ${F.decoBold}`;
						ctx.textAlign = 'center';
						ctx.textBaseline = 'middle';
						ctx.fillText(TEXT.seal, 0, 6);
						ctx.restore();
					}
				}}
			/>
		</AbsoluteFill>
	);
};

// ── 34 Kreidetafel ───────────────────────────────────────────────────────────
type Pt = [number, number];
const BULB: Pt[][] = (() => {
	const cx = 540;
	const cy = 860;
	const R = 190;
	const outline: Pt[] = [];
	for (let i = 0; i <= 60; i++) {
		const a = Math.PI * 0.78 + (i / 60) * Math.PI * 1.44;
		outline.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
	}
	const left: Pt[] = [outline[0], [cx - 85, cy + 260]];
	const right: Pt[] = [outline[outline.length - 1], [cx + 85, cy + 260]];
	const base: Pt[][] = [0, 1, 2].map((k) => [[cx - 90, cy + 285 + k * 36], [cx + 90, cy + 285 + k * 36]]);
	const fil: Pt[] = [[cx - 60, cy + 250], [cx - 40, cy + 60], [cx - 15, cy + 120], [cx + 15, cy + 60], [cx + 40, cy + 120], [cx + 60, cy + 250]];
	return [[...outline], left, right, fil, ...base];
})();
const RAYS_CHALK: Pt[][] = Array.from({length: 7}, (_, i) => {
	const a = -Math.PI / 2 + (i - 3) * 0.42;
	return [[540 + Math.cos(a) * 250, 860 + Math.sin(a) * 250], [540 + Math.cos(a) * 330, 860 + Math.sin(a) * 330]];
});

const chalkStroke = (ctx: CanvasRenderingContext2D, pts: Pt[], upto: number, seed: number) => {
	if (upto <= 0) return;
	const segs: Pt[] = [];
	for (let i = 0; i < pts.length - 1; i++) {
		const [x0, y0] = pts[i];
		const [x1, y1] = pts[i + 1];
		const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6));
		for (let k = 0; k < n; k++) segs.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n)]);
	}
	segs.push(pts[pts.length - 1]);
	const last = Math.floor(segs.length * Math.min(1, upto));
	for (let pass = 0; pass < 3; pass++) {
		ctx.beginPath();
		for (let i = 0; i < last; i++) {
			const j = (hash2(i + seed * 100, pass) - 0.5) * 4;
			const [x, y] = segs[i];
			if (i === 0 || hash2(i, seed + pass * 7) < 0.06) ctx.moveTo(x + j, y - j);
			else ctx.lineTo(x + j, y - j);
		}
		ctx.strokeStyle = `rgba(245,245,235,${0.38 + pass * 0.12})`;
		ctx.lineWidth = 9 - pass * 2.5;
		ctx.lineCap = 'round';
		ctx.stroke();
	}
};

export const Kreide: React.FC = () => {
	const f = useCurrentFrame();
	const draw = ramp(f, 0, 7, easeOut);
	const text = ramp(f, 4, 9);
	const rays = f >= 8 ? ramp(f, 8, 10, easeOut) : 0;
	return (
		<AbsoluteFill style={{background: '#7a4a24'}}>
			<Canvas2D
				draw={(ctx) => {
					ctx.fillStyle = COLOR.chalkBoard;
					ctx.fillRect(34, 34, 1012, 1852);
					// Wischspuren
					for (let i = 0; i < 9; i++) {
						const x = hash2(i, 1) * 1080;
						const y = hash2(i, 2) * 1920;
						const g = ctx.createRadialGradient(x, y, 0, x, y, 260);
						g.addColorStop(0, 'rgba(255,255,255,0.06)');
						g.addColorStop(1, 'rgba(255,255,255,0)');
						ctx.fillStyle = g;
						ctx.fillRect(34, 34, 1012, 1852);
					}
					BULB.forEach((s, i) => chalkStroke(ctx, s, draw * 1.3 - i * 0.05, i + 1));
					RAYS_CHALK.forEach((s, i) => chalkStroke(ctx, s, rays, 20 + i));
					ctx.save();
					ctx.beginPath();
					ctx.rect(0, 1260, 300 + text * 600, 300);
					ctx.clip();
					ctx.font = `700 200px ${F.chalk}`;
					ctx.textAlign = 'center';
					ctx.fillStyle = 'rgba(245,245,235,0.92)';
					ctx.fillText(TEXT.chalk, 540, 1440);
					ctx.restore();
				}}
			/>
		</AbsoluteFill>
	);
};

// ── 35 Halbton-Raster / 36 Comic ─────────────────────────────────────────────
const burst = (cx: number, cy: number, r1: number, r2: number, n: number, seed: number): Pt[] =>
	Array.from({length: n * 2}, (_, i) => {
		const a = (i / (n * 2)) * Math.PI * 2;
		const r = i % 2 ? r1 : r2 * (0.85 + hash2(i, seed) * 0.3);
		return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
	});

export const Comic: React.FC = () => {
	const f = useCurrentFrame();
	const slam = pop(f, 2, {damping: 11, stiffness: 420, mass: 0.5});
	const shake = f >= 3 && f <= 5 ? (f % 2 ? 9 : -9) : 0;
	return (
		<AbsoluteFill style={{background: '#111', transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
			<Canvas2D
				extra={slam}
				draw={(ctx) => {
					// Panel
					ctx.fillStyle = COLOR.comicYellow;
					ctx.fillRect(40, 40, 1000, 1840);
					// Halbtonpunkte: Größe nach Abstand zur Ecke, um 45° gedrehtes Raster
					ctx.fillStyle = COLOR.comicPink;
					const step = 34;
					for (let i = -60; i < 60; i++)
						for (let j = -60; j < 60; j++) {
							const x = 540 + (i - j) * step * 0.7071;
							const y = 960 + (i + j) * step * 0.7071;
							if (x < 40 || x > 1040 || y < 40 || y > 1880) continue;
							const d = Math.hypot(x - 1040, y - 1880) / 2100;
							const r = Math.max(0, (1 - d) * step * 0.52);
							if (r < 1) continue;
							ctx.beginPath();
							ctx.arc(x, y, r, 0, Math.PI * 2);
							ctx.fill();
						}
					// Speedlines
					ctx.fillStyle = 'rgba(17,17,17,0.85)';
					for (let i = 0; i < 40; i++) {
						const a = (i / 40) * Math.PI * 2 + hash2(i, 5) * 0.05;
						const r0 = 470 + hash2(i, 6) * 120;
						ctx.beginPath();
						ctx.moveTo(540 + Math.cos(a - 0.012) * r0, 960 + Math.sin(a - 0.012) * r0);
						ctx.lineTo(540 + Math.cos(a) * 1400, 960 + Math.sin(a) * 1400);
						ctx.lineTo(540 + Math.cos(a + 0.012) * r0, 960 + Math.sin(a + 0.012) * r0);
						ctx.fill();
					}
					ctx.fillStyle = COLOR.comicYellow;
					ctx.fillRect(0, 0, 1080, 40);
					// Explosion
					const sc = lerp(0.2, 1, slam);
					ctx.save();
					ctx.translate(540, 960);
					ctx.scale(sc, sc);
					ctx.rotate(-0.08);
					const outer = burst(0, 0, 330, 520, 14, 1);
					const inner = burst(0, 0, 250, 400, 14, 2);
					[outer, inner].forEach((pts, k) => {
						ctx.beginPath();
						pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
						ctx.closePath();
						ctx.fillStyle = k === 0 ? COLOR.comicRed : '#ffd21f';
						ctx.fill();
						ctx.lineWidth = 14;
						ctx.strokeStyle = '#111';
						ctx.lineJoin = 'round';
						ctx.stroke();
					});
					ctx.font = `230px ${F.comic}`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.lineWidth = 26;
					ctx.strokeStyle = '#111';
					ctx.strokeText(TEXT.comicSound, 0, 20);
					ctx.fillStyle = '#ffffff';
					ctx.fillText(TEXT.comicSound, 0, 20);
					ctx.restore();
					// Bildunterschrift-Kasten
					ctx.save();
					ctx.translate(90, 1500);
					ctx.rotate(-0.03);
					ctx.fillStyle = '#fffdf2';
					ctx.fillRect(0, 0, 520, 110);
					ctx.lineWidth = 8;
					ctx.strokeStyle = '#111';
					ctx.strokeRect(0, 0, 520, 110);
					ctx.font = `70px ${F.comic}`;
					ctx.fillStyle = '#111';
					ctx.textBaseline = 'middle';
					ctx.fillText(TEXT.comicCaption, 30, 60);
					ctx.restore();
					ctx.lineWidth = 12;
					ctx.strokeStyle = '#111';
					ctx.strokeRect(40, 40, 1000, 1840);
				}}
			/>
		</AbsoluteFill>
	);
};
