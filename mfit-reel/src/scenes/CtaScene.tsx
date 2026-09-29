// Szene 6 (25,6–30,4 s): Risiko raus. "NOCH UNSICHER? PROBIER'S EINFACH."
// → "KOSTENLOSES PROBETRAINING" mit drei Häkchen → wo man es bekommt + Wellpass/Hansefit.
import {interpolate} from 'remotion';
import {config} from '../config';
import {TICK_PATH} from '../components/Glyphs';
import {At, AtLeft} from '../components/Layout';
import {Stroke} from '../components/Pictograms';
import {fitSize, Line, MaskReveal, TextLine} from '../components/Type';
import {clamp, EASE, progress} from '../motion';
import {COLORS, DISPLAY_FONT, TEXT_FONT} from '../theme';
import {CTA, ENDE} from '../timing';
import {TYPE_WIDTH} from '../video';

export const CtaScene: React.FC<{frame: number}> = ({frame}) => {
	if (frame < CTA.start - 5 || frame >= ENDE.start + 2) return null;
	const pt = config.probetraining;
	const partOneOut = progress(frame, CTA.titel - 9, 5, EASE.inOut);
	const bulletsOut = progress(frame, CTA.aufruf - 4, 6, EASE.exit);
	const out = progress(frame, ENDE.start - 10, 6, EASE.inOut);
	const titleShift = interpolate(progress(frame, CTA.aufruf - 4, 10, EASE.inOut), [0, 1], [0, -40]);
	const bulletSize = Math.min(
		...pt.punkte.map((p) => fitSize({text: p, maxWidth: 1000 - 300 - 20, maxSize: 46, font: TEXT_FONT, weight: 600, uppercase: false})),
	);
	const url = progress(frame, CTA.aufruf + 2, 8);
	const underline = progress(frame, CTA.aufruf + 8, 10, EASE.inOut);

	return (
		<div style={{position: 'absolute', inset: 0, transform: `translateY(${-out * 100}px)`, opacity: 1 - out}}>
			{partOneOut < 1 ? (
				<>
					<At y={720}>
						<MaskReveal p={progress(frame, CTA.frage - 3, 7)} out={partOneOut}>
							<Line text={pt.frage} maxWidth={TYPE_WIDTH} maxSize={112} />
						</MaskReveal>
					</At>
					<At y={852}>
						<MaskReveal p={progress(frame, CTA.antwort - 3, 7)} out={partOneOut}>
							<Line text={pt.antwort} maxWidth={TYPE_WIDTH} maxSize={112} gold />
						</MaskReveal>
					</At>
				</>
			) : null}
			{frame >= CTA.titel - 4 ? (
				<div style={{position: 'absolute', inset: 0, transform: `translateY(${titleShift}px)`}}>
					<At y={574}>
						<MaskReveal p={progress(frame, CTA.titel - 4, 7)}>
							<Line text={pt.titel[0]} maxWidth={TYPE_WIDTH} maxSize={104} />
						</MaskReveal>
					</At>
					<At y={690}>
						<MaskReveal p={progress(frame, CTA.titel - 2, 7)}>
							<Line text={pt.titel[1]} maxWidth={TYPE_WIDTH} maxSize={120} gold />
						</MaskReveal>
					</At>
				</div>
			) : null}
			{frame >= CTA.punkte[0] - 1 && bulletsOut < 1
				? pt.punkte.map((text, i) => {
						const p = progress(frame, CTA.punkte[i], 8);
						const y = 850 + i * 84;
						return (
							<div key={text} style={{position: 'absolute', inset: 0, opacity: 1 - bulletsOut, transform: `translateY(${-bulletsOut * 30}px)`}}>
								<AtLeft x={228} y={y}>
									<svg viewBox="0 0 100 100" width={50} height={50} style={{overflow: 'visible'}}>
										<Stroke d={TICK_PATH} draw={progress(frame, CTA.punkte[i], 7, EASE.inOut)} width={12} />
									</svg>
								</AtLeft>
								<AtLeft x={300} y={y}>
									<div
										style={{
											fontFamily: TEXT_FONT,
											fontWeight: 600,
											fontSize: bulletSize,
											lineHeight: 1,
											color: COLORS.text,
											whiteSpace: 'nowrap',
											opacity: interpolate(p, [0, 0.5], [0, 1], clamp),
											transform: `translateX(${(1 - p) * -24}px)`,
										}}
									>
										{text}
									</div>
								</AtLeft>
							</div>
						);
					})
				: null}
			{frame >= CTA.aufruf - 1 ? (
				<>
					<At y={868}>
						<MaskReveal p={progress(frame, CTA.aufruf, 7)}>
							<TextLine text={pt.aufruf} maxWidth={TYPE_WIDTH} maxSize={44} weight={500} color={COLORS.textMuted} />
						</MaskReveal>
					</At>
					<At y={968}>
						<div style={{position: 'relative'}}>
							<MaskReveal p={url}>
								<Line text={config.website} maxWidth={TYPE_WIDTH} maxSize={104} gold uppercase={false} font={DISPLAY_FONT} />
							</MaskReveal>
							<div
								style={{
									position: 'absolute',
									left: 0,
									right: 0,
									bottom: -18,
									height: 5,
									borderRadius: 5,
									background: COLORS.gold,
									transform: `scaleX(${underline})`,
									transformOrigin: 'left center',
								}}
							/>
						</div>
					</At>
					<At y={1136}>
						<MaskReveal p={progress(frame, CTA.partner, 7)}>
							<TextLine text={config.partner.text} maxWidth={TYPE_WIDTH} maxSize={42} weight={600} />
						</MaskReveal>
					</At>
					<At y={1196}>
						<div style={{opacity: progress(frame, CTA.partner + 6, 8)}}>
							<TextLine text={config.partner.fussnote} maxWidth={TYPE_WIDTH} maxSize={30} weight={400} color={COLORS.textFaint} />
						</div>
					</At>
				</>
			) : null}
		</div>
	);
};
