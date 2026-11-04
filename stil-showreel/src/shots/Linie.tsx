import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {HEAD} from '../lib/glsl';
import {Shader} from '../lib/gl';
import {Canvas2D} from '../lib/canvas';
import {fbm2, hash2, mulberry} from '../lib/rand';
import {easeOut, ramp} from '../lib/motion';
import {FPS} from '../timing';

// ── 27 Lichtbänder ───────────────────────────────────────────────────────────
const RIBBONS = [
	{a: 1.7, b: 2.3, ph: 0.0, c1: [0, 230, 255], c2: [180, 80, 255]},
	{a: 2.1, b: 1.5, ph: 1.4, c1: [255, 70, 170], c2: [255, 190, 60]},
	{a: 1.3, b: 2.8, ph: 2.7, c1: [80, 255, 170], c2: [0, 140, 255]},
	{a: 2.6, b: 1.9, ph: 4.1, c1: [255, 120, 80], c2: [255, 60, 200]},
	{a: 1.9, b: 1.2, ph: 5.3, c1: [190, 140, 255], c2: [90, 230, 255]},
];

const ribbonPos = (r: (typeof RIBBONS)[number], s: number) => ({
	x: 540 + Math.sin(s * r.a + r.ph) * 380 + Math.sin(s * 0.7 + r.ph * 2) * 80,
	y: 960 + Math.sin(s * r.b + r.ph * 1.7) * 560 + Math.cos(s * 1.1 + r.ph) * 120,
});

export const Baender: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: '#06050d'}}>
			<Canvas2D
				draw={(ctx) => {
					const t = 1.2 + (f / FPS) * 3.2;
					ctx.globalCompositeOperation = 'lighter';
					const N = 70;
					for (const r of RIBBONS) {
						const pts = Array.from({length: N}, (_, k) => ribbonPos(r, t - k * 0.022));
						for (let k = 0; k < N - 1; k++) {
							const p0 = pts[k];
							const p1 = pts[k + 1];
							const dx = p1.x - p0.x;
							const dy = p1.y - p0.y;
							const len = Math.hypot(dx, dy) || 1;
							const nx = -dy / len;
							const ny = dx / len;
							const life = 1 - k / N;
							const twist = Math.cos(t * 3 + k * 0.18 + r.ph);
							const w = 70 * life * (0.25 + 0.75 * Math.abs(twist));
							const mix = k / N;
							const c = r.c1.map((v, i) => Math.round(v + (r.c2[i] - v) * mix));
							const bright = 0.45 + 0.55 * (twist > 0 ? 1 : 0.55);
							ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.62 * life * bright})`;
							ctx.beginPath();
							ctx.moveTo(p0.x + nx * w, p0.y + ny * w);
							ctx.lineTo(p1.x + nx * w, p1.y + ny * w);
							ctx.lineTo(p1.x - nx * w, p1.y - ny * w);
							ctx.lineTo(p0.x - nx * w, p0.y - ny * w);
							ctx.closePath();
							ctx.fill();
						}
						// heller Kopf
						const h = pts[0];
						const g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, 90);
						g.addColorStop(0, `rgba(255,255,255,0.9)`);
						g.addColorStop(0.3, `rgba(${r.c1.join(',')},0.5)`);
						g.addColorStop(1, 'rgba(0,0,0,0)');
						ctx.fillStyle = g;
						ctx.fillRect(h.x - 90, h.y - 90, 180, 180);
					}
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
		</AbsoluteFill>
	);
};

// ── 28 Magnetpunkte → 29 Partikel ────────────────────────────────────────────
const GRID = 40;
const DOTS = (() => {
	const out: {x: number; y: number; s: number}[] = [];
	for (let y = GRID / 2; y < 1920; y += GRID) for (let x = GRID / 2; x < 1080; x += GRID) out.push({x, y, s: hash2(x, y)});
	return out;
})();

const magnetAt = (f: number) => ({
	x: 540 + Math.sin(f * 0.32 + 0.5) * 300,
	y: 1000 + Math.cos(f * 0.24) * 380 - f * 10,
});

export const Magnet: React.FC = () => {
	const f = useCurrentFrame();
	const burst = f >= 9;
	return (
		<AbsoluteFill style={{background: burst ? '#14081f' : '#f3efe6'}}>
			<Canvas2D
				draw={(ctx) => {
					if (!burst) {
						const m = magnetAt(f);
						for (const d of DOTS) {
							const dx = d.x - m.x;
							const dy = d.y - m.y;
							const dist = Math.hypot(dx, dy) || 1;
							const push = 90 * Math.exp(-(dist * dist) / (2 * 150 * 150));
							const x = d.x + (dx / dist) * push;
							const y = d.y + (dy / dist) * push;
							const near = Math.exp(-(dist * dist) / (2 * 220 * 220));
							const r = 4.5 + near * 6;
							ctx.fillStyle = near > 0.25 ? `rgba(40,90,255,${0.6 + near * 0.4})` : '#1d1d24';
							ctx.beginPath();
							ctx.arc(x, y, r, 0, Math.PI * 2);
							ctx.fill();
						}
						return;
					}
					// Ausbruch: die Punkte fliegen als leuchtende Partikel davon und drehen sich ein
					const m = magnetAt(9);
					const tau = (f - 9 + 1) / 9;
					ctx.globalCompositeOperation = 'lighter';
					for (const d of DOTS) {
						const dx = d.x - m.x;
						const dy = d.y - m.y;
						const dist = Math.hypot(dx, dy) || 1;
						const ang = Math.atan2(dy, dx) + tau * (1.6 + d.s * 1.2) * (500 / (dist + 200));
						const rr = dist * (1 + tau * (0.6 + d.s * 1.4)) + 120 * tau;
						const x = m.x + Math.cos(ang) * rr;
						const y = m.y + Math.sin(ang) * rr;
						const ang0 = ang - 0.12;
						const x0 = m.x + Math.cos(ang0) * rr * 0.93;
						const y0 = m.y + Math.sin(ang0) * rr * 0.93;
						const hue = 290 + d.s * 60;
						ctx.strokeStyle = `hsla(${hue},100%,70%,0.75)`;
						ctx.lineWidth = 3 + d.s * 3;
						ctx.beginPath();
						ctx.moveTo(x0, y0);
						ctx.lineTo(x, y);
						ctx.stroke();
					}
					const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 380);
					g.addColorStop(0, `rgba(255,210,255,${0.8 * (1 - tau * 0.7)})`);
					g.addColorStop(1, 'rgba(0,0,0,0)');
					ctx.fillStyle = g;
					ctx.fillRect(0, 0, 1080, 1920);
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
		</AbsoluteFill>
	);
};

// ── 30 Höhenlinien → 31 Strömungsfeld ────────────────────────────────────────
const TOPO = /* glsl */ `${HEAD}
void main(){
	vec2 p = P();
	float t = uT;
	float h = fbm(p*1.3 + vec2(t*0.18, -t*0.1)) + 0.25*fbm(p*3.1 - t*0.05);
	float v = h * 22.;
	float fw = fwidth(v);
	float d = abs(fract(v + 0.5) - 0.5);
	float l1 = 1. - smoothstep(fw*0.6, fw*1.6, d);
	float idx = floor(v + 0.5); // jede fünfte Linie kräftiger
	float isMajor = 1. - step(0.5, abs(mod(idx, 5.)));
	float l2 = 1. - smoothstep(fw*1.4, fw*2.6, d);
	vec3 paper = vec3(0.95,0.91,0.84);
	paper *= 0.96 + 0.04*vnoise(gl_FragCoord.xy*0.4);
	vec3 tint = mix(vec3(0.86,0.9,0.78), vec3(0.95,0.85,0.72), smoothstep(0.35,0.7,h));
	vec3 col = mix(paper, tint, 0.35);
	vec3 ink = vec3(0.42,0.3,0.22);
	col = mix(col, ink, l1*0.7*(1.-isMajor) + l2*0.95*isMajor);
	fragColor = vec4(srgb(col), 1.);
}`;

type Seed = {x: number; y: number; w: number; c: number};
const SEEDS: Seed[] = (() => {
	const r = mulberry(5);
	return Array.from({length: 1500}, () => ({x: r() * 1180 - 50, y: r() * 2020 - 50, w: 1 + r() * 2.2, c: r()}));
})();

export const Topo: React.FC = () => {
	const f = useCurrentFrame();
	const reveal = ramp(f, 8, 12, easeOut);
	return (
		<AbsoluteFill>
			<Shader frag={TOPO} uniforms={{uT: 1 + (f / FPS) * 1.5, uF: f, uA: 0, uB: 0, uC: 0}} />
			{f >= 8 ? (
				<AbsoluteFill style={{clipPath: `circle(${reveal * 120}% at 50% 50%)`}}>
					<Canvas2D
						draw={(ctx) => {
							ctx.fillStyle = '#0c0a14';
							ctx.fillRect(0, 0, 1080, 1920);
							const steps = Math.round(interpolate(f, [8, 17], [10, 46], {extrapolateRight: 'clamp'}));
							ctx.lineCap = 'round';
							for (const s of SEEDS) {
								let x = s.x;
								let y = s.y;
								ctx.beginPath();
								ctx.moveTo(x, y);
								for (let k = 0; k < steps; k++) {
									const a = fbm2(x * 0.0024 + 3, y * 0.0024 + f * 0.004, 3) * Math.PI * 4;
									x += Math.cos(a) * 9;
									y += Math.sin(a) * 9;
									ctx.lineTo(x, y);
								}
								const pink = s.c > 0.7;
								ctx.strokeStyle = pink ? 'rgba(255,140,170,0.55)' : `rgba(240,232,255,${0.18 + s.c * 0.3})`;
								ctx.lineWidth = s.w;
								ctx.stroke();
							}
						}}
					/>
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};
