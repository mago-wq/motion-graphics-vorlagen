// Eigener Einstieg für den Posen-Prüfstand: npx remotion still src/lab-index.ts PoseLab out/poselab.png
import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {createElement} from 'react';
import {PoseLab} from './PoseLab';

registerRoot(() => createElement(Composition, {id: 'PoseLab', component: PoseLab, durationInFrames: 1, fps: 30, width: 1920, height: 1080}));
