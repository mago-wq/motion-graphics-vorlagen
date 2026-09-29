// Standbilder beliebiger Frames, mit einmaligem Bündeln und einem Browser für alle.
// Aufruf: node scripts/stills.mjs [--safe] [--scale=0.5] [--comp=FigurenVergleich] 0 24 192 ...
// Ohne Frames: Schlüsselmomente aus dem Zeitplan. Ausgabe: out/stills/f0000.png …
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const safe = args.includes('--safe');
const scaleArg = args.find((a) => a.startsWith('--scale='));
const scale = scaleArg ? Number(scaleArg.split('=')[1]) : 1;
const compArg = args.find((a) => a.startsWith('--comp='));
const compId = compArg ? compArg.split('=')[1] : 'MfitReel';
const DEFAULT = [0, 30, 60, 84, 110, 132, 170, 186, 200, 230, 262, 300, 330, 360, 400, 440, 470, 500, 540, 600, 640, 664, 690, 740, 790, 850, 900, 940, 1000, 1055];
const frames = args.filter((a) => /^\d+$/.test(a)).map(Number);
const list = frames.length ? frames : DEFAULT;

const outDir = path.resolve('out/stills');
mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome');
const inputProps = {showSafeZone: safe, withAudio: false};
const composition = await selectComposition({serveUrl, id: compId, inputProps, puppeteerInstance: browser});
for (const frame of list) {
	const output = path.join(outDir, `f${String(frame).padStart(4, '0')}.png`);
	await renderStill({composition, serveUrl, output, frame, inputProps, puppeteerInstance: browser, scale, imageFormat: 'png'});
	console.log('Standbild', frame);
}
await browser.close({silent: true});
