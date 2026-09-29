// Bausteine für den Film: Überschriften, Tipp-Finger, Konfetti, Feature-Karten, Blende.
import {interpolate} from 'remotion';
import {At} from '../../components/Layout';
import {Line, MaskReveal, TextLine} from '../../components/Type';
import {clamp, EASE, progress, SPRINGS, springFrom} from '../../motion';
import {COLORS, TEXT_FONT, withAlpha} from '../../theme';
import {TYPE_WIDTH} from '../../video';

/** Überschriftenzeile: schiebt sich ab `ab` von unten herein, ab `raus` nach oben hinaus. */
export const Kopfzeile: React.FC<{
	frame: number;
	y: number;
	text: string;
	ab: number;
	raus?: number;
	gold?: boolean;
	maxSize?: number;
	color?: string;
}> = ({frame, y, text, ab, raus = Infinity, gold, maxSize = 112, color}) => (
	<At y={y}>
		<MaskReveal p={progress(frame, ab - 3, 8)} out={Number.isFinite(raus) ? progress(frame, raus, 6, EASE.inOut) : 0}>
			<Line text={text} maxWidth={TYPE_WIDTH} maxSize={maxSize} gold={gold} color={color} />
		</MaskReveal>
	</At>
);

/** Kleine Textzeile (Rubik), gleiche Mechanik */
export const Textzeile: React.FC<{
	frame: number;
	y: number;
	text: string;
	ab: number;
	raus?: number;
	maxSize?: number;
	color?: string;
	weight?: number;
}> = ({frame, y, text, ab, raus = Infinity, maxSize = 36, color = COLORS.textMuted, weight = 500}) => (
	<At y={y}>
		<MaskReveal p={progress(frame, ab - 2, 8)} out={Number.isFinite(raus) ? progress(frame, raus, 6, EASE.inOut) : 0} bleed={20}>
			<TextLine text={text} maxWidth={TYPE_WIDTH} maxSize={maxSize} weight={weight} color={color} />
		</MaskReveal>
	</At>
);

/** Punkt, an dem ein Finger tippt: Kreis, der beim Tippen eindrückt, plus Welle. */
export const Tippfinger: React.FC<{x: number; y: number; sichtbar: number; tipps: number[]; frame: number}> = ({x, y, sichtbar, tipps, frame}) => {
	if (sichtbar <= 0) return null;
	const druck = tipps.reduce((s, t) => s + interpolate(frame, [t - 3, t, t + 5], [0, 1, 0], clamp), 0);
	const wellen = tipps.filter((t) => frame >= t && frame < t + 16);
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
			{wellen.map((t) => {
				const u = (frame - t) / 16;
				return <circle key={t} cx={x} cy={y} r={30 + 50 * EASE.out(u)} fill="none" stroke={COLORS.goldLight} strokeWidth={4 * (1 - u)} opacity={(1 - u) * sichtbar} />;
			})}
			<circle cx={x} cy={y} r={34 * (1 - 0.22 * druck)} fill="#FFFFFF" opacity={0.3 * sichtbar} />
			<circle cx={x} cy={y} r={34 * (1 - 0.22 * druck)} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.75 * sichtbar} />
		</svg>
	);
};

/** Goldenes Konfetti, das bei `ab` aus einem Punkt aufspringt und fällt. */
export const Konfetti: React.FC<{x: number; y: number; ab: number; frame: number; anzahl?: number}> = ({x, y, ab, frame, anzahl = 22}) => {
	const t = frame - ab;
	if (t < 0 || t > 40) return null;
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
			{Array.from({length: anzahl}, (_, i) => {
				const a = (i / anzahl) * Math.PI * 2 + (i % 3) * 0.3;
				const v = 9 + ((i * 7) % 5) * 2.4;
				const px = x + Math.cos(a) * v * t * 0.9;
				const py = y + Math.sin(a) * v * t * 0.9 + 0.35 * t * t;
				const o = interpolate(t, [0, 4, 30, 40], [0, 1, 1, 0], clamp);
				const farbe = i % 3 === 0 ? COLORS.goldLight : i % 3 === 1 ? COLORS.gold : COLORS.text;
				return i % 2 === 0 ? (
					<circle key={i} cx={px} cy={py} r={7} fill={farbe} opacity={o} />
				) : (
					<rect key={i} x={px - 6} y={py - 3} width={12} height={6} rx={2} fill={farbe} opacity={o} transform={`rotate(${t * 18 + i * 40} ${px} ${py})`} />
				);
			})}
		</svg>
	);
};

/**
 * Feature-Karte: Symbol links, zwei Zeilen rechts (weiß + gold), springt bei `ab` auf
 * und schrumpft bei `raus` weg. Optional ein Zeiger nach unten auf die Stelle im Bild.
 */
export const Karte: React.FC<{
	frame: number;
	ab: number;
	raus: number;
	y: number;
	zeilen: [string, string];
	symbol: React.ReactNode;
	zeiger?: {x: number; y: number};
}> = ({frame, ab, raus, y, zeilen, symbol, zeiger}) => {
	if (frame < ab - 2 || frame > raus + 10) return null;
	const pop = springFrom(frame, ab, SPRINGS.pop);
	const weg = progress(frame, raus, 8, EASE.exit);
	const s = pop * (1 - weg);
	const breite = 880;
	const hoehe = 210;
	const links = 540 - breite / 2;
	const linie = progress(frame, ab + 4, 10, EASE.inOut) * (1 - weg);
	return (
		<>
			{zeiger ? (
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					<path
						d={`M ${zeiger.x} ${y + hoehe / 2} L ${zeiger.x} ${y + hoehe / 2 + (zeiger.y - y - hoehe / 2) * linie}`}
						stroke={COLORS.gold}
						strokeWidth={4}
						strokeDasharray="2 12"
						strokeLinecap="round"
					/>
					{linie > 0.98 ? <circle cx={zeiger.x} cy={zeiger.y} r={10} fill={COLORS.gold} /> : null}
				</svg>
			) : null}
			<div
				style={{
					position: 'absolute',
					left: links,
					top: y - hoehe / 2,
					width: breite,
					height: hoehe,
					transform: `scale(${s})`,
					transformOrigin: zeiger ? `${zeiger.x - links}px ${hoehe}px` : 'center',
					opacity: Math.min(1, s * 1.5),
					borderRadius: 40,
					background: withAlpha('#0E0F12', 0.92),
					border: `3px solid ${withAlpha(COLORS.gold, 0.7)}`,
					boxShadow: `0 24px 60px ${withAlpha('#000000', 0.5)}`,
					display: 'flex',
					alignItems: 'center',
					gap: 34,
					padding: '0 44px',
					boxSizing: 'border-box',
				}}
			>
				<div style={{width: 140, height: 140, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{symbol}</div>
				<div style={{display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0}}>
					<Line text={zeilen[0]} maxWidth={600} maxSize={62} />
					<Line text={zeilen[1]} maxWidth={600} maxSize={62} gold />
				</div>
			</div>
		</>
	);
};

/**
 * Blende als Kreis: `zu` 0 → 1 füllt das Bild von (x, y) aus mit Gold, `auf` 0 → 1 öffnet
 * danach ein Loch von der Mitte aus und gibt das neue Bild frei.
 */
export const Kreisblende: React.FC<{x: number; y: number; zu: number; auf: number; farbe?: string}> = ({x, y, zu, auf, farbe = COLORS.gold}) => {
	if (zu <= 0 || auf >= 1) return null;
	const rMax = 2300;
	const r = rMax * EASE.inOut(zu);
	const loch = rMax * EASE.inOut(auf);
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<defs>
				<mask id={`blende-${Math.round(x)}-${Math.round(y)}`}>
					<rect width={1080} height={1920} fill="black" />
					<circle cx={x} cy={y} r={r} fill="white" />
					<circle cx={540} cy={960} r={loch} fill="black" />
				</mask>
			</defs>
			<rect width={1080} height={1920} fill={farbe} mask={`url(#blende-${Math.round(x)}-${Math.round(y)})`} />
		</svg>
	);
};

/** Schiebeübergang: Anteil 0 → 1, liefert Versatz für die alte (−) und neue (+) Szene */
export const schieben = (frame: number, ab: number, dauer: number) => interpolate(frame, [ab, ab + dauer], [0, 1], {...clamp, easing: EASE.inOut});

export const TEXT_STIL = {fontFamily: TEXT_FONT, color: COLORS.text};
