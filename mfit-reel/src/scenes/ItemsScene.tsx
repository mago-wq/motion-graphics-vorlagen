// Szene 3 (6,4–19,2 s): die sieben Häkchen. Jedes bekommt sein eigenes Piktogramm,
// darunter die Überschrift (zweite Zeile golden).
//
// Wechsel: Die Zeilen rollen wie ein Zählwerk (alte Zeile nach oben hinaus, neue von
// unten herein, im selben Takt – sie liegen nie übereinander). Die Piktogramme laufen
// wie ein Karussell nach links durch, mit Bewegungsunschärfe. Der neue Inhalt steht
// genau auf dem Beat. Getränke → Parkplätze teilen sich "KOSTENLOSE": dort rollt nur Zeile 2.
import {interpolate} from 'remotion';
import {config, type Haekchen} from '../config';
import {At} from '../components/Layout';
import {BottlePicto, ChainPicto, ClockPicto, FacePicto, ParkingPicto} from '../components/Pictograms';
import {SlotText} from '../components/SlotText';
import {StudioNetwork} from '../components/StudioNetwork';
import {fitSize, goldTextStyle, MaskReveal, RollBlock, TextLine} from '../components/Type';
import {clamp, EASE, progress, springFrom, SPRINGS} from '../motion';
import {COLORS, DISPLAY_FONT, NBSP} from '../theme';
import {EV, ITEMS, RECAP} from '../timing';
import {TYPE_WIDTH} from '../video';

const PICTO_Y = 700;
const PICTO_SIZE = 340;
const LINE1_Y = 948;
const LINE2_Y = 1062;
const SUB_Y = 1164;
const NOTE_Y = 1222;
/** Überschrift des Studio-Häkchens; der Recap-Titel übernimmt genau diese Zeilen */
export const STUDIOS_LINES_Y = [546, 628] as const;

/** Dauer eines Wechsels in Frames: endet genau auf dem Beat */
export const ROLL = 5;
/** Weg des Karussells in px (größer als ein Piktogramm breit ist: alt und neu überlappen nie) */
const CAROUSEL = 430;

/** Rollt herein: 0 → 1 im Fenster [beat − dur + delay, beat + delay) */
export const rollIn = (frame: number, beat: number, delay = 0, dur = ROLL) => progress(frame, beat - dur + delay, dur, EASE.inOut);
/** Rollt hinaus: 0 → 1 im gleichen Fenster vor dem Ende */
export const rollOut = (frame: number, end: number, delay = 0, dur = ROLL) => progress(frame, end - dur + delay, dur, EASE.inOut);

type ItemTiming = (typeof ITEMS)[number];

/** Piktogramm im Karussell: kommt von rechts, geht nach links, verwischt in der Bewegung. */
const Carousel: React.FC<{frame: number; start: number; end: number; dur?: number; children: React.ReactNode}> = ({
	frame,
	start,
	end,
	dur = ROLL,
	children,
}) => {
	const x = (f: number) => CAROUSEL * (1 - rollIn(f, start, 0, dur)) - CAROUSEL * rollOut(f, end);
	const pos = x(frame);
	const speed = Math.abs(pos - x(frame - 1));
	const blur = Math.min(24, Math.round(speed * 0.22));
	const opacity = interpolate(rollIn(frame, start, 0, dur), [0, 0.6], [0, 1], clamp) * (1 - interpolate(rollOut(frame, end), [0.4, 1], [0, 1], clamp));
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				transform: `translateX(${pos}px)`,
				opacity,
				filter: blur >= 1 ? `url(#hblur-${blur})` : undefined,
			}}
		>
			<At y={PICTO_Y}>{children}</At>
		</div>
	);
};

/** Gemeinsamer Aufbau: Piktogramm oben, zwei Zeilen, Unterzeile, Fußnote. */
const ItemFrame: React.FC<{
	frame: number;
	item: Haekchen;
	/** Beat, auf dem der Inhalt steht */
	start: number;
	/** Beat, auf dem das nächste Häkchen steht (Abgang davor) */
	end: number;
	picto: React.ReactNode;
	/** Erste Zeile rollt nicht herein (steht schon vom vorigen Häkchen da) */
	keepLine1?: boolean;
	/** Erste Zeile rollt nicht hinaus (das nächste Häkchen übernimmt sie) */
	holdLine1?: boolean;
	/** Dauer des Hereinrollens (beim Drop länger: dort muss auf dem Beat alles stehen) */
	dur?: number;
}> = ({frame, item, start, end, picto, keepLine1, holdLine1, dur = ROLL}) => {
	const [z1, z2] = item.zeilen;
	const smallOut = 1 - interpolate(rollOut(frame, end), [0, 0.5], [0, 1], clamp);
	const row1 = {text: z1, y: LINE1_Y, maxSize: 104};
	const row2 = {text: z2, y: LINE2_Y, maxSize: 128, gold: true};
	// Nur Zeile 2 rollt, Zeile 1 steht (beim Hereinkommen bzw. Hinausgehen); sonst rollt der Block.
	const entering = frame < start;
	const leaving = frame >= end - ROLL;
	const onlyLine2 = (entering && keepLine1) || (leaving && holdLine1);
	return (
		<div style={{position: 'absolute', inset: 0}}>
			<Carousel frame={frame} start={start} end={end} dur={dur}>
				{picto}
			</Carousel>
			{onlyLine2 ? (
				<>
					{(entering ? frame >= start - dur : frame < end) ? <RollBlock rows={[row1]} p={1} bleed={14} /> : null}
					<RollBlock rows={[row2]} p={rollIn(frame, start, 0, dur)} out={rollOut(frame, end)} bleed={14} />
				</>
			) : (
				<RollBlock rows={[row1, row2]} p={rollIn(frame, start, 0, dur)} out={rollOut(frame, end)} />
			)}
			{item.unterzeile ? (
				<At y={SUB_Y}>
					<div style={{opacity: progress(frame, start + 1, 6) * smallOut, transform: `translateY(${(1 - progress(frame, start + 1, 8)) * 14}px)`}}>
						<TextLine text={item.unterzeile} maxWidth={TYPE_WIDTH} maxSize={46} weight={500} color={COLORS.textMuted} />
					</div>
				</At>
			) : null}
			{item.fussnote ? (
				<At y={NOTE_Y}>
					<div style={{opacity: progress(frame, start + 4, 8) * smallOut}}>
						<TextLine text={item.fussnote} maxWidth={TYPE_WIDTH} maxSize={30} weight={400} color={COLORS.textFaint} />
					</div>
				</At>
			) : null}
		</div>
	);
};

export const ItemsScene: React.FC<{frame: number}> = ({frame}) => {
	if (frame < ITEMS[0].start - 8 || frame >= RECAP.start + 2) return null;
	const [kette, gebuehr, uhr, gesicht, getraenke, parken, studios] = ITEMS;
	const items = config.haekchen;
	const visible = (t: ItemTiming) => frame >= t.start - 8 && frame < t.end + 2;
	const sameFirstLine = items[4].zeilen[0] === items[5].zeilen[0];
	// Der Drop: das erste Häkchen rollt etwas länger herein und steht auf dem Schlag komplett
	const DROP_ROLL = 6;

	return (
		<div style={{position: 'absolute', inset: 0}}>
			{/* 1 Monatlich kündbar: Kette reißt auf dem Clap */}
			{visible(kette) ? (
				<ItemFrame
					frame={frame}
					item={items[0]}
					start={kette.start}
					end={kette.end}
					dur={DROP_ROLL}
					picto={
						<ChainPicto
							size={PICTO_SIZE}
							draw={progress(frame, kette.start - 7, 10, EASE.out)}
							brk={progress(frame, EV.kette.bruch, 22, (t) => t)}
						/>
					}
				/>
			) : null}

			{/* 2 Keine Anmeldegebühr: Walze rollt auf 0 € */}
			{visible(gebuehr) ? (
				<ItemFrame
					frame={frame}
					item={items[1]}
					start={gebuehr.start}
					end={gebuehr.end}
					picto={<ZeroEuro frame={frame} rollFrom={gebuehr.start - ROLL} lockAt={EV.gebuehr.null} />}
				/>
			) : null}

			{/* 3 24/7: der Ring schließt sich einmal ganz */}
			{visible(uhr) ? (
				<ItemFrame
					frame={frame}
					item={items[2]}
					start={uhr.start}
					end={uhr.end}
					picto={
						<ClockPicto
							size={PICTO_SIZE + 10}
							draw={progress(frame, uhr.start - ROLL, 12)}
							sweep={progress(frame, EV.uhr.umlauf[0], EV.uhr.umlauf[1] - EV.uhr.umlauf[0], EASE.inOut)}
							label="24/7"
							sheen={progress(frame, EV.uhr.umlauf[1] - 6, 16, (t) => t)}
						/>
					}
				/>
			) : null}

			{/* 4 Face-ID: erst was man NICHT braucht, dann "NUR DEIN GESICHT." */}
			{visible(gesicht) ? <FaceIdItem frame={frame} timing={gesicht} item={items[3]} /> : null}

			{/* 5 + 6 Getränke → Parkplätze */}
			{visible(getraenke) ? (
				<ItemFrame
					frame={frame}
					item={items[4]}
					start={getraenke.start}
					end={getraenke.end}
					holdLine1={sameFirstLine}
					picto={
						<BottlePicto
							size={PICTO_SIZE}
							draw={progress(frame, getraenke.start - ROLL, 10)}
							fill={progress(frame, EV.getraenke.fuellen + 2, 16, EASE.inOut)}
							wave={(frame - getraenke.start) * 0.45}
						/>
					}
				/>
			) : null}
			{visible(parken) ? (
				<ItemFrame
					frame={frame}
					item={items[5]}
					start={parken.start}
					end={parken.end}
					keepLine1={sameFirstLine}
					picto={
						<ParkingPicto
							size={PICTO_SIZE}
							draw={progress(frame, parken.start - ROLL, 10)}
							pop={frame >= EV.parken.schild + 2 ? springFrom(frame, EV.parken.schild + 2, SPRINGS.pop) : 0}
						/>
					}
				/>
			) : null}

			{/* 7 Alle Studios: Liniennetz */}
			{visible(studios) ? <StudiosItem frame={frame} timing={studios} item={items[6]} /> : null}
		</div>
	);
};

/** "0 €" als großes Gold, die Null rollt ein */
const ZeroEuro: React.FC<{frame: number; rollFrom: number; lockAt: number}> = ({frame, rollFrom, lockAt}) => {
	const text = `0${NBSP}€`;
	const size = fitSize({text, maxWidth: 520, maxSize: 300});
	const land = frame >= lockAt ? springFrom(frame, lockAt, SPRINGS.slam) : 0;
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'flex-start',
				fontFamily: DISPLAY_FONT,
				fontSize: size,
				lineHeight: 1,
				transform: `scale(${frame >= lockAt ? 1 + 0.1 * (1 - land) : 1})`,
			}}
		>
			<SlotText text="0" frame={frame} rollFrom={rollFrom} lockAt={[lockAt]} turns={3} digitStyle={goldTextStyle()} />
			<span style={{display: 'inline-block', height: '1em', ...goldTextStyle()}}>{`${NBSP}€`}</span>
		</div>
	);
};

/**
 * Face-ID über zwei Takte: Takt 1 scannt und zählt auf, was man nicht braucht,
 * Takt 2 (entsperrt) "NUR DEIN GESICHT." Die Aufzählung rollt erst ganz hinaus,
 * dann rollt die Überschrift herein – die Zeilen liegen an anderen Stellen.
 */
const FaceIdItem: React.FC<{frame: number; timing: ItemTiming; item: Haekchen}> = ({frame, timing, item}) => {
	const {start, end} = timing;
	const events = EV.gesicht;
	const unlocked = events.entsperrt;
	const scanOn = interpolate(frame, [events.scan, events.scan + 4, unlocked - 2, unlocked + 2], [0, 1, 1, 0], clamp);
	// Zwei volle Durchläufe der Scanlinie bis zur Erkennung
	const scan = interpolate(frame, [events.scan, unlocked], [0, 2], clamp);
	const success = progress(frame, unlocked, 10);
	return (
		<>
			<Carousel frame={frame} start={start} end={end}>
				<FacePicto size={PICTO_SIZE} draw={progress(frame, start - ROLL, 14)} scan={scan} scanOn={scanOn} success={success} />
			</Carousel>
			{config.ohneKarte.map((text, i) => (
				<At key={text} y={LINE1_Y - 10 + i * 88}>
					<MaskReveal p={progress(frame, events.nein[i] - 2, 6)} out={rollOut(frame, unlocked - 3, i * 0.5)}>
						<TextLine text={text.toUpperCase()} maxWidth={TYPE_WIDTH} maxSize={62} weight={800} tracking={0.02} color={COLORS.text} />
					</MaskReveal>
				</At>
			))}
			{frame >= unlocked - 4 ? (
				<ItemFrame frame={frame} item={item} start={unlocked + 2} end={end} picto={null} />
			) : null}
		</>
	);
};

const StudiosItem: React.FC<{frame: number; timing: ItemTiming; item: Haekchen}> = ({frame, timing, item}) => {
	const {start, end} = timing;
	const events = EV.studios;
	const out = rollOut(frame, end);
	const [z1, z2] = item.zeilen;
	return (
		<div style={{position: 'absolute', inset: 0}}>
			{/* Die Überschrift rollt erst herein, wenn das Parkschild fast draußen ist */}
			<RollBlock
				rows={[
					{text: z1, y: STUDIOS_LINES_Y[0], maxSize: 64},
					{text: z2, y: STUDIOS_LINES_Y[1], maxSize: 100, gold: true},
				]}
				p={rollIn(frame, start, 2)}
				out={rollOut(frame, end)}
			/>
			<div style={{position: 'absolute', inset: 0, transform: `translateX(${out * -CAROUSEL}px)`, opacity: 1 - out}}>
				<StudioNetwork frame={frame} lineAt={events.linie} stationsAt={events.stationen} neuAt={events.neu} />
			</div>
		</div>
	);
};
