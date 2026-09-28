// "Jetzt Termin sichern": federt herein und pulsiert danach leicht.
import {Easing, interpolate} from 'remotion';
import {SAFE} from '../video';
import {springFrom, SPRINGS} from '../motion';
import {COLORS, HEADLINE_FONT} from '../theme';
import {fitFontSize} from './FitText';

const PULSE_RISE = 5;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0 → 1 → 0: schnell hoch, weich zurück */
const pulseBump = (frame: number, start: number, length: number): number => {
	if (frame <= start || frame >= start + length) return 0;
	if (frame < start + PULSE_RISE) {
		return interpolate(frame, [start, start + PULSE_RISE], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	}
	return interpolate(frame, [start + PULSE_RISE, start + length], [1, 0], {...clamp, easing: Easing.inOut(Easing.sin)});
};

export const CtaButton: React.FC<{
	label: string;
	frame: number;
	appearAt: number;
	pulses: number[];
	pulseLength: number;
}> = ({label, frame, appearAt, pulses, pulseLength}) => {
	const appear = springFrom(frame, appearAt, SPRINGS.snap);
	const bump = pulses.reduce((sum, start) => sum + pulseBump(frame, start, pulseLength), 0);
	const scale = interpolate(appear, [0, 1], [0.6, 1]) * (1 + 0.045 * bump);
	const fontSize = fitFontSize({
		text: label,
		maxWidth: SAFE.width - 160,
		maxFontSize: 84,
		fontFamily: HEADLINE_FONT,
		letterSpacing: 0.03,
		uppercase: true,
	});

	return (
		<div style={{position: 'relative', opacity: interpolate(appear, [0, 0.4], [0, 1], clamp)}}>
			{/* Ring, der bei jedem Puls nach außen läuft und verblasst */}
			{pulses.map((start) => {
				const p = interpolate(frame, [start, start + pulseLength], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
				const visible = frame > start && frame < start + pulseLength;
				return (
					<div
						key={start}
						style={{
							position: 'absolute',
							inset: 0,
							borderRadius: 14,
							border: `3px solid ${COLORS.accent}`,
							transform: `scale(${1 + 0.1 * p}, ${1 + 0.32 * p})`,
							opacity: visible ? 0.6 * (1 - p) : 0,
						}}
					/>
				);
			})}
			<div
				style={{
					transform: `scale(${scale})`,
					background: COLORS.accent,
					color: COLORS.bg,
					borderRadius: 14,
					padding: '30px 64px 24px',
					fontFamily: HEADLINE_FONT,
					fontSize,
					lineHeight: 1,
					letterSpacing: '0.03em',
					textTransform: 'uppercase',
					whiteSpace: 'nowrap',
				}}
			>
				{label}
			</div>
		</div>
	);
};
