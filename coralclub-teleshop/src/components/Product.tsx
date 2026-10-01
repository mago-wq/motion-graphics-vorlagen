// Produktfoto mit Glanzlicht: ein heller, schräger Streifen fährt einmal über
// die Packung (maskiert auf die Packungsform), wie bei Produktaufnahmen im TV.
import {Img, interpolate, staticFile} from 'remotion';
import {clamp} from '../motion';

export const Product: React.FC<{
	src: string;
	height: number;
	frame: number;
	/** Frame, an dem das Glanzlicht startet (optional) */
	glintAt?: number;
	glintFrames?: number;
	shadow?: boolean;
	style?: React.CSSProperties;
}> = ({src, height, frame, glintAt, glintFrames = 16, shadow = true, style}) => {
	const url = staticFile(src);
	const g = glintAt === undefined ? -1 : interpolate(frame, [glintAt, glintAt + glintFrames], [-0.6, 1.6], clamp);
	return (
		<div style={{position: 'relative', height, ...style}}>
			<Img
				src={url}
				style={{
					height,
					display: 'block',
					filter: shadow ? 'drop-shadow(0 30px 40px rgba(3,10,46,0.55))' : undefined,
				}}
			/>
			{g > -0.6 && g < 1.6 ? (
				<div
					style={{
						position: 'absolute',
						inset: 0,
						WebkitMaskImage: `url(${url})`,
						WebkitMaskSize: '100% 100%',
						maskImage: `url(${url})`,
						maskSize: '100% 100%',
						background: `linear-gradient(115deg, transparent ${(g - 0.18) * 100}%, rgba(255,255,255,0.85) ${g * 100}%, transparent ${(g + 0.18) * 100}%)`,
						mixBlendMode: 'screen',
					}}
				/>
			) : null}
		</div>
	);
};
