// "Eine Mitgliedschaft. Alle Studios.": eine goldene Linie wie ein Liniennetzplan,
// die Studios fahren als Stationen ein, Neueröffnungen bekommen ein NEU-Schild.
import {interpolate} from 'remotion';
import {config} from '../config';
import {clamp, EASE, progress, springFrom, SPRINGS} from '../motion';
import {COLORS, TEXT_FONT} from '../theme';
import {fitSize} from './Type';

export const NETWORK = {x: 262, y0: 764, step: 91};

export const StudioNetwork: React.FC<{
	frame: number;
	lineAt: number;
	stationsAt: number[];
	neuAt: number[];
}> = ({frame, lineAt, stationsAt, neuAt}) => {
	const count = config.studios.length;
	const yEnd = NETWORK.y0 + (count - 1) * NETWORK.step;
	const lineP = progress(frame, lineAt, stationsAt[count - 1] - lineAt + 4, EASE.inOut);
	const lineTop = NETWORK.y0 - 30;
	const lineBottom = yEnd + 30;
	const labelSize = Math.min(
		52,
		...config.studios.map((s) => fitSize({text: s.name, maxWidth: 540, maxSize: 52, font: TEXT_FONT, weight: 600, uppercase: false})),
	);
	let neuIndex = 0;

	return (
		<div style={{position: 'absolute', inset: 0}}>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{/* Schiene: dünne Grundlinie, darauf die goldene, die sich nach unten zeichnet */}
				<line
					x1={NETWORK.x}
					y1={lineTop}
					x2={NETWORK.x}
					y2={lineBottom}
					stroke={COLORS.gold}
					strokeOpacity={0.18 * progress(frame, lineAt - 4, 8)}
					strokeWidth={6}
					strokeLinecap="round"
				/>
				<line
					x1={NETWORK.x}
					y1={lineTop}
					x2={NETWORK.x}
					y2={lineTop + (lineBottom - lineTop) * lineP}
					stroke={COLORS.gold}
					strokeWidth={6}
					strokeLinecap="round"
				/>
				{config.studios.map((studio, i) => {
					const at = stationsAt[i];
					const pop = frame >= at ? springFrom(frame, at, SPRINGS.pop) : 0;
					const y = NETWORK.y0 + i * NETWORK.step;
					return (
						<g key={studio.name} transform={`translate(${NETWORK.x} ${y}) scale(${pop})`}>
							<circle r={17} fill={COLORS.bg} stroke={COLORS.gold} strokeWidth={6} />
							<circle r={7} fill={COLORS.goldLight} />
						</g>
					);
				})}
			</svg>
			{config.studios.map((studio, i) => {
				const at = stationsAt[i];
				const p = progress(frame, at, 8);
				const y = NETWORK.y0 + i * NETWORK.step;
				const badgeAt = studio.neu ? neuAt[Math.min(neuIndex++, neuAt.length - 1)] : Infinity;
				const badge = frame >= badgeAt ? springFrom(frame, badgeAt, SPRINGS.pop) : 0;
				return (
					<div
						key={studio.name}
						style={{
							position: 'absolute',
							left: NETWORK.x + 44,
							top: y,
							transform: `translate(${(1 - p) * 40}px, -50%)`,
							opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
							display: 'flex',
							alignItems: 'center',
							gap: 18,
							whiteSpace: 'nowrap',
						}}
					>
						<span style={{fontFamily: TEXT_FONT, fontWeight: 600, fontSize: labelSize, color: COLORS.text, lineHeight: 1}}>{studio.name}</span>
						{studio.neu ? (
							<span
								style={{
									fontFamily: TEXT_FONT,
									fontWeight: 800,
									fontSize: 25,
									letterSpacing: '0.14em',
									textTransform: 'uppercase',
									color: COLORS.bg,
									background: COLORS.gold,
									borderRadius: 999,
									padding: '8px 14px 7px 17px',
									lineHeight: 1,
									transform: `scale(${badge})`,
									opacity: badge > 0 ? 1 : 0,
								}}
							>
								{config.neuSchild}
							</span>
						) : null}
					</div>
				);
			})}
		</div>
	);
};
