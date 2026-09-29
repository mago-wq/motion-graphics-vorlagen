import {Composition, Still} from 'remotion';
import {MfitReel, type MfitReelProps} from './MfitReel';
import {VERGLEICH} from './story/figuren/gang';
import {FigurEinzeln, FigurenVergleich} from './story/FigurenVergleich';
import {StilFigur} from './story/StilFigur';
import {StilHandy} from './story/StilHandy';
import {DURATION} from './timing';
import {FPS, HEIGHT, WIDTH} from './video';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="MfitReel"
			component={MfitReel}
			durationInFrames={DURATION}
			fps={FPS}
			width={WIDTH}
			height={HEIGHT}
			defaultProps={{showSafeZone: false, withAudio: true, hd: false} satisfies MfitReelProps}
		/>
		{/* Stilbilder für das zweite Video (Figuren + Anmelde-Ablauf) */}
		<Still id="StilFigur" component={StilFigur} width={WIDTH} height={HEIGHT} />
		<Still id="StilHandy" component={StilHandy} width={WIDTH} height={HEIGHT} />
		{/* Figuren-Vergleich: Lottie-Figur gegen Baukasten, nebeneinander und einzeln */}
		<Composition id="FigurenVergleich" component={FigurenVergleich} durationInFrames={VERGLEICH.frames} fps={FPS} width={WIDTH * 2} height={HEIGHT} />
		<Composition id="FigurLottie" component={FigurEinzeln} durationInFrames={VERGLEICH.frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{variante: 'lottie' as const}} />
		<Composition id="FigurKit" component={FigurEinzeln} durationInFrames={VERGLEICH.frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{variante: 'kit' as const}} />
	</>
);
