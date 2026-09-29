// Szene 4 (19,2–20,8 s): "KEIN HAKEN. NUR HÄKCHEN." – alle sieben Vorteile als Liste.
// Die Häkchen fliegen aus der Leiste an den Zeilenanfang (HookSwarm), hier stehen Titel und Texte.
import {interpolate} from 'remotion';
import {config} from '../config';
import {LIST} from '../components/HookSwarm';
import {At, AtLeft} from '../components/Layout';
import {rollIn, STUDIOS_LINES_Y} from './ItemsScene';
import {fitSize, RollBlock, TextLine} from '../components/Type';
import {clamp, EASE, progress} from '../motion';
import {COLORS, TEXT_FONT} from '../theme';
import {ANKER, RECAP} from '../timing';
import {TYPE_WIDTH} from '../video';

export const RecapScene: React.FC<{frame: number}> = ({frame}) => {
	if (frame < RECAP.start - 5 || frame >= ANKER.start + 8) return null;
	// Ganz weg, bevor "UND DAS ALLES" hereinrollt
	const out = progress(frame, ANKER.start - 8, 6, EASE.inOut);
	const [t1, t2] = config.recap;
	// Fußnoten der Häkchen (z. B. "*an den meisten Standorten") gehören auch unter die Liste
	const footnote = config.haekchen.map((h) => h.fussnote).filter(Boolean).join('   ');
	const labelSize = Math.min(
		...config.haekchen.map((h) => fitSize({text: h.kurz, maxWidth: 1000 - (LIST.x + 52) - 30, maxSize: 50, font: TEXT_FONT, weight: 600, uppercase: false})),
	);
	return (
		<div style={{position: 'absolute', inset: 0, transform: `translateY(${-out * 60}px)`, opacity: 1 - out}}>
			{/* Rollt als Block genau dann herein, wenn "EINE MITGLIEDSCHAFT. ALLE STUDIOS." hinausrollt */}
			<RollBlock
				rows={[
					{text: t1, y: STUDIOS_LINES_Y[0], maxSize: 92},
					{text: t2, y: STUDIOS_LINES_Y[1], maxSize: 92, gold: true},
				]}
				p={rollIn(frame, RECAP.titel)}
			/>
			{footnote ? (
				<At y={1232}>
					<div style={{opacity: progress(frame, RECAP.zeilen[RECAP.zeilen.length - 1] + 4, 8)}}>
						<TextLine text={footnote} maxWidth={TYPE_WIDTH} maxSize={30} weight={400} color={COLORS.textFaint} />
					</div>
				</At>
			) : null}
			{config.haekchen.map((h, i) => {
				const p = progress(frame, RECAP.zeilen[i] + 2, 8);
				return (
					<AtLeft key={h.kurz} x={LIST.x + 52} y={LIST.y0 + i * LIST.step}>
						<div
							style={{
								fontFamily: TEXT_FONT,
								fontWeight: 600,
								fontSize: labelSize,
								lineHeight: 1,
								color: COLORS.text,
								whiteSpace: 'nowrap',
								transform: `translateX(${(1 - p) * -28}px)`,
								opacity: interpolate(p, [0, 0.5], [0, 1], clamp),
							}}
						>
							{h.kurz}
						</div>
					</AtLeft>
				);
			})}
		</div>
	);
};
