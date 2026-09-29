// MFit-Logo. Zwei Fassungen:
// - Vektor (vermessen aus dem Original auf mfit-smart.de) für den Aufbau Stück für Stück,
// - das Original als freigestelltes PNG (3D-Gold) für den fertigen Zustand.
// Koordinaten im Raum des Original-Logos: 576 × 685.
// Die PNGs liegen in doppelter Auflösung vor (@2x, scripts/prepare_assets.py),
// damit die Endcard auch im 4K-Render scharf ist.
import {evolvePath} from '@remotion/paths';
import {Img, interpolate, staticFile} from 'remotion';
import {clamp} from '../motion';

export const LOGO_W = 576;
export const LOGO_H = 685;

const LOGO_SRC = 'brand/mfit-logo@2x.png';
const MARK_SRC = 'brand/mfit-zeichen@2x.png';

/** Rahmen: abgerundetes Rechteck, Mittellinie der Kontur */
const FRAME = {x: 18, y: 18, w: 540, h: 643, r: 72, stroke: 5.5};

/** Rahmen als Pfad, beginnt oben in der Mitte und läuft im Uhrzeigersinn. */
const framePath = (() => {
	const {x, y, w, h, r} = FRAME;
	const cx = x + w / 2;
	return [
		`M ${cx} ${y}`,
		`H ${x + w - r}`,
		`A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,
		`V ${y + h - r}`,
		`A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
		`H ${x + r}`,
		`A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
		`V ${y + r}`,
		`A ${r} ${r} 0 0 1 ${x + r} ${y}`,
		'Z',
	].join(' ');
})();

export const LOGO_PARTS = {
	chevron: 'M 57 40 L 288 268 L 519 40 L 519 158 L 287 390 L 57 158 Z',
	dreieck: 'M 58 287 L 174 405 L 58 405 Z',
	f: 'M 60 426 H 216 V 460 H 105 V 507 H 201 V 539 H 105 V 624 H 60 Z',
	i: 'M 256 425 H 301 V 625 H 256 Z',
	t: 'M 332 427 H 516 V 461 H 446 V 627 H 400 V 461 H 332 Z',
};

/** Ausschnitt des Zeichens (ohne Rahmen) im Logo-Raum: passt zu public/brand/mfit-zeichen.png */
export const MARK_BOX = {x: 48, y: 33, w: 478, h: 602};

export type LogoBuild = {
	/** Rahmen zeichnet sich (0 → 1) */
	frame: number;
	/** Chevron fällt von oben ein (0 → 1) */
	chevron: number;
	/** Dreieck schiebt sich von links ein */
	dreieck: number;
	/** F, I, T steigen nacheinander auf (je 0 → 1) */
	letters: [number, number, number];
	/** Überblendung zum Original (3D-Gold) */
	original: number;
	/** Glanz, der einmal diagonal über das Logo läuft (0 → 1) */
	sheen: number;
};

export const LOGO_DONE: LogoBuild = {frame: 1, chevron: 1, dreieck: 1, letters: [1, 1, 1], original: 1, sheen: 0};

/**
 * Vollständiges Logo mit Rahmen, `height` in px. Baut sich aus den Vektor-Teilen
 * auf und blendet dann ins Original über.
 */
export const Logo: React.FC<{height: number; build?: LogoBuild}> = ({height, build = LOGO_DONE}) => {
	const width = (height * LOGO_W) / LOGO_H;
	const frameDash = evolvePath(Math.max(0.0001, build.frame), framePath);
	const vector = 1 - build.original;
	const letterPaths = [LOGO_PARTS.f, LOGO_PARTS.i, LOGO_PARTS.t];
	// Glanzband: diagonal von links oben nach rechts unten
	const sheenX = interpolate(build.sheen, [0, 1], [-420, LOGO_W + 420], clamp);
	const sheenOn = build.sheen > 0 && build.sheen < 1;

	return (
		<div style={{position: 'relative', width, height}}>
			<svg viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} width={width} height={height} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<defs>
					<clipPath id="logo-innen">
						<rect x={FRAME.x + 4} y={FRAME.y + 4} width={FRAME.w - 8} height={FRAME.h - 8} rx={FRAME.r - 4} />
					</clipPath>
					<clipPath id="logo-buchstaben">
						<rect x={0} y={415} width={LOGO_W} height={220} />
					</clipPath>
				</defs>
				<g opacity={vector}>
					{build.frame > 0 ? (
						<path
							d={framePath}
							fill="none"
							stroke="url(#gold-stroke)"
							strokeWidth={FRAME.stroke}
							strokeDasharray={frameDash.strokeDasharray}
							strokeDashoffset={frameDash.strokeDashoffset}
							strokeLinecap="round"
						/>
					) : null}
					<g clipPath="url(#logo-innen)">
						<path
							d={LOGO_PARTS.chevron}
							fill="url(#gold-fill)"
							transform={`translate(0 ${(1 - build.chevron) * -440})`}
							opacity={build.chevron > 0 ? 1 : 0}
						/>
						<path
							d={LOGO_PARTS.dreieck}
							fill="url(#gold-fill)"
							transform={`translate(${(1 - build.dreieck) * -200} 0)`}
							opacity={build.dreieck > 0 ? 1 : 0}
						/>
					</g>
					<g clipPath="url(#logo-buchstaben)">
						{letterPaths.map((d, i) => (
							<path
								key={d}
								d={d}
								fill="url(#gold-fill)"
								transform={`translate(0 ${(1 - build.letters[i]) * 215})`}
								opacity={build.letters[i] > 0 ? 1 : 0}
							/>
						))}
					</g>
				</g>
			</svg>
			{build.original > 0 ? (
				<Img src={staticFile(LOGO_SRC)} style={{position: 'absolute', inset: 0, width, height, opacity: build.original}} />
			) : null}
			{sheenOn ? <LogoSheen width={width} height={height} x={sheenX} src={LOGO_SRC} /> : null}
		</div>
	);
};

/** Nur das Zeichen (Chevron, Dreieck, FIT) ohne Rahmen, als Original-PNG. */
export const LogoMark: React.FC<{height: number; sheen?: number}> = ({height, sheen = 0}) => {
	const width = (height * MARK_BOX.w) / MARK_BOX.h;
	const sheenX = interpolate(sheen, [0, 1], [-420, LOGO_W + 420], clamp);
	return (
		<div style={{position: 'relative', width, height}}>
			<Img src={staticFile(MARK_SRC)} style={{position: 'absolute', inset: 0, width, height}} />
			{sheen > 0 && sheen < 1 ? <LogoSheen width={width} height={height} x={sheenX} src={MARK_SRC} /> : null}
		</div>
	);
};

/**
 * Glanzband, das nur auf den Logo-Flächen liegt: das PNG dient als Maske
 * (seine Deckkraft), darüber wandert ein heller Streifen.
 */
const LogoSheen: React.FC<{width: number; height: number; x: number; src: string}> = ({width, height, x, src}) => {
	const pct = (x / LOGO_W) * 100;
	const url = `url('${staticFile(src)}')`;
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				width,
				height,
				backgroundImage: `linear-gradient(115deg, transparent ${pct - 16}%, rgba(255, 248, 225, 0.85) ${pct}%, transparent ${pct + 16}%)`,
				WebkitMaskImage: url,
				maskImage: url,
				WebkitMaskSize: '100% 100%',
				maskSize: '100% 100%',
				mixBlendMode: 'screen',
			}}
		/>
	);
};
