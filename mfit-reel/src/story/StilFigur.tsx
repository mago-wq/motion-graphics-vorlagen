// Stilbild 1: Nachts vor dem MFit-Studio. Die Figur tritt vor den Face-ID-Scanner,
// Lichtkegel vom Scanner aufs Gesicht, drinnen warmes Licht. Flacher Illustrationsstil
// in Markenfarben statt Pastell.
import {AbsoluteFill} from 'remotion';
import {FontGate} from '../components/FontGate';
import {GoldDefs} from '../components/Glyphs';
import {At} from '../components/Layout';
import {LogoMark} from '../components/Logo';
import {FacePicto} from '../components/Pictograms';
import {Line, TextLine} from '../components/Type';
import {COLORS, DISPLAY_FONT} from '../theme';
import {TYPE_WIDTH} from '../video';
import {Person, POSE_SCAN} from './Person';

const GROUND = 1700;
const STARS = Array.from({length: 34}, (_, i) => ({
	x: (i * 367 + 83) % 1080,
	y: 40 + ((i * 211) % 520),
	r: 1.4 + ((i * 7) % 3) * 0.8,
	o: 0.25 + ((i * 13) % 5) * 0.1,
}));

export const StilFigur: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: COLORS.bg}}>
		<GoldDefs />
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="sf-himmel" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#0D1320" />
					<stop offset="100%" stopColor="#0B0C10" />
				</linearGradient>
				<linearGradient id="sf-innen" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#4A3714" />
					<stop offset="100%" stopColor="#1E170B" />
				</linearGradient>
				<linearGradient id="sf-glas" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#141922" />
					<stop offset="100%" stopColor="#0B0D11" />
				</linearGradient>
				<linearGradient id="sf-licht" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#D4A83D" stopOpacity={0.16} />
					<stop offset="100%" stopColor="#D4A83D" stopOpacity={0} />
				</linearGradient>
				<mask id="sf-mond">
					<rect width={1080} height={1920} fill="white" />
					<circle cx={906} cy={150} r={50} fill="black" />
				</mask>
			</defs>
			{/* Himmel, Sterne, Mondsichel */}
			<rect width={1080} height={700} fill="url(#sf-himmel)" />
			{STARS.map((s, i) => (
				<circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#F4F1EA" opacity={s.o} />
			))}
			<circle cx={884} cy={170} r={56} fill={COLORS.gold} mask="url(#sf-mond)" />

			{/* Fassade */}
			<rect x={0} y={640} width={1080} height={GROUND - 640} fill="#1A1C22" />
			{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
				<rect key={i} x={0} y={700 + i * 124} width={1080} height={2} fill="#FFFFFF" opacity={0.025} />
			))}
			<rect x={0} y={640} width={1080} height={14} fill="#23262E" />
			<rect x={0} y={GROUND - 26} width={1080} height={26} fill="#15161A" />

			{/* Fenster mit Trainingsfläche dahinter */}
			<rect x={40} y={760} width={380} height={640} rx={6} fill="url(#sf-innen)" />
			{[110, 200, 290, 380].map((x) => (
				<ellipse key={x} cx={x} cy={790} rx={26} ry={6} fill="#F8E39C" opacity={0.75} />
			))}
			{/* Hantelablage */}
			<rect x={70} y={1250} width={300} height={14} rx={4} fill="#120E07" />
			<rect x={80} y={1264} width={12} height={130} fill="#120E07" />
			<rect x={348} y={1264} width={12} height={130} fill="#120E07" />
			{[100, 150, 200, 250, 300].map((x, i) => (
				<g key={x} fill="#120E07">
					<circle cx={x + 8} cy={1232 - i * 2} r={18 + i * 2} />
					<rect x={x - 10} y={1226 - i * 2} width={36} height={10} />
				</g>
			))}
			{/* Laufband */}
			<path d="M 120 1180 L 250 1180 L 300 1120 L 312 1128 L 268 1196 L 120 1196 Z" fill="#120E07" />
			<rect x={292} y={1040} width={14} height={90} fill="#120E07" transform="rotate(12 299 1085)" />
			<rect x={40} y={760} width={380} height={640} rx={6} fill="none" stroke={COLORS.gold} strokeWidth={5} />
			<rect x={228} y={760} width={4} height={640} fill={COLORS.gold} />
			{/* Lichtfall aufs Pflaster */}
			<path d={`M 40 ${GROUND} L 420 ${GROUND} L 560 1920 L -60 1920 Z`} fill="url(#sf-licht)" />

			{/* Tür mit Logo und 24/7 */}
			<rect x={740} y={720} width={280} height={GROUND - 720} fill="url(#sf-glas)" />
			<path d={`M 760 ${GROUND - 40} L 1000 780`} stroke="#FFFFFF" strokeWidth={60} opacity={0.035} />
			<rect x={740} y={720} width={280} height={GROUND - 720} fill="none" stroke={COLORS.gold} strokeWidth={6} />
			<rect x={766} y={1120} width={10} height={180} rx={5} fill={COLORS.gold} />
			<text x={880} y={1010} textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize={64} fill={COLORS.gold} opacity={0.9}>
				24/7
			</text>

			{/* Scanner an der Wand, Lichtkegel aufs Gesicht */}
			<path d="M 668 880 L 566 846 L 566 944 L 668 920 Z" fill={COLORS.gold} opacity={0.16} />
			<rect x={656} y={836} width={70} height={128} rx={14} fill="#0E0F12" stroke={COLORS.gold} strokeWidth={3} />

			{/* Pflaster */}
			<rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#111216" />
			<rect x={0} y={GROUND} width={1080} height={6} fill="#26282F" />

			<Person pose={POSE_SCAN} x={470} y={GROUND} scale={0.8} />
		</svg>

		{/* Face-ID-Symbol im Scanner */}
		<div style={{position: 'absolute', left: 663, top: 872}}>
			<FacePicto size={56} draw={1} scan={0.55} scanOn={1} success={0} />
		</div>
		<div style={{position: 'absolute', left: 880 - 45, top: 646}}>
			<LogoMark height={62} />
		</div>

		<FontGate>
			<At y={338}>
				<Line text="03:17 Uhr." maxWidth={TYPE_WIDTH} maxSize={124} />
			</At>
			<At y={460}>
				<Line text="Tür auf." maxWidth={TYPE_WIDTH} maxSize={124} gold />
			</At>
			<At y={566}>
				<TextLine text="Zugang per Face-ID · 24/7 an den meisten Standorten" maxWidth={TYPE_WIDTH} maxSize={34} weight={500} color={COLORS.textMuted} />
			</At>
		</FontGate>
	</AbsoluteFill>
);
