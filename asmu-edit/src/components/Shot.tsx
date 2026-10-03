// Eine Einstellung: Clip (mit Zeitrampe), Standbild, Karte, Rückblick oder Schwarz.
import React from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {GRADE, Shot, STROBE} from '../config';
import {clamp, easeOut} from '../fx';
import {FPS} from '../timing';
import {Karte} from './Karte';
import {Portraet} from './Portraet';
import {sourceTime} from '../rampe';

const fill = (focus: [number, number], filter: string): React.CSSProperties => ({
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	objectPosition: `${focus[0]}% ${focus[1]}%`,
	filter,
});

/** Standbild eines Clips/Bilds (für den Rückblick). */
const Still: React.FC<{src: string; filter: string}> = ({src, filter}) => {
	if (src === 'karte') return <Karte progress={1} still />;
	if (src === 'portraet') return <Portraet t={0} still />;
	if (src.startsWith('bilder/')) return <Img src={staticFile(src)} style={fill([50, 45], filter)} />;
	return <OffthreadVideo src={staticFile(src)} trimBefore={FPS} muted style={fill([50, 50], filter)} />;
};

const Strobe: React.FC = () => {
	const frame = useCurrentFrame();
	const i = Math.floor(frame / 3);
	const src = STROBE[i % STROBE.length];
	// abwechselnd hart und negativ-artig, wie ein Flackern durch die Erinnerung
	const filter = i % 2 ? 'grayscale(1) contrast(1.8) brightness(1.15)' : `${GRADE} contrast(1.4) brightness(1.1)`;
	return (
		<AbsoluteFill style={{transform: `scale(${1.08 + (i % 3) * 0.06})`}}>
			<Still src={src} filter={filter} />
		</AbsoluteFill>
	);
};

export const ShotLayer: React.FC<{shot: Shot}> = ({shot}) => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const dur = shot.to - shot.from;
	const p = Math.min(1, t / dur);

	if (shot.src === 'schwarz') return null;
	if (shot.src === 'strobe') return <Strobe />;
	if (shot.src === 'karte') return <Karte progress={p} />;
	if (shot.src === 'portraet') return <Portraet t={t} />;

	const zoom = shot.zoom ?? [1.05, 1.12];
	const turn = shot.turn ?? [0, 0];
	const drift = shot.drift ?? [0, 0];
	const focus = shot.focus ?? [50, 50];
	// Einstieg: groß und unscharf („zoom“) oder seitlich gewischt („whip“), 7 Frames
	const ein = interpolate(frame, [0, 7], [1, 0], {...clamp, easing: easeOut});
	const enterScale = shot.enter === 'zoom' ? 1 + 0.32 * ein : 1;
	const enterX = shot.enter === 'whip' ? 22 * ein : 0;
	const blur = shot.enter ? (shot.enter === 'zoom' ? 14 : 0) * ein : 0;
	const scale = interpolate(p, [0, 1], zoom) * enterScale;
	const rot = interpolate(p, [0, 1], turn);
	const dy = interpolate(p, [0, 1], drift);
	const filter = (shot.grade ?? GRADE) + (blur > 0.3 ? ` blur(${blur}px)` : '');

	const transform = `translateX(${enterX}%) scale(${scale}) rotate(${rot}deg) translateY(${dy}%)`;
	return (
		<AbsoluteFill style={{transform, filter: shot.enter === 'whip' && ein > 0.02 ? `url(#wisch)` : undefined}}>
			{shot.enter === 'whip' && ein > 0.02 ? (
				<svg width="0" height="0" style={{position: 'absolute'}}>
					<filter id="wisch" x="-20%" y="0" width="140%" height="100%">
						<feGaussianBlur stdDeviation={`${60 * ein} 0`} />
					</filter>
				</svg>
			) : null}
			{shot.src.startsWith('bilder/') ? (
				<Img src={staticFile(shot.src)} style={fill(focus, filter)} />
			) : (
				// Zeitrampe: pro Frame neu einsetzen (Remotion-Rezept „accelerated video“)
				<Sequence from={frame} name="Rampe">
					<OffthreadVideo
						src={staticFile(shot.src)}
						trimBefore={Math.max(0, Math.round(sourceTime(shot, t) * FPS))}
						muted
						style={fill(focus, filter)}
					/>
				</Sequence>
			)}
		</AbsoluteFill>
	);
};
