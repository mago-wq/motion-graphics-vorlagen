// Der Bildschnitt. Jede Einstellung hängt an Schlägen/Marken der Tonspur (src/timeline.json).
// Reihenfolge = Geschichte: Dzurdzuketien → Simsir 1395 → Sheikh Mansur → Taimi Bibolt →
// Kaukasuskrieg → Baysangur → Abreken/Zelimkhan → 1944 → 1957 → Dzhokhar Dudayev → НОХЧИ → МАРШО.
import {useMemo} from 'react';
import type {ReactNode} from 'react';
import {AbsoluteFill, Html5Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {cutout, img, place} from './assets';
import {Photo} from './components/Photo';
import {PopOut} from './components/PopOut';
import {MapCaucasus} from './components/MapCaucasus';
import {Counter, Kicker, Quote, Slam, Typed} from './components/Text';
import {F} from './fonts';
import {BeatPulse, HitFlash, Letterbox, useShake, Vignette} from './fx/Overlays';
import {Particles} from './fx/Particles';
import {C} from './theme';
import {beatsOf, mark, section} from './timeline';
import {DURATION} from './video';

type Shot = {from: number; to: number; el: ReactNode};

// ------------------------------------------------------------------ Zeitpunkte
const cold = section('cold');
const ch = beatsOf('chant');
const vs = beatsOf('verse');
const bu = beatsOf('build');
const st1 = section('stutter');
const tape = section('tapestop');
const breath = section('breath');
const d1 = beatsOf('drop1');
const deep = section('deep');
const ab = beatsOf('abrek');
const abrek = section('abrek');
const y44 = section('y1944');
const rise = section('rise');
const st2 = section('stutter2');
const fin = beatsOf('finale');
const finale = section('finale');
const grSec = section('grachev');
const fin2 = beatsOf('finale2');
const st3 = section('stutter3');
const end = section('end');

// Mitten im 1080×1920-Raster für Texte
const Y_TITLE = 1180;
const Y_KICK = 1330;

// JSX erst beim Rendern erzeugen (nicht beim Laden des Moduls – dort gibt es React noch nicht).
function buildShots(): Shot[] {
	const shots: Shot[] = [];
	const add = (from: number, to: number, el: ReactNode) => {
		if (to > from) shots.push({from, to, el});
	};

	// ------------------------------------------------------------------ 0 Kalter Einstieg (Wind, Wolf)
	// Ein Blitz enthüllt die Türme, НОХЧИ steht sofort im Bild.
	add(cold.from, cold.to, (
		<>
			<LightningReveal src={img('towers_ushkaloy')} />
			<Slam text="НОХЧИ" cyr at={3} y={900} size={330} color={C.bone} />
		</>
	));

	// ------------------------------------------------------------------ 1 Dzurdzuketien → Simsir → 1395 (animierte Karte)
	// Die Karte läuft durchgehend; beim Öffnen des Chants (Donner) schneiden kurz die Türme dazwischen.
	add(ch[0], ch[12], <MapCaucasus b={ch.map((x) => x - ch[0])} />);
	add(ch[0], ch[4], (
		<>
			<Slam text="Dzurdzuketien" at={2} y={300} size={150} />
			<Kicker text="3. Jh. v. Chr. · nach den georgischen Chroniken" at={ch[2] - ch[0]} y={420} />
		</>
	));
	add(ch[4], ch[6], (
		<>
			<Photo src={img('towers_ushkaloy')} grade="paint" focus={[0.5, 0.4]} zoom={[1.0, 1.06]} drift={[0, 40]} punch={0.15} trail rgbIn={10} />
			<Slam text="Türme aus Stein" at={1} y={Y_TITLE} size={150} />
			<Kicker text="Wehrtürme der Wainachen · Mittelalter" at={8} y={Y_KICK} />
		</>
	));
	add(ch[6], ch[8], (
		<>
			<Slam text="Simsir" at={0} y={300} size={170} />
			<Kicker text="1362–1395 · Hauptort Simsir" at={6} y={420} />
		</>
	));
	add(ch[8], ch[11], (
		<>
			<Slam text="1395" at={0} y={300} size={170} />
			<Kicker text="Khour II. kämpft an Tokhtamyschs Seite gegen Timur" at={6} y={420} />
		</>
	));
	add(ch[11], ch[12], (
		<>
			<Slam text="1395" at={-20} y={300} size={170} echo={false} />
			<Kicker text="Timur zieht nach Simsir" at={0} y={420} color={C.red} />
		</>
	));
	add(ch[12], ch[13], <Photo src={img('zafar_kaf_mountains')} grade="paint" zoom={[1.0, 1.08]} punch={0.2} rgbIn={10} />);
	add(ch[13], ch[14], <Photo src={img('zafar_before_battle')} grade="paint" zoom={[1.0, 1.08]} punch={0.2} trail />);
	add(ch[14], ch[15], (
		<>
			<Photo src={img('towers_chechnya')} grade="blood" zoom={[1.0, 1.1]} punch={0.2} />
			<Slam text="Simsir fällt." at={0} y={Y_TITLE} size={150} />
		</>
	));
	add(ch[15], vs[0], (
		<>
			<Photo src={img('valley_chinakha')} grade="paint" zoom={[1.05, 1.12]} punch={0.2} rgbIn={8} />
			<Slam text="Die Berge bleiben." at={0} y={Y_TITLE} size={130} />
		</>
	));

	// ------------------------------------------------------------------ 2 Sheikh Mansur, Taimi Bibolt, Kaukasuskrieg
	add(vs[0], vs[2], (
		<>
			<PopOut src={img('mansur_1787')} cut={cutout('mansur_1787')} img={place('mansur_1787', 0.55, 0.47, 545, 640, 860)}
				frameRect={{x: 150, y: 600, w: 780, h: 740}} behind="MANSUR" behindY={330} behindSize={330} grade="warm" />
			<Kicker text="Sheikh Mansur · aus Aldy" at={6} y={1450} />
		</>
	));
	add(vs[2], vs[4], (
		<>
			<Photo src={img('mansur_1787')} grade="blood" focus={[0.55, 0.47]} zoom={[1.7, 1.9]} punch={0.25} trail rgbIn={8} />
			<Slam text="1785" at={0} y={Y_TITLE - 60} size={260} />
			<Kicker text="Sieg an der Sunscha · erster vereinter Widerstand" at={6} y={Y_KICK} />
		</>
	));
	add(vs[4], vs[8], (
		<>
			<Photo src={img('bibolt_pushkin')} grade="warm" focus={[0.66, 0.3]} zoom={[1.0, 1.12]} punch={0.15} />
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 28%, rgba(0,0,0,0.05) 46%, rgba(0,0,0,0.88) 60%, rgba(0,0,0,0.95) 100%)'}} />
			<Slam text="Taimi Bibolt" at={1} y={360} size={160} />
			<Kicker text="Skizze von Alexander Puschkin · 1829" at={8} y={470} />
			<Quote at={6} y={1180} size={54} wordsPerSec={1.6} lines={['„Славный Бей-Булат,', 'гроза Кавказа“']} />
			<Quote at={14} y={1360} size={38} wordsPerSec={4} color={C.boneDim} lines={['Der ruhmreiche Bei-Bulat, der Schrecken des Kaukasus.']} />
		</>
	));
	const war = [img('war_roubaud_scene'), img('war_valerik_lermontov'), img('war_faesi_1836'), img('war_dargo_roubaud')];
	war.forEach((src, i) => add(vs[8 + i], vs[9 + i] ?? bu[0], <Photo src={src} grade="paint" zoom={[1.25, 1.4]} punch={0.3} rgbIn={14} glitch={i % 2 ? 4 : 0} trail={i % 2 === 0} />));
	add(vs[8], bu[0], (
		<>
			<Slam text="Kaukasuskrieg" at={0} y={Y_TITLE} size={160} />
			<Kicker text="1817–1864 · 47 Jahre" at={8} y={Y_KICK} />
		</>
	));
	add(bu[0], bu[1], <Photo src={img('war_vedeno_horschelt')} grade="paint" zoom={[1.3, 1.45]} punch={0.3} glitch={6} rgbIn={16} />);
	add(bu[1], st1.from, <Photo src={img('sharoi_1800')} grade="blood" zoom={[1.3, 1.5]} punch={0.3} glitch={8} rgb={6} />);
	// Stotterer: Baysangur blitzt auf, Schwarz dazwischen
	beatsOf('stutter').forEach((f0, i, arr) => {
		const to = arr[i + 1] ?? tape.from;
		add(f0, to, i % 2 === 0
			? <Photo src={img('baysangur')} grade="blood" focus={[0.5, 0.28]} zoom={[2.0 + i * 0.25, 2.0 + i * 0.25]} punch={0} />
			: <AbsoluteFill style={{backgroundColor: C.black}}><Slam text="1846" at={0} y={960} size={200} color={C.red} echo={false} /></AbsoluteFill>);
	});
	// Bandstopp: das Bild sackt weg
	add(tape.from, tape.to, <Photo src={img('war_valerik_lermontov')} grade="bw" zoom={[1.3, 1.3]} punch={0} fall />);
	add(breath.from, breath.to, <AbsoluteFill style={{backgroundColor: C.black}} />);

	// ------------------------------------------------------------------ 3 DROP – Baysangur
	add(d1[0], d1[2], (
		<>
			<PopOut src={img('baysangur')} cut={cutout('baysangur')} noFrame img={place('baysangur', 0.47, 0.25, 540, 720, 1350)} behind="BAYSANGUR" behindY={560} behindSize={270} grade="warm" bgDim={0.7} zoom={[1, 1.08]} />
			<Kicker text="Naib aus Benoy · 1794–1861" at={4} y={1450} />
		</>
	));
	add(d1[2], d1[3], <Photo src={img('baysangur')} grade="bw" focus={[0.5, 0.2]} zoom={[2.2, 2.4]} punch={0.2} rgbIn={14} />);
	add(d1[3], d1[4], <Photo src={img('baysangur')} grade="warm" focus={[0.5, 0.45]} zoom={[1.4, 1.5]} punch={0.25} trail />);
	const stop = (word: string, year: string | null, focus: [number, number]) => (
		<>
			<Photo src={img('baysangur')} grade="blood" focus={focus} zoom={[1.9, 2.05]} punch={0.12} opacity={0.55} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.2), rgba(0,0,0,0.85))'}} />
			<Slam text={word} at={0} y={960} size={220} />
			{year ? <Kicker text={year} at={3} y={1110} color={C.red} line={false} /> : null}
		</>
	);
	add(d1[4], d1[5], stop('Ein Arm.', '1846', [0.3, 0.6]));
	add(d1[5], d1[6], <Photo src={img('baysangur')} grade="bw" focus={[0.5, 0.35]} zoom={[1.6, 1.7]} punch={0.2} rgbIn={10} />);
	add(d1[6], d1[7], stop('Ein Auge.', '1846', [0.45, 0.2]));
	add(d1[7], d1[8], <Photo src={img('baysangur')} grade="warm" focus={[0.5, 0.3]} zoom={[1.3, 1.4]} punch={0.2} glitch={3} />);
	add(d1[8], d1[9], stop('Und ein Bein.', '1847 · Gergebil', [0.5, 0.8]));
	add(d1[9], d1[11], (
		<>
			<PopOut src={img('baysangur')} cut={cutout('baysangur')} img={place('baysangur', 0.47, 0.25, 540, 760, 1150)} frameRect={{x: 130, y: 640, w: 820, h: 780}} grade="warm" tilt={2.5} bgDim={0.75} />
			<Slam text="Er kämpfte weiter." at={0} y={470} size={120} />
		</>
	));
	add(d1[11], deep.from, (
		<>
			<Photo src={img('baysangur_order1861')} grade="warm" focus={[0.5, 0.4]} zoom={[1.35, 1.5]} punch={0.25} rgbIn={10} />
			<Kicker text="Zeitung „Kawkas“ 1861 · Befehl zur Hinrichtung" at={2} y={1440} />
		</>
	));
	// Tief und langsam: das Grab, das Zitat
	add(deep.from, deep.to, (
		<>
			<Photo src={img('baysangur_churt')} grade="cold" focus={[0.5, 0.4]} zoom={[1.15, 1.32]} punch={0.06} />
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.75) 75%)'}} />
			<Quote at={4} y={1000} size={60} wordsPerSec={6} lines={['„Redet mit ihnen', 'über eure Sache –', 'sie hören euch eher als ich.“']}
				source="Baysangur zu den Gesandten, die ihm die Kapitulation anboten – er zeigte auf die Gräber" />
		</>
	));

	// ------------------------------------------------------------------ 4 Abreken / Zelimkhan
	add(ab[0], ab[1], <Photo src={img('chechens_kennan')} grade="bw" focus={[0.5, 0.45]} zoom={[1.25, 1.38]} punch={0.3} trail rgbIn={10} />);
	add(ab[1], ab[2], <Photo src={img('murids_1902')} grade="warm" focus={[0.55, 0.45]} zoom={[1.5, 1.65]} punch={0.25} rgbIn={8} />);
	add(ab[0], ab[2], (
		<>
			<Slam text="Abreken" at={0} y={Y_TITLE} size={190} />
			<Kicker text="Die Gesetzlosen der Berge" at={8} y={Y_KICK} />
		</>
	));
	add(ab[2], ab[4], (
		<PopOut src={img('chechen_yermakov')} cut={cutout('chechen_yermakov')} img={place('chechen_yermakov', 0.55, 0.22, 560, 560, 1150)} frameRect={{x: 170, y: 600, w: 740, h: 820}} grade="bw" tilt={-3} />
	));
	add(ab[4], ab[6], (
		<>
			<PopOut src={img('zelimkhan')} cut={cutout('zelimkhan')} img={place('zelimkhan', 0.48, 0.36, 540, 640, 1080)} frameRect={{x: 160, y: 620, w: 760, h: 760}} behind="ZELIMKHAN" behindY={520} behindSize={250} grade="bw" tilt={2.5} />
			<Kicker text="Abrek aus Kharachoy · † 1913" at={5} y={1450} />
		</>
	));
	add(ab[6], ab[7], <Photo src={img('zelimkhan')} grade="blood" focus={[0.5, 0.3]} zoom={[1.6, 1.75]} punch={0.25} rgbIn={14} />);
	add(ab[7], abrek.to, <Photo src={img('zelimkhan')} grade="bw" focus={[0.5, 0.3]} zoom={[2.1, 2.3]} punch={0.3} glitch={10} rgb={8} />);

	// ------------------------------------------------------------------ 5 1944 (tief, gedämpft, Schnee)
	const born = mark('born');
	const deport = mark('deport');
	const solzh = mark('solzh');
	add(y44.from, y44.to, <Photo src={img('valley_chinakha')} grade="cold" zoom={[1.3, 1.45]} opacity={0.22} punch={0} blur={2} />);
	add(born, deport, (
		<>
			<Typed text="15. Februar 1944" at={4} y={800} size={60} color={C.cold} />
			<Typed text="In Yalkhoroy wird" at={30} y={900} size={46} />
			<Typed text="Dzhokhar Dudayev geboren." at={52} y={970} size={46} />
		</>
	));
	add(deport, solzh, (
		<>
			<Typed text="23. Februar 1944" at={2} y={800} size={60} color={C.cold} />
			<Typed text="Das ganze tschetschenische Volk" at={22} y={900} size={42} />
			<Typed text="wird deportiert." at={50} y={970} size={52} color={C.red} />
		</>
	));
	add(solzh, y44.to, (
		<Quote at={2} y={880} size={54} wordsPerSec={5}
			lines={['„Aber es gab eine Nation,', 'die der Psychologie der Unterwerfung', 'überhaupt nicht erlag – nicht Einzelne,', 'nicht Aufrührer, sondern die ganze Nation.', 'Das waren die Tschetschenen.“']}
			source="Alexander Solschenizyn · Der Archipel GULAG" />
	));
	// 1957: Rückkehr – Band läuft an, Bild wird hell
	add(rise.from, rise.to, (
		<>
			<RiseBackground src={img('valley_chinakha')} />
			<Counter from={1944} to={1957} frames={40} at={0} y={900} size={300} />
			<Kicker text="Sie kehren zurück" at={36} y={1080} color={C.bone} />
		</>
	));
	beatsOf('stutter2').forEach((f0, i, arr) => {
		add(f0, arr[i + 1] ?? st2.to, i % 2 === 0
			? <Photo src={img('dudayev_1991')} grade="bw" focus={[0.5, 0.25]} zoom={[1.8 + i * 0.3, 1.8 + i * 0.3]} punch={0} rgb={10} />
			: <AbsoluteFill style={{backgroundColor: C.bone}} />);
	});

	// ------------------------------------------------------------------ 6 FINALE – Dzhokhar Dudayev
	add(fin[0], fin[2], (
		<>
			<PopOut src={img('dudayev_1991')} cut={cutout('dudayev_1991')} noFrame img={place('dudayev_1991', 0.62, 0.33, 560, 760, 1500)} behind="DUDAYEV" behindY={560} behindSize={300} grade="bw" bgDim={0.7} />
			<Kicker text="Dzhokhar Dudayev · 1944–1996" at={4} y={1450} />
			<SignatureWipe src={img('dudayev_signature')} at={12} />
		</>
	));
	add(fin[2], grSec.from, (
		<>
			<PopOut src={img('dudayev_1991')} cut={cutout('dudayev_1991')} img={place('dudayev_1991', 0.62, 0.33, 560, 640, 1250)} frameRect={{x: 150, y: 600, w: 780, h: 780}} grade="bw" tilt={-2.5} />
			<Slam text="къоман турпал" cyr at={0} y={1450} size={120} />
			<Kicker text="„Held des Volkes“ – aus dem Nasheed" at={6} y={300} color={C.bone} />
		</>
	));
	// Breakdown, Dezember 1994: Gratschows Ansage – tief, langsam, dunkel
	add(grSec.from, grSec.to, (
		<>
			<Photo src={img('valley_chinakha')} grade="blood" zoom={[1.25, 1.45]} punch={0.1} opacity={0.32} blur={4} />
			<Kicker text="Dezember 1994" at={0} y={520} color={C.red} line={false} />
			<Quote at={2} y={720} size={40} wordsPerSec={3.2} color={C.boneDim}
				lines={['„Грозный можно взять одним', 'парашютно-десантным полком за два часа.“']} />
			<Quote at={8} y={1000} size={62} wordsPerSec={3.2}
				lines={['„Grosny nehmen wir mit einem', 'Fallschirmjäger-Regiment', 'in zwei Stunden.“']}
				source="Pawel Gratschow · russ. Verteidigungsminister · sinngemäß" />
		</>
	));
	// August 1996: Chassawjurt – die Armee zieht ab
	add(fin2[0], fin2[1], (
		<>
			<Photo src={img('towers_ushkaloy')} grade="blood" zoom={[1.2, 1.3]} punch={0.35} trail rgbIn={14} />
			<Slam text="1996" at={0} y={860} size={300} />
			<Kicker text="Chassawjurt · die russische Armee zieht ab" at={3} y={1060} color={C.bone} />
		</>
	));
	// Rückblick: alle Helden im Halbtakt
	const recap = [
		img('mountains_kezenoyam'), img('zafar_battle'), img('mansur_1787'), img('chechen_yermakov'),
		img('war_roubaud_scene'), img('baysangur'), img('zelimkhan'), img('dudayev_1991'),
	];
	recap.forEach((src, i) => {
		const a = fin2[1] + Math.round((i * (fin2[4] - fin2[1])) / recap.length);
		const b = fin2[1] + Math.round(((i + 1) * (fin2[4] - fin2[1])) / recap.length);
		add(a, b, <Photo src={src} grade={i % 2 ? 'bw' : 'warm'} focus={[0.5, 0.3]} zoom={[1.35, 1.45]} punch={0.3} rgbIn={12} trail={i % 3 === 0} />);
	});
	add(fin2[4], st3.from, (
		<>
			<Photo src={img('towers_ushkaloy')} grade="blood" focus={[0.5, 0.35]} zoom={[1.05, 1.2]} punch={0.3} trail />
			<Slam text="НОХЧИ" cyr at={0} y={900} size={360} />
			<Kicker text="So nennen sich die Tschetschenen selbst" at={10} y={1110} color={C.bone} />
		</>
	));
	beatsOf('stutter3').forEach((f0, i, arr) => {
		const inv = i % 2 === 1;
		add(f0, arr[i + 1] ?? st3.to, (
			<AbsoluteFill style={{backgroundColor: inv ? C.bone : C.red}}>
				<Slam text="НОХЧИ" cyr at={0} y={900} size={360} color={inv ? C.black : C.bone} echo={false} />
			</AbsoluteFill>
		));
	});

	// ------------------------------------------------------------------ 7 Ende: МАРШО
	add(end.from, DURATION, <EndCard />);

	return shots;
}

// ------------------------------------------------------------------ Hilfsbilder
function LightningReveal({src}: {src: string | null}) {
	const frame = useCurrentFrame();
	// zwei Blitze: Frame 1–3 hell, Frame 12–13 schwächer
	const flash = frame <= 3 ? 1 - frame * 0.22 : frame >= 12 && frame <= 14 ? 0.55 - (frame - 12) * 0.2 : 0.08;
	return (
		<>
			<Photo src={src} grade="cold" focus={[0.5, 0.35]} zoom={[1.08, 1.14]} punch={0} opacity={Math.max(0.12, flash)} />
			<AbsoluteFill style={{backgroundColor: '#dfe7ff', opacity: frame <= 1 ? 0.6 : 0, mixBlendMode: 'screen'}} />
		</>
	);
}

function RiseBackground({src}: {src: string | null}) {
	const frame = useCurrentFrame();
	const o = interpolate(frame, [0, 60], [0.1, 0.85], {extrapolateRight: 'clamp'});
	return <Photo src={src} grade="warm" zoom={[1.5, 1.1]} punch={0} opacity={o} />;
}

function SignatureWipe({src, at}: {src: string | null; at: number}) {
	const frame = useCurrentFrame();
	if (!src || frame < at) return null;
	const p = interpolate(frame, [at, at + 18], [0, 100], {extrapolateRight: 'clamp'});
	return (
		<div style={{position: 'absolute', left: 240, top: 1150, width: 600, height: 238, clipPath: `inset(0 ${100 - p}% 0 0)`}}>
			<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(1) brightness(1.4)', mixBlendMode: 'screen'}} />
		</div>
	);
}

function EndCard() {
	const frame = useCurrentFrame();
	const o = interpolate(frame, [10, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{backgroundColor: C.black}}>
			<div style={{opacity: o}}>
				<Slam text="МАРШО" cyr at={10} y={880} size={300} echo={false} />
			</div>
			<Kicker text="Freiheit" at={24} y={1060} color={C.bone} />
			<Kicker text="„маршонан некъ“ – der Weg der Freiheit" at={34} y={1170} size={26} line={false} />
			<Kicker text="„Marsha woghiyla“ – Komm in Freiheit · der Gruß der Tschetschenen" at={44} y={1240} size={22} line={false} />
		</AbsoluteFill>
	);
}

// ------------------------------------------------------------------ Gesamtbild
export const Edit: React.FC = () => {
	const frame = useCurrentFrame();
	const shake = useShake(frame);
	const shots = useMemo(buildShots, []);
	return (
		<AbsoluteFill style={{backgroundColor: C.black, fontFamily: F.slam}}>
			<AbsoluteFill style={{transform: shake || undefined}}>
				{shots.map((s, i) => (
					<Sequence key={i} from={s.from} durationInFrames={s.to - s.from} name={`Einstellung ${i}`}>
						{s.el}
					</Sequence>
				))}
			</AbsoluteFill>
			<Particles kind="ember" from={vs[8]} to={breath.from} count={60} />
			<Particles kind="ember" from={finale.from} to={grSec.from} count={70} />
			<Particles kind="ember" from={fin2[0]} to={st3.from} count={80} />
			<Letterbox from={grSec.from} to={grSec.to} />
			<Particles kind="snow" from={y44.from} to={rise.to} count={110} />
			<Letterbox from={deep.from} to={deep.to} />
			<Letterbox from={y44.from} to={rise.from} size={180} />
			<BeatPulse from={0} to={DURATION} />
			<HitFlash from={0} to={DURATION} />
			<Vignette />
			<Html5Audio src={staticFile('audio/mix.wav')} />
		</AbsoluteFill>
	);
};
