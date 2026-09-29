// Schluss (40–42 s): MFit-Logo in Gold, Claim und Adresse, dann Standbild.
import {interpolate} from 'remotion';
import {config} from '../../config';
import {At} from '../../components/Layout';
import {Logo, LOGO_DONE} from '../../components/Logo';
import {TextLine} from '../../components/Type';
import {clamp, EASE, impulse, progress} from '../../motion';
import {COLORS, TEXT_FONT} from '../../theme';
import {Kopfzeile} from './teile';
import {Z} from './zeit';

const G = Z.logo;

export const LogoSzene: React.FC<{frame: number}> = ({frame}) => {
	if (frame < G.start - 1) return null;
	const auf = interpolate(frame, [G.start, G.start + 18], [0.9, 1], {...clamp, easing: EASE.out});
	const punch = 1 + 0.04 * impulse(frame, G.finale, 14);
	const glanz = progress(frame, G.finale - 4, 22, (t) => t);
	const [c1, c2] = config.claim;
	return (
		<div style={{position: 'absolute', inset: 0, background: COLORS.bg}}>
			<At y={700}>
				<div style={{transform: `scale(${auf * punch})`}}>
					<Logo height={560} build={{...LOGO_DONE, sheen: glanz}} />
				</div>
			</At>
			<Kopfzeile frame={frame} y={1110} text={c1} ab={G.claim} maxSize={62} />
			<Kopfzeile frame={frame} y={1190} text={c2} ab={G.claim + 5} gold maxSize={62} />
			<At y={1290}>
				<div style={{opacity: progress(frame, G.claim + 10, 8), fontFamily: TEXT_FONT}}>
					<TextLine text={config.website} maxWidth={600} maxSize={44} weight={600} color={COLORS.text} />
				</div>
			</At>
		</div>
	);
};
