// Pfade der vorhandenen Bilder (aus scripts/index_assets.py). Fehlt ein Bild, liefert img() null
// und die Einstellung zeigt nur ihren dunklen Grund – das Rendern bricht nicht ab.
import assets from './assets.json';

type Entry = {path: string; aspect: number};
const hist = assets.hist as Record<string, Entry>;
const cut = assets.cut as Record<string, Entry>;
const blur = assets.blur as Record<string, Entry>;

export const img = (key: string): string | null => hist[key]?.path ?? null;
export const cutout = (key: string): string | null => cut[key]?.path ?? null;

/** Stark weichgezeichnete Kleinfassung eines Bildes (vorberechnet, statt CSS blur() beim Rendern) */
export const blurredOf = (path: string): string | null => {
	const key = path.split('/').pop()?.replace(/\.[a-z]+$/i, '') ?? '';
	return blur[key]?.path ?? null;
};

/**
 * Bildrahmen (px im 1080×1920-Raster), so dass Punkt (cx, cy) des Bildes (0–1, z. B. das Gesicht)
 * bei (sx, sy) auf dem Schirm liegt und das Bild `width` px breit ist.
 */
export const place = (key: string, cx: number, cy: number, sx: number, sy: number, width: number) => {
	const aspect = hist[key]?.aspect ?? 0.75;
	const h = width / aspect;
	return {x: sx - cx * width, y: sy - cy * h, w: width, h};
};
