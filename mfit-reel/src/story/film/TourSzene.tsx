// Szene 4 (18–28 s): Rundgang durchs Studio. Die Kamera läuft mit, die Figur bleibt links,
// das Studio zieht vorbei. An jeder Station springt eine Karte auf: Anmeldegebühr (Empfang),
// Getränke (Kühlschrank), Parkplätze (Fenster), monatlich kündbar (Hantelbereich).
import {Img, interpolate, staticFile} from 'remotion';
import {config} from '../../config';
import {BottlePicto, ChainPicto, ParkingPicto} from '../../components/Pictograms';
import {clamp, EASE, progress} from '../../motion';
import {COLORS, DISPLAY_FONT, withAlpha} from '../../theme';
import {macheGang} from '../figuren/gang';
import {LottieFigur, pxProZyklus} from '../figuren/LottieFigur';
import {LOTTIE_MANN} from '../figuren/lottieMann';
import {Karte, schieben} from './teile';
import {Z} from './zeit';

const T = Z.tour;
const HOEHE = 800;
const BODEN = 1790;
const FIGUR_X = 360;
/** Szenenbeginn etwas vor T.start: dort blendet das warme Licht aus der Tür über */
const START = T.start - 12;
const L = (f: number) => f - START;
const TEMPO = pxProZyklus(LOTTIE_MANN, HOEHE) / LOTTIE_MANN.zyklus;

export const TOUR_GANG = macheGang({frames: Z.studios.start - START + 2, start: {frame: 0, x: 0}, tempo: TEMPO});

/** Weltposition, die zum Zeitpunkt `f` bei Bild-x `sx` liegt */
const weltBei = (f: number, sx: number) => TOUR_GANG.hueftX(L(f)) - FIGUR_X + sx;
const STATION = T.karten.map((k) => weltBei(k, 820));

const WAND = 1600;

/** Dunkle Geräte-Silhouetten mit Goldakzenten, Fuß auf der Wandlinie */
const Laufband: React.FC<{x: number}> = ({x}) => (
	<g transform={`translate(${x} ${WAND})`} fill="#0B0907">
		<path d="M -20 0 L 250 0 L 250 -30 L -20 -30 Z" />
		<rect x={210} y={-230} width={18} height={210} rx={6} transform="rotate(14 219 -125)" />
		<rect x={190} y={-250} width={90} height={40} rx={10} />
		<rect x={196} y={-244} width={60} height={20} rx={4} fill={withAlpha(COLORS.gold, 0.6)} />
		<rect x={-20} y={-34} width={270} height={6} fill={withAlpha(COLORS.gold, 0.5)} />
	</g>
);

const Hantelbank: React.FC<{x: number}> = ({x}) => (
	<g transform={`translate(${x} ${WAND})`} fill="#0B0907">
		<rect x={0} y={-90} width={220} height={26} rx={10} />
		<rect x={40} y={-64} width={16} height={64} />
		<rect x={170} y={-64} width={16} height={64} />
		<rect x={160} y={-200} width={14} height={140} rx={4} transform="rotate(-24 167 -130)" />
	</g>
);

const Hantelregal: React.FC<{x: number}> = ({x}) => (
	<g transform={`translate(${x} ${WAND})`}>
		<rect x={0} y={-260} width={420} height={16} rx={6} fill="#0B0907" />
		<rect x={0} y={-140} width={420} height={16} rx={6} fill="#0B0907" />
		<rect x={10} y={-260} width={14} height={260} fill="#0B0907" />
		<rect x={396} y={-260} width={14} height={260} fill="#0B0907" />
		{[0, 1, 2, 3, 4, 5].map((i) => (
			<g key={i} fill="#0B0907">
				<circle cx={50 + i * 64} cy={-282 + i} r={22 + i * 2} />
				<circle cx={50 + i * 64} cy={-162} r={26 + i * 2} />
				<rect x={30 + i * 64} y={-287 + i} width={40} height={8} fill={withAlpha(COLORS.gold, 0.55)} />
			</g>
		))}
	</g>
);

const Kraftstation: React.FC<{x: number}> = ({x}) => (
	<g transform={`translate(${x} ${WAND})`} fill="#0B0907">
		<rect x={0} y={-620} width={20} height={620} />
		<rect x={260} y={-620} width={20} height={620} />
		<rect x={0} y={-620} width={280} height={20} />
		<rect x={-40} y={-360} width={360} height={12} rx={6} fill={withAlpha(COLORS.gold, 0.7)} />
		<circle cx={-40} cy={-354} r={40} />
		<circle cx={320} cy={-354} r={40} />
	</g>
);

const Empfang: React.FC<{x: number; frame: number}> = ({x, frame}) => {
	const glanz = progress(frame, T.karten[0], 12);
	return (
		<g transform={`translate(${x} ${WAND})`}>
			<rect x={0} y={-230} width={360} height={230} rx={12} fill="#120F0A" />
			<rect x={0} y={-236} width={360} height={14} rx={6} fill={COLORS.gold} opacity={0.8} />
			<rect x={150} y={-420} width={12} height={190} fill="#0B0907" />
			<rect x={70} y={-560} width={180} height={150} rx={14} fill="#0B0907" stroke={withAlpha(COLORS.gold, 0.6)} strokeWidth={4} />
			<text x={160} y={-462} textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize={64} fill={COLORS.gold} opacity={0.4 + 0.6 * glanz}>
				0 €
			</text>
		</g>
	);
};

const Getraenke: React.FC<{x: number}> = ({x}) => (
	<g transform={`translate(${x} ${WAND})`}>
		{/* Kühlschrank mit leuchtenden Flaschen */}
		<rect x={0} y={-560} width={220} height={560} rx={14} fill="#0B0907" />
		<rect x={16} y={-544} width={188} height={500} rx={8} fill="#2A2112" />
		{[0, 1, 2, 3].map((r) =>
			[0, 1, 2, 3].map((c) => (
				<g key={`${r}-${c}`}>
					<rect x={34 + c * 44} y={-520 + r * 118} width={26} height={78} rx={9} fill="#6E8FA8" opacity={0.55} />
					<rect x={40 + c * 44} y={-530 + r * 118} width={14} height={14} rx={3} fill={COLORS.gold} />
				</g>
			)),
		)}
		<rect x={16} y={-544} width={188} height={500} rx={8} fill={COLORS.goldLight} opacity={0.08} />
		{/* Wasserspender */}
		<rect x={250} y={-330} width={110} height={330} rx={10} fill="#0B0907" />
		<rect x={262} y={-470} width={86} height={140} rx={30} fill="#6E8FA8" opacity={0.5} />
		<rect x={286} y={-240} width={38} height={8} rx={3} fill={COLORS.gold} />
	</g>
);

const Fenster: React.FC<{x: number; frame: number}> = ({x, frame}) => {
	const w = 560;
	const top = -800;
	const blink = Math.floor(frame / 10) % 2 === 0;
	return (
		<g transform={`translate(${x} ${WAND})`}>
			{/* Nachthimmel und Parkplatz draußen, von einer Laterne beleuchtet */}
			<rect x={0} y={top} width={w} height={640} rx={8} fill="#101626" />
			<rect x={0} y={top + 330} width={w} height={310} fill="#232834" />
			<path d={`M ${w - 150} ${top + 150} L ${w - 330} ${top + 640} L ${w + 40} ${top + 640} Z`} fill="#F8E39C" opacity={0.12} />
			<rect x={w - 158} y={top + 120} width={10} height={210} fill="#3A4150" />
			<ellipse cx={w - 150} cy={top + 124} rx={30} ry={8} fill="#F8E39C" opacity={0.9} />
			{[0, 1, 2, 3, 4, 5].map((i) => (
				<rect key={i} x={20 + i * 100} y={top + 400} width={7} height={170} fill="#E8EBF0" opacity={0.6} transform={`skewX(-18)`} />
			))}
			{[0, 1, 2].map((i) => (
				<g key={i} transform={`translate(${60 + i * 150} ${top + 460})`}>
					<rect x={0} y={0} width={116} height={44} rx={16} fill={['#7C8699', '#9AA3B3', '#5E677A'][i]} />
					<rect x={20} y={-26} width={74} height={32} rx={10} fill={['#6A7488', '#86909F', '#4F586B'][i]} />
					<rect x={28} y={-20} width={58} height={18} rx={5} fill="#1B2130" />
					<circle cx={26} cy={44} r={12} fill="#0A0C10" />
					<circle cx={92} cy={44} r={12} fill="#0A0C10" />
					{i === 1 && blink ? <rect x={104} y={12} width={12} height={9} rx={2} fill={COLORS.goldLight} /> : null}
				</g>
			))}
			{/* P-Schild */}
			<rect x={40} y={top + 190} width={10} height={150} fill="#3A4150" />
			<rect x={0} y={top + 110} width={92} height={92} rx={14} fill={COLORS.gold} />
			<text x={46} y={top + 182} textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize={68} fill={COLORS.bg}>
				P
			</text>
			{/* Rahmen und Sprosse */}
			<rect x={0} y={top} width={w} height={640} rx={8} fill="none" stroke={COLORS.gold} strokeWidth={6} />
			<rect x={w / 2 - 3} y={top} width={6} height={640} fill={COLORS.gold} />
			<path d={`M 20 ${top + 600} L ${w - 40} ${top + 40}`} stroke="#FFFFFF" strokeWidth={50} opacity={0.04} />
		</g>
	);
};

export const TourSzene: React.FC<{frame: number}> = ({frame}) => {
	if (frame < START || frame >= Z.studios.start + 1) return null;
	const lf = L(frame);
	const cam = TOUR_GANG.hueftX(lf) - FIGUR_X;
	const sx = (wx: number) => wx - cam;
	const weg = schieben(frame, T.raus, 15);
	const licht = interpolate(frame, [T.start, T.start + 14], [1, 0], clamp);
	const lampen = Array.from({length: 14}, (_, i) => i * 300).filter((wx) => sx(wx) > -200 && sx(wx) < 1300);
	const paneele = Array.from({length: 30}, (_, i) => i * 240).filter((wx) => sx(wx) > -40 && sx(wx) < 1120);
	const karten = T.karten;
	const aus = (i: number) => karten[i] + 44;
	return (
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden', transform: `translateX(${-weg * 1080}px)`}}>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<defs>
					<linearGradient id="tour-wand" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#0E0C09" />
						<stop offset="45%" stopColor="#1C170F" />
						<stop offset="100%" stopColor="#15110B" />
					</linearGradient>
					<linearGradient id="tour-boden" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#15110B" />
						<stop offset="100%" stopColor="#0A0907" />
					</linearGradient>
					<radialGradient id="tour-spot" cx="0.5" cy="0" r="0.8">
						<stop offset="0%" stopColor={COLORS.goldLight} stopOpacity={0.14} />
						<stop offset="100%" stopColor={COLORS.goldLight} stopOpacity={0} />
					</radialGradient>
				</defs>
				<rect width={1080} height={WAND} fill="url(#tour-wand)" />
				{paneele.map((wx) => (
					<rect key={wx} x={sx(wx)} y={640} width={3} height={WAND - 640} fill="#FFFFFF" opacity={0.025} />
				))}
				{/* Decke mit Spots */}
				<rect width={1080} height={640} fill="#0B0A08" />
				{lampen.map((wx) => (
					<g key={wx}>
						<path d={`M ${sx(wx) - 30} 640 L ${sx(wx) + 30} 640 L ${sx(wx) + 170} ${WAND} L ${sx(wx) - 170} ${WAND} Z`} fill="url(#tour-spot)" />
						<ellipse cx={sx(wx)} cy={640} rx={40} ry={9} fill={COLORS.goldLight} opacity={0.85} />
					</g>
				))}
				{/* LED-Band an der Wand */}
				<rect x={0} y={700} width={1080} height={5} fill={COLORS.gold} opacity={0.75} />
				<rect x={0} y={694} width={1080} height={17} fill={COLORS.gold} opacity={0.12} />
				{/* Stationen */}
				<Empfang x={sx(STATION[0] - 180)} frame={frame} />
				<Laufband x={sx(STATION[0] + 330)} />
				<Getraenke x={sx(STATION[1] - 180)} />
				<Kraftstation x={sx(STATION[1] + 300)} />
				<Fenster x={sx(STATION[2] - 280)} frame={frame} />
				<Hantelbank x={sx(STATION[2] + 380)} />
				<Hantelregal x={sx(STATION[3] - 210)} />
				<Kraftstation x={sx(STATION[3] + 330)} />
				<Laufband x={sx(STATION[3] + 780)} />
				{/* Boden */}
				<rect x={0} y={WAND} width={1080} height={1920 - WAND} fill="url(#tour-boden)" />
				<rect x={0} y={WAND} width={1080} height={4} fill={COLORS.gold} opacity={0.25} />
				{paneele.map((wx) => (
					<path key={`b${wx}`} d={`M ${sx(wx)} ${WAND} L ${sx(wx) - 90} 1920`} stroke="#FFFFFF" strokeWidth={2} opacity={0.03} />
				))}
			</svg>
			{/* MFit-Zeichen an der Wand */}
			<div style={{position: 'absolute', left: sx(STATION[0] + 380), top: 820, opacity: 0.9}}>
				<Img src={staticFile('brand/mfit-zeichen@2x.png')} style={{height: 210}} />
			</div>
			<LottieFigur figur={LOTTIE_MANN} gang={TOUR_GANG} frame={lf} x={FIGUR_X} boden={BODEN} hoehe={HOEHE} />
			<Karte
				frame={frame}
				ab={karten[0]}
				raus={aus(0)}
				y={540}
				zeilen={config.haekchen[1].zeilen}
				symbol={
					<svg viewBox="0 0 140 140" width={140} height={140}>
						<circle cx={70} cy={70} r={62} fill="none" stroke={COLORS.gold} strokeWidth={7} />
						<text x={70} y={92} textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize={60} fill={COLORS.goldLight}>
							0€
						</text>
					</svg>
				}
			/>
			<Karte
				frame={frame}
				ab={karten[1]}
				raus={aus(1)}
				y={540}
				zeilen={config.haekchen[4].zeilen}
				symbol={<BottlePicto size={140} draw={progress(frame, karten[1], 12)} fill={progress(frame, karten[1] + 8, 24, EASE.inOut)} wave={frame / 4} />}
			/>
			<Karte
				frame={frame}
				ab={karten[2]}
				raus={aus(2)}
				y={540}
				zeilen={config.haekchen[5].zeilen}
				symbol={<ParkingPicto size={140} draw={progress(frame, karten[2], 12)} pop={progress(frame, karten[2] + 10, 10, EASE.snap)} />}
			/>
			<Karte
				frame={frame}
				ab={karten[3]}
				raus={aus(3)}
				y={540}
				zeilen={config.haekchen[0].zeilen}
				symbol={<ChainPicto size={140} draw={progress(frame, karten[3], 12)} brk={interpolate(frame, [karten[3] + 16, karten[3] + 40], [0, 1], clamp)} />}
			/>
			<div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 60%, ${COLORS.goldLight}, #6B5020)`, opacity: licht}} />
		</div>
	);
};
