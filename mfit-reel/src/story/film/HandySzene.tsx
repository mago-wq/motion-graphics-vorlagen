// Szene 2 (3,5–10 s): Er fragt auf mfit-smart.de ein Probetraining an. Großes Handy mit dem
// Anfrageformular der Website; ein Finger wählt Studio, Tag und Uhrzeit, tippt den Namen
// und schickt ab. Bestätigung mit Konfetti, dann Kreisblende in die Nacht.
import {evolvePath} from '@remotion/paths';
import {interpolate} from 'remotion';
import {config} from '../../config';
import {TICK_PATH} from '../../components/Glyphs';
import {LogoMark} from '../../components/Logo';
import {clamp, EASE, progress, SPRINGS, springFrom} from '../../motion';
import {COLORS, TEXT_FONT, withAlpha} from '../../theme';
import {Konfetti, Kopfzeile, Kreisblende, schieben, Tippfinger} from './teile';
import {Z} from './zeit';

const H = Z.handy;
/** Handy und Bildschirm (Bildschirm-Koordinaten relativ zu S) */
const PH = {x: 230, y: 560, w: 620, h: 1230, r: 72, rand: 18};
const S = {x: PH.x + PH.rand, y: PH.y + PH.rand, w: PH.w - 2 * PH.rand};
const abs = (x: number, y: number) => ({x: S.x + x, y: S.y + y});

const STUDIO_WAHL = 4; // Bremen-Weserpark
const TAGE = [
	['Mo', '5'],
	['Di', '6'],
	['Mi', '7'],
	['Do', '8'],
	['Fr', '9'],
] as const;
const TAG_WAHL = 2;
const ZEITEN = ['07:00', '12:00', '18:00', '21:00'];
const ZEIT_WAHL = 2;
const NAME = 'Max';

// Layout im Bildschirm
const Y = {studio: 452, liste: 540, tage: 600, zeiten: 750, name: 880, knopf: 1010};
const ZEILE = 62;
const PILLE_TAG = {x0: 32, w: 96, gap: 10, h: 88};
const PILLE_ZEIT = {x0: 32, w: 122.5, gap: 10, h: 66};
const FOKUS = H.tippen[0] - 7;

/** Wo und wann der Finger tippt */
const TIPPS = [
	{t: H.studioAuf, ...abs(292, Y.studio + 40)},
	{t: H.studioWahl, ...abs(292, Y.liste + STUDIO_WAHL * ZEILE + ZEILE / 2)},
	{t: H.tag, ...abs(PILLE_TAG.x0 + TAG_WAHL * (PILLE_TAG.w + PILLE_TAG.gap) + PILLE_TAG.w / 2, Y.tage + PILLE_TAG.h / 2)},
	{t: H.zeit, ...abs(PILLE_ZEIT.x0 + ZEIT_WAHL * (PILLE_ZEIT.w + PILLE_ZEIT.gap) + PILLE_ZEIT.w / 2, Y.zeiten + PILLE_ZEIT.h / 2)},
	{t: FOKUS, ...abs(292, Y.name + 40)},
	{t: H.knopf, ...abs(292, Y.knopf + 52)},
];
const HAKEN_MITTE = abs(292, 470);

const fingerPos = (frame: number) => {
	const start = {x: 980, y: 1900};
	const pts = [{t: H.studioAuf - 12, ...start}, ...TIPPS];
	if (frame <= pts[0].t) return start;
	for (let i = 0; i < pts.length - 1; i++) {
		const a = pts[i];
		const b = pts[i + 1];
		const ab = a.t + 3;
		const an = b.t - 3;
		if (frame <= an) {
			const u = interpolate(frame, [ab, an], [0, 1], {...clamp, easing: EASE.inOut});
			return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u};
		}
		if (frame <= b.t + 3) return {x: b.x, y: b.y};
	}
	const last = pts[pts.length - 1];
	return {x: last.x, y: last.y};
};

const Etikett: React.FC<{y: number; text: string}> = ({y, text}) => (
	<div style={{position: 'absolute', left: 32, top: y, fontSize: 22, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.textFaint}}>
		{text}
	</div>
);

const Pille: React.FC<{x: number; y: number; w: number; h: number; aktiv: number; children: React.ReactNode}> = ({x, y, w, h, aktiv, children}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			width: w,
			height: h,
			borderRadius: 16,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: 27,
			fontWeight: 600,
			lineHeight: 1.1,
			background: aktiv > 0 ? COLORS.gold : '#1B1D22',
			color: aktiv > 0 ? COLORS.bg : COLORS.text,
			border: aktiv > 0 ? 'none' : `2px solid ${withAlpha(COLORS.text, 0.08)}`,
			boxSizing: 'border-box',
			transform: `scale(${aktiv > 0 ? 1 + 0.12 * Math.sin(Math.min(1, aktiv) * Math.PI) : 1})`,
		}}
	>
		{children}
	</div>
);

const Bildschirm: React.FC<{frame: number}> = ({frame}) => {
	const liste = interpolate(frame, [H.studioAuf, H.studioAuf + 6, H.studioWahl + 2, H.studioWahl + 8], [0, 1, 1, 0], {...clamp, easing: EASE.out});
	const gewaehlt = frame >= H.studioWahl;
	const tag = interpolate(frame, [H.tag, H.tag + 8], [0, 1], clamp);
	const zeit = interpolate(frame, [H.zeit, H.zeit + 8], [0, 1], clamp);
	const buchstaben = H.tippen.filter((t) => frame >= t).length;
	const fokus = frame >= FOKUS && frame < H.knopf;
	const cursor = fokus && Math.floor((frame - FOKUS) / 8) % 2 === 0;
	const druck = interpolate(frame, [H.knopf - 2, H.knopf + 1, H.knopf + 6], [0, 1, 0], clamp);
	const erfolg = progress(frame, H.erfolg, 10, EASE.out);
	const hakenZeichnen = progress(frame, H.erfolg + 4, 12, EASE.inOut);
	const hakenStrich = evolvePath(Math.max(0.0001, hakenZeichnen), TICK_PATH);
	const studioName = config.studios[STUDIO_WAHL].name;
	return (
		<div style={{position: 'absolute', inset: 0, fontFamily: TEXT_FONT, color: COLORS.text}}>
			{/* Statuszeile, Adresszeile, Logo */}
			<div style={{position: 'absolute', left: 34, right: 34, top: 22, display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 600, color: COLORS.textMuted}}>
				<span>22:51</span>
				<span style={{width: 110, height: 28, borderRadius: 14, background: '#050506'}} />
				<span>●●●</span>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 64, display: 'flex', justifyContent: 'center'}}>
				<div style={{padding: '10px 28px', borderRadius: 999, background: '#1B1D22', fontSize: 22, color: COLORS.textMuted}}>{config.website}</div>
			</div>
			<div style={{position: 'absolute', left: 32, right: 32, top: 130, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<LogoMark height={60} />
				<div style={{display: 'flex', flexDirection: 'column', gap: 7}}>
					{[0, 1, 2].map((i) => (
						<span key={i} style={{width: 34, height: 4, borderRadius: 2, background: COLORS.text}} />
					))}
				</div>
			</div>
			<div style={{position: 'absolute', left: 32, top: 222, fontSize: 48, fontWeight: 800, lineHeight: 1.1}}>
				Probetraining
				<br />
				<span style={{color: COLORS.gold}}>anfragen</span>
			</div>
			<div style={{position: 'absolute', left: 32, top: 350, display: 'flex', gap: 24, fontSize: 24, fontWeight: 600}}>
				{[config.probetraining.punkte[0], config.probetraining.punkte[1]].map((t) => (
					<span key={t} style={{display: 'flex', alignItems: 'center', gap: 8}}>
						<svg viewBox="0 0 100 100" width={30} height={30}>
							<path d={TICK_PATH} fill="none" stroke={COLORS.gold} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
						</svg>
						{t}
					</span>
				))}
			</div>
			{/* Studio */}
			<Etikett y={Y.studio - 34} text="Studio" />
			<div
				style={{
					position: 'absolute',
					left: 32,
					right: 32,
					top: Y.studio,
					height: 80,
					borderRadius: 16,
					border: `3px solid ${gewaehlt || liste > 0 ? COLORS.gold : withAlpha(COLORS.text, 0.15)}`,
					background: '#15171B',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '0 24px',
					boxSizing: 'border-box',
					fontSize: 27,
					fontWeight: 600,
				}}
			>
				<span style={{color: gewaehlt ? COLORS.text : COLORS.textFaint}}>{gewaehlt ? `MFit Smart ${studioName}` : 'Studio wählen'}</span>
				<span style={{color: COLORS.gold, transform: `rotate(${liste * 180}deg)`}}>▾</span>
			</div>
			{/* Wunschtermin */}
			<Etikett y={Y.tage - 34} text="Wunschtermin" />
			{TAGE.map(([d, n], i) => (
				<Pille key={d} x={PILLE_TAG.x0 + i * (PILLE_TAG.w + PILLE_TAG.gap)} y={Y.tage} w={PILLE_TAG.w} h={PILLE_TAG.h} aktiv={i === TAG_WAHL ? tag : 0}>
					<span style={{fontSize: 19, opacity: 0.75}}>{d}</span>
					{n}
				</Pille>
			))}
			{/* Uhrzeit */}
			<Etikett y={Y.zeiten - 34} text="Uhrzeit" />
			{ZEITEN.map((t, i) => (
				<Pille key={t} x={PILLE_ZEIT.x0 + i * (PILLE_ZEIT.w + PILLE_ZEIT.gap)} y={Y.zeiten} w={PILLE_ZEIT.w} h={PILLE_ZEIT.h} aktiv={i === ZEIT_WAHL ? zeit : 0}>
					{t}
				</Pille>
			))}
			{/* Vorname */}
			<Etikett y={Y.name - 34} text="Vorname" />
			<div
				style={{
					position: 'absolute',
					left: 32,
					right: 32,
					top: Y.name,
					height: 80,
					borderRadius: 16,
					background: '#1B1D22',
					border: `3px solid ${fokus || buchstaben > 0 ? COLORS.gold : 'transparent'}`,
					display: 'flex',
					alignItems: 'center',
					padding: '0 24px',
					boxSizing: 'border-box',
					fontSize: 30,
					fontWeight: 500,
				}}
			>
				{NAME.slice(0, buchstaben)}
				<span style={{color: COLORS.gold, opacity: cursor ? 1 : 0, marginLeft: 2}}>|</span>
			</div>
			{/* Knopf */}
			<div
				style={{
					position: 'absolute',
					left: 32,
					right: 32,
					top: Y.knopf,
					height: 104,
					borderRadius: 20,
					background: COLORS.gold,
					color: COLORS.bg,
					fontSize: 32,
					fontWeight: 800,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					transform: `scale(${1 - 0.05 * druck})`,
					boxShadow: `0 0 ${30 + 40 * druck}px ${withAlpha(COLORS.gold, 0.35)}`,
				}}
			>
				Probetraining anfragen
			</div>
			{/* Aufklappliste der Studios */}
			{liste > 0 ? (
				<div
					style={{
						position: 'absolute',
						left: 32,
						right: 32,
						top: Y.liste,
						borderRadius: 18,
						background: '#1F2228',
						border: `2px solid ${withAlpha(COLORS.gold, 0.4)}`,
						overflow: 'hidden',
						transformOrigin: 'top center',
						transform: `scaleY(${liste})`,
						opacity: Math.min(1, liste * 2),
						boxShadow: `0 30px 60px ${withAlpha('#000000', 0.6)}`,
					}}
				>
					{config.studios.map((s, i) => (
						<div
							key={s.name}
							style={{
								height: ZEILE,
								display: 'flex',
								alignItems: 'center',
								padding: '0 24px',
								fontSize: 26,
								fontWeight: 500,
								background: i === STUDIO_WAHL && frame >= H.studioWahl - 2 ? withAlpha(COLORS.gold, 0.25) : 'transparent',
								borderTop: i ? `1px solid ${withAlpha(COLORS.text, 0.06)}` : 'none',
							}}
						>
							{s.name}
						</div>
					))}
				</div>
			) : null}
			{/* Bestätigung */}
			{erfolg > 0 ? (
				<div style={{position: 'absolute', inset: 0, background: withAlpha('#0F1013', 0.96 * erfolg), display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
					<div style={{marginTop: 330, transform: `scale(${springFrom(frame, H.erfolg, SPRINGS.pop)})`}}>
						<svg viewBox="0 0 280 280" width={280} height={280}>
							<circle cx={140} cy={140} r={128} fill={withAlpha(COLORS.gold, 0.14)} stroke={COLORS.gold} strokeWidth={8} />
							<g transform="translate(40 40) scale(2)">
								<path d={TICK_PATH} fill="none" stroke={COLORS.goldLight} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={hakenStrich.strokeDasharray} strokeDashoffset={hakenStrich.strokeDashoffset} />
							</g>
						</svg>
					</div>
					<div style={{marginTop: 40, fontSize: 46, fontWeight: 800, opacity: progress(frame, H.erfolg + 8, 8)}}>Anfrage gesendet!</div>
					<div style={{marginTop: 18, fontSize: 28, fontWeight: 500, color: COLORS.textMuted, opacity: progress(frame, H.erfolg + 14, 8)}}>
						{`Probetraining · ${TAGE[TAG_WAHL][0]}, ${TAGE[TAG_WAHL][1]}. · ${ZEITEN[ZEIT_WAHL]} Uhr`}
					</div>
				</div>
			) : null}
		</div>
	);
};

/** Schwebende Symbole im Hintergrund: Hantel und Kalender */
const Schweber: React.FC<{frame: number}> = ({frame}) => {
	const a = Math.sin(frame / 18) * 10;
	const b = Math.cos(frame / 22) * 12;
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<circle cx={540} cy={1180} r={560} fill="#15120B" />
			<circle cx={940} cy={700} r={140} fill="#15120B" />
			<g transform={`translate(${130} ${760 + a}) rotate(-18)`} fill="none" stroke={COLORS.gold} strokeWidth={7} strokeLinecap="round" opacity={0.7}>
				<path d="M -46 0 H 46" />
				<rect x={-60} y={-24} width={14} height={48} rx={5} />
				<rect x={46} y={-24} width={14} height={48} rx={5} />
			</g>
			<g transform={`translate(${960} ${900 + b}) rotate(10)`} fill="none" stroke={COLORS.gold} strokeWidth={6} opacity={0.55}>
				<rect x={-38} y={-34} width={76} height={70} rx={10} />
				<path d="M -38 -14 H 38 M -18 -44 V -26 M 18 -44 V -26" strokeLinecap="round" />
			</g>
			<g transform={`translate(${120} ${1500 - b})`} fill="none" stroke={COLORS.gold} strokeWidth={6} opacity={0.45}>
				<circle r={34} />
				<path d="M -14 0 L -4 10 L 16 -12" strokeLinecap="round" strokeLinejoin="round" />
			</g>
		</svg>
	);
};

export const HandySzene: React.FC<{frame: number}> = ({frame}) => {
	if (frame < Z.problem.raus || frame >= Z.tuer.start) return null;
	const rein = 1 - schieben(frame, Z.problem.raus, 15);
	const fall = springFrom(frame, Z.problem.raus + 8, {damping: 14, stiffness: 120, mass: 0.9});
	const phoneY = (1 - fall) * 900;
	const phoneR = (1 - fall) * -8;
	const finger = fingerPos(frame);
	const fingerSichtbar = interpolate(frame, [H.studioAuf - 12, H.studioAuf - 4, H.knopf + 6, H.knopf + 14], [0, 1, 1, 0], clamp);
	return (
		<>
			<div style={{position: 'absolute', inset: 0, transform: `translateY(${rein * 1920}px)`}}>
				<Schweber frame={frame} />
				<div
					style={{
						position: 'absolute',
						left: PH.x,
						top: PH.y,
						width: PH.w,
						height: PH.h,
						borderRadius: PH.r,
						background: '#050506',
						boxShadow: `0 0 0 3px ${withAlpha(COLORS.gold, 0.55)}, 0 40px 90px ${withAlpha('#000000', 0.6)}`,
						transform: `translateY(${phoneY}px) rotate(${phoneR}deg)`,
					}}
				>
					<div style={{position: 'absolute', left: PH.rand, top: PH.rand, right: PH.rand, bottom: PH.rand, borderRadius: PH.r - PH.rand, background: '#0F1013', overflow: 'hidden'}}>
						<Bildschirm frame={frame} />
					</div>
				</div>
				<Tippfinger x={finger.x} y={finger.y} sichtbar={fingerSichtbar} tipps={TIPPS.map((t) => t.t)} frame={frame} />
				<Konfetti x={HAKEN_MITTE.x} y={HAKEN_MITTE.y} ab={H.erfolg + 4} frame={frame} anzahl={26} />
				<Kopfzeile frame={frame} y={338} text="Probetraining" ab={H.titel} />
				<Kopfzeile frame={frame} y={456} text="kostenlos anfragen." ab={H.titel + 5} gold />
			</div>
		</>
	);
};

/** Kreisblende vom Bestätigungshaken in die Nacht (liegt über der nächsten Szene) */
export const HandyBlende: React.FC<{frame: number}> = ({frame}) => (
	<Kreisblende
		x={HAKEN_MITTE.x}
		y={HAKEN_MITTE.y}
		zu={interpolate(frame, [H.raus, Z.tuer.start], [0, 1], clamp)}
		auf={interpolate(frame, [Z.tuer.start, Z.tuer.start + 12], [0, 1], clamp)}
	/>
);
