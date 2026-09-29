// Stilbild 2: Probetraining anfragen. Großes Handy mit dem echten Anfrageformular
// von mfit-smart.de (Studio, Wunschtermin, Uhrzeit, "Probetraining anfragen"),
// daneben die Figur, die auf ihr Handy schaut – gestrichelte Linie verbindet beides.
import {AbsoluteFill} from 'remotion';
import {config} from '../config';
import {FontGate} from '../components/FontGate';
import {GoldDefs, TICK_PATH} from '../components/Glyphs';
import {At} from '../components/Layout';
import {LogoMark} from '../components/Logo';
import {Line} from '../components/Type';
import {COLORS, TEXT_FONT, withAlpha} from '../theme';
import {TYPE_WIDTH} from '../video';
import {Person, POSE_PHONE} from './Person';

const GROUND = 1700;
const PHONE = {x: 120, y: 560, w: 560, h: 1110, r: 64};

const Field: React.FC<{label: string; children: React.ReactNode}> = ({label, children}) => (
	<div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
		<div style={{fontSize: 22, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.textFaint}}>{label}</div>
		{children}
	</div>
);

const Pill: React.FC<{active?: boolean; children: React.ReactNode; wide?: boolean}> = ({active, children, wide}) => (
	<div
		style={{
			flex: wide ? 1 : undefined,
			padding: '14px 0',
			minWidth: 76,
			borderRadius: 16,
			textAlign: 'center',
			fontSize: 26,
			fontWeight: 600,
			lineHeight: 1.1,
			background: active ? COLORS.gold : '#1B1D22',
			color: active ? COLORS.bg : COLORS.text,
			border: active ? 'none' : `2px solid ${withAlpha(COLORS.text, 0.08)}`,
		}}
	>
		{children}
	</div>
);

const Tick: React.FC<{size: number}> = ({size}) => (
	<svg viewBox="0 0 100 100" width={size} height={size}>
		<path d={TICK_PATH} fill="none" stroke={COLORS.gold} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

export const StilHandy: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: COLORS.bg}}>
		<GoldDefs />
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			{/* Flache Hintergrundformen statt Verläufe */}
			<circle cx={430} cy={1120} r={500} fill="#15120B" />
			<circle cx={930} cy={760} r={120} fill="#15120B" />
			{/* kleine schwebende Symbole: Hantel, Kalender */}
			<g transform="translate(900 700) rotate(-18)" fill="none" stroke={COLORS.gold} strokeWidth={7} strokeLinecap="round" opacity={0.8}>
				<path d="M -46 0 H 46" />
				<rect x={-60} y={-24} width={14} height={48} rx={5} />
				<rect x={46} y={-24} width={14} height={48} rx={5} />
			</g>
			<g transform="translate(975 900) rotate(10)" fill="none" stroke={COLORS.gold} strokeWidth={6} opacity={0.55}>
				<rect x={-38} y={-34} width={76} height={70} rx={10} />
				<path d="M -38 -14 H 38 M -18 -44 V -26 M 18 -44 V -26" strokeLinecap="round" />
			</g>
			{/* Boden */}
			<rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#111216" />
			<rect x={0} y={GROUND} width={1080} height={6} fill="#26282F" />
			{/* Schatten unter dem Handy */}
			<ellipse cx={400} cy={GROUND + 6} rx={260} ry={18} fill="#000000" opacity={0.5} />
			{/* Verbindung vom kleinen Handy der Figur zum großen */}
			<path d="M 922 1236 C 860 1150 790 1110 706 1086" fill="none" stroke={COLORS.gold} strokeWidth={4} strokeDasharray="4 14" strokeLinecap="round" />
			<circle cx={922} cy={1236} r={8} fill={COLORS.gold} />
			<Person pose={POSE_PHONE} x={880} y={GROUND} scale={0.6} />
		</svg>

		{/* Das Handy: echtes Formular von mfit-smart.de, dunkles Design wie dort */}
		<div
			style={{
				position: 'absolute',
				left: PHONE.x,
				top: PHONE.y,
				width: PHONE.w,
				height: PHONE.h,
				borderRadius: PHONE.r,
				background: '#050506',
				padding: 16,
				boxSizing: 'border-box',
				transform: 'rotate(-3deg)',
				boxShadow: `0 0 0 3px ${withAlpha(COLORS.gold, 0.55)}`,
			}}
		>
			<div
				style={{
					width: '100%',
					height: '100%',
					borderRadius: PHONE.r - 16,
					background: '#0F1013',
					overflow: 'hidden',
					fontFamily: TEXT_FONT,
					color: COLORS.text,
					display: 'flex',
					flexDirection: 'column',
					padding: '26px 34px 34px',
					boxSizing: 'border-box',
					gap: 26,
				}}
			>
				{/* Statuszeile und Adresszeile */}
				<div style={{display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 600, color: COLORS.textMuted}}>
					<span>18:02</span>
					<span style={{width: 110, height: 28, borderRadius: 14, background: '#050506'}} />
					<span>●●●</span>
				</div>
				<div style={{alignSelf: 'center', padding: '10px 26px', borderRadius: 999, background: '#1B1D22', fontSize: 22, color: COLORS.textMuted}}>
					{config.website}
				</div>
				<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
					<LogoMark height={54} />
					<div style={{display: 'flex', flexDirection: 'column', gap: 7}}>
						{[0, 1, 2].map((i) => (
							<span key={i} style={{width: 34, height: 4, borderRadius: 2, background: COLORS.text}} />
						))}
					</div>
				</div>
				<div style={{fontSize: 44, fontWeight: 800, lineHeight: 1.1}}>
					Probetraining
					<br />
					<span style={{color: COLORS.gold}}>anfragen</span>
				</div>
				<div style={{display: 'flex', gap: 22, fontSize: 24, fontWeight: 600}}>
					{['100 % kostenlos', 'Unverbindlich'].map((t) => (
						<span key={t} style={{display: 'flex', alignItems: 'center', gap: 8}}>
							<Tick size={30} />
							{t}
						</span>
					))}
				</div>
				<Field label="Studio">
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '18px 22px',
							borderRadius: 16,
							border: `3px solid ${COLORS.gold}`,
							fontSize: 28,
							fontWeight: 600,
						}}
					>
						MFit Smart Ritterhude
						<span style={{color: COLORS.gold}}>▾</span>
					</div>
				</Field>
				<Field label="Wunschtermin">
					<div style={{display: 'flex', gap: 10}}>
						{[
							['Mo', '5'],
							['Di', '6'],
							['Mi', '7'],
							['Do', '8'],
							['Fr', '9'],
						].map(([d, n]) => (
							<Pill key={d} active={d === 'Mi'} wide>
								<div style={{fontSize: 18, opacity: 0.75}}>{d}</div>
								{n}
							</Pill>
						))}
					</div>
				</Field>
				<Field label="Uhrzeit">
					<div style={{display: 'flex', gap: 10}}>
						{['07:00', '12:00', '18:00', '21:00'].map((t) => (
							<Pill key={t} active={t === '18:00'} wide>
								{t}
							</Pill>
						))}
					</div>
				</Field>
				<Field label="Vorname">
					<div style={{padding: '18px 22px', borderRadius: 16, background: '#1B1D22', fontSize: 28, fontWeight: 500}}>
						Lena<span style={{color: COLORS.gold}}>|</span>
					</div>
				</Field>
				<div style={{flex: 1}} />
				{/* Button mit Tipp-Wellen */}
				<div style={{position: 'relative'}}>
					<div
						style={{
							borderRadius: 18,
							background: COLORS.gold,
							color: COLORS.bg,
							fontSize: 30,
							fontWeight: 800,
							textAlign: 'center',
							padding: '26px 0',
						}}
					>
						Probetraining anfragen
					</div>
					{[46, 78].map((r, i) => (
						<span
							key={r}
							style={{
								position: 'absolute',
								left: 330 - r,
								top: 40 - r,
								width: r * 2,
								height: r * 2,
								borderRadius: '50%',
								border: `3px solid ${COLORS.goldLight}`,
								opacity: 0.7 - i * 0.3,
							}}
						/>
					))}
				</div>
			</div>
		</div>

		<FontGate>
			<At y={330}>
				<Line text="Probetraining" maxWidth={TYPE_WIDTH} maxSize={104} />
			</At>
			<At y={440}>
				<Line text="Kostenlos anfragen." maxWidth={TYPE_WIDTH} maxSize={80} gold />
			</At>
		</FontGate>
	</AbsoluteFill>
);
