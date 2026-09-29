// Szene 7 (30,4–35,2 s): Das letzte Häkchen wird zum Chevron im MFit-Logo
// (das "M" ist selbst ein Häkchen), Rahmen, Dreieck und FIT bauen sich an,
// dann übernimmt das Original-Logo in 3D-Gold. Darunter der MFit-Claim.
import {evolvePath} from '@remotion/paths';
import {interpolate} from 'remotion';
import {config} from '../config';
import {At} from '../components/Layout';
import {Logo, LOGO_H, LOGO_W, type LogoBuild} from '../components/Logo';
import {Line, MaskReveal, TextLine} from '../components/Type';
import {clamp, EASE, impulse, progress} from '../motion';
import {COLORS} from '../theme';
import {ENDE} from '../timing';
import {TYPE_WIDTH} from '../video';

const LOGO_HEIGHT = 520;
const LOGO_CENTER_Y = 640;

/** Häkchen im Logo-Raum (so groß und dort, wo der Chevron sitzen wird) */
const TICK_IN_LOGO: [number, number][] = [
	[147, 227],
	[244, 324],
	[429, 104],
];
/** Mittellinie des Chevrons im Logo; Strichstärke = Armdicke */
const CHEVRON_LINE: [number, number][] = [
	[57, 99],
	[287.5, 329],
	[519, 99],
];
const TICK_STROKE = 48;
const CHEVRON_STROKE = 83.4;

export const EndScene: React.FC<{frame: number}> = ({frame}) => {
	if (frame < ENDE.start - 6) return null;
	const s = ENDE.rahmen;
	// Das Häkchen zeichnet sich schon während der Probetraining-Szene geht, damit kein leeres Bild entsteht
	const tickDraw = progress(frame, s - 5, 9, EASE.inOut);
	const morph = progress(frame, s + 8, 12, EASE.inOut);
	const swap = progress(frame, s + 19, 4);
	const build: LogoBuild = {
		frame: progress(frame, s + 12, 24, EASE.inOut),
		chevron: swap > 0 ? 1 : 0,
		dreieck: progress(frame, s + 18, 10, EASE.out),
		letters: [0, 1, 2].map((i) => progress(frame, s + 22 + i * 4, 10, EASE.out)) as [number, number, number],
		original: progress(frame, ENDE.logo + 26, 8),
		sheen: Math.max(progress(frame, ENDE.claim[0], 20, (t) => t), progress(frame, ENDE.finale, 20, (t) => t)),
	};
	const points = TICK_IN_LOGO.map(([x, y], i) => [
		x + (CHEVRON_LINE[i][0] - x) * morph,
		y + (CHEVRON_LINE[i][1] - y) * morph,
	]);
	const strokePath = `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]} L ${points[2][0]} ${points[2][1]}`;
	const tickDash = tickDraw < 1 ? evolvePath(Math.max(0.0001, tickDraw), strokePath) : null;
	const strokeW = TICK_STROKE + (CHEVRON_STROKE - TICK_STROKE) * morph;
	const logoW = (LOGO_HEIGHT * LOGO_W) / LOGO_H;
	const punch = 1 + 0.05 * impulse(frame, ENDE.finale, 14);
	const settle = interpolate(frame, [ENDE.start, ENDE.still], [0.97, 1], {...clamp, easing: EASE.out});

	return (
		<div style={{position: 'absolute', inset: 0}}>
			<div
				style={{
					position: 'absolute',
					left: 540 - logoW / 2,
					top: LOGO_CENTER_Y - LOGO_HEIGHT / 2,
					width: logoW,
					height: LOGO_HEIGHT,
					transform: `scale(${punch * settle})`,
				}}
			>
				<Logo height={LOGO_HEIGHT} build={build} />
				{swap < 1 ? (
					<svg
						viewBox={`0 0 ${LOGO_W} ${LOGO_H}`}
						width={logoW}
						height={LOGO_HEIGHT}
						style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: 1 - swap}}
					>
						<path
							d={strokePath}
							fill="none"
							stroke="url(#gold-stroke)"
							strokeWidth={strokeW}
							strokeLinejoin="miter"
							strokeMiterlimit={4}
							strokeLinecap={morph > 0.5 ? 'butt' : 'round'}
							strokeDasharray={tickDash?.strokeDasharray}
							strokeDashoffset={tickDash?.strokeDashoffset}
						/>
					</svg>
				) : null}
			</div>
			<At y={1012}>
				<MaskReveal p={progress(frame, ENDE.claim[0], 7)}>
					<Line text={config.claim[0]} maxWidth={TYPE_WIDTH} maxSize={70} />
				</MaskReveal>
			</At>
			<At y={1094}>
				<MaskReveal p={progress(frame, ENDE.claim[1], 7)}>
					<Line text={config.claim[1]} maxWidth={TYPE_WIDTH} maxSize={70} gold />
				</MaskReveal>
			</At>
			<At y={1192}>
				<div style={{opacity: progress(frame, ENDE.kontakt, 10)}}>
					<TextLine
						text={`${config.website}   ·   ${config.instagram}`}
						maxWidth={TYPE_WIDTH}
						maxSize={40}
						weight={600}
						color={COLORS.textMuted}
					/>
				</div>
			</At>
		</div>
	);
};
