// Gemeinsamer GLSL-Kopf (WebGL2 / GLSL ES 3.0). p: Bildkoordinate, y von -1 (unten) bis 1 (oben),
// x von -0.5625 bis 0.5625 (9:16). uv: 0..1.
export const HEAD = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uT;   // Sekunden (je nach Szene global oder lokal)
uniform float uF;   // lokaler Frame der Einstellung
uniform float uA;
uniform float uB;
uniform float uC;
out vec4 fragColor;
#define PI 3.14159265
#define TAU 6.2831853
float h11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}
float h21(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
vec2 h22(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float a=.5,s=0.;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){s+=a*vnoise(p);p=m*p;a*=.5;}return s;}
float fbm3(vec2 p){float a=.5,s=0.;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<3;i++){s+=a*vnoise(p);p=m*p;a*=.5;}return s;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 pal(float t,vec3 a,vec3 b,vec3 c,vec3 d){return a+b*cos(TAU*(c*t+d));}
vec2 P(){return (gl_FragCoord.xy*2.-uRes)/uRes.y;}
float px(){return 2./uRes.y;} // Breite eines Pixels in p-Einheiten
vec3 srgb(vec3 c){return pow(clamp(c,0.,1.),vec3(1./2.2));}
`;
