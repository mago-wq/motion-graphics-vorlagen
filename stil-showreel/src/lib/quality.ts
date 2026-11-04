import {getInputProps} from 'remotion';

/**
 * Auflösungsfaktor für Canvas und Shader. Entwurf: --props='{"res":0.5}' zusammen mit --scale=0.5,
 * dann rechnen Shader nur 540×960 Pixel. Endrender: res 1 (1080×1920) oder 2 mit --scale=2 (4K).
 */
export const RES: number = Number((getInputProps() as {res?: number}).res ?? 1);
