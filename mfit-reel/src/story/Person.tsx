// Flache Figur im Erklärvideo-Stil: keine Konturen, schlanke lange Proportionen,
// Gliedmaßen aus sich verjüngenden Segmenten mit runden Gelenken.
// Lokaler Raum: Füße bei y = 0, nach oben negativ, Höhe ≈ 1080 Einheiten.
// Blickrichtung rechts. Posen sind Gelenkpositionen, damit sie sich animieren lassen.

export type Pt = [number, number];

export type Pose = {
	/** Rücken- und Vorderbein: Hüfte, Knie, Knöchel */
	legBack: [Pt, Pt, Pt];
	legFront: [Pt, Pt, Pt];
	/** Arme: Schulter, Ellbogen, Handgelenk */
	armBack: [Pt, Pt, Pt];
	armFront: [Pt, Pt, Pt];
	/** Kopfneigung in Grad (positiv = nach unten schauen) */
	headTilt: number;
	/** Handy in der Hand (Mitte, Drehung) oder keines */
	phone?: {at: Pt; rotate: number};
	/** Sporttasche an der Hüfte */
	bag?: boolean;
};

export type Look = {
	skin: string;
	skinShade: string;
	hair: string;
	top: string;
	topShade: string;
	legs: string;
	legsShade: string;
	shoes: string;
	accent: string;
};

export const LOOK_A: Look = {
	skin: '#B97A4F',
	skinShade: '#9C6440',
	hair: '#1C1715',
	top: '#EDE7DA',
	topShade: '#D6CDBB',
	legs: '#343A48',
	legsShade: '#272C37',
	shoes: '#F4F1EA',
	accent: '#D4A83D',
};

export const POSE_SCAN: Pose = {
	legBack: [[-24, -560], [-40, -300], [-58, -42]],
	legFront: [[24, -560], [40, -304], [52, -42]],
	armBack: [[-54, -858], [-74, -722], [-66, -616]],
	armFront: [[56, -858], [80, -724], [74, -612]],
	headTilt: -3,
	bag: true,
};

export const POSE_PHONE: Pose = {
	legBack: [[-24, -560], [-34, -300], [-44, -42]],
	legFront: [[24, -560], [34, -302], [48, -42]],
	armBack: [[-54, -858], [-34, -712], [54, -756]],
	armFront: [[56, -858], [72, -706], [92, -764]],
	headTilt: 22,
	phone: {at: [76, -786], rotate: -70},
};

/** Segment von a nach b mit Breiten wa → wb, als Viereck */
const segment = (a: Pt, b: Pt, wa: number, wb: number): string => {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const l = Math.hypot(dx, dy) || 1;
	const nx = -dy / l;
	const ny = dx / l;
	const p = (q: Pt, w: number, s: number) => `${q[0] + nx * (w / 2) * s} ${q[1] + ny * (w / 2) * s}`;
	return `M ${p(a, wa, 1)} L ${p(b, wb, 1)} L ${p(b, wb, -1)} L ${p(a, wa, -1)} Z`;
};

/** Gliedmaße aus drei Gelenken, sich verjüngend, mit runden Gelenken */
const Limb: React.FC<{j: [Pt, Pt, Pt]; w: [number, number, number]; fill: string}> = ({j, w, fill}) => (
	<g fill={fill}>
		<path d={segment(j[0], j[1], w[0], w[1])} />
		<path d={segment(j[1], j[2], w[1], w[2])} />
		{j.map((p, i) => (
			<circle key={i} cx={p[0]} cy={p[1]} r={w[i] / 2} />
		))}
	</g>
);

const Shoe: React.FC<{at: Pt; fill: string; sole: string}> = ({at, fill, sole}) => {
	const [x] = at;
	return (
		<g>
			<path d={`M ${x - 26} -58 Q ${x - 30} -8 ${x - 20} -6 L ${x + 58} -6 Q ${x + 72} -10 ${x + 62} -26 Q ${x + 40} -40 ${x + 18} -58 Z`} fill={fill} />
			<rect x={x - 22} y={-10} width={84} height={10} rx={5} fill={sole} />
		</g>
	);
};

export const Person: React.FC<{pose: Pose; look?: Look; x: number; y: number; scale: number}> = ({
	pose,
	look = LOOK_A,
	x,
	y,
	scale,
}) => {
	const neck: Pt = [2, -900];
	return (
		<g transform={`translate(${x} ${y}) scale(${scale})`}>
			{/* Rückseite zuerst: Arm, Bein, Tasche */}
			<Limb j={pose.armBack} w={[44, 38, 30]} fill={look.skinShade} />
			<circle cx={pose.armBack[2][0]} cy={pose.armBack[2][1]} r={20} fill={look.skinShade} />
			<Limb j={pose.legBack} w={[82, 58, 40]} fill={look.legsShade} />
			<Shoe at={pose.legBack[2]} fill={look.topShade} sole={look.accent} />
			{pose.bag ? (
				<g>
					<rect x={-150} y={-700} width={112} height={132} rx={24} fill="#1E2129" />
					<rect x={-150} y={-668} width={112} height={8} fill={look.accent} opacity={0.9} />
				</g>
			) : null}
			{/* Hüfte und vorderes Bein */}
			<path d="M -68 -612 L 64 -612 L 70 -536 Q 0 -512 -72 -536 Z" fill={look.legs} />
			<Limb j={pose.legFront} w={[84, 60, 42]} fill={look.legs} />
			<Shoe at={pose.legFront[2]} fill={look.shoes} sole={look.accent} />
			{/* Oberkörper: Sporttop, Schultern rund */}
			<path d="M -76 -880 Q -90 -760 -60 -640 L -66 -596 L 64 -596 L 58 -640 Q 88 -760 76 -880 Z" fill={look.top} />
			<path d="M 18 -880 Q 40 -760 30 -610 L 58 -596 L 54 -640 Q 82 -760 70 -880 Z" fill={look.topShade} opacity={0.55} />
			<circle cx={-52} cy={-862} r={30} fill={look.top} />
			<circle cx={54} cy={-862} r={30} fill={look.top} />
			{/* Taschengurt quer über den Oberkörper */}
			{pose.bag ? <path d="M 52 -884 L -96 -660" stroke={look.accent} strokeWidth={16} strokeLinecap="round" /> : null}
			{/* Hals und Kopf */}
			<rect x={-14} y={-940} width={32} height={80} rx={12} fill={look.skinShade} />
			<g transform={`rotate(${pose.headTilt} ${neck[0]} ${neck[1]})`}>
				<ellipse cx={8} cy={-1000} rx={56} ry={68} fill={look.skin} />
				<path d="M 60 -1008 Q 76 -992 62 -978 Z" fill={look.skin} />
				<ellipse cx={-8} cy={-996} rx={11} ry={16} fill={look.skinShade} />
				<circle cx={40} cy={-1012} r={5.5} fill="#1C1715" />
				{/* Haare mit Dutt */}
				<path d="M -50 -990 Q -60 -1080 8 -1076 Q 66 -1072 64 -1024 Q 28 -1050 -8 -1042 Q -26 -1010 -44 -960 Z" fill={look.hair} />
				<circle cx={-34} cy={-1086} r={30} fill={look.hair} />
			</g>
			{/* Vorderer Arm zuletzt */}
			<Limb j={pose.armFront} w={[46, 40, 32]} fill={look.skin} />
			{pose.phone ? (
				<g transform={`translate(${pose.phone.at[0]} ${pose.phone.at[1]}) rotate(${pose.phone.rotate})`}>
					<rect x={-26} y={-48} width={52} height={96} rx={10} fill="#0E0E10" />
					<rect x={-21} y={-42} width={42} height={84} rx={6} fill={look.accent} opacity={0.85} />
				</g>
			) : null}
			<circle cx={pose.armFront[2][0]} cy={pose.armFront[2][1]} r={21} fill={look.skin} />
		</g>
	);
};
