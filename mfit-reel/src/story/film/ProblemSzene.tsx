// Szene 1 (0–3,5 s): 22:47 Uhr. Der Mann kommt müde die Straße entlang zu einem Studio –
// genau als er ankommt, rasselt der Rollladen herunter. Kalte Farben, kein Gold:
// das Problem. (Ein allgemeines Studio, kein bestimmtes.)
import {interpolate} from 'remotion';
import {clamp, impulse, progress, shake} from '../../motion';
import {DISPLAY_FONT, TEXT_FONT} from '../../theme';
import {macheGang} from '../figuren/gang';
import {LottieFigur} from '../figuren/LottieFigur';
import {LOTTIE_MANN_TRAURIG} from '../figuren/lottieMann';
import {Kopfzeile, schieben} from './teile';
import {Z} from './zeit';

const P = Z.problem;
const BODEN = 1790;
const HOEHE = 856;
const TUER = {x: 640, y: 1030, w: 330};

export const PROBLEM_GANG = macheGang({
	frames: Z.handy.start + 2,
	start: {frame: 0, x: 40},
	halt: {frame: P.halt, x: 420},
	bremsen: 16,
	schliessen: 16,
});

const FENSTER = Array.from({length: 18}, (_, i) => ({
	x: 20 + ((i * 97) % 480),
	y: 520 + ((i * 53) % 220),
	an: (i * 7) % 3 === 0,
}));

export const ProblemSzene: React.FC<{frame: number}> = ({frame}) => {
	if (frame > P.raus + 16) return null;
	const weg = schieben(frame, P.raus, 15);
	const zoom = interpolate(frame, [0, P.raus], [1, 1.05], clamp);
	// Rollladen: fährt herunter und schlägt unten auf
	const runter = interpolate(frame, [P.rollladen, P.halt], [0, 1], {...clamp, easing: (t) => t * t});
	const unten = TUER.y + (BODEN - 10 - TUER.y) * runter;
	const stoss = shake(frame, P.halt, 7, 8);
	const x = PROBLEM_GANG.hueftX(frame);
	return (
		<div style={{position: 'absolute', inset: 0, transform: `translateY(${-weg * 1920}px)`}}>
			<div style={{position: 'absolute', inset: 0, transform: `translate(${stoss.x}px, ${stoss.y}px) scale(${zoom})`, transformOrigin: '540px 1150px'}}>
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					<defs>
						<linearGradient id="pr-himmel" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#070B14" />
							<stop offset="100%" stopColor="#141A28" />
						</linearGradient>
						<linearGradient id="pr-lampe" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#B9CCE8" stopOpacity={0.2} />
							<stop offset="100%" stopColor="#B9CCE8" stopOpacity={0.02} />
						</linearGradient>
					</defs>
					<rect width={1080} height={1920} fill="url(#pr-himmel)" />
					{/* Häuser in der Ferne */}
					<path d="M 0 760 V 520 H 90 V 470 H 170 V 560 H 250 V 430 H 360 V 540 H 430 V 600 H 520 V 760 Z" fill="#0E1320" />
					{FENSTER.map((w, i) => (
						<rect key={i} x={w.x} y={w.y} width={16} height={22} fill={w.an ? '#6F86A8' : '#141B2B'} opacity={w.an ? 0.35 : 1} />
					))}
					{/* Straßenlaterne mit kaltem Licht */}
					<path d="M 120 760 L 40 1800 L 330 1800 Z" fill="url(#pr-lampe)" />
					<rect x={112} y={720} width={12} height={1080} fill="#1E2432" />
					<rect x={96} y={712} width={60} height={16} rx={8} fill="#2A3142" />
					<ellipse cx={126} cy={732} rx={26} ry={8} fill="#DDE7F7" opacity={0.85} />
					{/* Studio-Fassade (kalt, unbeleuchtet) */}
					<rect x={520} y={780} width={560} height={BODEN - 780} fill="#1A1F29" />
					{[0, 1, 2, 3, 4, 5, 6].map((i) => (
						<rect key={i} x={520} y={840 + i * 130} width={560} height={2} fill="#FFFFFF" opacity={0.03} />
					))}
					<rect x={560} y={850} width={480} height={110} rx={10} fill="#232A36" />
					<text x={800} y={926} textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize={66} fill="#3B4454" letterSpacing={8}>
						FITNESS
					</text>
					{/* Eingang: dunkles Glas, darüber der Rollladenkasten */}
					<rect x={TUER.x} y={TUER.y} width={TUER.w} height={BODEN - TUER.y} fill="#0B0E14" />
					<rect x={TUER.x - 14} y={TUER.y - 34} width={TUER.w + 28} height={40} rx={6} fill="#2A303C" />
					{/* Rollladen mit Lamellen */}
					<g>
						<rect x={TUER.x} y={TUER.y} width={TUER.w} height={unten - TUER.y} fill="#3A404C" />
						{Array.from({length: 40}, (_, i) => TUER.y + i * 19).filter((y) => y < unten - 6).map((y) => (
							<rect key={y} x={TUER.x} y={unten - 6 - (y - TUER.y)} width={TUER.w} height={3} fill="#2C313B" />
						))}
						<rect x={TUER.x} y={unten - 16} width={TUER.w} height={16} fill="#4A515E" />
						{runter > 0.55 ? (
							<g opacity={progress(frame, P.rollladen + 14, 6)}>
								<rect x={TUER.x + 25} y={unten - 330} width={280} height={78} rx={8} fill="#C9CFD9" />
								<text x={TUER.x + 165} y={unten - 280} textAnchor="middle" fontFamily={TEXT_FONT} fontWeight={800} fontSize={28} fill="#1A1F29" letterSpacing={1}>
									GESCHLOSSEN
								</text>
							</g>
						) : null}
					</g>
					{/* Gehweg */}
					<rect x={0} y={BODEN - 10} width={1080} height={1920 - BODEN + 10} fill="#10131A" />
					<rect x={0} y={BODEN - 10} width={1080} height={5} fill="#232936" />
					{/* Staub beim Aufschlag */}
					{frame >= P.halt && frame < P.halt + 14 ? (
						<g opacity={1 - (frame - P.halt) / 14}>
							{[-1, 1].map((s) => (
								<ellipse key={s} cx={TUER.x + TUER.w / 2 + s * (60 + (frame - P.halt) * 9)} cy={BODEN - 12} rx={40} ry={8} fill="#8C96A8" opacity={0.25} />
							))}
						</g>
					) : null}
				</svg>
				<LottieFigur figur={LOTTIE_MANN_TRAURIG} gang={PROBLEM_GANG} frame={frame} x={x} boden={BODEN} hoehe={HOEHE} />
			</div>
			<Kopfzeile frame={frame} y={338} text="22:47 Uhr." ab={P.uhr} />
			<Kopfzeile frame={frame} y={460} text="Studio zu." ab={P.zu} color="#8FA3C0" />
			<div style={{position: 'absolute', inset: 0, background: '#000', opacity: 0.12 * impulse(frame, P.halt, 6), pointerEvents: 'none'}} />
		</div>
	);
};
