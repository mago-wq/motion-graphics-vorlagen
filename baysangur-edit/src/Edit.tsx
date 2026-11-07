// Baysangur von Benoy – Edit im Stil alter Farbfilm-Aufnahmen mit Sprichwort-Einblendungen.
// Aufbau wie das Vorbild: lange erste Einstellung mit Sprichwort links/rechts der Figur →
// schnelle Schnitte auf jeden zweiten Schlag mit Bildkästchen → zweites Sprichwort (Halt) →
// schnelle Schnitte → Einzelwort МАРШО. Alle Zeiten hängen an src/timeline.json.
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FilmBand, Outline, PopBox, Shot} from './components/Film';
import {F} from './fonts';
import {BAND, DURATION, f, TL} from './video';

const B = TL.beats.map(f); // Schläge in Frames
const img = (n: string) => `img/${n}`;

// Sprichwörter: rus4all.ru, „Чеченская народная мудрость“ (Nr. 206 und 203), Quelle in README.md
const Q1 = {left: 'СТЕГАН\nМАХ', right: 'ША\nХАДИЙНАРГ\nБУ', de: 'Der Wert eines Mannes ist der, den er sich selbst gibt.'};
const Q2 = {top: 'СОБАР —', bottom: 'ТОЛАМАН\nЛАРД ЙУ', de: 'Geduld ist das Fundament des Sieges.'};

/** Deutsche Übersetzung klein im unteren Balken */
const Translation: React.FC<{text: string; dur: number}> = ({text, dur}) => {
	const fr = useCurrentFrame();
	const o = interpolate(fr, [4, 12, dur - 4, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<div
			style={{
				position: 'absolute',
				left: 60,
				right: 60,
				top: BAND.y + BAND.h + 38,
				textAlign: 'center',
				fontFamily: F.cond,
				fontWeight: 500,
				fontSize: 38,
				letterSpacing: 0.5,
				color: 'rgba(240,232,215,0.9)',
				opacity: o,
			}}
		>
			{text}
		</div>
	);
};

/** Erste Einstellung: Baysangur (freigestellte Zeichnung, scripts/make_figure.py) vor Himmel und Bergen */
const Hero: React.FC<{dur: number}> = ({dur}) => {
	const fr = useCurrentFrame();
	const s = interpolate(fr, [0, dur], [1, 1.045]);
	return (
		<AbsoluteFill>
			{/* Himmel wie im Vorbild (türkis), Berge nur unten – so steht die Figur frei */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, #6fa3ab 0%, #94bdb9 55%, #b9cfc4 100%)'}} />
			<Shot
				src={img('mountains_kezenoyam.jpg')}
				focus={[0.5, 0.42]}
				zoom={[1.05, 1.1]}
				dur={dur}
				style={{WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, transparent 42%, #000 58%)'}}
			/>
			<Img
				src={staticFile(img('baysangur_fig.png'))}
				style={{
					position: 'absolute',
					width: 780,
					left: (BAND.w - 780) / 2 + 6,
					top: 44,
					transformOrigin: '50% 20%',
					transform: `scale(${s})`,
					filter: 'contrast(1.12) saturate(0.9) sepia(0.15) drop-shadow(0 0 18px rgba(20,30,30,0.35))',
					WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 74%, transparent 86%)',
				}}
			/>
		</AbsoluteFill>
	);
};

type ShotDef = {from: number; to: number; band: (dur: number) => React.ReactNode; over?: (dur: number) => React.ReactNode};

function buildShots(): ShotDef[] {
	const bx = (n: number) => B[n];
	return [
		// 1 – Sprichwort 1 über Baysangur vor Himmel und Bergen
		{
			from: 0,
			to: bx(6),
			band: (d) => <Hero dur={d} />,
			over: (d) => (
				<>
					<div style={{position: 'absolute', left: 20, width: 380, top: 860}}>
						<Outline size={80} color="#fff" stroke="#000">{Q1.left}</Outline>
					</div>
					<div style={{position: 'absolute', left: 700, width: 360, top: 860}}>
						<Outline size={74} color="#000" stroke="#fff">{Q1.right}</Outline>
					</div>
					<Translation text={Q1.de} dur={d} />
					<PopBox at={bx(5)} src={img('baysangur_medal.jpg')} x={880} y={572} w={170} h={110} focus={[0.5, 0.5]} zoom={1.5} />
					<PopBox at={bx(5) + 6} src={img('baysangur_churt.jpg')} x={70} y={1150} w={150} h={180} focus={[0.5, 0.35]} zoom={1.1} grade="film" />
				</>
			),
		},
		// 2 – Reiterkampf im Wald (Roubaud), langsame Fahrt
		{from: bx(6), to: bx(8), band: (d) => <Shot src={img('war_roubaud_scene.jpg')} focus={[0.56, 0.5]} zoom={[1.3, 1.42]} dur={d} />},
		// 3 – Dargo im Schnee (S/W), Einzelwort КЪОНАХ mit Collage
		{
			from: bx(8),
			to: bx(10),
			band: (d) => <Shot src={img('war_dargo_roubaud.jpg')} focus={[0.45, 0.42]} zoom={[1.0, 1.1]} dur={d} grade="filmBw" />,
			over: () => (
				<>
					<PopBox at={bx(9) - bx(8)} src={img('baysangur.jpg')} x={395} y={800} w={290} h={240} focus={[0.46, 0.2]} zoom={2.4} word="КЪОНАХ" wordSize={64} />
					<PopBox at={bx(9) - bx(8) + 3} src={img('chechens_kennan.jpg')} x={790} y={590} w={230} h={140} focus={[0.5, 0.3]} zoom={1.6} grade="filmBw" />
					<PopBox at={bx(9) - bx(8) + 6} src={img('murids_1902.jpg')} x={90} y={1160} w={230} h={140} focus={[0.6, 0.4]} zoom={1.5} grade="filmBw" />
				</>
			),
		},
		// 4 – Steine des Wehrturms, nah (wie die Bronze-Details im Vorbild)
		{from: bx(10), to: bx(12), band: (d) => <Shot src={img('tower_khambetar.jpg')} focus={[0.45, 0.72]} zoom={[1.55, 1.7]} dur={d} />},
		// 5 – Valerik (Lermontow), Ausschnitt Kampf
		{from: bx(12), to: bx(13), band: (d) => <Shot src={img('war_valerik_lermontov.jpg')} focus={[0.76, 0.42]} zoom={[1.9, 2.0]} dur={d} grade="filmWarm" />},
		// 6–8 – Baysangur: halbnah → nah → Augen (wie die drei Büsten-Einstellungen im Vorbild)
		{from: bx(13), to: bx(14), band: (d) => <Shot src={img('baysangur.jpg')} focus={[0.46, 0.3]} zoom={[1.0, 1.04]} dur={d} grade="filmWarm" />},
		{from: bx(14), to: bx(15), band: (d) => <Shot src={img('baysangur.jpg')} focus={[0.46, 0.22]} zoom={[1.7, 1.78]} dur={d} grade="filmWarm" />},
		{from: bx(15), to: bx(16), band: (d) => <Shot src={img('baysangur.jpg')} focus={[0.47, 0.19]} zoom={[3.0, 3.15]} dur={d} grade="filmWarm" />},
		// 9 – Sprichwort 2: Dorf Sharoi mit Wehrtürmen (alte Aufnahme), Halt
		{
			from: bx(16),
			to: bx(22),
			band: (d) => <Shot src={img('sharoi_1800.jpg')} focus={[0.6, 0.45]} zoom={[1.08, 1.2]} dur={d} grade="filmBw" />,
			over: (d) => (
				<>
					<div style={{position: 'absolute', left: 60, width: 640, top: 640}}>
						<Outline size={92} color="#000" stroke="#fff" align="left" style={{transformOrigin: '0 0'}}>{Q2.top}</Outline>
					</div>
					<div style={{position: 'absolute', left: 60, width: 640, top: 760}}>
						<Outline size={92} color="#000" stroke="#fff" align="left" style={{transformOrigin: '0 0'}}>{Q2.bottom}</Outline>
					</div>
					<Translation text={Q2.de} dur={d} />
					<PopBox at={bx(21) - bx(16)} src={img('baysangur_order1861.jpg')} x={770} y={1080} w={260} h={220} focus={[0.5, 0.45]} zoom={1.2} />
				</>
			),
		},
		// 10 – Berge weit (wie die Akropolis von unten)
		{
			from: bx(22),
			to: bx(24),
			band: (d) => <Shot src={img('mountains_kezenoyam.jpg')} focus={[0.5, 0.45]} zoom={[1.0, 1.06]} dur={d} />,
			over: () => <PopBox at={bx(23) - bx(22)} src={img('baysangur.jpg')} x={150} y={780} w={210} h={250} focus={[0.46, 0.25]} zoom={1.7} />,
		},
		// 11 – Türme von Ushkaloy, von unten
		{
			from: bx(24),
			to: bx(26),
			band: (d) => <Shot src={img('towers_ushkaloy.jpg')} focus={[0.45, 0.62]} zoom={[1.15, 1.25]} dur={d} />,
			over: () => (
				<>
					<PopBox at={bx(25) - bx(24)} src={img('chechen_yermakov.jpg')} x={120} y={700} w={220} h={160} focus={[0.42, 0.13]} zoom={2.2} grade="filmBw" />
					<PopBox at={bx(25) - bx(24) + 4} src={img('baysangur_churt.jpg')} x={120} y={872} w={220} h={160} focus={[0.5, 0.3]} zoom={1.3} />
				</>
			),
		},
		// 12 – Wehrturm-Siedlung, Schluss: МАРШО
		{
			from: bx(26),
			to: DURATION,
			band: (d) => <Shot src={img('towers_chechnya.jpg')} focus={[0.5, 0.55]} zoom={[1.2, 1.28]} dur={d} />,
			over: () => (
				<>
					<PopBox at={bx(28) - bx(26)} src={img('tower_komalkhi.jpg')} x={250} y={870} w={260} h={250} focus={[0.4, 0.5]} zoom={1.3} word="МАРШО" wordSize={70} />
					<PopBox at={bx(29) - bx(26)} src={img('baysangur_medal.jpg')} x={530} y={850} w={240} h={130} focus={[0.5, 0.5]} zoom={1.6} />
					<PopBox at={bx(29) - bx(26) + 4} src={img('valley_chinakha.jpg')} x={530} y={990} w={240} h={130} focus={[0.5, 0.5]} zoom={1.2} />
				</>
			),
		},
	];
}

export const Edit: React.FC = () => {
	const shots = buildShots();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{shots.map((s, i) => (
				<Sequence key={i} from={s.from} durationInFrames={s.to - s.from}>
					<FilmBand>{s.band(s.to - s.from)}</FilmBand>
					{s.over?.(s.to - s.from)}
				</Sequence>
			))}
			<Audio src={staticFile('audio/mix.wav')} />
		</AbsoluteFill>
	);
};
