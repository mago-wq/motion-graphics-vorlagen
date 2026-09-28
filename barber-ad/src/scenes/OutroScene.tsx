// Szene 5 (12,0–15,0 s): Abschluss mit Name, Adresse, Instagram und Termin-Button.
// Ab STILL_FROM (letzte halbe Sekunde) bewegt sich nichts mehr.
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {CtaButton} from '../components/CtaButton';
import {FitText, fitFontSize} from '../components/FitText';
import {Icon} from '../components/Icons';
import {MaskReveal} from '../components/MaskReveal';
import {SafeArea} from '../components/SafeArea';
import {config} from '../config';
import {softIn} from '../motion';
import {BODY_FONT, COLORS, HEADLINE_FONT} from '../theme';
import {OUTRO, SCENES} from '../timing';
import {SAFE} from '../video';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const InfoRow: React.FC<{icon: 'pin' | 'kamera'; text: string; progress: number; strong?: boolean}> = ({
	icon,
	text,
	progress,
	strong = false,
}) => {
	const fontWeight = strong ? 600 : 500;
	const iconSize = strong ? 54 : 50;
	const fontSize = fitFontSize({
		text,
		maxWidth: SAFE.width - iconSize - 18,
		maxFontSize: strong ? 50 : 44,
		fontFamily: BODY_FONT,
		fontWeight,
	});
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 18,
				opacity: progress,
				transform: `translateY(${(1 - progress) * 26}px)`,
			}}
		>
			<Icon name={icon} size={iconSize} strokeWidth={6.5} />
			<div
				style={{
					fontFamily: BODY_FONT,
					fontSize,
					fontWeight,
					lineHeight: 1.1,
					color: strong ? COLORS.text : COLORS.textMuted,
					whiteSpace: 'nowrap',
				}}
			>
				{text}
			</div>
		</div>
	);
};

export const OutroScene: React.FC = () => {
	const frame = useCurrentFrame() + SCENES.abschluss.from;

	const icon = interpolate(frame, [OUTRO.iconIn, OUTRO.iconIn + 18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const name = softIn(frame, OUTRO.nameIn, 18);
	const rule = softIn(frame, OUTRO.ruleIn, 16);
	const address = softIn(frame, OUTRO.addressIn, 16);
	const insta = softIn(frame, OUTRO.instaIn, 16);

	return (
		<AbsoluteFill>
			<SafeArea>
				<Icon name="schere" size={96} progress={icon} strokeWidth={4.2} />
				<div style={{height: 36}} />
				<MaskReveal progress={name}>
					<FitText
						text={config.name}
						maxWidth={SAFE.width}
						maxFontSize={220}
						fontFamily={HEADLINE_FONT}
						letterSpacing={0.01}
						uppercase
						style={{color: COLORS.text}}
					/>
				</MaskReveal>
				<div style={{height: 30}} />
				<div
					style={{
						width: 150,
						height: 5,
						borderRadius: 3,
						background: COLORS.accent,
						transform: `scaleX(${rule})`,
					}}
				/>
				<div style={{height: 60}} />
				<InfoRow icon="pin" text={config.adresse} progress={address} />
				<div style={{height: 24}} />
				<InfoRow icon="kamera" text={config.instagram} progress={insta} strong />
				<div style={{height: 100}} />
				<CtaButton
					label={config.texte.button}
					frame={frame}
					appearAt={OUTRO.buttonIn}
					pulses={OUTRO.pulses}
					pulseLength={OUTRO.pulseLength}
				/>
			</SafeArea>
		</AbsoluteFill>
	);
};
