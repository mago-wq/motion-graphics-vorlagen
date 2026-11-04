import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {HEIGHT, WIDTH} from '../timing';
import {RES} from './quality';

export type Uniforms = Record<string, number | number[]>;

const VERT = `#version 300 es
in vec2 pos;
void main(){gl_Position=vec4(pos,0.,1.);}`;

type Prog = {gl: WebGL2RenderingContext; prog: WebGLProgram; loc: Map<string, WebGLUniformLocation | null>};

const compile = (gl: WebGL2RenderingContext, type: number, src: string) => {
	const sh = gl.createShader(type)!;
	gl.shaderSource(sh, src);
	gl.compileShader(sh);
	if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(sh);
		throw new Error(`Shader-Fehler: ${log}\n${src.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n')}`);
	}
	return sh;
};

/** Legt WebGL2 auf dem Canvas an und kompiliert den Fragment-Shader. */
export const createProg = (canvas: HTMLCanvasElement | OffscreenCanvas, frag: string): Prog => {
	const gl = (canvas as HTMLCanvasElement).getContext('webgl2', {
		preserveDrawingBuffer: true,
		antialias: false,
		premultipliedAlpha: false,
	}) as WebGL2RenderingContext | null;
	if (!gl) throw new Error('WebGL2 nicht verfügbar');
	const prog = gl.createProgram()!;
	gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
	gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, frag));
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`Link-Fehler: ${gl.getProgramInfoLog(prog)}`);
	gl.useProgram(prog);
	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const posLoc = gl.getAttribLocation(prog, 'pos');
	gl.enableVertexAttribArray(posLoc);
	gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
	return {gl, prog, loc: new Map()};
};

export const drawProg = (p: Prog, w: number, h: number, u: Uniforms) => {
	const {gl, prog, loc} = p;
	gl.viewport(0, 0, w, h);
	const set = (name: string, v: number | number[]) => {
		if (!loc.has(name)) loc.set(name, gl.getUniformLocation(prog, name));
		const l = loc.get(name);
		if (!l) return;
		if (typeof v === 'number') gl.uniform1f(l, v);
		else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
		else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
		else gl.uniform4f(l, v[0], v[1], v[2], v[3]);
	};
	set('uRes', [w, h]);
	for (const [k, v] of Object.entries(u)) set(k, v);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	gl.finish();
};

/**
 * Vollbild-Fragment-Shader. `pixel` setzt die Rechenbreite fest (z. B. 90 für Pixel-Art,
 * angezeigt mit image-rendering: pixelated), sonst WIDTH·RES.
 */
export const Shader: React.FC<{
	frag: string;
	uniforms: Uniforms;
	pixel?: number;
	style?: React.CSSProperties;
}> = ({frag, uniforms, pixel, style}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	const progRef = useRef<Prog | null>(null);
	const w = pixel ? pixel : Math.round(WIDTH * RES);
	const h = pixel ? Math.round((pixel * HEIGHT) / WIDTH) : Math.round(HEIGHT * RES);
	const key = JSON.stringify(uniforms);
	useLayoutEffect(() => {
		if (!ref.current) return;
		if (!progRef.current) progRef.current = createProg(ref.current, frag);
		drawProg(progRef.current, w, h, uniforms);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, w, h, frag]);
	return (
		<AbsoluteFill style={style}>
			<canvas
				ref={ref}
				width={w}
				height={h}
				style={{width: '100%', height: '100%', imageRendering: pixel ? 'pixelated' : 'auto'}}
			/>
		</AbsoluteFill>
	);
};

/** Shader, der unsichtbar in kleiner Auflösung rechnet und die Pixel zurückgibt (ASCII, Matrix). */
export const useShaderPixels = (frag: string, w: number, h: number) => {
	const state = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		return {c, prog: null as Prog | null, buf: new Uint8Array(w * h * 4)};
	}, [w, h]);
	return (u: Uniforms) => {
		if (!state.prog) state.prog = createProg(state.c, frag);
		drawProg(state.prog, w, h, u);
		state.prog.gl.readPixels(0, 0, w, h, state.prog.gl.RGBA, state.prog.gl.UNSIGNED_BYTE, state.buf);
		return state.buf; // Zeile 0 = unten
	};
};
