// Szene 3 (4,0–8,5 s): drei Leistungen fliegen gestaffelt von der Seite rein
// und rasten ein. Danach laufen Goldstreifen als Trenner zwischen den Karten.
import {measureText} from '@remotion/layout-utils';
import {Fragment, useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {FitText} from '../components/FitText';
import {GoldRule} from '../components/GoldRule';
import {Icon} from '../components/Icons';
import {SafeArea} from '../components/SafeArea';
import {config, type Leistung} from '../config';
import {softIn, springFrom, SPRINGS} from '../motion';
import {BODY_FONT, COLORS, formatEuro, HEADLINE_FONT} from '../theme';
import {SCENES, SERVICES} from '../timing';

const CARD_WIDTH = 900; // etwas schmaler als die Zone, damit der langsame Zoom drin bleibt
const CARD_HEIGHT = 212;
const GAP = 60; // Platz für den Goldstreifen
const ICON_SIZE = 116;
const PAD_LEFT = 32;
const PAD_RIGHT = 40;
const INNER_GAP = 28;
const PRICE_SIZE = 122;
const PUSH_IN = 1.02;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const ServiceCard: React.FC<{leistung: Leistung; index: number; frame: number}> = ({leistung, index, frame}) => {
	const side = SERVICES.cardSide(index);
	const land = SERVICES.cardLands[index];
	const fly = springFrom(frame, SERVICES.cardStarts[index], SPRINGS.snap);
	const x = interpolate(fly, [0, 1], [side * 1150, 0]);
	const skew = interpolate(fly, [0, 1], [side * 12, 0]); // lehnt sich in die Bewegung
	const iconDraw = interpolate(frame, [land - 3, land + 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});

	const price = formatEuro(leistung.preis);
	const nameWidth = useMemo(() => {
		const priceWidth = measureText({text: price, fontFamily: HEADLINE_FONT, fontSize: PRICE_SIZE}).width;
		return CARD_WIDTH - PAD_LEFT - PAD_RIGHT - ICON_SIZE - 2 * INNER_GAP - priceWidth;
	}, [price]);

	return (
		<div
			style={{
				width: CARD_WIDTH,
				height: CARD_HEIGHT,
				boxSizing: 'border-box',
				display: 'flex',
				alignItems: 'center',
				gap: INNER_GAP,
				padding: `0 ${PAD_RIGHT}px 0 ${PAD_LEFT}px`,
				background: COLORS.surface,
				border: `2px solid ${COLORS.hairline}`,
				borderRadius: 12,
				transform: `translateX(${x}px) skewX(${skew}deg)`,
			}}
		>
			<Icon name={leistung.icon} size={ICON_SIZE} progress={iconDraw} />
			<div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12}}>
				<FitText
					text={leistung.name}
					maxWidth={nameWidth}
					maxFontSize={96}
					fontFamily={HEADLINE_FONT}
					letterSpacing={0.01}
					uppercase
					style={{color: COLORS.text, marginTop: 6}}
				/>
				{leistung.kurztext ? (
					<FitText
						text={leistung.kurztext}
						maxWidth={nameWidth}
						maxFontSize={34}
						fontFamily={BODY_FONT}
						fontWeight={500}
						style={{color: COLORS.textMuted}}
					/>
				) : null}
			</div>
			<div
				style={{
					fontFamily: HEADLINE_FONT,
					fontSize: PRICE_SIZE,
					lineHeight: 1,
					color: COLORS.accent,
					whiteSpace: 'nowrap',
					marginTop: 10,
				}}
			>
				{price}
			</div>
		</div>
	);
};

export const ServicesScene: React.FC = () => {
	const frame = useCurrentFrame() + SCENES.leistungen.from;
	const dividers = softIn(frame, SERVICES.dividersIn, 16);
	const sceneEnd = SCENES.leistungen.from + SCENES.leistungen.durationInFrames;
	// Ganz langsamer Zoom, solange die Preise stehen
	const push = interpolate(frame, [SERVICES.dividersIn, sceneEnd], [1, PUSH_IN], {
		...clamp,
		easing: Easing.inOut(Easing.sin),
	});

	return (
		<AbsoluteFill>
			<SafeArea>
				<div style={{transform: `scale(${push})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
					<div style={{width: CARD_WIDTH, marginBottom: 54}}>
						{/* Kommt mit dem Szenenübergang ins Bild, deshalb ohne eigene Einblendung */}
						<FitText
							text={config.texte.leistungenTitel}
							maxWidth={CARD_WIDTH}
							maxFontSize={126}
							fontFamily={HEADLINE_FONT}
							letterSpacing={0.01}
							uppercase
							style={{color: COLORS.text}}
						/>
					</div>
					{config.leistungen.map((leistung, i) => (
						<Fragment key={leistung.name}>
							{i > 0 ? (
								<div style={{height: GAP, display: 'flex', alignItems: 'center'}}>
									<GoldRule progress={dividers} width={CARD_WIDTH - 80} />
								</div>
							) : null}
							<ServiceCard leistung={leistung} index={i} frame={frame} />
						</Fragment>
					))}
				</div>
			</SafeArea>
		</AbsoluteFill>
	);
};
