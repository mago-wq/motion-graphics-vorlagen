#!/usr/bin/env node
// Baut aus dem Roh-Nasheed die Edit-Tonspur (public/audio/nasheed-edit.wav):
//   1. Intro laut, Stimmen mit Bass angehoben
//   2. leise, dumpf (Tiefpass) und mit Bergecho – die "alte Zeit"
//   3. ein halber Beat Stille vor dem Drop
//   4. Drop: laut, Bass angehoben, zusätzliche Schläge auf den Titel-Beats
//   5. am Ende ausblenden
// Alle Zeiten kommen aus src/audio.json und src/config.ts (Beats), genau wie im Bild.
// Braucht ein vollständiges ffmpeg (System-ffmpeg); Remotions eingebautes ffmpeg hat
// weder `bass` noch `lowpass`.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const audio = JSON.parse(readFileSync(join(root, 'src/audio.json'), 'utf8'));
const config = readFileSync(join(root, 'src/config.ts'), 'utf8');

// Gesamtlänge in Beats aus config.ts lesen (Summe aller `beats:` + END_BEATS)
const shotsBlock = config.slice(config.indexOf('export const SHOTS'), config.indexOf('];', config.indexOf('export const SHOTS')));
const totalBeats = [...shotsBlock.matchAll(/beats:\s*(\d+(?:\.\d+)?)/g)].reduce((s, m) => s + Number(m[1]), 0);
const endBeats = Number(/END_BEATS\s*=\s*(\d+)/.exec(config)[1]);

const beat = 60 / audio.bpm;
const t = (b) => audio.firstBeat + b * beat;
const d = audio.dynamics;
const length = Math.round(t(totalBeats + endBeats) * 30) / 30;

const quietFrom = t(d.loudIntroUntilBeat);
const gapFrom = t(d.quietUntilBeat - d.gapBeforeDropBeats);
const dropAt = t(d.quietUntilBeat);
const ramp = 0.03; // 30 ms Rampen gegen Knackser

const f = (x) => x.toFixed(3);
// 0..1-Rampen als ffmpeg-Ausdrücke
const rise = (at) => `clip((t-${f(at - ramp)})/${ramp},0,1)`;
const fall = (at) => `(1-clip((t-${f(at)})/${ramp},0,1))`;

// Laute Kette: an bis quietFrom, ab dropAt wieder an
const loudGate = `(${fall(quietFrom)}+${rise(dropAt)})`;
// Leise Kette: an von quietFrom bis gapFrom
const quietGate = `(${rise(quietFrom + ramp)}*${fall(gapFrom)})`;

// Bass-Schläge: auf jedem Titel-Beat kurz lauter, über einen Viertel-Beat abklingend
const punchGain = 10 ** (d.punchGainDb / 20) - 1;
const punchLen = beat * 0.75;
const punch = d.punchBeats.map((b) => `between(t,${f(t(b))},${f(t(b) + punchLen)})*(1-(t-${f(t(b))})/${f(punchLen)})`).join('+');

const graph = [
	`[0:a]atrim=0:${f(length)},asetnsamples=n=128,asplit=2[l][q]`,
	`[l]bass=g=${d.bassGainDb}:f=${d.bassFreqHz}:w=0.7,volume='${loudGate}*(1+${f(punchGain)}*(${punch}))':eval=frame[lo]`,
	`[q]lowpass=f=${d.quietLowpassHz},aecho=0.8:0.8:${d.echoMs.join("|")}:0.45|0.3,volume='${d.quietVolume}*${quietGate}':eval=frame[qo]`,
	`[lo][qo]amix=inputs=2:normalize=0,alimiter=limit=0.95:level=false,afade=t=out:st=${f(length - d.fadeOutSeconds)}:d=${d.fadeOutSeconds}[out]`,
].join(';');

const src = join(root, 'public', audio.source);
const out = join(root, 'public', audio.output);
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-filter_complex', graph, '-map', '[out]', '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le', out], {stdio: 'inherit'});
console.log(`Fertig: public/${audio.output} (${length.toFixed(2)} s, ${totalBeats} Beats Bild + ${endBeats} Beats Abspann)`);
