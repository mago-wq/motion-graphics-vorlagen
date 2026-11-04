import React from 'react';
import {Composition} from 'remotion';
import {Showreel} from './Showreel';
import {DURATION, FPS, HEIGHT, WIDTH} from './timing';

export const RemotionRoot: React.FC = () => (
	<Composition id="StilShowreel" component={Showreel} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
