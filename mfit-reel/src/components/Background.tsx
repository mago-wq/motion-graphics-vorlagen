// Hintergrund über das ganze Video: fast Schwarz, warmes Licht von oben,
// Vignette, auf den Drops ein kurzer warmer Lichtstoß, darüber feines Filmkorn
// (verhindert auch Banding in den dunklen Verläufen nach der Kompression).
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {impulse} from '../motion';
import {COLORS, withAlpha} from '../theme';

export const Background: React.FC<{frame: number; drops: number[]}> = ({frame, drops}) => {
	const flash = drops.reduce((sum, at) => sum + impulse(frame, at, 16), 0);
	return (
		<AbsoluteFill style={{backgroundColor: COLORS.bg}}>
			{/* Warmes Oberlicht wie über einer Trainingsfläche, sehr zurückhaltend */}
			<AbsoluteFill
				style={{
					background: `linear-gradient(180deg, ${withAlpha(COLORS.gold, 0.07 + flash * 0.07)} 0%, ${withAlpha(COLORS.gold, 0.02)} 38%, transparent 62%)`,
				}}
			/>
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 120% 80% at 50% 42%, transparent 55%, rgba(0, 0, 0, 0.6) 100%)`,
				}}
			/>
		</AbsoluteFill>
	);
};

/**
 * Filmkorn als oberste Ebene. Wechselt alle 2 Frames die Kachel (wirkt wie Film, nicht wie Flimmern).
 * `hd`: Kacheln in doppelter Auflösung für den 4K-Render – gleiche Körnung relativ zum Bild,
 * aber nativ fein statt hochskaliert.
 */
export const Grain: React.FC<{frame: number; still: boolean; hd: boolean}> = ({frame, still, hd}) => {
	const step = still ? 0 : Math.floor(frame / 2);
	const tile = step % 8;
	const name = (i: number) => `grain/korn-${hd ? 'hd-' : ''}${i}.png`;
	// Versatz je Schritt, damit sich das Muster nicht als Kachel zu erkennen gibt
	const ox = (step * 97) % 256;
	const oy = (step * 61) % 256;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: 0.1, mixBlendMode: 'overlay', overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					inset: -256,
					backgroundImage: `url('${staticFile(name(tile))}')`,
					backgroundSize: '256px 256px',
					transform: `translate(${ox}px, ${oy}px)`,
				}}
			/>
			{/* Kacheln vorab laden, damit beim Rendern keine fehlen */}
			<div style={{display: 'none'}}>
				{Array.from({length: 8}, (_, i) => (
					<Img key={i} src={staticFile(name(i))} />
				))}
			</div>
		</AbsoluteFill>
	);
};
