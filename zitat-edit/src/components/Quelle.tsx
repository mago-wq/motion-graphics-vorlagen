// Quellenangabe am Ende, klein und ruhig unter der letzten Tafel.
import {useMemo} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {config} from '../config';
import {softIn} from '../motion';
import {COLORS, FONT, withAlpha} from '../theme';
import {QUELLE_IN, TAFELN} from '../timing';
import {SAFE} from '../video';
import {FitText} from './FitText';
import {layout} from './Tafeln';

export const Quelle: React.FC = () => {
	const frame = useCurrentFrame();
	const p = softIn(frame, QUELLE_IN, 24);
	const top = useMemo(() => {
		const zeilen = layout(TAFELN[TAFELN.length - 1]);
		const last = zeilen[zeilen.length - 1];
		return Math.min(SAFE.bottom - 110, last.y + last.size + 70);
	}, []);
	if (p <= 0) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE.left,
				width: SAFE.width,
				top,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 18,
				opacity: p,
				transform: `translateY(${interpolate(p, [0, 1], [14, 0])}px)`,
			}}
		>
			<div style={{width: 64 * p, height: 2, background: withAlpha(COLORS.text, 0.6)}} />
			<FitText
				text={config.quelle}
				maxWidth={SAFE.width * 0.9}
				maxFontSize={40}
				fontFamily={FONT}
				fontWeight={600}
				letterSpacing={0.06}
				style={{color: withAlpha(COLORS.text, 0.92), textShadow: '0 2px 14px rgba(0, 0, 0, 0.85), 0 0 3px rgba(0, 0, 0, 0.6)'}}
			/>
		</div>
	);
};
