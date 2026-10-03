// Ibn Battutas Reisen 1325–1354 als goldene Linie über Afrika und Asien.
// Die Kamera startet nah an Tanger und zieht auf, während die Route sich zeichnet.
import {getLength, getPointAtLength} from '@remotion/paths';
import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {COLORS} from '../config';
import {COND} from '../fonts';
import {clamp, easeOut} from '../fx';
import KARTE from '../karte.json';

type P = {x: number; y: number};

/** Catmull-Rom durch alle Punkte als kubische Bézierkurven. */
const smooth = (pts: P[]) => {
	let d = `M${pts[0].x},${pts[0].y}`;
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[Math.max(0, i - 1)];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[Math.min(pts.length - 1, i + 2)];
		d += `C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
	}
	return d;
};

const R = KARTE.route;
const iQuanzhou = R.findIndex((c) => c.name === 'Quanzhou');
// Hinweg bis China, Rückweg nach Fès als Bogen, dann Andalusien und Mali
const HIN = smooth(R.slice(0, iQuanzhou + 1));
const q = R[iQuanzhou];
const fes = R[iQuanzhou + 1];
const RUECK = `M${q.x},${q.y}Q${(q.x + fes.x) / 2},${Math.min(q.y, fes.y) - 520} ${fes.x},${fes.y}`;
const WEST = smooth(R.slice(iQuanzhou + 1));
const PARTS = [HIN, RUECK, WEST].map((d) => ({d, len: getLength(d)}));
const TOTAL = PARTS.reduce((a, b) => a + b.len, 0);

/** Wo auf der Gesamtlänge jede Station liegt (für das Aufleuchten der Punkte). */
const STATION_AT = (() => {
	const at: number[] = [];
	let acc = 0;
	for (let i = 0; i <= iQuanzhou; i++) {
		// Länge bis zur Station i auf dem Hinweg: Teilpfad bis i messen
		at.push(i === 0 ? 0 : getLength(smooth(R.slice(0, i + 1))));
	}
	acc = PARTS[0].len + PARTS[1].len;
	const west = R.slice(iQuanzhou + 1);
	west.forEach((_, j) => at.push(acc + (j === 0 ? 0 : getLength(smooth(west.slice(0, j + 1))))));
	return at;
})();

const CX = 540;
const CY = 880;
const FIT = 1000 / KARTE.width;

const graticule = () => {
	const {s, lon0, lat1, cos} = KARTE.proj;
	const lines: string[] = [];
	for (let lon = -15; lon <= 120; lon += 15) {
		const x = (lon - lon0) * cos * s;
		lines.push(`M${x},0V${KARTE.height}`);
	}
	for (let lat = -10; lat <= 50; lat += 15) {
		const y = (lat1 - lat) * s;
		lines.push(`M0,${y}H${KARTE.width}`);
	}
	return lines.join('');
};
const GRAT = graticule();

export const Karte: React.FC<{progress: number; still?: boolean}> = ({progress, still}) => {
	const p = still ? 1 : progress;
	const draw = interpolate(p, [0.05, 0.86], [0, 1], {...clamp, easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)});
	const cam = interpolate(p, [0, 0.9], [0, 1], {...clamp, easing: easeOut});
	const scale = interpolate(cam, [0, 1], [2.4, FIT]);
	const fx = interpolate(cam, [0, 1], [R[0].x + 160, KARTE.width / 2]);
	const fy = interpolate(cam, [0, 1], [R[0].y + 60, KARTE.height / 2 - 20]);
	const fade = still ? 1 : interpolate(p, [0, 0.07], [0, 1], clamp);
	const toScreen = (pt: P) => ({x: (pt.x - fx) * scale + CX, y: (pt.y - fy) * scale + CY});

	// Länge, die schon gezeichnet ist, auf die drei Teilpfade verteilen
	let rest = draw * TOTAL;
	const shown = PARTS.map((part) => {
		const l = Math.max(0, Math.min(part.len, rest));
		rest -= part.len;
		return l;
	});
	const activeIdx = Math.max(0, shown.findIndex((l, i) => l < PARTS[i].len));
	const headLen = shown[activeIdx];
	const headPt = draw > 0 && draw < 1 ? getPointAtLength(PARTS[activeIdx].d, headLen) : null;
	const head = headPt ? toScreen(headPt) : null;

	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 60% at 50% 46%, #15120d 0%, #07070a 70%)', opacity: fade}}>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<defs>
					<filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur stdDeviation="6" result="b" />
						<feMerge>
							<feMergeNode in="b" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>
				<g transform={`translate(${CX},${CY}) scale(${scale}) translate(${-fx},${-fy})`}>
					<path d={GRAT} stroke={COLORS.gold} strokeOpacity={0.07} strokeWidth={1} vectorEffect="non-scaling-stroke" fill="none" />
					{KARTE.land.map((d, i) => (
						<path key={i} d={d} fill="#1b160f" stroke={COLORS.gold} strokeOpacity={0.42} strokeWidth={1.2}
							vectorEffect="non-scaling-stroke" fillRule="evenodd" />
					))}
					{PARTS.map((part, i) => (
						<path
							key={i}
							d={part.d}
							fill="none"
							stroke={i === 1 ? COLORS.goldHell : COLORS.gold}
							strokeOpacity={i === 1 ? 0.6 : 1}
							strokeWidth={i === 1 ? 2 : 3.6}
							strokeLinecap="round"
							strokeLinejoin="round"
							vectorEffect="non-scaling-stroke"
							strokeDasharray={i === 1 ? undefined : `${part.len} ${part.len}`}
							strokeDashoffset={i === 1 ? undefined : part.len - shown[i]}
							style={i === 1 ? {strokeDasharray: `${shown[i]} ${part.len * 2}`} : undefined}
							filter="url(#routeGlow)"
						/>
					))}
				</g>
			</svg>
			{/* Stationen: Punkt leuchtet auf, wenn die Linie ankommt; Hauptstationen mit Namen */}
			{R.map((c, i) => {
				const reached = draw * TOTAL - STATION_AT[i];
				if (reached < 0) return null;
				const s = toScreen(c);
				const pop = interpolate(reached, [0, TOTAL * 0.03], [1.9, 1], clamp);
				const dot = c.label ? 13 : 7;
				return (
					<React.Fragment key={i}>
						<div style={{position: 'absolute', left: s.x - dot / 2, top: s.y - dot / 2, width: dot, height: dot, borderRadius: '50%',
							background: COLORS.goldHell, boxShadow: `0 0 ${dot * 1.6}px ${COLORS.gold}`, transform: `scale(${pop})`}} />
						{c.label ? (
							<div style={{position: 'absolute', left: s.x + 12, top: s.y - 34, fontFamily: COND, fontWeight: 600, fontSize: 30,
								transform: s.x > 820 ? 'translateX(calc(-100% - 24px))' : undefined,
								letterSpacing: '0.12em', color: COLORS.knochen, opacity: interpolate(reached, [0, TOTAL * 0.04], [0, 0.92], clamp),
								textShadow: '0 2px 8px rgba(0,0,0,0.9)', whiteSpace: 'nowrap'}}>
								{c.name.toUpperCase()}
							</div>
						) : null}
					</React.Fragment>
				);
			})}
			{head ? (
				<div style={{position: 'absolute', left: head.x - 11, top: head.y - 11, width: 22, height: 22, borderRadius: '50%',
					background: '#fff6dc', boxShadow: `0 0 26px 10px ${COLORS.gold}`}} />
			) : null}
			<div style={{position: 'absolute', left: 0, right: 0, top: CY + 300, textAlign: 'center', fontFamily: COND, fontWeight: 600,
				fontSize: 22, letterSpacing: '0.3em', color: COLORS.knochen, opacity: 0.4 * interpolate(p, [0.6, 0.8], [0, 1], {...clamp, easing: easeOut})}}>
				ROUTE VEREINFACHT
			</div>
		</AbsoluteFill>
	);
};
