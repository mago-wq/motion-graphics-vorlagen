// Baysangur von Benoy – Edit im Stil alter Farbfilm-Aufnahmen mit Sprichwort-Einblendungen.
// Aufbau Einstellung für Einstellung nach dem Vorbild (TikTok @obscura.theories):
//   Figur vor Himmel + Sprichwort links/rechts → Punch-ins in ein Gemälde → dunkle Einstellung mit
//   Kästchen und Einzelwort → schnelle Detail-Schnitte → Himmel mit Kästchen-Stapel und Wort →
//   drei Nah-Einstellungen der Figur → Sprichwort 2 vor dunkler Figur auf rotem Vorhang →
//   schnelle Wechsel mit Kästchen → letzte Einstellung mit МАРШО, Abblende.
// Alle Zeiten rasten auf die Schläge aus src/timeline.json ein.
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FilmBand, Outline, PopBox, Shot} from './components/Film';
import {F} from './fonts';
import {BAND, DURATION, f, FPS, TL} from './video';

const BEATS = TL.beats.map(f);
/** Nächster Schlag zur Sekunde t (in Frames) */
const at = (t: number) => BEATS.reduce((b, x) => (Math.abs(x - t * FPS) < Math.abs(b - t * FPS) ? x : b), BEATS[0]);
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

/** Baysangur als freigestellte Figur (scripts/make_figure.py) */
const Figure: React.FC<{dur: number; width: number; left: number; top: number; zoom: [number, number]; filter: string}> = ({dur, width, left, top, zoom, filter}) => {
	const fr = useCurrentFrame();
	const s = interpolate(fr, [0, dur], zoom);
	return (
		<Img
			src={staticFile(img('baysangur_fig.png'))}
			style={{
				position: 'absolute',
				width,
				left,
				top,
				transformOrigin: '50% 20%',
				transform: `scale(${s})`,
				filter,
				WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 74%, transparent 86%)',
			}}
		/>
	);
};

/** Erste Einstellung: Baysangur vor türkisem Himmel, Berge unten (wie die Statue vor der Akropolis) */
const Hero: React.FC<{dur: number}> = ({dur}) => (
	<AbsoluteFill>
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #4f8f99 0%, #79aeb0 55%, #a6c4bb 100%)'}} />
		<Shot
			src={img('mountains_kezenoyam.jpg')}
			focus={[0.5, 0.42]}
			zoom={[1.05, 1.1]}
			dur={dur}
			style={{WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, transparent 42%, #000 58%)'}}
		/>
		<Figure dur={dur} width={780} left={(BAND.w - 780) / 2 + 6} top={44} zoom={[1, 1.045]} filter="contrast(1.25) saturate(1.05) sepia(0.2) brightness(0.92) drop-shadow(0 0 18px rgba(10,20,20,0.45))" />
	</AbsoluteFill>
);

/** Sprichwort 2: dunkle Figur vor rotem Vorhang (wie die sitzende Bronze im Vorbild) */
const Curtain: React.FC<{dur: number}> = ({dur}) => {
	const fr = useCurrentFrame();
	const sway = Math.sin(fr / 18) * 6;
	return (
		<AbsoluteFill>
			<AbsoluteFill
				style={{
					background: `repeating-linear-gradient(90deg, #7a3a36 ${sway}px, #b8726a ${34 + sway}px, #8c4640 ${62 + sway}px, #6b2f2c ${90 + sway}px)`,
					filter: 'blur(5px)',
				}}
			/>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.45))'}} />
			<Figure dur={dur} width={900} left={330} top={-40} zoom={[1.02, 1.1]} filter="grayscale(0.7) sepia(0.45) brightness(0.42) contrast(1.9) drop-shadow(0 0 22px rgba(0,0,0,0.7))" />
		</AbsoluteFill>
	);
};

type Sub = {from: number; band: (dur: number) => React.ReactNode};
type ShotDef = {from: number; to: number; band?: (dur: number) => React.ReactNode; subs?: Sub[]; over?: (dur: number) => React.ReactNode};

function buildShots(): ShotDef[] {
	const s1 = at(5.25), s2 = at(6.71), s3 = at(8.08), s4 = at(9.66), s5 = at(10.92), s6 = at(12.32), s7 = at(16.23), s8 = at(16.77), s9 = at(18.24), s10 = at(19.61);
	const half = (a: number, b: number) => Math.round((a + b) / 2);
	return [
		// 1 – Sprichwort 1 über Baysangur
		{
			from: 0,
			to: s1,
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
					<PopBox at={at(4.24)} src={img('baysangur_medal.jpg')} x={860} y={572} w={190} h={120} focus={[0.5, 0.5]} zoom={1.4} />
					<PopBox at={at(4.76)} src={img('belgatoy_1845.jpg')} x={60} y={1170} w={210} h={150} focus={[0.5, 0.45]} zoom={1.3} />
				</>
			),
		},
		// 2 – Reiterkampf (Roubaud): weit → Punch-in → noch näher (wie der Diskuswerfer)
		{
			from: s1,
			to: s2,
			subs: [
				{from: s1, band: (d) => <Shot src={img('war_roubaud_scene.jpg')} focus={[0.56, 0.5]} zoom={[1.25, 1.35]} dur={d} />},
				{from: at(5.75), band: (d) => <Shot src={img('war_roubaud_scene.jpg')} focus={[0.5, 0.55]} zoom={[2.1, 2.25]} dur={d} />},
				{from: at(6.19), band: (d) => <Shot src={img('war_roubaud_scene.jpg')} focus={[0.62, 0.48]} zoom={[3.0, 3.2]} dur={d} />},
			],
		},
		// 3 – dunkle Einstellung: Wald von Dargo, Kästchen, Einzelwort КЪОНАХ
		{
			from: s2,
			to: s3,
			band: (d) => <Shot src={img('war_dargo_roubaud.jpg')} focus={[0.5, 0.35]} zoom={[1.15, 1.25]} dur={d} grade="filmBw" style={{filter: 'grayscale(1) sepia(0.5) saturate(1.4) contrast(1.6) brightness(0.55)'}} />,
			over: () => (
				<>
					<PopBox at={at(7.25) - s2} src={img('chechens_kennan.jpg')} x={800} y={590} w={220} h={140} focus={[0.5, 0.3]} zoom={1.6} />
					<PopBox at={at(7.25) - s2 + 4} src={img('murids_1902.jpg')} x={80} y={1170} w={230} h={140} focus={[0.6, 0.4]} zoom={1.5} />
					<PopBox at={at(7.62) - s2} src={img('baysangur.jpg')} x={395} y={800} w={290} h={240} focus={[0.46, 0.2]} zoom={2.4} word="КЪОНАХ" wordSize={64} />
				</>
			),
		},
		// 4 – schnelle Details (wie Füße, Hand, Beine, Gesicht im Vorbild)
		{
			from: s3,
			to: s4,
			subs: [
				{from: s3, band: (d) => <Shot src={img('achkhoy.jpg')} focus={[0.62, 0.62]} zoom={[2.6, 2.75]} dur={d} grade="filmBw" />},
				{from: at(8.64), band: (d) => <Shot src={img('tower_khambetar.jpg')} focus={[0.45, 0.72]} zoom={[1.7, 1.8]} dur={d} />},
				{from: at(9.13), band: (d) => <Shot src={img('valerik_color.jpg')} focus={[0.62, 0.3]} zoom={[2.4, 2.5]} dur={d} soft />},
				{from: half(at(9.13), s4), band: (d) => <Shot src={img('baysangur_medal.jpg')} focus={[0.5, 0.5]} zoom={[1.5, 1.6]} dur={d} grade="filmWarm" />},
			],
		},
		// 5 – Himmel und Berge, Kästchen-Stapel und ДАЙМОХК (wie das Tempeldach mit INVICTUS)
		{
			from: s4,
			to: s5,
			band: (d) => <Shot src={img('mountains_kezenoyam.jpg')} focus={[0.3, 0.3]} zoom={[1.5, 1.6]} dur={d} />,
			over: () => (
				<>
					<PopBox at={at(10.12) - s4} src={img('naiby.jpg')} x={70} y={700} w={260} h={170} focus={[0.45, 0.4]} zoom={1.3} />
					<PopBox at={at(10.12) - s4 + 5} src={img('sani_1926.jpg')} x={70} y={882} w={260} h={170} focus={[0.5, 0.45]} zoom={1.2} />
					<PopBox at={at(10.52) - s4} src={img('khulkhulau.jpg')} x={345} y={760} w={260} h={240} focus={[0.5, 0.5]} zoom={1.5} word="ДАЙМОХК" wordSize={58} />
				</>
			),
		},
		// 6 – Baysangur: halbnah → nah → Augen
		{
			from: s5,
			to: s6,
			subs: [
				{from: s5, band: (d) => <Shot src={img('baysangur.jpg')} focus={[0.46, 0.3]} zoom={[1.0, 1.04]} dur={d} grade="filmWarm" />},
				{from: at(11.39), band: (d) => <Shot src={img('baysangur.jpg')} focus={[0.46, 0.22]} zoom={[1.7, 1.78]} dur={d} grade="filmWarm" />},
				{from: at(11.88), band: (d) => <Shot src={img('baysangur.jpg')} focus={[0.47, 0.19]} zoom={[3.0, 3.15]} dur={d} grade="filmWarm" />},
			],
		},
		// 7 – Sprichwort 2: dunkle Figur vor rotem Vorhang
		{
			from: s6,
			to: s7,
			band: (d) => <Curtain dur={d} />,
			over: (d) => (
				<>
					<div style={{position: 'absolute', left: 50, width: 640, top: 760}}>
						<Outline size={88} color="#fff" stroke="#000" align="left" style={{transformOrigin: '0 0'}}>{Q2.top}</Outline>
					</div>
					<div style={{position: 'absolute', left: 50, width: 640, top: 870}}>
						<Outline size={88} color="#fff" stroke="#000" align="left" style={{transformOrigin: '0 0'}}>{Q2.bottom}</Outline>
					</div>
					<Translation text={Q2.de} dur={d} />
					<PopBox at={at(15.26) - s6} src={img('baysangur_order1861.jpg')} x={780} y={600} w={250} h={200} focus={[0.5, 0.45]} zoom={1.2} grade="filmWarm" />
				</>
			),
		},
		// 8 – kurz: Achkhoy, Reiter in der Ebene
		{
			from: s7,
			to: s8,
			band: (d) => <Shot src={img('achkhoy.jpg')} focus={[0.45, 0.45]} zoom={[1.45, 1.55]} dur={d} grade="filmBw" />,
			over: () => <PopBox at={6} src={img('baysangur.jpg')} x={140} y={760} w={190} h={240} focus={[0.46, 0.25]} zoom={1.8} />,
		},
		// 9 – Valerik in Farbe (Lermontow), lebendig und düster – statt der Türme
		{
			from: s8,
			to: s9,
			band: (d) => <Shot src={img('valerik_color.jpg')} focus={[0.4, 0.5]} zoom={[1.1, 1.22]} drift={[30, 0]} dur={d} soft />,
			over: () => (
				<>
					<PopBox at={at(17.27) - s8} src={img('chechen_yermakov.jpg')} x={110} y={690} w={230} h={160} focus={[0.42, 0.13]} zoom={2.2} />
					<PopBox at={at(17.27) - s8 + 4} src={img('baysangur_churt.jpg')} x={110} y={862} w={230} h={160} focus={[0.5, 0.3]} zoom={1.3} />
				</>
			),
		},
		// 10 – Hügel und Tal (Chinkha), von unten
		{
			from: s9,
			to: s10,
			band: (d) => <Shot src={img('valley_chinakha.jpg')} focus={[0.5, 0.35]} zoom={[1.2, 1.3]} dur={d} />,
			over: () => (
				<>
					<PopBox at={at(18.71) - s9} src={img('naiby.jpg')} x={640} y={640} w={250} h={160} focus={[0.3, 0.45]} zoom={1.9} />
					<PopBox at={at(19.14) - s9} src={img('sani_1926.jpg')} x={640} y={812} w={250} h={160} focus={[0.5, 0.4]} zoom={1.3} />
				</>
			),
		},
		// 11 – Schluss: Männer über dem Tal (Vasilenko, „Ущелье в Чечне“), МАРШО, Abblende – statt der Türme
		{
			from: s10,
			to: DURATION,
			band: (d) => <Shot src={img('ushchelye_vasilenko.jpg')} focus={[0.62, 0.55]} zoom={[1.15, 1.3]} dur={d} soft style={{filter: 'sepia(0.7) saturate(1.5) contrast(1.6) brightness(0.68) blur(0.9px)'}} />,
			over: () => (
				<>
					<PopBox at={at(20.08) - s10} src={img('baysangur.jpg')} x={150} y={800} w={250} h={290} focus={[0.46, 0.24]} zoom={1.6} word="МАРШО" wordSize={66} />
					<PopBox at={at(20.58) - s10} src={img('baysangur_medal.jpg')} x={415} y={800} w={250} h={140} focus={[0.5, 0.5]} zoom={1.6} />
					<PopBox at={at(21.08) - s10} src={img('belgatoy_1845.jpg')} x={415} y={950} w={250} h={140} focus={[0.5, 0.45]} zoom={1.3} />
				</>
			),
		},
	];
}

const FadeOut: React.FC = () => {
	const fr = useCurrentFrame();
	const o = interpolate(fr, [DURATION - 18, DURATION - 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return <AbsoluteFill style={{background: '#000', opacity: o}} />;
};

export const Edit: React.FC = () => {
	const shots = buildShots();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{shots.map((s, i) => (
				<Sequence key={i} from={s.from} durationInFrames={s.to - s.from}>
					{s.band && <FilmBand>{s.band(s.to - s.from)}</FilmBand>}
					{s.subs?.map((u, j) => {
						const end = j + 1 < s.subs!.length ? s.subs![j + 1].from : s.to;
						return (
							<Sequence key={j} from={u.from - s.from} durationInFrames={end - u.from}>
								<FilmBand>{u.band(end - u.from)}</FilmBand>
							</Sequence>
						);
					})}
					{s.over?.(s.to - s.from)}
				</Sequence>
			))}
			<FadeOut />
			<Audio src={staticFile('audio/mix.wav')} />
		</AbsoluteFill>
	);
};
