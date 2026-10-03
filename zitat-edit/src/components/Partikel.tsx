// Regen (feine, schräge Striche) und schwebende helle Teilchen.
// Der Regen lässt ab RUHE_AB nach, passend zum Ton.
import {noise2D} from '@remotion/noise';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {hash} from '../motion';
import {RUHE_AB} from '../timing';
import {HEIGHT, WIDTH} from '../video';

const RAIN = Array.from({length: 130}, (_, i) => ({
	x0: hash(i + 0.11) * WIDTH * 1.4 - WIDTH * 0.3,
	y0: hash(i + 0.37) * (HEIGHT + 300),
	speed: 46 + hash(i + 0.73) * 34,
	len: 34 + hash(i + 0.91) * 60,
	alpha: 0.08 + hash(i + 0.53) * 0.16,
}));

const SPECKS = Array.from({length: 30}, (_, i) => ({
	x0: hash(i + 7.1) * WIDTH,
	y0: hash(i + 7.7) * HEIGHT,
	r: 1.5 + hash(i + 8.3) * 3.5,
	alpha: 0.18 + hash(i + 9.1) * 0.35,
	drift: 0.6 + hash(i + 9.9) * 1.6,
}));

/** Regen fällt schräg: Wind von links */
const SLANT = 0.24;

export const Partikel: React.FC = () => {
	const frame = useCurrentFrame();
	const rain = interpolate(frame, [0, 12, RUHE_AB, RUHE_AB + 70], [0, 1, 1, 0.25], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const span = HEIGHT + 300;

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', filter: 'blur(0.6px)'}}>
				{RAIN.map((d, i) => {
					const t = (d.y0 + d.speed * frame) % span;
					const y = t - 150;
					const x = d.x0 + SLANT * t;
					const k = d.len / Math.hypot(SLANT, 1);
					return (
						<line
							key={i}
							x1={x}
							y1={y}
							x2={x - SLANT * k}
							y2={y - k}
							stroke="rgb(214, 226, 245)"
							strokeWidth={1.6}
							strokeLinecap="round"
							opacity={d.alpha * rain}
						/>
					);
				})}
			</svg>
			<svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', filter: 'blur(1.2px)'}}>
				{SPECKS.map((s, i) => {
					const x = (s.x0 + frame * s.drift * 2.2 + noise2D('sx', i, frame / 70) * 60) % (WIDTH + 40);
					const y = (s.y0 - frame * s.drift * 0.9 + noise2D('sy', i, frame / 70) * 50 + HEIGHT) % HEIGHT;
					return <circle key={i} cx={x} cy={y} r={s.r} fill="#ffffff" opacity={s.alpha} />;
				})}
			</svg>
		</AbsoluteFill>
	);
};
