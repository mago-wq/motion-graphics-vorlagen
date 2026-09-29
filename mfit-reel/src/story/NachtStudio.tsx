// Nachts vor dem MFit-Studio, animierbar: Schiebetür, Face-ID-Scanner mit Lichtkegel,
// Innenlicht, das beim Öffnen aufs Pflaster fällt. Zwei Ebenen, damit die Figur
// dazwischen liegt: `NachtHinten` (alles hinter der Figur) und `NachtVorn` (rechter
// Türpfosten und Wandstück – dahinter verschwindet die Figur beim Hineingehen).
import {FacePicto} from '../components/Pictograms';
import {LogoMark} from '../components/Logo';
import {COLORS, DISPLAY_FONT} from '../theme';

export const NACHT = {
	/** Fassade endet hier, davor Pflaster */
	sockel: 1700,
	tuer: {x: 740, y: 720, w: 280},
	scanner: {x: 656, y: 912, w: 70, h: 128},
} as const;

export type NachtZustand = {
	/** 0 zu, 1 offen */
	tuer: number;
	/** Scanlinie im Scanner: Sichtbarkeit und Position (fortlaufend, 1 = ein Durchlauf) */
	scanAn: number;
	scanPos: number;
	/** 0 → 1 beim erfolgreichen Scan */
	erfolg: number;
	/** Gesichtsmitte der Figur (Ziel des Lichtkegels), sonst null */
	gesicht: {x: number; y: number} | null;
};

const STARS = Array.from({length: 34}, (_, i) => ({
	x: (i * 367 + 83) % 1080,
	y: 40 + ((i * 211) % 520),
	r: 1.4 + ((i * 7) % 3) * 0.8,
	o: 0.25 + ((i * 13) % 5) * 0.1,
}));

const T = NACHT.tuer;
const TUER_H = NACHT.sockel - T.y;
const S = NACHT.scanner;

export const NachtHinten: React.FC<{z: NachtZustand}> = ({z}) => {
	const schieben = z.tuer * (T.w + 12);
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="nh-himmel" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#0D1320" />
					<stop offset="100%" stopColor="#0B0C10" />
				</linearGradient>
				<linearGradient id="nh-innen" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#4A3714" />
					<stop offset="100%" stopColor="#1E170B" />
				</linearGradient>
				<linearGradient id="nh-tuerlicht" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#6B5020" />
					<stop offset="55%" stopColor="#3A2C12" />
					<stop offset="100%" stopColor="#2A200D" />
				</linearGradient>
				<linearGradient id="nh-glas" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#141922" />
					<stop offset="100%" stopColor="#0B0D11" />
				</linearGradient>
				<linearGradient id="nh-licht" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#D4A83D" stopOpacity={0.16} />
					<stop offset="100%" stopColor="#D4A83D" stopOpacity={0} />
				</linearGradient>
				<linearGradient id="nh-kegel" x1="1" y1="0" x2="0" y2="0">
					<stop offset="0%" stopColor="#F8E39C" stopOpacity={0.34} />
					<stop offset="100%" stopColor="#F8E39C" stopOpacity={0.05} />
				</linearGradient>
				<clipPath id="nh-oeffnung">
					<rect x={T.x} y={T.y} width={T.w} height={TUER_H} />
				</clipPath>
				<mask id="nh-mond">
					<rect width={1080} height={1920} fill="white" />
					<circle cx={906} cy={150} r={50} fill="black" />
				</mask>
			</defs>
			{/* Himmel, Sterne, Mondsichel */}
			<rect width={1080} height={700} fill="url(#nh-himmel)" />
			{STARS.map((s, i) => (
				<circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#F4F1EA" opacity={s.o} />
			))}
			<circle cx={884} cy={170} r={56} fill={COLORS.gold} mask="url(#nh-mond)" />

			{/* Fassade */}
			<rect x={0} y={640} width={1080} height={NACHT.sockel - 640} fill="#1A1C22" />
			{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
				<rect key={i} x={0} y={700 + i * 124} width={1080} height={2} fill="#FFFFFF" opacity={0.025} />
			))}
			<rect x={0} y={640} width={1080} height={14} fill="#23262E" />
			<rect x={0} y={NACHT.sockel - 26} width={1080} height={26} fill="#15161A" />

			{/* Fenster mit Trainingsfläche dahinter */}
			<rect x={40} y={760} width={380} height={640} rx={6} fill="url(#nh-innen)" />
			{[110, 200, 290, 380].map((x) => (
				<ellipse key={x} cx={x} cy={790} rx={26} ry={6} fill="#F8E39C" opacity={0.75} />
			))}
			<rect x={70} y={1250} width={300} height={14} rx={4} fill="#120E07" />
			<rect x={80} y={1264} width={12} height={130} fill="#120E07" />
			<rect x={348} y={1264} width={12} height={130} fill="#120E07" />
			{[100, 150, 200, 250, 300].map((x, i) => (
				<g key={x} fill="#120E07">
					<circle cx={x + 8} cy={1232 - i * 2} r={18 + i * 2} />
					<rect x={x - 10} y={1226 - i * 2} width={36} height={10} />
				</g>
			))}
			<path d="M 120 1180 L 250 1180 L 300 1120 L 312 1128 L 268 1196 L 120 1196 Z" fill="#120E07" />
			<rect x={292} y={1040} width={14} height={90} fill="#120E07" transform="rotate(12 299 1085)" />
			<rect x={40} y={760} width={380} height={640} rx={6} fill="none" stroke={COLORS.gold} strokeWidth={5} />
			<rect x={228} y={760} width={4} height={640} fill={COLORS.gold} />

			{/* Hinter der Tür: beleuchteter Eingang mit Boden und Deckenlicht */}
			<g clipPath="url(#nh-oeffnung)">
				<rect x={T.x} y={T.y} width={T.w} height={TUER_H} fill="url(#nh-tuerlicht)" />
				{[790, 900].map((x) => (
					<ellipse key={x} cx={x + 30} cy={T.y + 26} rx={40} ry={8} fill="#F8E39C" opacity={0.8} />
				))}
				<path d={`M ${T.x} ${NACHT.sockel - 120} L ${T.x + T.w} ${NACHT.sockel - 170} L ${T.x + T.w} ${NACHT.sockel} L ${T.x} ${NACHT.sockel} Z`} fill="#241B0B" />
				{/* Glastür, schiebt nach rechts in die Wand */}
				<g transform={`translate(${schieben} 0)`}>
					<rect x={T.x} y={T.y} width={T.w} height={TUER_H} fill="url(#nh-glas)" />
					<path d={`M ${T.x + 20} ${NACHT.sockel - 40} L ${T.x + 260} ${T.y + 60}`} stroke="#FFFFFF" strokeWidth={60} opacity={0.035} />
					<rect x={T.x + 26} y={1120} width={10} height={180} rx={5} fill={COLORS.gold} />
					<text x={T.x + 140} y={1010} textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize={64} fill={COLORS.gold} opacity={0.9}>
						24/7
					</text>
				</g>
			</g>
			{/* Linker Türpfosten und Sturz (hinter der Figur) */}
			<rect x={T.x - 3} y={T.y - 3} width={6} height={TUER_H + 3} fill={COLORS.gold} />
			<rect x={T.x - 3} y={T.y - 3} width={T.w + 6} height={6} fill={COLORS.gold} />

			{/* Pflaster; Licht aus Fenster und (geöffneter) Tür */}
			<rect x={0} y={NACHT.sockel} width={1080} height={1920 - NACHT.sockel} fill="#111216" />
			<rect x={0} y={NACHT.sockel} width={1080} height={6} fill="#26282F" />
			<path d={`M 40 ${NACHT.sockel} L 420 ${NACHT.sockel} L 560 1920 L -60 1920 Z`} fill="url(#nh-licht)" />
			<path
				d={`M ${T.x} ${NACHT.sockel} L ${T.x + T.w} ${NACHT.sockel} L 1180 1920 L ${T.x - 120} 1920 Z`}
				fill="url(#nh-licht)"
				opacity={z.tuer * 1.6}
			/>

			{/* Scanner an der Wand und Lichtkegel aufs Gesicht */}
			{z.gesicht && z.scanAn > 0 ? (
				<path
					d={`M ${S.x + 10} ${S.y + 40} L ${z.gesicht.x + 34} ${z.gesicht.y - 62} L ${z.gesicht.x + 34} ${z.gesicht.y + 58} L ${S.x + 10} ${S.y + 88} Z`}
					fill="url(#nh-kegel)"
					opacity={z.scanAn}
				/>
			) : null}
			<rect x={S.x} y={S.y} width={S.w} height={S.h} rx={14} fill="#0E0F12" stroke={COLORS.gold} strokeWidth={3} />
			<circle cx={S.x + S.w / 2} cy={S.y + S.h / 2} r={60 + 50 * z.erfolg} fill="none" stroke={COLORS.goldLight} strokeWidth={4} opacity={z.erfolg > 0 && z.erfolg < 1 ? 0.8 * (1 - z.erfolg) : 0} />
		</svg>
	);
};

/** Ebenen vor der Figur: rechter Türpfosten, Wandstück rechts der Tür, Scan auf dem Gesicht */
export const NachtVorn: React.FC<{z: NachtZustand}> = ({z}) => {
	const rechts = T.x + T.w;
	const g = z.gesicht;
	const scanY = g ? g.y - 58 + (((z.scanPos % 1) + 1) % 1) * 116 : 0;
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="nv-strahl" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%" stopColor="#F8E39C" stopOpacity={0} />
					<stop offset="45%" stopColor="#F8E39C" stopOpacity={0.9} />
					<stop offset="100%" stopColor="#F8E39C" stopOpacity={0.2} />
				</linearGradient>
			</defs>
			<rect x={rechts} y={640} width={1080 - rechts} height={NACHT.sockel - 640} fill="#1A1C22" />
			{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
				<rect key={i} x={rechts} y={700 + i * 124} width={1080 - rechts} height={2} fill="#FFFFFF" opacity={0.025} />
			))}
			<rect x={rechts} y={NACHT.sockel - 26} width={1080 - rechts} height={26} fill="#15161A" />
			<rect x={rechts - 3} y={T.y - 3} width={6} height={TUER_H + 3} fill={COLORS.gold} />
			{/* Scanlinie über das Gesicht */}
			{g && z.scanAn > 0 ? (
				<g opacity={z.scanAn}>
					<rect x={g.x - 52} y={scanY - 2} width={104} height={4} rx={2} fill="url(#nv-strahl)" />
					<rect x={g.x - 52} y={scanY - 9} width={104} height={18} rx={9} fill="url(#nv-strahl)" opacity={0.18} />
				</g>
			) : null}
		</svg>
	);
};

/** Face-ID-Symbol im Scanner und Logo über der Tür (HTML-Ebene über dem SVG) */
export const NachtSymbole: React.FC<{z: NachtZustand}> = ({z}) => (
	<>
		<div style={{position: 'absolute', left: S.x + 7, top: S.y + 36}}>
			<FacePicto size={56} draw={1} scan={z.scanPos} scanOn={z.scanAn} success={z.erfolg} />
		</div>
		<div style={{position: 'absolute', left: T.x + T.w / 2 - 45, top: 646}}>
			<LogoMark height={62} />
		</div>
	</>
);
