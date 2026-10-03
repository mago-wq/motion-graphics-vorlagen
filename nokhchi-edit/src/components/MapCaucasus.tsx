// Animierte Karte des Kaukasus: Dzurdzuketien (3. Jh. v. Chr.) → Simsir (1362–1395) → Timurs Feldzug 1395.
// Alle Linien liegen auf echten Koordinaten (Länge/Breite), die Kamera fährt per Projektion – Linienstärken
// und Schrift bleiben dadurch beim Zoomen gleich.
//
// Belege: Dzurdzuketien – georgische Chroniken (Leonti Mroweli): Bergland nördlich des Hauptkamms
// zwischen Darial-Schlucht und Argun. Simsir – Zafarnama (Schami, Yazdi): Ostteil Tschetscheniens bis in
// die Kumyken-Ebene, Hauptort Simsir (43,012° N, 46,466° E); Grenzen nach der Karte „Caucasus about
// year 1124“ (Commons, D. Mataev). Schlacht am Terek: 14. April 1395, 43°35′ N 47°27′ E. Timurs Weg nach
// Simsir: Brücke über die Sunscha südlich von Braguny, Kämpfe bei Gudermes, Chankala, Argun-Schlucht.
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {F} from '../fonts';
import {C} from '../theme';

type LL = [number, number]; // [Länge, Breite]

const BLACK_SEA: LL[] = [
	[27.5, 42.5], [28.0, 43.5], [28.6, 44.3], [29.6, 45.3], [30.8, 46.5], [31.5, 46.6], [32.5, 45.4], [33.4, 44.55],
	[34.3, 44.45], [35.1, 44.8], [36.45, 45.05], [36.65, 45.25], [37.32, 44.89], [37.77, 44.72], [38.06, 44.56],
	[39.07, 44.1], [39.72, 43.58], [40.27, 43.29], [41.02, 43.0], [41.47, 42.71], [41.67, 42.15], [41.64, 41.64],
	[41.43, 41.39], [40.52, 41.03], [39.72, 41.0], [38.4, 40.95], [37.0, 41.15], [35.9, 41.7], [35.0, 42.05],
	[33.5, 42.0], [32.2, 41.6], [31.2, 41.1], [29.1, 41.2], [28.0, 41.6],
];
const AZOV: LL[] = [
	[35.4, 45.35], [36.6, 45.45], [37.5, 46.05], [38.3, 46.25], [39.2, 47.25], [38.0, 47.1], [37.0, 46.95],
	[35.9, 46.6], [35.1, 46.25], [34.9, 45.8],
];
const CASPIAN: LL[] = [
	[49.5, 46.6], [48.6, 46.2], [47.9, 45.7], [47.4, 45.4], [47.1, 44.95], [46.9, 44.6], [47.0, 44.3], [47.3, 44.0],
	[47.55, 43.6], [47.5, 43.3], [47.5, 42.98], [47.64, 42.88], [47.87, 42.56], [48.29, 42.06], [48.6, 41.82],
	[48.9, 41.55], [49.11, 41.08], [49.5, 40.75], [49.67, 40.59], [50.37, 40.47], [50.0, 40.25], [49.5, 40.0],
	[49.3, 39.5], [48.95, 38.9], [48.85, 38.4], [49.0, 37.6], [50.5, 37.0], [52.0, 36.8], [53.9, 37.3], [55, 38],
	[55, 47], [51.5, 47.2], [50.5, 46.9],
];
const RIDGE: LL[] = [
	[37.4, 44.85], [38.3, 44.4], [39.4, 43.95], [40.4, 43.55], [41.4, 43.35], [42.44, 43.35], [43.2, 42.95],
	[44.0, 42.75], [44.52, 42.7], [45.33, 42.57], [46.0, 42.4], [46.7, 42.0], [47.85, 41.22], [48.7, 41.0], [49.4, 40.75],
];
const TEREK: LL[] = [
	[44.4, 42.6], [44.63, 42.75], [44.67, 43.03], [44.5, 43.2], [44.25, 43.33], [44.05, 43.62], [44.3, 43.72],
	[44.65, 43.73], [45.2, 43.68], [45.8, 43.62], [46.25, 43.65], [46.71, 43.85], [47.1, 43.72], [47.45, 43.58], [47.55, 43.6],
];
const SUNZHA: LL[] = [[44.7, 43.08], [44.9, 43.28], [45.3, 43.36], [45.7, 43.32], [46.0, 43.36], [46.17, 43.45], [46.25, 43.62]];
const ARGUN: LL[] = [[45.28, 42.48], [45.58, 42.73], [45.68, 42.87], [45.8, 43.12], [45.88, 43.3], [45.95, 43.36]];

const DZURDZUKETIA: LL[] = [
	[44.55, 42.7], [45.0, 42.64], [45.33, 42.57], [45.7, 42.48], [45.95, 42.48], [46.05, 42.75], [45.95, 43.0],
	[45.5, 43.08], [45.0, 43.05], [44.75, 42.98], [44.55, 42.85],
];
const SIMSIR: LL[] = [
	[45.6, 42.95], [46.1, 42.85], [46.55, 42.85], [46.75, 43.05], [46.85, 43.4], [46.7, 43.75], [46.2, 43.68],
	[45.7, 43.62], [45.4, 43.45], [45.45, 43.15],
];
const SIMSIR_CAPITAL: LL = [46.466, 43.012];
const DARIAL: LL = [44.63, 42.75];
const GROZNY: LL = [45.7, 43.32];
const DERBENT: LL = [48.29, 42.06];
const BATTLE: LL = [47.45, 43.58];
const TIMUR_NORTH: LL[] = [DERBENT, [47.95, 42.55], [47.62, 42.98], [47.42, 43.3], BATTLE];
const HORDE_SOUTH: LL[] = [[46.6, 45.6], [46.9, 44.9], [47.2, 44.25], BATTLE];
const TIMUR_SIMSIR: LL[] = [BATTLE, [47.05, 43.66], [46.6, 43.6], [46.2, 43.45], [46.1, 43.35], [45.77, 43.3], [45.76, 43.02]];
const GUDERMES: LL = [46.1, 43.35];
const KHANKALA: LL = [45.77, 43.3];
const BRIDGE: LL = [46.2, 43.45];

type Cam = {lon: number; lat: number; k: number};
const COS = Math.cos((43 * Math.PI) / 180);

const ease = Easing.bezier(0.45, 0, 0.2, 1);

/** Kamerafahrt über Keyframes [frame, Kamera] */
const camAt = (frame: number, keys: [number, Cam][]): Cam => {
	if (frame <= keys[0][0]) return keys[0][1];
	for (let i = 1; i < keys.length; i++) {
		const [f1, c1] = keys[i];
		const [f0, c0] = keys[i - 1];
		if (frame <= f1) {
			const t = ease((frame - f0) / Math.max(1, f1 - f0));
			// Zoom logarithmisch interpolieren, sonst „springt“ er am Ende
			const k = Math.exp(Math.log(c0.k) + (Math.log(c1.k) - Math.log(c0.k)) * t);
			return {lon: c0.lon + (c1.lon - c0.lon) * t, lat: c0.lat + (c1.lat - c0.lat) * t, k};
		}
	}
	return keys[keys.length - 1][1];
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ramp = (frame: number, a: number, b: number) => clamp01((frame - a) / Math.max(1, b - a));

export const MapCaucasus: React.FC<{b: number[]}> = ({b}) => {
	const frame = useCurrentFrame();
	// Phasen hängen an den Schlägen des Chants (b = lokale Frames der 16 Schläge)
	const P = {
		zoomIn: [b[1], b[3] + 8],
		rivers: [b[2], b[3] + 6],
		dzurdzuk: b[2] + 8,
		simsir: b[6],
		war: b[8],
		battle: b[10],
		sack: b[11],
	};
	const cam = camAt(frame, [
		[0, {lon: 43.6, lat: 43.2, k: 68}],
		[P.zoomIn[0], {lon: 43.9, lat: 43.1, k: 80}],
		[P.zoomIn[1], {lon: 45.3, lat: 42.85, k: 470}],
		[P.simsir - 2, {lon: 45.35, lat: 42.9, k: 480}],
		[P.simsir + 14, {lon: 45.95, lat: 43.15, k: 330}],
		[P.war, {lon: 45.95, lat: 43.15, k: 320}],
		[P.war + 16, {lon: 47.15, lat: 43.05, k: 190}],
		[P.battle + 6, {lon: 47.1, lat: 43.2, k: 200}],
		[P.sack + 10, {lon: 46.25, lat: 43.25, k: 300}],
	]);
	const xy = ([lon, lat]: LL): [number, number] => [540 + (lon - cam.lon) * cam.k * COS, 960 - (lat - cam.lat) * cam.k];
	const path = (pts: LL[], close = false) => pts.map((p, i) => `${i ? 'L' : 'M'}${xy(p)[0].toFixed(1)},${xy(p)[1].toFixed(1)}`).join(' ') + (close ? ' Z' : '');
	const len = (pts: LL[]) => pts.slice(1).reduce((s, p, i) => {
		const [x0, y0] = xy(pts[i]);
		const [x1, y1] = xy(p);
		return s + Math.hypot(x1 - x0, y1 - y0);
	}, 0);
	/** Linie, die sich von 0 bis 1 einzeichnet */
	const draw = (pts: LL[], p: number, style: React.SVGProps<SVGPathElement>) => {
		const L = len(pts);
		return <path d={path(pts)} fill="none" strokeDasharray={`${L} ${L}`} strokeDashoffset={L * (1 - clamp01(p))} strokeLinecap="round" strokeLinejoin="round" {...style} />;
	};
	const label = (pt: LL, text: string, o: number, size = 34, color: string = C.bone, dy = 0, mono = false, anchor: 'middle' | 'start' = 'middle', dx = 0) => {
		if (o <= 0) return null;
		const [x, y] = xy(pt);
		return (
			<text x={x + dx} y={y + dy} textAnchor={anchor} opacity={o} fill={color}
				style={{fontFamily: mono ? F.mono : F.serif, fontStyle: mono ? 'normal' : 'normal', fontWeight: mono ? 500 : 700, fontSize: size, letterSpacing: mono ? '0.12em' : '0.22em', textTransform: 'uppercase'}}
				stroke="#0b0807" strokeWidth={mono ? 5 : 7} paintOrder="stroke">
				{text}
			</text>
		);
	};
	const centroid = (pts: LL[]): LL => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

	const fadeIn = ramp(frame, 0, 6);
	const coastP = ramp(frame, 0, 34);
	const ridgeP = ramp(frame, 8, 42);
	const riverP = ramp(frame, P.rivers[0], P.rivers[1]);
	const dzO = ramp(frame, P.dzurdzuk, P.dzurdzuk + 8) * (1 - 0.65 * ramp(frame, P.simsir, P.simsir + 10));
	const simO = ramp(frame, P.simsir + 6, P.simsir + 14);
	const warO = ramp(frame, P.war, P.war + 6);
	const timurP = ramp(frame, P.war + 4, P.battle);
	const hordeP = ramp(frame, P.war + 8, P.battle);
	const battleAge = frame - P.battle;
	const sackP = ramp(frame, P.battle + 4, P.sack + 12);
	const sackAge = frame - P.sack;
	const burn = sackAge >= 0 ? 0.55 + 0.45 * Math.abs(Math.sin(sackAge / 2.3)) : 0;
	// Timurs Zeichen (drei Kreise) reitet an der Spitze seines Heerzugs
	const headAt = (pts: LL[], p: number): [number, number] => {
		const L = len(pts) * clamp01(p);
		let acc = 0;
		for (let i = 1; i < pts.length; i++) {
			const [x0, y0] = xy(pts[i - 1]);
			const [x1, y1] = xy(pts[i]);
			const d = Math.hypot(x1 - x0, y1 - y0);
			if (acc + d >= L) {
				const t = (L - acc) / Math.max(1e-6, d);
				return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
			}
			acc += d;
		}
		return xy(pts[pts.length - 1]);
	};
	const emblem = (x: number, y: number, o: number) => (
		<g opacity={o} transform={`translate(${x},${y})`}>
			<circle r={34} fill="#120d0c" stroke={C.gold} strokeWidth={3} />
			<circle cx={0} cy={-10} r={7.5} fill={C.gold} />
			<circle cx={-9} cy={6} r={7.5} fill={C.gold} />
			<circle cx={9} cy={6} r={7.5} fill={C.gold} />
		</g>
	);
	const [bx, by] = xy(BATTLE);
	const grat = [];
	for (let lon = 30; lon <= 56; lon++) grat.push(<path key={`lo${lon}`} d={path([[lon, 36], [lon, 48]])} stroke="rgba(239,232,218,0.05)" strokeWidth={1} />);
	for (let lat = 36; lat <= 48; lat++) grat.push(<path key={`la${lat}`} d={path([[26, lat], [56, lat]])} stroke="rgba(239,232,218,0.05)" strokeWidth={1} />);

	return (
		<AbsoluteFill style={{backgroundColor: '#120d0c', opacity: fadeIn}}>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920">
				<defs>
					<pattern id="sea" width={14} height={14} patternUnits="userSpaceOnUse">
						<rect width={14} height={14} fill="#0b1219" />
						<path d="M0 10 Q3.5 7 7 10 T14 10" stroke="rgba(143,166,191,0.16)" strokeWidth={1.2} fill="none" />
					</pattern>
					<pattern id="hatch" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
						<rect width={12} height={12} fill="rgba(200,20,30,0.28)" />
						<line x1={0} y1={0} x2={0} y2={12} stroke="rgba(200,20,30,0.75)" strokeWidth={3} />
					</pattern>
					<radialGradient id="vig" cx="50%" cy="50%" r="70%">
						<stop offset="60%" stopColor="rgba(0,0,0,0)" />
						<stop offset="100%" stopColor="rgba(0,0,0,0.75)" />
					</radialGradient>
				</defs>
				{grat}
				<path d={path(BLACK_SEA, true)} fill="url(#sea)" opacity={coastP} />
				<path d={path(AZOV, true)} fill="url(#sea)" opacity={coastP} />
				<path d={path(CASPIAN, true)} fill="url(#sea)" opacity={coastP} />
				{draw([...BLACK_SEA, BLACK_SEA[0]], coastP, {stroke: 'rgba(239,232,218,0.75)', strokeWidth: 2.2})}
				{draw([...AZOV, AZOV[0]], coastP, {stroke: 'rgba(239,232,218,0.6)', strokeWidth: 1.8})}
				{draw([...CASPIAN, CASPIAN[0]], coastP, {stroke: 'rgba(239,232,218,0.75)', strokeWidth: 2.2})}
				{/* Hauptkamm: breiter Schein + feine Linie */}
				{draw(RIDGE, ridgeP, {stroke: 'rgba(201,185,154,0.18)', strokeWidth: 26})}
				{draw(RIDGE, ridgeP, {stroke: '#d8c9a6', strokeWidth: 3.5})}
				{draw(TEREK, riverP, {stroke: '#6f93b0', strokeWidth: 3})}
				{draw(SUNZHA, riverP, {stroke: '#6f93b0', strokeWidth: 2.5})}
				{draw(ARGUN, riverP, {stroke: '#6f93b0', strokeWidth: 2.5})}
				{/* Dzurdzuketien */}
				<path d={path(DZURDZUKETIA, true)} fill="url(#hatch)" stroke={C.red} strokeWidth={3.5} opacity={dzO} />
				{/* Simsir */}
				<path d={path(SIMSIR, true)} fill="url(#hatch)" stroke={C.red} strokeWidth={4} opacity={simO} />
				{sackAge >= 0 ? <path d={path(SIMSIR, true)} fill="#ff5a14" opacity={0.28 * burn} /> : null}
				{/* Heerzüge 1395 */}
				<g opacity={warO}>
					{draw(HORDE_SOUTH, hordeP, {stroke: C.bone, strokeWidth: 5, strokeDasharray: undefined})}
					{draw(TIMUR_NORTH, timurP, {stroke: C.gold, strokeWidth: 7})}
					{draw(TIMUR_SIMSIR, sackP, {stroke: C.gold, strokeWidth: 7})}
				</g>
				{battleAge >= 0 ? (
					<g>
						<circle cx={bx} cy={by} r={30 + battleAge * 6} fill="none" stroke={C.red} strokeWidth={4} opacity={Math.max(0, 1 - battleAge / 14)} />
						<path d={`M${bx - 20},${by - 20} L${bx + 20},${by + 20} M${bx + 20},${by - 20} L${bx - 20},${by + 20}`} stroke={C.red} strokeWidth={9} strokeLinecap="round" />
					</g>
				) : null}
				{warO > 0 && timurP < 1 ? emblem(...headAt(TIMUR_NORTH, timurP), warO) : null}
				{sackP > 0 && sackP < 1 ? emblem(...headAt(TIMUR_SIMSIR, sackP), 1) : null}
				{/* Beschriftung */}
				{label([37.6, 43.0], 'Schwarzes Meer', ramp(frame, 18, 30) * (1 - ramp(frame, P.zoomIn[0], P.zoomIn[0] + 10)), 30, '#8fa6bf')}
				{label([50.4, 41.9], 'Kaspisches Meer', ramp(frame, 18, 30) * (1 - ramp(frame, P.zoomIn[0], P.zoomIn[0] + 10)), 30, '#8fa6bf')}
				{label([48.6, 42.9], 'Kaspisches Meer', warO, 30, '#8fa6bf')}
				{label([44.3, 42.25], 'Kartli · Iberien', ramp(frame, P.dzurdzuk + 4, P.dzurdzuk + 12) * (1 - ramp(frame, P.simsir, P.simsir + 6)), 34, C.boneDim)}
				{label(centroid(DZURDZUKETIA), 'Dzurdzuketien', dzO, 40, C.bone, 0)}
				{label(DARIAL, 'Darial', ramp(frame, P.dzurdzuk + 6, P.dzurdzuk + 14) * (1 - ramp(frame, P.simsir, P.simsir + 6)), 26, C.bone, 40, true, 'start', -60)}
				{label([45.6, 42.25], 'Georgien', ramp(frame, P.simsir + 8, P.simsir + 16), 34, C.boneDim)}
				{label(centroid(SIMSIR), 'Simsir', simO, 46, C.bone, -10)}
				{simO > 0 ? <circle cx={xy(SIMSIR_CAPITAL)[0]} cy={xy(SIMSIR_CAPITAL)[1]} r={9} fill={C.bone} stroke="#0b0807" strokeWidth={4} opacity={simO} /> : null}
				{label(SIMSIR_CAPITAL, 'Simsir (Hauptort)', simO * (1 - ramp(frame, P.war, P.war + 6)), 22, C.bone, 40, true)}
				{label([45.6, 44.45], 'Goldene Horde', ramp(frame, P.simsir + 10, P.simsir + 18), 40, C.bone)}
				{label([45.6, 44.45], 'Tokhtamysch', ramp(frame, P.war + 6, P.war + 14), 24, C.boneDim, 44, true)}
				{label(DERBENT, 'Derbent', warO, 24, C.bone, 44, true)}
				{label(GROZNY, 'heute Grosny', ramp(frame, P.rivers[1], P.rivers[1] + 8) * (1 - warO), 20, 'rgba(239,232,218,0.6)', 34, true)}
				{label(BATTLE, 'Schlacht am Terek', ramp(frame, P.battle, P.battle + 4), 30, C.bone, -92)}
				{label(BATTLE, '14. April 1395', ramp(frame, P.battle + 2, P.battle + 6), 24, C.red, -56, true)}
				{label(BRIDGE, 'Brücke über die Sunscha', ramp(frame, P.battle + 10, P.battle + 16) * (1 - ramp(frame, P.sack + 4, P.sack + 8)), 20, C.gold, 60, true, 'start', 20)}
				{label(GUDERMES, 'Gudermes', ramp(frame, P.sack - 4, P.sack + 2), 22, C.bone, 40, true)}
				{label(KHANKALA, 'Chankala', ramp(frame, P.sack + 2, P.sack + 8), 22, C.bone, 40, true, 'middle', -40)}
				<rect width={1080} height={1920} fill="url(#vig)" />
			</svg>
		</AbsoluteFill>
	);
};
