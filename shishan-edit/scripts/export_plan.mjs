// Gibt den Schnittplan (src/plan.ts) als JSON aus – build_audio.py setzt die Geräusche danach,
// damit jedes Geräusch genau auf der Einstellung liegt, in der man sein Motiv sieht.
import {build} from 'esbuild';
const res = await build({
	stdin: {contents: "import {buildPlan} from './src/plan'; const p = buildPlan(); console.log(JSON.stringify({shots: p.shots, tops: p.tops, flashes: p.flashes}));", resolveDir: process.cwd(), loader: 'ts'},
	bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'error',
});
await import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
