// Szene 2 (1,6–6,4 s): "WO IST DER HAKEN?" → "GANZ EHRLICH?" → "ES GIBT 7."
// Die Haken selbst zeichnet HookSwarm, hier steht nur der Text darunter.
import {interpolate} from 'remotion';
import {config} from '../config';
import {At} from '../components/Layout';
import {fitSize, goldTextStyle, Line, MaskReveal} from '../components/Type';
import {clamp, EASE, impulse, progress, shake, springFrom, SPRINGS} from '../motion';
import {COLORS, DISPLAY_FONT} from '../theme';
import {HAKEN, ITEMS} from '../timing';
import {TYPE_WIDTH} from '../video';

export const HakenScene: React.FC<{frame: number}> = ({frame}) => {
	if (frame < HAKEN.start || frame >= ITEMS[0].start) return null;

	// ---- Teil 1: Frage
	const [zeile1, zeile2] = config.haken.frage;
	const words = zeile1.split(' ');
	const size1 = fitSize({text: zeile1, maxWidth: TYPE_WIDTH, maxSize: 118});
	const hakenSlam = springFrom(frame, HAKEN.haken, SPRINGS.slam);
	const hakenShake = shake(frame, HAKEN.haken, 14, 9);
	// Erst geht die Frage, dann kommt das Geständnis: an anderer Stelle, deshalb nacheinander
	const frageOut = progress(frame, HAKEN.ehrlich - 9, 5, EASE.inOut);

	// ---- Teil 2: Geständnis
	const ehrlich = progress(frame, HAKEN.ehrlich - 4, 7);
	const esGibt = progress(frame, HAKEN.esGibt - 3, 7);
	const sevenSlam = springFrom(frame, HAKEN.esGibt + 3, SPRINGS.slam);
	// Die 7 pumpt in Takt 4 auf jedem Beat, jedes Mal etwas stärker (Spannung vor dem Drop)
	const pump = [0, 1, 2, 3].reduce((sum, i) => sum + (0.05 + i * 0.03) * impulse(frame, HAKEN.vermehren[0] + i * 12, 9), 0);
	const tension = interpolate(frame, [HAKEN.vermehren[0], HAKEN.einholen], [1, 1.06], {...clamp, easing: EASE.inOut});
	// Geht, während die Haken eingeholt werden – bevor das erste Häkchen hereinrollt
	const allOut = progress(frame, HAKEN.einholen, 6, EASE.exit);
	const count = config.haekchen.length;
	const line2 = `${config.haken.esGibt} ${count}.`;
	const size2 = fitSize({text: line2, maxWidth: TYPE_WIDTH, maxSize: 150});

	return (
		<div style={{position: 'absolute', inset: 0}}>
			{frageOut < 1 ? (
				<>
					<At y={880}>
						<div style={{display: 'flex', gap: '0.28em', fontFamily: DISPLAY_FONT, fontSize: size1, lineHeight: 1, textTransform: 'uppercase', color: COLORS.text}}>
							{words.map((word, i) => (
								<MaskReveal key={word + i} p={progress(frame, HAKEN.worte[i] - 2, 6)} out={frageOut}>
									<span style={{display: 'inline-block', whiteSpace: 'nowrap'}}>{word}</span>
								</MaskReveal>
							))}
						</div>
					</At>
					<At y={1045}>
						<div
							style={{
								transform: `translate(${hakenShake.x}px, ${hakenShake.y}px) scale(${frame >= HAKEN.haken ? 1 + 0.3 * (1 - hakenSlam) : 0})`,
								opacity: frame >= HAKEN.haken ? 1 - frageOut : 0,
							}}
						>
							<Line text={zeile2} maxWidth={TYPE_WIDTH} maxSize={236} gold />
						</div>
					</At>
				</>
			) : null}
			{frame >= HAKEN.ehrlich - 4 ? (
				<div style={{position: 'absolute', inset: 0, transform: `scale(${tension}) translateY(${allOut * 120}px)`, opacity: 1 - allOut}}>
					<At y={860}>
						<MaskReveal p={ehrlich}>
							<Line text={config.haken.ehrlich} maxWidth={TYPE_WIDTH} maxSize={112} />
						</MaskReveal>
					</At>
					<At y={1020}>
						<MaskReveal p={esGibt}>
							<div style={{fontFamily: DISPLAY_FONT, fontSize: size2, lineHeight: 1, textTransform: 'uppercase', color: COLORS.text, whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline'}}>
								<span>{config.haken.esGibt}&nbsp;</span>
								<span
									style={{
										display: 'inline-block',
										transform: `scale(${(1 + 0.4 * (1 - sevenSlam)) * (1 + pump)})`,
										transformOrigin: '50% 70%',
										...goldTextStyle(),
									}}
								>
									{count}.
								</span>
							</div>
						</MaskReveal>
					</At>
				</div>
			) : null}
		</div>
	);
};
