// Text schiebt sich aus einer unsichtbaren Kante nach oben ins Bild.
import type {CSSProperties} from 'react';

/** Zusätzlicher Rand der Maske, damit Umlaute und Unterlängen nicht abgeschnitten werden */
const BLEED = 24;

export const MaskReveal: React.FC<{progress: number; children: React.ReactNode; style?: CSSProperties}> = ({
	progress,
	children,
	style,
}) => (
	<div style={{overflow: 'hidden', padding: `${BLEED}px 0`, margin: `-${BLEED}px 0`, ...style}}>
		<div
			style={{
				transform: `translateY(calc(${(1 - progress) * 110}% + ${(1 - progress) * BLEED}px))`,
				opacity: progress > 0 ? 1 : 0,
			}}
		>
			{children}
		</div>
	</div>
);
