// Kontrollbilder: einmal bündeln, dann viele Einzelbilder (schneller als je `remotion still`).
//   node scripts/stills.mjs 20 50 75        Frames (Standard: je Einstellung eines)
// Ergebnis: out/stills/fNNNN.jpg in halber Auflösung.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'AsmuEdit'});
mkdirSync('out/stills', {recursive: true});
for (const frame of frames) {
	const output = `out/stills/f${String(frame).padStart(4, '0')}.jpg`;
	await renderStill({composition, serveUrl, output, frame, scale: 0.5, imageFormat: 'jpeg', jpegQuality: 85});
	process.stdout.write(`${frame} `);
}
console.log('fertig');
