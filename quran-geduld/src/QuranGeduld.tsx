// Gesamtvideo: Rezitation, Nachthimmel mit Dünen, zehn Bildszenen, Verse mit deutscher Übersetzung.
import {AbsoluteFill, Html5Audio, staticFile} from 'remotion';
import {Background, Grain, Vignette} from './components/Background';
import {FontGate} from './components/FontGate';
import type {SceneProps} from './components/Scene';
import {TextBlock} from './components/TextBlock';
import {CONFIG, type SceneId} from './config';
import {Danken, Gedenken, Undank} from './scenes/Vers152';
import {Gebet, Geduld, MitAllah} from './scenes/Vers153';
import {Blind, Grab, GrabLicht, Lebendig} from './scenes/Vers154';
import {sec} from './video';

const SCENES: Record<SceneId, React.FC<SceneProps>> = {
	gedenken: Gedenken,
	danken: Danken,
	undank: Undank,
	geduld: Geduld,
	gebet: Gebet,
	mitAllah: MitAllah,
	grab: Grab,
	grabLicht: GrabLicht,
	lebendig: Lebendig,
	blind: Blind,
};

export const QuranGeduld: React.FC = () => (
	<AbsoluteFill>
		<Html5Audio src={staticFile(CONFIG.audio.file)} volume={CONFIG.audio.volume} />
		<Background />
		<FontGate>
			{CONFIG.scenes.map((s) => {
				const Scene = SCENES[s.id];
				const mark = (s as {mark?: number}).mark;
				return <Scene key={s.id} from={sec(s.on)} to={sec(s.off)} mark={mark === undefined ? undefined : sec(mark)} />;
			})}
			{CONFIG.texts.map((t, i) => (
				<TextBlock key={i} block={t} />
			))}
		</FontGate>
		<Vignette />
		<Grain />
	</AbsoluteFill>
);
