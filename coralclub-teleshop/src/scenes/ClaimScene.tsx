// Szene 6: "Und Magnesium trägt zur Verringerung von Müdigkeit und Ermüdung bei!"
// Der zugelassene Claim im exakten Wortlaut auf einer Tafel; jedes Wort wird
// hell, wenn der Sprecher es sagt. Darunter die Pflichtangaben (Art. 10 Abs. 2
// VO (EG) 1924/2006), lange genug lesbar und in der Sicherheitszone.
import {AbsoluteFill, interpolate} from 'remotion';
import {At} from '../components/At';
import {Sunburst} from '../components/Sunburst';
import {config} from '../config';
import {clamp, ramp, SPRINGS, springFrom} from '../motion';
import {COLORS, FONT, STRIPE} from '../theme';
import {line, toFrame} from '../timing';
import vo from '../sprecher.json';

const start = line('claim').start;

const clean = (w: string) => w.toLowerCase().replace(/[.,!?:;–-]/g, '');

/** Für jedes angezeigte Wort den Frame, an dem der Sprecher es beginnt (der Reihe nach gesucht). */
const wordFrames = (() => {
	const spoken = vo.zeilen.find((l) => l.id === 'claim')?.woerter ?? [];
	let j = 0;
	return config.claim.text.split(' ').map((w) => {
		while (j < spoken.length && clean(spoken[j].w) !== clean(w)) j++;
		const hit = spoken[j];
		j++;
		return hit ? toFrame(hit.s) : start;
	});
})();

export const ClaimScene: React.FC<{frame: number}> = ({frame}) => {
	const card = springFrom(frame, start, SPRINGS.snap);
	return (
		<AbsoluteFill>
			<Sunburst frame={frame} colors={{base: COLORS.blue, ray: '#0F35AE', glow: COLORS.blueLight, edge: COLORS.blueDeep}} cy={860} speed={0.12} glow={0.6} />
			<At x={540} y={860} transform={`scale(${interpolate(card, [0, 1], [0.85, 1])})`} opacity={interpolate(card, [0, 0.25], [0, 1], clamp)}>
				<div
					style={{
						width: 880,
						padding: '56px 58px 62px',
						borderRadius: 34,
						background: 'linear-gradient(170deg, #FFFFFF 0%, #EAF1FF 100%)',
						border: `8px solid ${COLORS.ink}`,
						boxShadow: '16px 20px 0 rgba(3,10,46,0.6)',
						boxSizing: 'border-box',
					}}
				>
					<div style={{display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', width: 300, marginBottom: 38}}>
						{STRIPE.map((c) => (
							<div key={c} style={{flex: 1, background: c}} />
						))}
					</div>
					<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 70, lineHeight: 1.14, color: COLORS.ink, letterSpacing: '-0.01em'}}>
						{config.claim.text.split(' ').map((w, i) => {
							const lit = ramp(frame, wordFrames[i], wordFrames[i] + 4);
							return (
								<span key={i} style={{opacity: 0.22 + 0.78 * lit, marginRight: '0.26em', display: 'inline-block'}}>
									{w}
								</span>
							);
						})}
					</div>
				</div>
			</At>
			<At x={540} y={1370} opacity={ramp(frame, start + 6, start + 14)}>
				<div style={{width: 860, fontFamily: FONT, fontWeight: 600, fontSize: 30, lineHeight: 1.3, color: '#FFFFFF', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
					{config.claim.pflicht}
				</div>
			</At>
		</AbsoluteFill>
	);
};
