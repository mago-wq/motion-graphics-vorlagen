// Kopfzeile ab dem Drop: kleines MFit-Zeichen oben mittig. Ab hier ist die Marke
// durchgehend im Bild, bis die Endcard das große Logo übernimmt.
import {interpolate} from 'remotion';
import {clamp, EASE, exitProgress, progress} from '../motion';
import {ENDE, HEADER_IN, ITEMS, PREIS} from '../timing';
import {LogoMark} from './Logo';

export const HEADER = {top: 276, height: 92};

export const Header: React.FC<{frame: number}> = ({frame}) => {
	if (frame < HEADER_IN || frame >= ENDE.start) return null;
	const p = progress(frame, HEADER_IN, 10, EASE.out);
	const out = exitProgress(frame, ENDE.start, 7);
	const sheen = Math.max(progress(frame, ITEMS[0].start + 2, 18, (t) => t), progress(frame, PREIS.slam + 4, 18, (t) => t));
	return (
		<div
			style={{
				position: 'absolute',
				top: HEADER.top,
				left: 0,
				width: 1080,
				display: 'flex',
				justifyContent: 'center',
				opacity: interpolate(p, [0, 0.6], [0, 1], clamp) * (1 - out),
				transform: `translateY(${(1 - p) * -24 - out * 30}px) scale(${0.9 + 0.1 * p})`,
			}}
		>
			<LogoMark height={HEADER.height} sheen={sheen} />
		</div>
	);
};
