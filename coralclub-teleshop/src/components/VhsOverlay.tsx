// Fernseh-Anmutung über dem ganzen Bild: feine Zeilen, Korn, Vignette.
// Bewusst zurückhaltend, damit es nach Zitat aussieht und nicht nach Defekt.
// Im Schwarzweiß-Teil (strong) kräftiger.
import {AbsoluteFill, Img, random, staticFile} from 'remotion';
import {HEIGHT, WIDTH} from '../video';

export const VhsOverlay: React.FC<{frame: number; strong?: boolean}> = ({frame, strong = false}) => {
	// Korn wechselt alle 3 Frames (10 fps): wirkt wie Filmkorn, und der Encoder
	// muss nicht jedes Bild komplett neues Rauschen speichern.
	const step = Math.floor(frame / 3);
	const ox = Math.floor(random(`gx-${step}`) * 512);
	const oy = Math.floor(random(`gy-${step}`) * 512);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{/* Korn: Rauschkachel, alle 3 Bilder an anderer Stelle */}
			<AbsoluteFill style={{opacity: strong ? 0.22 : 0.07, mixBlendMode: 'overlay', overflow: 'hidden'}}>
				<div style={{position: 'absolute', left: -ox, top: -oy, width: WIDTH + 512, height: HEIGHT + 512, display: 'flex', flexWrap: 'wrap'}}>
					{Array.from({length: 4 * 6}, (_, i) => (
						<Img key={i} src={staticFile('textur/rauschen.png')} style={{width: 512, height: 512}} />
					))}
				</div>
			</AbsoluteFill>
			{/* Zeilen */}
			<AbsoluteFill
				style={{
					backgroundImage: `repeating-linear-gradient(180deg, rgba(0,0,0,${strong ? 0.16 : 0.07}) 0px, rgba(0,0,0,${strong ? 0.16 : 0.07}) 2px, transparent 2px, transparent 5px)`,
				}}
			/>
			{/* Vignette */}
			<AbsoluteFill
				style={{background: `radial-gradient(ellipse 75% 60% at 50% 45%, transparent 55%, rgba(0,0,0,${strong ? 0.6 : 0.32}) 100%)`}}
			/>
		</AbsoluteFill>
	);
};
