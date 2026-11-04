import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH} from '../timing';
import {RES} from './quality';

/**
 * Canvas 2D in Logik-Koordinaten 1080×1920; draw() läuft bei jedem Frame neu.
 * `extra` zeichnet neu, wenn sich weitere Werte ändern.
 */
export const Canvas2D: React.FC<{
	draw: (ctx: CanvasRenderingContext2D, frame: number) => void;
	extra?: unknown;
	style?: React.CSSProperties;
}> = ({draw, extra, style}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	const frame = useCurrentFrame();
	const w = Math.round(WIDTH * RES);
	const h = Math.round(HEIGHT * RES);
	useLayoutEffect(() => {
		const ctx = ref.current?.getContext('2d');
		if (!ctx) return;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, w, h);
		ctx.setTransform(RES, 0, 0, RES, 0, 0);
		ctx.globalCompositeOperation = 'source-over';
		ctx.globalAlpha = 1;
		draw(ctx, frame);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [frame, w, h, JSON.stringify(extra ?? null)]);
	return (
		<AbsoluteFill style={style}>
			<canvas ref={ref} width={w} height={h} style={{width: '100%', height: '100%'}} />
		</AbsoluteFill>
	);
};
