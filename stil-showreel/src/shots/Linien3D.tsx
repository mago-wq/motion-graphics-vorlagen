import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLOR, TEXT} from '../config';
import {F} from '../fonts';
import {Canvas2D} from '../lib/canvas';
import {hash2} from '../lib/rand';
import {easeOut, lerp, pop, ramp} from '../lib/motion';
import {FPS, VOXEL_WAVE, shot} from '../timing';

// ── Geodätische Kugel (Ikosaeder, einmal unterteilt) ─────────────────────────
type V3 = [number, number, number];
const norm = (v: V3): V3 => {
	const l = Math.hypot(v[0], v[1], v[2]);
	return [v[0] / l, v[1] / l, v[2] / l];
};
const GEO = (() => {
	const t = (1 + Math.sqrt(5)) / 2;
	let verts: V3[] = (
		[
			[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t],
			[0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
		] as V3[]
	).map(norm);
	let faces = [
		[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6],
		[7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10],
		[8, 6, 7], [9, 8, 1],
	];
	const cache = new Map<string, number>();
	const mid = (a: number, b: number) => {
		const k = a < b ? `${a}-${b}` : `${b}-${a}`;
		if (!cache.has(k)) {
			const va = verts[a];
			const vb = verts[b];
			verts = [...verts, norm([(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2])];
			cache.set(k, verts.length - 1);
		}
		return cache.get(k)!;
	};
	faces = faces.flatMap(([a, b, c]) => {
		const ab = mid(a, b);
		const bc = mid(b, c);
		const ca = mid(c, a);
		return [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]];
	});
	const edges = new Set<string>();
	faces.forEach(([a, b, c]) =>
		[[a, b], [b, c], [c, a]].forEach(([x, y]) => edges.add(x < y ? `${x}-${y}` : `${y}-${x}`)),
	);
	return {verts, edges: [...edges].map((e) => e.split('-').map(Number) as [number, number])};
})();

const CUBE: V3[] = [
	[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
];
const CUBE_E: [number, number][] = [
	[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7],
];

const project = (v: V3, yaw: number, pitch: number, cx: number, cy: number, focal = 1500, dist = 4.2) => {
	const [x0, y0, z0] = v;
	const x1 = x0 * Math.cos(yaw) + z0 * Math.sin(yaw);
	const z1 = -x0 * Math.sin(yaw) + z0 * Math.cos(yaw);
	const y2 = y0 * Math.cos(pitch) - z1 * Math.sin(pitch);
	const z2 = y0 * Math.sin(pitch) + z1 * Math.cos(pitch);
	const z = z2 + dist;
	return {x: cx + (x1 * focal) / z, y: cy - (y2 * focal) / z, z: z2};
};

const drawWire = (ctx: CanvasRenderingContext2D, t: number, color: string, back: number, grow: number) => {
	const yaw = t * 2.2 + 0.4;
	const pitch = 0.42 + Math.sin(t * 1.3) * 0.1;
	const cx = 540;
	const cy = 930;
	ctx.lineCap = 'round';
	const line = (a: V3, b: V3, width: number, s = 1) => {
		const pa = project([a[0] * s, a[1] * s, a[2] * s], yaw, pitch, cx, cy);
		const pb = project([b[0] * s, b[1] * s, b[2] * s], yaw, pitch, cx, cy);
		const depth = (pa.z + pb.z) / 2 / s;
		const alpha = lerp(1, back, (depth + 1) / 2);
		ctx.globalAlpha = alpha;
		ctx.strokeStyle = color;
		ctx.lineWidth = width;
		ctx.beginPath();
		ctx.moveTo(pa.x, pa.y);
		ctx.lineTo(lerp(pa.x, pb.x, grow), lerp(pa.y, pb.y, grow));
		ctx.stroke();
	};
	GEO.edges.forEach(([a, b]) => line(GEO.verts[a], GEO.verts[b], 4));
	CUBE_E.forEach(([a, b]) => line(CUBE[a], CUBE[b], 3, 1.12));
	ctx.globalAlpha = 1;
	// Knoten
	ctx.fillStyle = color;
	GEO.verts.forEach((v) => {
		const p = project(v, yaw, pitch, cx, cy);
		ctx.globalAlpha = lerp(1, back, (p.z + 1) / 2);
		ctx.beginPath();
		ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
		ctx.fill();
	});
	ctx.globalAlpha = 1;
};

const wireTime = (id: string, f: number) => (shot(id).from - shot('drahtgitter').from + f) / FPS;

// ── 08 Drahtgitter 3D ────────────────────────────────────────────────────────
export const Drahtgitter: React.FC = () => {
	const f = useCurrentFrame();
	const grow = ramp(f, 0, 5, easeOut);
	return (
		<AbsoluteFill style={{background: '#f3f5fb'}}>
			<Canvas2D
				draw={(ctx) => {
					// Bodengitter in Perspektive
					ctx.strokeStyle = 'rgba(47,69,255,0.28)';
					ctx.lineWidth = 2;
					for (let i = -10; i <= 10; i++) {
						const a = project([i * 0.5, -1.9, -4], 0, 0.42, 540, 930);
						const b = project([i * 0.5, -1.9, 6], 0, 0.42, 540, 930);
						ctx.beginPath();
						ctx.moveTo(a.x, a.y);
						ctx.lineTo(b.x, b.y);
						ctx.stroke();
					}
					for (let j = 0; j < 14; j++) {
						const z = -4 + j * 0.75 - ((f * 0.05) % 0.75);
						const a = project([-5, -1.9, z], 0, 0.42, 540, 930);
						const b = project([5, -1.9, z], 0, 0.42, 540, 930);
						ctx.beginPath();
						ctx.moveTo(a.x, a.y);
						ctx.lineTo(b.x, b.y);
						ctx.stroke();
					}
					drawWire(ctx, wireTime('drahtgitter', f), COLOR.wire, 0.18, grow);
				}}
			/>
		</AbsoluteFill>
	);
};

// ── 09 Blaupause ─────────────────────────────────────────────────────────────
const gearPath = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, teeth: number, rot: number) => {
	ctx.beginPath();
	const n = teeth * 4;
	for (let i = 0; i <= n; i++) {
		const a = rot + (i / n) * Math.PI * 2;
		const k = i % 4;
		const rr = k === 0 || k === 1 ? r + 16 : r;
		const x = cx + Math.cos(a) * rr;
		const y = cy + Math.sin(a) * rr;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
	ctx.stroke();
};

const arrowLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
	const a = Math.atan2(y2 - y1, x2 - x1);
	[[x1, y1, a], [x2, y2, a + Math.PI]].forEach(([x, y, aa]) => {
		ctx.beginPath();
		ctx.moveTo(x + Math.cos(aa + 0.35) * 22, y + Math.sin(aa + 0.35) * 22);
		ctx.lineTo(x, y);
		ctx.lineTo(x + Math.cos(aa - 0.35) * 22, y + Math.sin(aa - 0.35) * 22);
		ctx.stroke();
	});
};

export const Blaupause: React.FC = () => {
	const f = useCurrentFrame();
	const dim = ramp(f, 0, 6, easeOut);
	return (
		<AbsoluteFill style={{background: COLOR.blueprint}}>
			<Canvas2D
				draw={(ctx) => {
					for (let x = 0; x <= 1080; x += 30) {
						ctx.strokeStyle = x % 150 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)';
						ctx.lineWidth = x % 150 === 0 ? 2 : 1;
						ctx.beginPath();
						ctx.moveTo(x, 0);
						ctx.lineTo(x, 1920);
						ctx.stroke();
					}
					for (let y = 0; y <= 1920; y += 30) {
						ctx.strokeStyle = y % 150 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)';
						ctx.lineWidth = y % 150 === 0 ? 2 : 1;
						ctx.beginPath();
						ctx.moveTo(0, y);
						ctx.lineTo(1080, y);
						ctx.stroke();
					}
					drawWire(ctx, wireTime('blaupause', f), '#ffffff', 0.3, 1);
					ctx.strokeStyle = '#ffffff';
					ctx.fillStyle = '#ffffff';
					ctx.lineWidth = 3;
					// Maßlinien
					const half = 360 * dim;
					arrowLine(ctx, 540 - half, 1420, 540 + half, 1420);
					ctx.setLineDash([14, 10]);
					ctx.beginPath();
					ctx.moveTo(180, 1360);
					ctx.lineTo(180, 1450);
					ctx.moveTo(900, 1360);
					ctx.lineTo(900, 1450);
					ctx.stroke();
					ctx.setLineDash([]);
					ctx.globalAlpha = dim;
					ctx.font = `700 52px ${F.spaceMono}`;
					ctx.textAlign = 'center';
					ctx.fillText(TEXT.blueprintDim, 540, 1395);
					ctx.globalAlpha = 1;
					// Zahnräder
					const rot = (f / FPS) * 2.4;
					ctx.lineWidth = 3;
					gearPath(ctx, 170, 520, 70, 10, rot);
					gearPath(ctx, 300, 600, 52, 8, -rot * 1.25 + 0.2);
					// Schriftfeld
					ctx.strokeRect(620, 1500, 380, 90);
					ctx.font = `700 30px ${F.spaceMono}`;
					ctx.textAlign = 'left';
					ctx.fillText(TEXT.blueprintTitle, 640, 1556);
				}}
			/>
		</AbsoluteFill>
	);
};

// ── 10 Isometrie / 11 Voxel ──────────────────────────────────────────────────
type Block = {x: number; y: number; z: number; top: string; left: string; right: string; wave: number};

const shade = (hex: string, k: number) => {
	const n = parseInt(hex.slice(1), 16);
	const r = Math.min(255, Math.round(((n >> 16) & 255) * k));
	const g = Math.min(255, Math.round(((n >> 8) & 255) * k));
	const b = Math.min(255, Math.round((n & 255) * k));
	return `rgb(${r},${g},${b})`;
};

const BLOCKS: Block[] = (() => {
	const out: Block[] = [];
	const add = (x: number, y: number, z: number, base: string, wave: number) =>
		out.push({x, y, z, top: shade(base, 1.12), left: shade(base, 0.86), right: shade(base, 0.68), wave});
	const R = 3.6;
	for (let x = -4; x <= 4; x++)
		for (let y = -4; y <= 4; y++) {
			const d = Math.hypot(x, y);
			if (d <= R - 1.6) add(x, y, -2, '#8a5a3c', 0);
			if (d <= R - 0.7) add(x, y, -1, '#9b6a45', 0);
			if (d <= R) {
				const water = x >= 1 && x <= 2 && y >= -2 && y <= -1;
				add(x, y, 0, water ? '#4fb3ff' : '#6cc94f', 1);
			}
		}
	add(-1, 1, 1, '#7a4b2a', 2);
	add(-1, 1, 2, '#7a4b2a', 2);
	for (let x = -2; x <= 0; x++) for (let y = 0; y <= 2; y++) add(x, y, 3, '#3fa34d', 3);
	add(-1, 1, 4, '#4dbb5a', 3);
	add(2, 2, 1, '#f4f1e8', 2);
	add(3, 0, 1, '#ff6b6b', 3);
	return out.sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z);
})();

export const Voxel: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: 'linear-gradient(#8fd3ff, #e8f7ff 70%)'}}>
			<Canvas2D
				draw={(ctx) => {
					const s = 64;
					const cx = 540;
					const cy = 960 + Math.sin(f / 5) * 12;
					// Wolken
					ctx.fillStyle = 'rgba(255,255,255,0.9)';
					[[200, 560, 1], [860, 700, 0.8], [760, 1400, 0.7]].forEach(([x, y, k]) => {
						ctx.beginPath();
						ctx.ellipse(x + f * 2 * k, y, 110 * k, 40 * k, 0, 0, Math.PI * 2);
						ctx.ellipse(x + 60 * k + f * 2 * k, y - 25 * k, 70 * k, 40 * k, 0, 0, Math.PI * 2);
						ctx.fill();
					});
					BLOCKS.forEach((b) => {
						const delay = VOXEL_WAVE[b.wave] + hash2(b.x * 13 + b.z, b.y * 7) * 2.5;
						const t = pop(f, delay, {damping: 13, stiffness: 300, mass: 0.6});
						if (t <= 0.001) return;
						const drop = (1 - t) * -520;
						const X = cx + (b.x - b.y) * s;
						const Y = cy + (b.x + b.y) * (s / 2) - b.z * s * 1.1 + drop;
						const h = s * 1.1;
						ctx.globalAlpha = Math.min(1, t * 3);
						// oben
						ctx.fillStyle = b.top;
						ctx.beginPath();
						ctx.moveTo(X, Y - s / 2);
						ctx.lineTo(X + s, Y);
						ctx.lineTo(X, Y + s / 2);
						ctx.lineTo(X - s, Y);
						ctx.closePath();
						ctx.fill();
						// links
						ctx.fillStyle = b.left;
						ctx.beginPath();
						ctx.moveTo(X - s, Y);
						ctx.lineTo(X, Y + s / 2);
						ctx.lineTo(X, Y + s / 2 + h);
						ctx.lineTo(X - s, Y + h);
						ctx.closePath();
						ctx.fill();
						// rechts
						ctx.fillStyle = b.right;
						ctx.beginPath();
						ctx.moveTo(X + s, Y);
						ctx.lineTo(X, Y + s / 2);
						ctx.lineTo(X, Y + s / 2 + h);
						ctx.lineTo(X + s, Y + h);
						ctx.closePath();
						ctx.fill();
						ctx.strokeStyle = 'rgba(0,0,0,0.08)';
						ctx.lineWidth = 1.5;
						ctx.stroke();
					});
					ctx.globalAlpha = 1;
				}}
			/>
		</AbsoluteFill>
	);
};
