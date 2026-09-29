// Szene 5a (20,8–22,4 s): "UND DAS ALLES FÜR" … 29,90 € wird durchgestrichen (in der Stille).
// Szene 5b (22,4–25,6 s): "NUR 17,90 € IM MONAT" schlägt auf dem zweiten Drop ein.
import {evolvePath} from '@remotion/paths';
import {interpolate} from 'remotion';
import {config} from '../config';
import {At} from '../components/Layout';
import {fitSize, goldTextStyle, Line, MaskReveal, TextLine} from '../components/Type';
import {clamp, EASE, progress, shake, springFrom, SPRINGS} from '../motion';
import {COLORS, DISPLAY_FONT, formatAmount, NBSP, TEXT_FONT} from '../theme';
import {ANKER, CTA, PREIS} from '../timing';
import {TYPE_WIDTH} from '../video';

export const AnkerScene: React.FC<{frame: number}> = ({frame}) => {
	if (frame < ANKER.start - 2 || frame >= PREIS.start + 6) return null;
	const [z1, z2] = config.anker;
	const words = z1.split(' ');
	const size1 = fitSize({text: z1, maxWidth: TYPE_WIDTH, maxSize: 112});
	// Geht in der Stille vor dem Drop: ein kurzer schwarzer Moment, dann schlägt der Preis ein
	const out = progress(frame, PREIS.slam - 8, 5, EASE.inOut);
	const stattText = `${formatAmount(config.preis.statt)}${NBSP}€`;
	const priceIn = frame >= ANKER.preis ? springFrom(frame, ANKER.preis, SPRINGS.slam) : 0;
	const strike = progress(frame, ANKER.strich, 5, EASE.out);
	const strikeShake = shake(frame, ANKER.strich + 3, 10, 7);
	const dim = interpolate(strike, [0.4, 1], [1, 0.42], clamp);
	const priceSize = fitSize({text: stattText, maxWidth: 760, maxSize: 210});
	// Schrägstrich über die Zahl, von links unten nach rechts oben
	const slash = 'M 0 118 L 700 22';
	const dash = evolvePath(Math.max(0.0001, strike), slash);
	return (
		<div style={{position: 'absolute', inset: 0, transform: `translateY(${-out * 140}px) scale(${1 - out * 0.08})`, opacity: 1 - out}}>
			<At y={640}>
				<div style={{display: 'flex', gap: '0.28em', fontFamily: DISPLAY_FONT, fontSize: size1, lineHeight: 1, textTransform: 'uppercase', color: COLORS.text}}>
					{words.map((word, i) => (
						<MaskReveal key={word + i} p={progress(frame, ANKER.worte[i] - 2, 6)}>
							<span style={{display: 'inline-block', whiteSpace: 'nowrap'}}>{word}</span>
						</MaskReveal>
					))}
				</div>
			</At>
			<At y={764}>
				<MaskReveal p={progress(frame, ANKER.worte[3] - 2, 6)}>
					<Line text={z2} maxWidth={TYPE_WIDTH} maxSize={112} />
				</MaskReveal>
			</At>
			<At y={960}>
				<div
					style={{
						position: 'relative',
						transform: `translate(${strikeShake.x}px, ${strikeShake.y}px) scale(${frame >= ANKER.preis ? 1 + 0.25 * (1 - priceIn) : 0})`,
					}}
				>
					<div style={{fontFamily: DISPLAY_FONT, fontSize: priceSize, lineHeight: 1, color: COLORS.text, opacity: dim, whiteSpace: 'nowrap'}}>
						{stattText}
					</div>
					{strike > 0 ? (
						<svg viewBox="0 0 700 140" preserveAspectRatio="none" style={{position: 'absolute', left: '-4%', top: '0%', width: '108%', height: '100%', overflow: 'visible'}}>
							<path
								d={slash}
								stroke={COLORS.gold}
								strokeWidth={18}
								strokeLinecap="round"
								fill="none"
								strokeDasharray={dash.strokeDasharray}
								strokeDashoffset={dash.strokeDashoffset}
							/>
						</svg>
					) : null}
				</div>
			</At>
		</div>
	);
};

export const PreisScene: React.FC<{frame: number}> = ({frame}) => {
	// Erst auf dem Drop sichtbar: davor ist das Bild einen Moment schwarz
	if (frame < PREIS.start || frame >= CTA.start + 2) return null;
	const out = progress(frame, CTA.start - 8, 5, EASE.inOut);
	const slam = springFrom(frame, PREIS.slam, SPRINGS.slam);
	const hit = shake(frame, PREIS.slam, 18, 10);
	const amount = `${formatAmount(config.preis.aktuell)}${NBSP}€`;
	const priceSize = fitSize({text: amount, maxWidth: 820, maxSize: 250});
	const sheen = progress(frame, PREIS.glanz, 20, (t) => t);
	const ring = interpolate(frame - PREIS.slam, [0, 18], [0, 1], {...clamp, easing: EASE.out});
	const frameDraw = progress(frame, PREIS.slam + 2, 20, EASE.inOut);
	const stattText = `${config.preisScene.stattText} ${formatAmount(config.preis.statt)}${NBSP}€`;
	const statt = progress(frame, PREIS.statt, 8);
	const [d1, d2] = config.preisScene.details;
	const box = {x: 110, y: 492, w: 860, h: 606, r: 72};
	const boxPath = `M ${box.x + box.w / 2} ${box.y} H ${box.x + box.w - box.r} A ${box.r} ${box.r} 0 0 1 ${box.x + box.w} ${box.y + box.r} V ${box.y + box.h - box.r} A ${box.r} ${box.r} 0 0 1 ${box.x + box.w - box.r} ${box.y + box.h} H ${box.x + box.r} A ${box.r} ${box.r} 0 0 1 ${box.x} ${box.y + box.h - box.r} V ${box.y + box.r} A ${box.r} ${box.r} 0 0 1 ${box.x + box.r} ${box.y} Z`;
	const boxDash = evolvePath(Math.max(0.0001, frameDraw), boxPath);

	return (
		<div style={{position: 'absolute', inset: 0, transform: `translateY(${-out * 120}px)`, opacity: 1 - out}}>
			{/* Rahmen wie im MFit-Logo: zeichnet sich von oben mittig einmal herum */}
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<path d={boxPath} fill="none" stroke={COLORS.gold} strokeWidth={4} strokeDasharray={boxDash.strokeDasharray} strokeDashoffset={boxDash.strokeDashoffset} strokeLinecap="round" />
				{ring > 0 && ring < 1 ? <circle cx={540} cy={776} r={140 + ring * 420} fill="none" stroke={COLORS.goldLight} strokeWidth={5 * (1 - ring)} opacity={1 - ring} /> : null}
			</svg>
			<At y={590}>
				<MaskReveal p={progress(frame, PREIS.slam, 6)}>
					<TextLine text={config.preisScene.vor.toUpperCase()} maxWidth={400} maxSize={58} weight={800} tracking={0.16} />
				</MaskReveal>
			</At>
			<At y={776}>
				<div
					style={{
						fontFamily: DISPLAY_FONT,
						fontSize: priceSize,
						lineHeight: 1,
						whiteSpace: 'nowrap',
						transform: `translate(${hit.x}px, ${hit.y}px) scale(${1 + 0.22 * (1 - slam)})`,
						...goldTextStyle(sheen),
					}}
				>
					{amount}
				</div>
			</At>
			<At y={922}>
				<MaskReveal p={progress(frame, PREIS.imMonat, 7)}>
					<TextLine text={config.hook.unterPreis.toUpperCase()} maxWidth={600} maxSize={46} weight={600} tracking={0.24} color={COLORS.textMuted} />
				</MaskReveal>
			</At>
			<At y={1010}>
				<div style={{position: 'relative', opacity: statt}}>
					<TextLine text={stattText} maxWidth={600} maxSize={46} weight={500} color={COLORS.textFaint} />
					<div
						style={{
							position: 'absolute',
							left: '-3%',
							right: '-3%',
							top: '52%',
							height: 4,
							background: COLORS.gold,
							transform: `scaleX(${progress(frame, PREIS.statt + 3, 6)})`,
							transformOrigin: 'left center',
						}}
					/>
				</div>
			</At>
			<At y={1172}>
				<div style={{display: 'flex', alignItems: 'center', gap: 22, fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 40, color: COLORS.text, whiteSpace: 'nowrap'}}>
					<MaskReveal p={progress(frame, PREIS.details[0], 7)}>
						<span>{d1}</span>
					</MaskReveal>
					<span style={{color: COLORS.gold, opacity: progress(frame, PREIS.details[1], 4)}}>·</span>
					<MaskReveal p={progress(frame, PREIS.details[1], 7)}>
						<span>{d2}</span>
					</MaskReveal>
				</div>
			</At>
		</div>
	);
};
