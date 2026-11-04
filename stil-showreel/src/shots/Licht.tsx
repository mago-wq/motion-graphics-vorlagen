import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {TEXT} from '../config';
import {F} from '../fonts';
import {HEAD} from '../lib/glsl';
import {Shader} from '../lib/gl';
import {Canvas2D} from '../lib/canvas';
import {mulberry} from '../lib/rand';
import {easeOut, pop, ramp} from '../lib/motion';
import {FPS} from '../timing';

// ── 17 Verlaufsnetz / 18 Glasmorphismus ──────────────────────────────────────
// uA = 1 zeichnet nur den Ausschnitt hinter der Glaskarte, stark weichgezeichnet.
const MESH = /* glsl */ `${HEAD}
vec3 mesh(vec2 p, float t){
	vec2 q = p + 0.25*vec2(fbm3(p*1.2+t*0.3), fbm3(p*1.2-t*0.25+3.1));
	vec2 c[4]; vec3 k[4];
	c[0]=vec2(-0.4+0.2*sin(t), 0.6); c[1]=vec2(0.45, 0.2+0.3*cos(t*1.2));
	c[2]=vec2(-0.3, -0.5+0.2*sin(t*0.8)); c[3]=vec2(0.4+0.1*cos(t), -0.7);
	k[0]=vec3(1.0,0.36,0.62); k[1]=vec3(0.36,0.42,1.0); k[2]=vec3(0.2,0.9,0.8); k[3]=vec3(1.0,0.66,0.25);
	vec3 s = vec3(0.); float w = 0.;
	for(int i=0;i<4;i++){float d = length(q-c[i]); float wi = 1./(0.02+d*d*d); s += k[i]*wi; w += wi;}
	return s/w;
}
void main(){
	vec2 p = P();
	vec3 col = mesh(p, uT);
	col += (h21(gl_FragCoord.xy) - 0.5) * 0.035;
	fragColor = vec4(srgb(col), 1.);
}`;

export const Glas: React.FC = () => {
	const f = useCurrentFrame();
	const t = 1 + (f / FPS) * 2.2;
	const card = pop(f, 3, {damping: 14, stiffness: 220});
	const toggle = ramp(f, 6, 9, easeOut);
	return (
		<AbsoluteFill>
			<Shader frag={MESH} uniforms={{uT: t, uF: f, uA: 0, uB: 0, uC: 0}} />
			<div
				style={{
					position: 'absolute',
					left: 150,
					top: 640,
					width: 780,
					height: 620,
					borderRadius: 64,
					background: 'rgba(255,255,255,0.18)',
					border: '3px solid rgba(255,255,255,0.55)',
					backdropFilter: 'blur(36px) saturate(1.5)',
					boxShadow: '0 40px 80px rgba(40,10,80,0.25), inset 0 2px 0 rgba(255,255,255,0.6)',
					transform: `translateY(${(1 - card) * 300}px) rotate(${(1 - card) * -8}deg)`,
					opacity: Math.min(1, card * 2),
					color: '#fff',
					fontFamily: F.grotesk,
					padding: 60,
					boxSizing: 'border-box',
				}}
			>
				<div style={{fontSize: 52, fontWeight: 500, opacity: 0.9}}>{TEXT.glassTitle}</div>
				<div style={{fontSize: 230, fontWeight: 700, lineHeight: 1.05, letterSpacing: -6}}>{TEXT.glassTemp}</div>
				<div
					style={{
						marginTop: 30,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						background: 'rgba(255,255,255,0.18)',
						borderRadius: 40,
						padding: '22px 30px',
						fontSize: 46,
						fontWeight: 600,
					}}
				>
					{TEXT.glassRow}
					<div style={{width: 130, height: 70, borderRadius: 35, background: `rgba(255,255,255,${0.3 + toggle * 0.5})`, position: 'relative'}}>
						<div
							style={{
								position: 'absolute',
								top: 7,
								left: 7 + toggle * 60,
								width: 56,
								height: 56,
								borderRadius: 28,
								background: toggle > 0.5 ? '#3ad29f' : '#fff',
								boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
							}}
						/>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ── 19 Polarlicht ────────────────────────────────────────────────────────────
const AURORA = /* glsl */ `${HEAD}
vec3 sky(vec2 p, float t){
	vec3 col = mix(vec3(0.01,0.03,0.09), vec3(0.03,0.08,0.2), smoothstep(1., -0.2, p.y));
	vec2 sp = p*90.;
	col += step(0.985, h21(floor(sp))) * smoothstep(0.4,0.,length(fract(sp)-.5)) * 0.8;
	for(int k=0;k<3;k++){
		float fk = float(k);
		float x = p.x*1.3 + fk*0.7;
		float yc = 0.25 + fk*0.16 + 0.12*sin(x*2.6 + t*0.9 + fk) + 0.1*(fbm3(vec2(x*1.5 + t*0.25, fk)) - .5);
		float dy = p.y - yc;
		float curtain = smoothstep(-0.03, 0.0, dy) * exp(-max(dy,0.)*(3.2 - fk*0.6));
		float rays = 0.45 + 0.75*fbm3(vec2(x*18. + t*0.6, fk*5.));
		vec3 c = mix(vec3(0.1,1.0,0.55), vec3(0.15,0.75,1.0), clamp(dy*2.2,0.,1.));
		c = mix(c, vec3(0.85,0.25,0.95), clamp(dy*1.6-0.5,0.,1.));
		col += c * curtain * rays * (0.9 - fk*0.2);
	}
	return col;
}
void main(){
	vec2 p = P();
	float t = uT;
	float lake = -0.42;
	vec3 col;
	float m = lake + 0.06 + 0.22*fbm3(vec2(p.x*2.3+1., 2.)) * smoothstep(0.0, 0.5, abs(p.x+0.1));
	if (p.y > lake) {
		col = sky(p, t);
		if (p.y < m) col = vec3(0.01,0.015,0.04) + 0.03*vec3(0.1,0.6,0.4);
	} else {
		vec2 q = vec2(p.x + 0.01*sin(p.y*90. + t*4.), 2.*lake - p.y);
		col = sky(q, t) * 0.45;
		float mm = lake - 0.06 - 0.22*fbm3(vec2(p.x*2.3+1., 2.)) * smoothstep(0.0, 0.5, abs(p.x+0.1));
		if (p.y > mm) col = vec3(0.01,0.015,0.04);
		col *= 0.85 + 0.15*sin(p.y*260. + t*3.);
	}
	fragColor = vec4(srgb(col), 1.);
}`;

export const Polarlicht: React.FC = () => {
	const f = useCurrentFrame();
	return <Shader frag={AURORA} uniforms={{uT: 2 + (f / FPS) * 2.5, uF: f, uA: 0, uB: 0, uC: 0}} />;
};

// ── 20 Tinte im Wasser / 21 Fluid-Simulation ─────────────────────────────────
const INK = /* glsl */ `${HEAD}
void main(){
	vec2 p = P();
	float t = uT;
	// Tinte sinkt von oben ein und wirbelt (verschachteltes Domain-Warping als Strömung)
	vec2 q = p * 1.6;
	q.y += t * 0.55;
	vec2 w1 = vec2(fbm(q + vec2(0., t*0.3)), fbm(q + vec2(5.2, 1.3 - t*0.2)));
	vec2 w2 = vec2(fbm(q + 2.6*w1 + vec2(1.7, 9.2) + t*0.15*uA), fbm(q + 2.6*w1 + vec2(8.3, 2.8)));
	float n = fbm(q + 3.2*w2);
	float front = 0.35 - t*1.9; // Tintenfront sinkt von oben durchs Bild
	float mask = smoothstep(front - 0.1, front + 0.4, p.y + 0.6*(w1.x - 0.5));
	float dens = smoothstep(0.32, 0.56, n) * mask;
	float wisp = smoothstep(0.5, 0.62, n) * (1. - smoothstep(0.62, 0.8, n)) * mask;
	vec3 inkA = vec3(0.42,0.17,1.0), inkB = vec3(0.05,0.78,0.72), inkC = vec3(1.0,0.38,0.35);
	float sel = fbm(p*1.1 + vec2(3., t*0.1));
	vec3 ink = mix(inkA, inkB, smoothstep(0.45, 0.62, sel));
	ink = mix(ink, inkC, smoothstep(0.6, 0.75, fbm(p*0.9 + 7.)) * 0.8);
	vec3 col = vec3(0.985, 0.98, 0.97);
	col = mix(col, ink * (0.4 + 0.6*w2.y), dens * 0.95);
	col = mix(col, ink*1.25, wisp*0.35);
	fragColor = vec4(srgb(col), 1.);
}`;

export const Tinte: React.FC = () => {
	const f = useCurrentFrame();
	const fluid = ramp(f, 4, 8);
	return <Shader frag={INK} uniforms={{uT: 0.1 + (f / FPS) * 1.5, uF: f, uA: fluid, uB: 0, uC: 0}} />;
};

// ── 22 Kaleidoskop → 23 Buntglas ─────────────────────────────────────────────
const KALEIDO = /* glsl */ `${HEAD}
vec2 fold(vec2 p, float n){
	float a = atan(p.y, p.x), r = length(p);
	float s = TAU / n;
	a = mod(a, s); a = abs(a - s*0.5);
	return r * vec2(cos(a), sin(a));
}
void main(){
	vec2 p = P() * 1.05;
	float t = uT;
	float r = length(p);
	vec2 q = fold(p * rot(t*0.6), 12.);
	// Kaleidoskop: bunte, verschobene Muster im gespiegelten Segment
	float n = fbm(q*3.2 + vec2(t*0.8, -t*0.4));
	vec3 kal = pal(n*1.6 + r*0.8 - t*0.3, vec3(0.55), vec3(0.45), vec3(1.0,1.0,1.0), vec3(0.0,0.15,0.3));
	kal *= 0.7 + 0.5*smoothstep(0.02, 0.0, abs(fract(r*6. - t) - 0.5) - 0.42);
	// Buntglas: Voronoi im selben gefalteten Raum, Bleiruten, Licht scheint durch
	vec2 g = q * 5.5;
	vec2 gi = floor(g), gf = fract(g);
	float d1 = 9., d2 = 9.; vec2 cell = vec2(0.);
	for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
		vec2 o = vec2(x,y);
		vec2 h = h22(gi+o);
		vec2 dv = o + h - gf;
		float d = dot(dv,dv);
		if(d < d1){d2 = d1; d1 = d; cell = gi+o;} else if(d < d2) d2 = d;
	}
	float edge = sqrt(d2) - sqrt(d1);
	float hc = h21(cell);
	vec3 jewel = hc < 0.25 ? vec3(0.85,0.1,0.15) : (hc < 0.5 ? vec3(0.1,0.3,0.9) : (hc < 0.75 ? vec3(1.0,0.75,0.1) : vec3(0.1,0.65,0.35)));
	jewel *= 0.75 + 0.5*vnoise(g*3.);
	jewel *= 0.75 + 0.6*exp(-r*1.6);
	vec3 glass = mix(vec3(0.03), jewel, smoothstep(0.05, 0.12, edge));
	// Rosenfenster-Ringe
	float ring = smoothstep(0.012, 0.0, abs(r - 0.92)) + smoothstep(0.01, 0.0, abs(r - 0.35));
	glass = mix(glass, vec3(0.03), clamp(ring, 0., 1.));
	glass = mix(glass, vec3(0.08,0.06,0.05), smoothstep(0.93, 0.95, r));
	vec3 col = mix(kal, glass, uA);
	col = mix(col, col*vec3(0.25), smoothstep(1.0, 1.25, r)*(1.-uA));
	fragColor = vec4(srgb(col), 1.);
}`;

export const Kaleido: React.FC = () => {
	const f = useCurrentFrame();
	const glass = ramp(f, 7, 10);
	return <Shader frag={KALEIDO} uniforms={{uT: (f / FPS) * 1.4, uF: f, uA: glass, uB: 0, uC: 0}} />;
};

// ── 24 Lichtstrahlen (volumetrisch) ──────────────────────────────────────────
const RAYS = /* glsl */ `${HEAD}
float windowMask(vec2 p){
	// Rundbogenfenster mit Sprossen
	vec2 c = vec2(-0.22, 0.42);
	vec2 q = p - c;
	float w = 0.2, h = 0.34;
	float body = step(abs(q.x), w) * step(-h, q.y) * step(q.y, 0.);
	float arch = step(length(q), w) * step(0., q.y);
	float m = max(body, arch);
	float bars = step(abs(q.x), 0.012) + step(abs(q.y + 0.12), 0.012);
	return m * (1. - clamp(bars, 0., 1.));
}
void main(){
	vec2 p = P();
	float t = uT;
	vec3 col = vec3(0.04,0.035,0.05);
	vec2 L = vec2(-0.6, 1.4); // Lichtquelle hinter dem Fenster
	// Strahlen: vom Pixel Richtung Licht marschieren und das Fenster abtasten
	float acc = 0.;
	vec2 dir = (L - p);
	const int N = 48;
	for(int i=0;i<N;i++){
		float k = float(i)/float(N);
		vec2 s = p + dir * k * 0.85;
		acc += windowMask(s) * (1. - k);
	}
	acc /= float(N) * 0.5;
	float dust = 0.;
	for(int i=0;i<3;i++){
		vec2 g = p*vec2(40.,40.) + vec2(t*2. + float(i)*13., t*1.2 - float(i)*7.);
		dust += step(0.992, h21(floor(g))) * smoothstep(0.5, 0.1, length(fract(g)-.5));
	}
	float on = uA;
	vec3 warm = vec3(1.0, 0.85, 0.6);
	col += warm * acc * 0.75 * on * (0.9 + 0.1*sin(t*5.));
	col += warm * dust * acc * 2.2 * on;
	col = mix(col, warm*1.4, windowMask(p) * on);
	// Lichtfleck am Boden
	vec2 fp = (p - vec2(0.18, -0.62)) * vec2(1., 2.2) + vec2(p.y*0.35, 0.);
	float floorMask = windowMask(fp*0.9 + vec2(-0.22, 0.42) + vec2(0.0, 0.1));
	col += warm * floorMask * 0.55 * on * smoothstep(-0.3, -0.5, p.y);
	col *= 1. - 0.35*length(p*0.7);
	fragColor = vec4(srgb(col), 1.);
}`;

export const Lichtstrahlen: React.FC = () => {
	const f = useCurrentFrame();
	const on = interpolate(f, [0, 1, 2, 3, 5], [0.15, 0.7, 0.4, 1, 1], {extrapolateRight: 'clamp'});
	return <Shader frag={RAYS} uniforms={{uT: f / FPS, uF: f, uA: on, uB: 0, uC: 0}} />;
};

// ── 25 Sternensprung → 26 Endloszoom ─────────────────────────────────────────
const ZOOM = /* glsl */ `${HEAD}
void main(){
	vec2 p = P();
	float ph = uT; // Zoomphase: je +1 eine Rahmenebene tiefer
	// Ähnlichkeitsabbildung T = Skalierung s mit Drehung a; jedes Quadrat steckt gedreht im vorigen.
	float s = 1.55, a = 0.32;
	float f = fract(ph);
	float scale = pow(s, f) / (0.9*s*s*s); // drei Ebenen außerhalb beginnen, damit das Bild voll ist
	vec2 q = rot(a*f) * p * scale;
	int level = 0;
	for(int i=0;i<26;i++){
		if(max(abs(q.x), abs(q.y)) > 1.) break;
		level = i;
		q = rot(a) * q * s;
		scale *= s;
	}
	// Abstand zum nächst kleineren Quadrat, in Einheiten der aktuellen Ebene
	float dist = (max(abs(q.x), abs(q.y)) - 1.) / s;
	float pxq = px() * scale / s;
	vec3 cols[5];
	cols[0]=vec3(0.98,0.95,0.88); cols[1]=vec3(1.0,0.36,0.3); cols[2]=vec3(0.1,0.12,0.3); cols[3]=vec3(0.2,0.8,0.75); cols[4]=vec3(1.0,0.8,0.25);
	vec3 col = cols[(level - int(floor(ph)) + 100) % 5];
	col *= 0.78 + 0.22*smoothstep(0., 0.25, dist);
	col = mix(vec3(0.04), col, smoothstep(pxq*3., pxq*6., dist));
	fragColor = vec4(srgb(col), 1.);
}`;

type Star = {x: number; y: number; z: number; c: string};
const STARS: Star[] = (() => {
	const r = mulberry(11);
	return Array.from({length: 700}, () => ({
		x: (r() - 0.5) * 2.4,
		y: (r() - 0.5) * 4.2,
		z: 0.15 + r() * 3,
		c: r() < 0.15 ? '#9fd8ff' : r() < 0.25 ? '#ffd0f0' : '#ffffff',
	}));
})();

export const Warp: React.FC = () => {
	const f = useCurrentFrame();
	const speed = interpolate(f, [0, 9, 18], [0.02, 0.55, 0.9], {easing: easeOut});
	const travel = interpolate(f, [0, 9, 18], [0, 1.4, 4], {easing: (x) => x * x});
	const zoomIn = ramp(f, 8, 11);
	const ph = interpolate(f, [8, 18], [0, 2.6], {extrapolateLeft: 'clamp'});
	return (
		<AbsoluteFill style={{background: '#02030a'}}>
			<Canvas2D
				style={{opacity: 1 - zoomIn * 0.85}}
				draw={(ctx) => {
					ctx.fillStyle = '#02030a';
					ctx.fillRect(0, 0, 1080, 1920);
					ctx.lineCap = 'round';
					for (const s of STARS) {
						let z = s.z - travel;
						z = ((z % 3) + 3) % 3 + 0.05;
						const z2 = z + speed;
						const fx = 540 + (s.x / z) * 540;
						const fy = 960 + (s.y / z) * 540;
						const bx = 540 + (s.x / z2) * 540;
						const by = 960 + (s.y / z2) * 540;
						const a = Math.min(1, 1.2 / z);
						ctx.strokeStyle = s.c;
						ctx.globalAlpha = a;
						ctx.lineWidth = Math.max(1.5, 5 / z);
						ctx.beginPath();
						ctx.moveTo(bx, by);
						ctx.lineTo(fx, fy);
						ctx.stroke();
					}
					ctx.globalAlpha = 1;
					// Lichtkern in der Mitte
					const g = ctx.createRadialGradient(540, 960, 0, 540, 960, 420);
					g.addColorStop(0, `rgba(170,200,255,${0.35 * speed + 0.05})`);
					g.addColorStop(1, 'rgba(0,0,0,0)');
					ctx.fillStyle = g;
					ctx.fillRect(0, 0, 1080, 1920);
				}}
			/>
			<AbsoluteFill style={{opacity: zoomIn, transform: `scale(${interpolate(zoomIn, [0, 1], [0.2, 1])})`}}>
				<Shader frag={ZOOM} uniforms={{uT: ph, uF: f, uA: 1, uB: 0, uC: 0}} />
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
