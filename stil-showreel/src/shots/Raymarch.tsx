import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {HEAD} from '../lib/glsl';
import {Shader} from '../lib/gl';
import {pop} from '../lib/motion';
import {FPS, KNETE_LAND, shot} from '../timing';

// ── 12 Knete 3D / 13 Cel-Shading: dieselbe SDF-Szene, zwei Arten zu schattieren ─
// uA: Modus (0 Knete, 1 Cel), uLand: Landefortschritt der drei Formen, uT: Zeit.
const CLAY = /* glsl */ `${HEAD}
uniform vec3 uLand; // Federwerte 0..1 der drei Formen
float sdBox(vec3 p, vec3 b, float r){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}
float sdTorus(vec3 p, vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
vec3 objPos(int i){
	float l = i==0 ? uLand.x : (i==1 ? uLand.y : uLand.z);
	float drop = (1.-l) * 3.2;
	if(i==0) return vec3(-0.42, 0.55 + drop, 0.15);
	if(i==1) return vec3(0.38, 0.05 + drop, -0.25);
	return vec3(-0.05, -0.62 + drop, 0.45);
}
vec2 map(vec3 p){
	float t = uT;
	vec3 q0 = p - objPos(0);
	q0.y /= 1. - 0.12*sin(t*9.);
	float d0 = length(q0) - 0.36;
	vec3 q1 = p - objPos(1);
	q1.xz *= rot(t*1.6);
	q1.xy *= rot(0.35);
	float d1 = sdBox(q1, vec3(0.2), 0.1);
	vec3 q2 = p - objPos(2);
	q2.yz *= rot(1.1 + sin(t*2.)*0.2);
	q2.xy *= rot(t*1.2);
	float d2 = sdTorus(q2, vec2(0.25, 0.1));
	float fl = p.y + 1.15;
	vec2 r = vec2(d0, 1.);
	if(d1 < r.x) r = vec2(d1, 2.);
	if(d2 < r.x) r = vec2(d2, 3.);
	if(fl < r.x) r = vec2(fl, 0.);
	// Knete: leichte Fingerabdruck-Dellen
	if(uA < 0.5 && r.y > 0.5) r.x += 0.006 * vnoise(p.xy*38.) - 0.003;
	return r;
}
vec3 nrm(vec3 p){vec2 e=vec2(0.002,0.);return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x));}
float shadow(vec3 ro, vec3 rd){float res=1.,t=0.02;for(int i=0;i<40;i++){float h=map(ro+rd*t).x;res=min(res,10.*h/t);t+=clamp(h,0.02,0.2);if(res<0.001||t>4.)break;}return clamp(res,0.,1.);}
float ao(vec3 p, vec3 n){float o=0.,s=1.;for(int i=1;i<=5;i++){float h=0.04*float(i);o+=(h-map(p+n*h).x)*s;s*=.7;}return clamp(1.-3.*o,0.,1.);}
vec3 matCol(float id, bool cel){
	if(id < .5) return cel ? vec3(0.35,0.82,1.0) : vec3(0.96,0.91,0.86);
	if(id < 1.5) return cel ? vec3(1.0,0.32,0.48) : vec3(0.98,0.55,0.62);
	if(id < 2.5) return cel ? vec3(0.22,0.45,1.0) : vec3(0.45,0.68,0.98);
	return cel ? vec3(1.0,0.82,0.12) : vec3(1.0,0.83,0.35);
}
void main(){
	vec2 p = P();
	bool cel = uA > 0.5;
	vec3 ro = vec3(0., 0.3, 3.35);
	vec3 ta = vec3(0., -0.12, 0.);
	vec3 ww = normalize(ta-ro), uu = normalize(cross(ww, vec3(0,1,0))), vv = cross(uu, ww);
	vec3 rd = normalize(p.x*uu + p.y*vv + 1.95*ww);
	float t = 0.; vec2 h; float minD = 1e9; float tMin = 0.;
	for(int i=0;i<110;i++){
		h = map(ro+rd*t);
		if(h.y > 0.5 && h.x < minD){minD = h.x; tMin = t;}
		if(h.x < 0.0008 || t > 12.) break;
		t += h.x * 0.9;
	}
	vec3 bg = cel ? vec3(0.35,0.82,1.0) : mix(vec3(0.98,0.95,0.92), vec3(0.93,0.88,0.84), -p.y*.5+.5);
	vec3 col = bg;
	vec3 L = normalize(vec3(-0.6, 0.9, 0.5));
	if(t < 12.){
		vec3 pos = ro + rd*t;
		vec3 n = nrm(pos);
		float dif = max(dot(n, L), 0.);
		float sh = shadow(pos + n*0.003, L);
		vec3 base = matCol(h.y, cel);
		if(!cel){
			float a = ao(pos, n);
			float wrap = clamp((dot(n,L)+0.4)/1.4, 0., 1.);
			col = base * (0.42*a + 0.75*wrap*mix(0.45,1.,sh));
			col += base * vec3(1.,0.6,0.5) * pow(clamp(1.+dot(rd,n),0.,1.),3.) * 0.35 * float(h.y>0.5);
			col += 0.12 * pow(max(dot(reflect(rd,n),L),0.), 12.) * float(h.y>0.5);
			if(h.y < .5) col = bg * mix(0.62, 1., sh) * mix(0.75, 1., a);
		} else {
			float lit = dif * sh;
			float band = lit > 0.55 ? 1. : (lit > 0.18 ? 0.72 : 0.45);
			col = base * band;
			float spec = pow(max(dot(reflect(rd,n),L),0.), 30.);
			if(spec > 0.5 && h.y > 0.5) col = vec3(1.);
			if(h.y < .5) col = bg * (sh > 0.5 ? 1. : 0.7);
			// Umriss: Silhouette über Blickwinkel
			if(h.y > 0.5 && dot(n, -rd) < 0.28) col = vec3(0.05);
		}
	}
	// Umriss außen: Strahl knapp am Objekt vorbei
	if(cel && (t >= 12. || h.y < 0.5) && minD < 0.018 && tMin < t) col = vec3(0.05);
	if(cel){
		// Halbtonpunkte im Hintergrund oben
		vec2 g = gl_FragCoord.xy / uRes.y * 60.;
		float dots = smoothstep(0.32, 0.28, length(fract(g)-.5)) * smoothstep(0.2, 1., p.y);
		if(t >= 12.) col = mix(col, vec3(1.), dots*0.25);
	}
	fragColor = vec4(srgb(col), 1.);
}`;

const useLand = (f: number) =>
	KNETE_LAND.map((l) => pop(f, l - 2, {damping: 10, stiffness: 380, mass: 0.5}));

export const Knete: React.FC = () => {
	const f = useCurrentFrame();
	const land = useLand(f);
	return <Shader frag={CLAY} uniforms={{uT: f / FPS, uF: f, uA: 0, uLand: land}} />;
};

export const Cel: React.FC = () => {
	const f = useCurrentFrame();
	const g = shot('cel').from - shot('knete').from + f;
	return <Shader frag={CLAY} uniforms={{uT: g / FPS, uF: f, uA: 1, uLand: [1, 1, 1]}} />;
};

// ── 14 Raymarching: Flug durch einen goldenen Gyroid-Tunnel ──────────────────
const GYROID = /* glsl */ `${HEAD}
float gyroid(vec3 p, float s){p*=s;return abs(dot(sin(p),cos(p.zxy)))/s;}
// Gyroid mit ausgeschnittener, geschwungener Röhre für die Kamera.
float map(vec3 q){
	float tube = length(q.xy - vec2(sin(q.z*0.4)*0.3, cos(q.z*0.3)*0.2)) - 0.42;
	return max(gyroid(q, 3.2) - 0.03, -tube);
}
void main(){
	vec2 p = P();
	float t = uT;
	vec3 ro = vec3(sin(t*0.4)*0.3, cos(t*0.3)*0.2, t*0.6 + uF*0.2);
	vec3 rd = normalize(vec3(p*rot(t*0.3 + uF*0.05), 1.25));
	float d = 0., h;
	int i;
	float glow = 0.;
	for(i=0;i<90;i++){
		vec3 q = ro + rd*d;
		h = map(q);
		glow += 0.012/(0.02+abs(h));
		if(h < 0.001 || d > 9.) break;
		d += h*0.8;
	}
	vec3 col = vec3(0.02,0.03,0.08);
	if(d < 9.){
		vec3 q = ro + rd*d;
		vec2 e = vec2(0.003, 0.);
		vec3 n = normalize(vec3(map(q+e.xyy)-map(q-e.xyy), map(q+e.yxy)-map(q-e.yxy), map(q+e.yyx)-map(q-e.yyx)));
		vec3 L = normalize(vec3(0.3, 0.6, -0.7));
		float dif = max(dot(n, L), 0.);
		float fres = pow(1. - max(dot(n, -rd), 0.), 3.);
		vec3 gold = vec3(1.0, 0.72, 0.28);
		vec3 refl = reflect(rd, n);
		vec3 env = mix(vec3(0.1,0.12,0.35), vec3(1.,0.9,0.7), smoothstep(-0.2, 0.8, refl.y));
		col = gold * (0.15 + 0.7*dif) + env * gold * (0.35 + fres) * 0.8;
		col += pow(max(dot(refl, L), 0.), 24.) * vec3(1., 0.95, 0.8);
		col = mix(col, vec3(0.02,0.03,0.1), smoothstep(2., 8.5, d));
	}
	col += vec3(0.25, 0.4, 1.0) * glow * 0.012;
	col *= 1. - 0.4*dot(p*0.6, p*0.6);
	fragColor = vec4(srgb(col), 1.);
}`;

export const Raymarch: React.FC = () => {
	const f = useCurrentFrame();
	return <Shader frag={GYROID} uniforms={{uT: 1.5 + f / FPS, uF: f, uA: 0, uB: 0, uC: 0}} />;
};

// ── 15 Flüssig-Morph / 16 Holografie: schillernde Metaballs ──────────────────
const HOLO = /* glsl */ `${HEAD}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float map(vec3 p){
	float t = uT;
	float d = 1e9;
	for(int i=0;i<5;i++){
		float fi = float(i);
		vec3 c = vec3(sin(t*1.7+fi*1.3)*0.38, cos(t*1.3+fi*2.1)*0.55, sin(t*1.1+fi*0.7)*0.25);
		float r = 0.28 + 0.06*sin(t*2.+fi);
		d = smin(d, length(p-c)-r, 0.32);
	}
	return d;
}
vec3 nrm(vec3 p){vec2 e=vec2(0.002,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
void main(){
	vec2 p = P();
	vec3 ro = vec3(0., 0., 3.4);
	vec3 rd = normalize(vec3(p, -1.9));
	float t = 0.;
	float h;
	for(int i=0;i<90;i++){h = map(ro+rd*t); if(h<0.001||t>8.) break; t+=h;}
	vec3 bg = mix(vec3(0.93,0.93,1.0), vec3(0.98,0.95,1.0), p.y*.5+.5);
	// weicher Schatten am Boden
	bg *= 1. - 0.12*exp(-dot((p-vec2(0.,-0.95))*vec2(1.6,6.),(p-vec2(0.,-0.95))*vec2(1.6,6.)));
	vec3 col = bg;
	if(t < 8.){
		vec3 pos = ro + rd*t;
		vec3 n = nrm(pos);
		float ndv = max(dot(n, -rd), 0.);
		vec3 r = reflect(rd, n);
		// Dünnschicht-Interferenz: Farbe hängt vom Blickwinkel ab
		float film = (1.-ndv)*1.6 + r.y*0.4 + uT*0.35 + pos.y*0.3;
		vec3 irid = pal(film, vec3(0.6), vec3(0.45), vec3(1.), vec3(0.0,0.33,0.67));
		// Studio-Umgebung mit dunklem Boden und hellem Himmel: gibt dem Chrom Kontrast
		vec3 env = mix(vec3(0.12,0.13,0.18), vec3(1.), smoothstep(-0.05,0.3,r.y));
		env += vec3(0.6,0.65,0.8)*smoothstep(0.02,0.,abs(r.y-0.0));
		col = mix(env*0.9, irid, uA) ;
		col = mix(col, irid*1.1, 0.55*pow(1.-ndv, 1.2)*uA + 0.25*uA);
		float spec = pow(max(dot(r, normalize(vec3(-0.4,0.7,0.6))),0.), 40.);
		col += spec*1.2;
		col += 0.15*pow(1.-ndv, 3.);
		// Chrom ohne Holo: kühler Spiegel
		col = mix(env + spec, col, uA);
	}
	fragColor = vec4(srgb(col), 1.);
}`;

export const Holo: React.FC = () => {
	const f = useCurrentFrame();
	// Ab Frame 6 schillert der Chrom-Tropfen holografisch.
	const holo = Math.min(1, Math.max(0, (f - 5) / 3));
	return (
		<AbsoluteFill>
			<Shader frag={HOLO} uniforms={{uT: 0.6 + f / FPS * 1.6, uF: f, uA: holo, uB: 0, uC: 0}} />
		</AbsoluteFill>
	);
};
