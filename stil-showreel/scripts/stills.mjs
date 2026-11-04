// Standbilder einzelner Frames mit einem einzigen Bundle (schneller als mehrfach "remotion still").
// Aufruf: node scripts/stills.mjs 10 28 42 ...   [--res=0.5]  → out/stills/f<frame>.png
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const args = process.argv.slice(2);
const res = Number((args.find((a) => a.startsWith('--res=')) ?? '--res=0.5').split('=')[1]);
const frames = args.filter((a) => !a.startsWith('--')).map(Number);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'out', 'stills');
fs.mkdirSync(out, {recursive: true});

const serveUrl = await bundle({entryPoint: path.join(root, 'src', 'index.ts')});
const inputProps = {res};
const chromiumOptions = {gl: 'swangle'};
const composition = await selectComposition({serveUrl, id: 'StilShowreel', inputProps, chromiumOptions});
for (const frame of frames) {
	const output = path.join(out, `f${String(frame).padStart(3, '0')}.png`);
	const t0 = Date.now();
	await renderStill({composition, serveUrl, output, frame, inputProps, chromiumOptions, scale: res, imageFormat: 'png'});
	console.log(`${output} (${Date.now() - t0} ms)`);
}
