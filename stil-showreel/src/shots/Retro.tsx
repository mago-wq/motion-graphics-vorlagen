import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {TEXT} from '../config';
import {F} from '../fonts';
import {HEAD} from '../lib/glsl';
import {Shader, useShaderPixels} from '../lib/gl';
import {Canvas2D} from '../lib/canvas';
import {hash2} from '../lib/rand';
import {FPS, shot} from '../timing';

// Eine Synthwave-Szene, viermal anders gerendert: VHS → Pixel-Art → ASCII → Matrix.
// Die Zeit läuft über alle vier Einstellungen durch (Match-Cut).
// uA: VHS-Effekte an (1/0), uB: Glitch-Stärke, uC: Farbstufen (0 = aus).
const SYNTH = /* glsl */ `${HEAD}
vec3 scene(vec2 p, float t){
	float hor = -0.12;
	vec3 col;
	if (p.y > hor) {
		float y = (p.y - hor) / (1. - hor);
		col = mix(vec3(1.0, 0.36, 0.52), vec3(0.10, 0.02, 0.24), pow(y, 0.55));
		vec2 sp = p * 70.;
		float st = step(0.975, h21(floor(sp))) * smoothstep(0.35, 0., length(fract(sp) - .5));
		col += st * smoothstep(0.25, 0.8, y) * 0.9;
		vec2 c = vec2(0., hor + 0.34);
		float r = 0.3;
		float d = length(p - c);
		col += vec3(1., 0.3, 0.6) * 0.45 * exp(-max(d - r, 0.) * 7.);
		vec3 sunc = mix(vec3(1., 0.88, 0.3), vec3(1., 0.18, 0.55), clamp((c.y + r - p.y) / (2. * r), 0., 1.));
		float stripe = 1.;
		if (p.y < c.y + 0.05) {
			float s = (c.y + 0.05 - p.y) / (r + 0.05);
			float k = fract(s * 7. - t * 0.9);
			stripe = step(0.18 + 0.55 * s, k) + step(s, 0.02);
			stripe = clamp(stripe, 0., 1.);
		}
		float sunMask = smoothstep(r, r - 0.006, d) * stripe;
		col = mix(col, sunc, sunMask);
		float m = hor + 0.025 + 0.15 * vnoise(vec2(p.x * 3.2 + 4.1, 1.3)) * smoothstep(0.05, 0.5, abs(p.x))
			+ 0.035 * vnoise(vec2(p.x * 14., 7.));
		if (p.y < m) {
			col = mix(vec3(0.06, 0.0, 0.14), vec3(0.28, 0.04, 0.38), clamp((p.y - hor) / max(m - hor, 0.001), 0., 1.) * 0.7);
		}
		col += vec3(1., 0.25, 0.85) * smoothstep(0.012, 0., abs(p.y - m)) * 0.9 * step(hor, p.y);
	} else {
		float y = hor - p.y;
		float z = 0.32 / y;
		vec2 g = vec2(p.x * z * 2.6, z - t * 3.2);
		vec2 fw = fwidth(g) * 1.2;
		vec2 gl = abs(fract(g - .5) - .5) / max(fw, vec2(1e-4));
		float line = 1. - min(min(gl.x, gl.y), 1.);
		col = vec3(0.06, 0.0, 0.13);
		col += vec3(1., 0.2, 0.85) * line * (0.35 + 0.65 * smoothstep(0., 0.6, y));
		col = mix(col, vec3(1., 0.4, 0.62), exp(-y * 22.) * 0.75);
	}
	return col;
}
void main(){
	vec2 p = P();
	float t = uT;
	if (uA > 0.5) {
		// VHS: Bandlauf-Streifen, Zittern, Farbversatz, Zeilen, Rauschen
		float band = smoothstep(0.08, 0., abs(p.y - (fract(t * 0.35) * 2.4 - 1.2)));
		p.x += band * 0.02 * (h11(floor(gl_FragCoord.y / 3.) + t) - 0.5);
		float gb = uB * step(0.5, h11(floor(gl_FragCoord.y / (28. * uRes.y / 1920.)) + floor(uF)));
		p.x += gb * 0.12 * (h11(floor(gl_FragCoord.y / 40.) + uF * 7.) - 0.5);
		float ca = 0.006 + uB * 0.03;
		vec3 col = vec3(scene(p + vec2(ca, 0.), t).r, scene(p, t).g, scene(p - vec2(ca, 0.), t).b);
		float sl = 0.82 + 0.18 * sin(gl_FragCoord.y / uRes.y * 1920. * PI / 3.);
		col *= sl;
		col += (h21(gl_FragCoord.xy + fract(t) * 100.) - 0.5) * 0.09;
		col += band * 0.08;
		vec2 uv = gl_FragCoord.xy / uRes;
		col *= 1. - 0.55 * pow(length(uv - .5) * 1.25, 2.2);
		col = mix(col, vec3(dot(col, vec3(.3, .55, .15))), 0.12);
		fragColor = vec4(srgb(col * 1.05), 1.);
	} else {
		vec3 col = scene(p, t);
		if (uC > 0.5) col = floor(col * uC + 0.5) / uC;
		fragColor = vec4(srgb(col), 1.);
	}
}`;

/** Szenenzeit läuft über VHS, Pixel, ASCII und Matrix durch. */
const useSceneTime = (id: string) => {
	const f = useCurrentFrame();
	return {f, t: (shot(id).from + f) / FPS};
};

const vhsText: React.CSSProperties = {
	position: 'absolute',
	fontFamily: F.mono,
	fontSize: 54,
	color: '#f4f4f4',
	textShadow: '3px 0 0 rgba(255,0,80,0.7), -3px 0 0 rgba(0,220,255,0.7)',
	letterSpacing: 4,
};

// ── 04 Retro-VHS ─────────────────────────────────────────────────────────────
export const Vhs: React.FC = () => {
	const {f, t} = useSceneTime('vhs');
	const glitch = f >= 14 ? (f - 13) / 4 : 0;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Shader frag={SYNTH} uniforms={{uT: t, uF: f, uA: 1, uB: glitch, uC: 0}} />
			<div style={{...vhsText, left: 90, top: 400}}>{TEXT.vhsPlay}</div>
			<div style={{...vhsText, right: 110, top: 400, opacity: Math.floor(f / 6) % 2 ? 0.2 : 1}}>
				<span style={{color: '#ff2a2a'}}>●</span> {TEXT.vhsRec}
			</div>
			<div style={{...vhsText, left: 90, top: 1400}}>{TEXT.vhsTime}</div>
		</AbsoluteFill>
	);
};

// ── 05 Pixel-Art ─────────────────────────────────────────────────────────────
export const Pixel: React.FC = () => {
	const {f, t} = useSceneTime('pixel');
	const hop = Math.max(0, Math.sin((f / 12) * Math.PI)) * 60;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Shader frag={SYNTH} uniforms={{uT: t, uF: f, uA: 0, uB: 0, uC: 4}} pixel={96} />
			<div
				style={{
					position: 'absolute',
					left: 80,
					top: 400,
					fontFamily: F.pixel,
					fontSize: 44,
					color: '#fff',
					textShadow: '6px 6px 0 #000',
				}}
			>
				{TEXT.pixelCoins}
			</div>
			<div
				style={{
					position: 'absolute',
					right: 80,
					top: 400,
					fontFamily: F.pixel,
					fontSize: 44,
					color: '#ffe14d',
					textShadow: '6px 6px 0 #000',
				}}
			>
				{TEXT.pixelLevel}
			</div>
			{/* Münze, die über dem Horizont springt */}
			<svg
				width={1080}
				height={1920}
				style={{position: 'absolute', left: 0, top: 0}}
				shapeRendering="crispEdges"
			>
				{[
					'..XXXX..',
					'.XYYYYX.',
					'XYYXXYYX',
					'XYYXYYYX',
					'XYYXYYYX',
					'XYYXXYYX',
					'.XYYYYX.',
					'..XXXX..',
				].map((row, y) =>
					row.split('').map((c, x) =>
						c === '.' ? null : (
							<rect
								key={`${x}-${y}`}
								x={540 - 4 * 22 + x * 22}
								y={1180 - hop + y * 22}
								width={22}
								height={22}
								fill={c === 'X' ? '#1a1030' : '#ffd23f'}
							/>
						),
					),
				)}
			</svg>
		</AbsoluteFill>
	);
};

// ── 06 ASCII-Art / 07 Matrix-Regen ───────────────────────────────────────────
const COLS = 40;
const ROWS = 71;
const CW = 1080 / COLS; // 27
const CH = 1920 / ROWS; // ≈27
const RAMP = ' .,:;-=+*#%@';
const MATRIX_GLYPHS = '0123456789ABCDEFXYZ<>{}[]=+*#$%&@'.split('');

const AsciiBase: React.FC<{id: string; matrix: boolean}> = ({id, matrix}) => {
	const {f, t} = useSceneTime(id);
	const read = useShaderPixels(SYNTH, COLS, ROWS);
	return (
		<Canvas2D
			extra={[t, matrix]}
			draw={(ctx) => {
				const px = read({uT: t, uF: f, uA: 0, uB: 0, uC: 0});
				ctx.fillStyle = '#000';
				ctx.fillRect(0, 0, 1080, 1920);
				ctx.font = `700 ${CH * 0.95}px ${F.mono}`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				for (let r = 0; r < ROWS; r++) {
					for (let c = 0; c < COLS; c++) {
						const i = ((ROWS - 1 - r) * COLS + c) * 4;
						const R = px[i];
						const G = px[i + 1];
						const B = px[i + 2];
						const lum = Math.pow((0.3 * R + 0.55 * G + 0.15 * B) / 255, 0.7);
						const x = c * CW + CW / 2;
						const y = r * CH + CH / 2;
						if (!matrix) {
							const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(lum * RAMP.length * 1.15))];
							if (ch === ' ') continue;
							ctx.fillStyle = `rgb(${Math.min(255, R * 1.35 + 20)},${Math.min(255, G * 1.35 + 20)},${Math.min(255, B * 1.35 + 20)})`;
							ctx.fillText(ch, x, y);
						} else {
							// Regen: jede Spalte hat einen fallenden Kopf; das Bild bleibt grün im Hintergrund.
							const speed = 1.4 + hash2(c, 7) * 1.6;
							const head = ((f + 2) * speed + hash2(c, 3) * ROWS * 1.4) % (ROWS * 1.4);
							const dist = head - r;
							const trail = dist >= 0 && dist < 16 ? 1 - dist / 16 : 0;
							const keep = Math.max(0, 1 - f / 9) * lum;
							const a = Math.max(trail, keep * 0.9);
							if (a < 0.04) continue;
							const ch = MATRIX_GLYPHS[Math.floor(hash2(c * 97 + r, Math.floor(f / 2) + (dist < 1 ? f : 0)) * MATRIX_GLYPHS.length)];
							ctx.fillStyle = dist >= 0 && dist < 1 ? '#eafff0' : `rgba(40,255,110,${a})`;
							ctx.fillText(ch, x, y);
						}
					}
				}
				if (matrix) {
					const g = ctx.createLinearGradient(0, 0, 0, 1920);
					g.addColorStop(0, 'rgba(0,0,0,0)');
					g.addColorStop(1, 'rgba(0,40,10,0.35)');
					ctx.fillStyle = g;
					ctx.fillRect(0, 0, 1080, 1920);
				}
			}}
		/>
	);
};

export const Ascii: React.FC = () => <AsciiBase id="ascii" matrix={false} />;
export const Matrix: React.FC = () => <AsciiBase id="matrix" matrix />;
