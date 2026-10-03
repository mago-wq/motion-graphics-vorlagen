// Szene 4 – „Krümel“: Die Figur rennt einer Münze hinterher, die an einer Angel
// hängt – und die Angel ist an ihrem eigenen Rücken festgeschnallt.
// Die Jagd kann nie enden. Von der Münze rieseln nur Krümel.
import {random, useCurrentFrame} from 'remotion';
import {CONFIG} from '../config';
import {Figure, type Pose} from '../components/Figure';
import {SceneShell} from '../components/SceneShell';
import {TITLE_FONT} from '../fonts';
import {lightLevel, tween} from '../motion';
import {T} from '../timing';

const ORIGIN: [number, number] = [430, 1200];
const SCALE = 1.7;
const GROUND = 168;
const RUN = 0.43; // Schrittphase pro Frame (≈ 2 Doppelschritte/s)
const SCROLL = 15; // Bodenlauf pro Frame (lokale Einheiten)
const CRUMB_EVERY = 7;

const runPose = (p: number): Pose => {
	const leg = (q: number): [number, number] => [12 + 62 * Math.sin(q), 158 - Math.max(0, Math.cos(q)) * 46];
	const arm = (q: number): [number, number] => [56 - 66 * Math.sin(q), -34 - 34 * Math.max(0, -Math.sin(q))];
	return {
		neck: [52, -100],
		head: [82, -140],
		lFoot: leg(p),
		rFoot: leg(p + Math.PI),
		lHand: arm(p),
		rHand: arm(p + Math.PI),
		bend: {lArm: 1, rArm: 1, lLeg: -1, rLeg: -1},
	};
};

export const KruemelScene: React.FC = () => {
	const frame = useCurrentFrame();
	const t = T.kruemel;
	const level = lightLevel(frame, t.from, t.to);
	if (level === 0) return null;
	const f = frame - t.from;
	const ink = CONFIG.colors.ink;

	const p = f * RUN;
	const bob = -Math.abs(Math.sin(p)) * 10;
	const pose = runPose(p);

	// Angel: vom Rücken über den Kopf nach vorn, Münze pendelt an der Schnur
	const rodBase: [number, number] = [8, -92 + bob];
	const tip: [number, number] = [318, -268 + bob * 0.6 + Math.sin(p) * 4];
	const swing = Math.sin(f * 0.19) * 0.22;
	const stringLen = 170;
	const coin: [number, number] = [tip[0] + Math.sin(swing) * stringLen, tip[1] + Math.cos(swing) * stringLen];

	// Krümel: fallen von der Münze, bleiben auf dem Boden zurück und ziehen davon
	const crumbs = [];
	for (let k = Math.max(0, Math.floor(f / CRUMB_EVERY) - 8); k <= Math.floor(f / CRUMB_EVERY); k++) {
		const born = k * CRUMB_EVERY + 4;
		const age = f - born;
		if (age < 0) continue;
		const fallT = Math.min(age, 14);
		const x0 = coin[0] + (random(`cx${k}`) - 0.5) * 30;
		const y = Math.min(GROUND - 4, coin[1] + 30 + 0.85 * fallT * fallT);
		const x = x0 - (age > 14 ? (age - 14) * SCROLL : 0) - age * 1.5;
		const size = 6 + random(`cs${k}`) * 6;
		crumbs.push(<rect key={k} x={x} y={y - size} width={size} height={size} rx={1.5} fill={ink} transform={`rotate(${random(`cr${k}`) * 90} ${x} ${y})`} opacity={x < -260 ? 0 : 1} />);
	}

	// Bodenstriche laufen nach links, Tempolinien hinter der Figur
	const dashes = [];
	for (let i = -4; i < 10; i++) {
		const x = ((i * 90 - f * SCROLL) % 1260 + 1260) % 1260 - 380;
		dashes.push(<path key={i} d={`M${x} ${GROUND} h48`} stroke={ink} strokeWidth={7} strokeLinecap="round" />);
	}
	const speed = [-60, -110, 20].map((y, i) => {
		const ph = ((f * 2.2 + i * 13) % 26) / 26;
		const x = -90 - ph * 170;
		return <path key={i} d={`M${x} ${y} h${70 - ph * 40}`} stroke={ink} strokeWidth={6} strokeLinecap="round" opacity={1 - ph} />;
	});
	// Schweißtropfen fliegen nach hinten weg
	const drops = [0, 1].map((i) => {
		const ph = ((f + i * 11) % 22) / 22;
		const x = 40 - ph * 120;
		const y = -190 - Math.sin(ph * Math.PI) * 40 + ph * 50 + bob;
		return <ellipse key={i} cx={x} cy={y} rx={6} ry={9} fill={ink} opacity={1 - ph} transform={`rotate(-40 ${x} ${y})`} />;
	});

	const enter = tween(f, 0, 14, -60, 0);

	return (
		<SceneShell line={CONFIG.lines.kruemel} timing={t} level={level} color={ink} subtitle={{top: 270, fontSize: 60}} spotlightY={56}>
			<g transform={`translate(${ORIGIN[0]} ${ORIGIN[1]}) scale(${SCALE})`}>
				{dashes}
				{crumbs}
				<g transform={`translate(${enter} ${bob})`}>
					{speed}
					{drops}
					<path d={`M${rodBase[0]} ${rodBase[1] - bob} Q${120} ${-330} ${tip[0]} ${tip[1] - bob}`} fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />
					<path d={`M${tip[0]} ${tip[1] - bob} L${coin[0]} ${coin[1] - bob}`} stroke={ink} strokeWidth={3} />
					<g transform={`translate(${coin[0]} ${coin[1] - bob}) rotate(${swing * 40})`}>
						<circle r={34} fill={ink} />
						<circle r={25} fill="none" stroke="#000" strokeWidth={3} />
						<text textAnchor="middle" dy={11} fontFamily={TITLE_FONT} fontWeight={900} fontSize={30} fill="#000">
							€
						</text>
					</g>
					<Figure pose={pose} color={ink} far="#9c9c9c" face="up" />
				</g>
			</g>
		</SceneShell>
	);
};
