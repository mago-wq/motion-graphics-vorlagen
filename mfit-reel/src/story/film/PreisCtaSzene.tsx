// Szene 6 und 7 (32–40 s): Er kommt herein und bleibt stehen, über ihm der Preis. Dann die
// Einladung: "Noch unsicher? Probier's einfach." – kostenloses Probetraining mit drei Punkten,
// Knopf "Jetzt anfragen", ein Tipp darauf, Konfetti, goldene Blende ins Logo.
import {evolvePath} from '@remotion/paths';
import {interpolate} from 'remotion';
import {config} from '../../config';
import {TICK_PATH} from '../../components/Glyphs';
import {At} from '../../components/Layout';
import {fitSize, goldTextStyle, Line, MaskReveal, TextLine} from '../../components/Type';
import {clamp, EASE, impulse, progress, shake, SPRINGS, springFrom} from '../../motion';
import {COLORS, DISPLAY_FONT, formatAmount, NBSP, TEXT_FONT, withAlpha} from '../../theme';
import {TYPE_WIDTH} from '../../video';
import {macheGang} from '../figuren/gang';
import {LottieFigur} from '../figuren/LottieFigur';
import {LOTTIE_MANN} from '../figuren/lottieMann';
import {Konfetti, Kopfzeile, Kreisblende, Tippfinger} from './teile';
import {Z} from './zeit';

const P = Z.preis;
const C = Z.cta;
const HOEHE = 560;
const BODEN = 1880;
const L = (f: number) => f - P.start;

export const PREIS_GANG = macheGang({
	frames: Z.logo.start - P.start + 14,
	start: {frame: 0, x: -100},
	halt: {frame: L(P.halt), x: 220},
	bremsen: 14,
	schliessen: 16,
});

const KNOPF = {x: 540, y: 1150, w: 700, h: 124};

const Preis: React.FC<{frame: number}> = ({frame}) => {
	const raus = progress(frame, P.raus, 8, EASE.inOut);
	if (raus >= 1) return null;
	const slam = springFrom(frame, P.slam, SPRINGS.slam);
	const hit = shake(frame, P.slam, 16, 10);
	const betrag = `${formatAmount(config.preis.aktuell)}${NBSP}€`;
	const groesse = fitSize({text: betrag, maxWidth: 860, maxSize: 240});
	const glanz = progress(frame, P.slam + 10, 22, (t) => t);
	const ring = interpolate(frame - P.slam, [0, 18], [0, 1], clamp);
	const statt = progress(frame, P.statt, 8);
	const [d1, d2] = config.preisScene.details;
	return (
		<div style={{position: 'absolute', inset: 0, transform: `translateY(${-raus * 140}px)`, opacity: 1 - raus}}>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{ring > 0 && ring < 1 ? <circle cx={540} cy={640} r={130 + ring * 440} fill="none" stroke={COLORS.goldLight} strokeWidth={5 * (1 - ring)} opacity={1 - ring} /> : null}
			</svg>
			<Kopfzeile frame={frame} y={430} text={`${config.hook.zeile} ${config.hook.vorPreis}`} ab={P.vor} maxSize={92} />
			{frame >= P.slam ? (
				<At y={650}>
					<div
						style={{
							fontFamily: DISPLAY_FONT,
							fontSize: groesse,
							lineHeight: 1,
							whiteSpace: 'nowrap',
							transform: `translate(${hit.x}px, ${hit.y}px) scale(${1 + 0.25 * (1 - slam)})`,
							...goldTextStyle(glanz),
						}}
					>
						{betrag}
					</div>
				</At>
			) : null}
			<At y={808}>
				<MaskReveal p={progress(frame, P.slam + 4, 8)}>
					<TextLine text={config.hook.unterPreis.toUpperCase()} maxWidth={600} maxSize={46} weight={600} tracking={0.24} color={COLORS.textMuted} />
				</MaskReveal>
			</At>
			<At y={892}>
				<div style={{position: 'relative', opacity: statt}}>
					<TextLine text={`${config.preisScene.stattText} ${formatAmount(config.preis.statt)}${NBSP}€`} maxWidth={600} maxSize={44} weight={500} color={COLORS.textFaint} />
					<div
						style={{
							position: 'absolute',
							left: '-3%',
							right: '-3%',
							top: '52%',
							height: 4,
							background: COLORS.gold,
							transform: `scaleX(${progress(frame, P.statt + 3, 6)})`,
							transformOrigin: 'left center',
						}}
					/>
				</div>
			</At>
			<At y={990}>
				<div style={{display: 'flex', alignItems: 'center', gap: 20, fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 38, color: COLORS.text, whiteSpace: 'nowrap'}}>
					<MaskReveal p={progress(frame, P.details[0], 7)}>
						<span>{d1}</span>
					</MaskReveal>
					<span style={{color: COLORS.gold, opacity: progress(frame, P.details[1], 4)}}>·</span>
					<MaskReveal p={progress(frame, P.details[1], 7)}>
						<span>{d2}</span>
					</MaskReveal>
				</div>
			</At>
			<At y={1072}>
				<MaskReveal p={progress(frame, P.partner, 7)} bleed={20}>
					<TextLine text={config.partner.text} maxWidth={TYPE_WIDTH} maxSize={34} weight={500} color={COLORS.textMuted} />
				</MaskReveal>
			</At>
			<At y={1122}>
				<div style={{opacity: progress(frame, P.partner + 4, 8)}}>
					<TextLine text={config.partner.fussnote} maxWidth={TYPE_WIDTH} maxSize={24} weight={400} color={COLORS.textFaint} />
				</div>
			</At>
		</div>
	);
};

const Einladung: React.FC<{frame: number}> = ({frame}) => {
	if (frame < C.start - 4) return null;
	const pt = config.probetraining;
	const karte = springFrom(frame, C.karte, SPRINGS.pop);
	const knopf = springFrom(frame, C.knopf, SPRINGS.pop);
	const druck = interpolate(frame, [C.tipp - 2, C.tipp + 1, C.tipp + 7], [0, 1, 0], clamp);
	const glow = impulse(frame, C.tipp, 16);
	const url = progress(frame, C.knopf + 6, 8);
	const finger = interpolate(frame, [C.knopf + 2, C.tipp - 3], [0, 1], {...clamp, easing: EASE.inOut});
	const fingerSichtbar = interpolate(frame, [C.knopf + 2, C.knopf + 8, C.tipp + 10, C.tipp + 16], [0, 1, 1, 0], clamp);
	return (
		<>
			<Kopfzeile frame={frame} y={338} text={pt.frage} ab={C.frage} maxSize={104} />
			<Kopfzeile frame={frame} y={456} text={pt.antwort} ab={C.antwort} gold maxSize={104} />
			{frame >= C.karte - 2 ? (
				<div
					style={{
						position: 'absolute',
						left: 110,
						top: 560,
						width: 860,
						height: 450,
						borderRadius: 44,
						background: withAlpha('#111216', 0.95),
						border: `3px solid ${withAlpha(COLORS.gold, 0.7)}`,
						transform: `scale(${karte})`,
						opacity: Math.min(1, karte * 1.5),
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						paddingTop: 44,
						boxSizing: 'border-box',
						gap: 8,
					}}
				>
					<Line text={pt.titel[0]} maxWidth={760} maxSize={74} />
					<Line text={pt.titel[1]} maxWidth={760} maxSize={74} gold />
					<div style={{display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24, alignSelf: 'flex-start', marginLeft: 90}}>
						{pt.punkte.map((p, i) => {
							const t = progress(frame, C.punkte[i], 8);
							const strich = evolvePath(Math.max(0.0001, progress(frame, C.punkte[i], 10, EASE.inOut)), TICK_PATH);
							return (
								<div key={p} style={{display: 'flex', alignItems: 'center', gap: 20, opacity: t, transform: `translateX(${(1 - t) * -24}px)`}}>
									<svg viewBox="0 0 100 100" width={50} height={50}>
										<path d={TICK_PATH} fill="none" stroke={COLORS.gold} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={strich.strokeDasharray} strokeDashoffset={strich.strokeDashoffset} />
									</svg>
									<span style={{fontFamily: TEXT_FONT, fontSize: 40, fontWeight: 600, color: COLORS.text}}>{p}</span>
								</div>
							);
						})}
					</div>
				</div>
			) : null}
			{frame >= C.knopf - 2 ? (
				<div
					style={{
						position: 'absolute',
						left: KNOPF.x - KNOPF.w / 2,
						top: KNOPF.y - KNOPF.h / 2,
						width: KNOPF.w,
						height: KNOPF.h,
						borderRadius: 28,
						background: COLORS.gold,
						color: COLORS.bg,
						fontFamily: TEXT_FONT,
						fontWeight: 800,
						fontSize: 46,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						transform: `scale(${knopf * (1 - 0.05 * druck)})`,
						boxShadow: `0 0 ${40 + 80 * glow}px ${withAlpha(COLORS.gold, 0.35 + 0.4 * glow)}`,
					}}
				>
					Jetzt anfragen
				</div>
			) : null}
			<At y={1260}>
				<div style={{opacity: url, fontFamily: TEXT_FONT, fontSize: 40, fontWeight: 600, color: COLORS.text}}>
					{config.probetraining.aufruf} <span style={{color: COLORS.gold}}>{config.website}</span>
				</div>
			</At>
			<Tippfinger x={900 + (KNOPF.x + 120 - 900) * finger} y={1500 + (KNOPF.y - 1500) * finger} sichtbar={fingerSichtbar} tipps={[C.tipp]} frame={frame} />
			<Konfetti x={KNOPF.x} y={KNOPF.y} ab={C.tipp + 1} frame={frame} anzahl={30} />
		</>
	);
};

export const PreisCtaSzene: React.FC<{frame: number}> = ({frame}) => {
	if (frame < P.start || frame >= Z.logo.start + 1) return null;
	const lf = L(frame);
	return (
		<div style={{position: 'absolute', inset: 0}}>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<defs>
					<radialGradient id="pc-glow" cx="0.5" cy="0.3" r="0.7">
						<stop offset="0%" stopColor="#221B0F" />
						<stop offset="100%" stopColor={COLORS.bg} />
					</radialGradient>
				</defs>
				<rect width={1080} height={1920} fill="url(#pc-glow)" />
				<rect x={0} y={BODEN} width={1080} height={3} fill={COLORS.gold} opacity={0.18} />
			</svg>
			<LottieFigur figur={LOTTIE_MANN} gang={PREIS_GANG} frame={lf} x={PREIS_GANG.hueftX(lf)} boden={BODEN} hoehe={HOEHE} />
			<Preis frame={frame} />
			<Einladung frame={frame} />
		</div>
	);
};

/** Goldene Blende vom Knopf ins Logo (liegt über der Logo-Szene) */
export const CtaBlende: React.FC<{frame: number}> = ({frame}) => (
	<Kreisblende
		x={KNOPF.x}
		y={KNOPF.y}
		zu={interpolate(frame, [C.tipp + 10, Z.logo.start], [0, 1], clamp)}
		auf={interpolate(frame, [Z.logo.start, Z.logo.start + 12], [0, 1], clamp)}
	/>
);
