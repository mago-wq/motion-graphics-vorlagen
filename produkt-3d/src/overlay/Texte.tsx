// Texteinblendungen über der 3D-Szene. Inhalte aus config.ts, Zeiten aus timing.ts.
import {fitText} from '@remotion/layout-utils';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {BODY_FONT, HEADLINE_FONT} from '../fonts';
import {easeInOut} from '../motion';
import {HOOK, MARKE, MERKMALE, STILL_FROM} from '../timing';
import {SAFE} from '../video';

const {farben} = config;

const useFeder = (start: number, damping = 18) => {
	const {fps} = useVideoConfig();
	const frame = Math.min(useCurrentFrame(), STILL_FROM);
	return spring({frame: frame - start, fps, config: {damping}});
};

const Hook: React.FC = () => {
	const frame = useCurrentFrame();
	const aus = interpolate(frame, [HOOK.aus, HOOK.aus + 12], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: easeInOut,
	});
	const a = useFeder(HOOK.zeilen[0]);
	const b = useFeder(HOOK.zeilen[1]);
	if (aus >= 1) return null;
	const zeile = (text: string, f: number, farbe: string) => (
		<div
			style={{
				fontFamily: HEADLINE_FONT,
				fontSize: 136,
				lineHeight: 1,
				color: farbe,
				opacity: f,
				transform: `translateY(${(1 - f) * 70}px)`,
			}}
		>
			{text}
		</div>
	);
	return (
		<div
			style={{
				position: 'absolute',
				top: SAFE.top,
				width: '100%',
				textAlign: 'center',
				opacity: 1 - aus,
				transform: `translateY(${-aus * 60}px)`,
			}}
		>
			{zeile(config.hook[0], a, farben.text)}
			{zeile(config.hook[1], b, farben.akzent)}
		</div>
	);
};

const Merkmale: React.FC = () => {
	const frame = useCurrentFrame();
	const aus = interpolate(frame, [MERKMALE.aus, MERKMALE.aus + 12], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: easeInOut,
	});
	const federn = [useFeder(MERKMALE.start), useFeder(MERKMALE.start + MERKMALE.abstand), useFeder(MERKMALE.start + MERKMALE.abstand * 2)];
	if (frame < MERKMALE.start || aus >= 1) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE.left,
				right: SAFE.left,
				top: 1185,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 22,
				opacity: 1 - aus,
			}}
		>
			{config.merkmale.map((m, i) => {
				const f = federn[i];
				return (
					<div
						key={m}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 22,
							padding: '20px 38px',
							borderRadius: 60,
							background: 'rgba(10, 20, 30, 0.72)',
							border: `2px solid ${farben.akzent}55`,
							boxShadow: `0 0 40px ${farben.akzent2}22`,
							opacity: f,
							transform: `translateX(${(1 - f) * (i % 2 ? 260 : -260)}px)`,
						}}
					>
						<div style={{width: 18, height: 18, borderRadius: 9, background: i === 1 ? farben.akzent2 : farben.akzent}} />
						<div style={{fontFamily: BODY_FONT, fontWeight: 700, fontSize: 46, color: farben.text}}>{m}</div>
					</div>
				);
			})}
		</div>
	);
};

const Schluss: React.FC = () => {
	const frame = Math.min(useCurrentFrame(), STILL_FROM);
	const name = useFeder(MARKE.name, 22);
	const sorte = useFeder(MARKE.sorte);
	const slogan = useFeder(MARKE.slogan);
	const button = useFeder(MARKE.button, 11);
	const web = useFeder(MARKE.web);
	if (frame < MARKE.name) return null;

	const marke = config.marke.toUpperCase();
	const sperrung = interpolate(name, [0, 1], [0.35, 0.06]);
	const {fontSize} = fitText({text: marke, withinWidth: SAFE.width * 0.86, fontFamily: HEADLINE_FONT, fontWeight: 400});
	const groesse = Math.min(fontSize, 230);

	return (
		<>
			<div style={{position: 'absolute', top: SAFE.top - 10, width: '100%', textAlign: 'center'}}>
				<div
					style={{
						fontFamily: HEADLINE_FONT,
						fontSize: groesse,
						lineHeight: 1,
						color: farben.text,
						letterSpacing: `${sperrung}em`,
						marginRight: `-${sperrung}em`,
						opacity: name,
						filter: `blur(${(1 - name) * 14}px)`,
						textShadow: `0 0 50px ${farben.akzent2}55`,
					}}
				>
					{marke}
				</div>
				<div
					style={{
						fontFamily: HEADLINE_FONT,
						fontSize: 64,
						letterSpacing: '0.3em',
						marginRight: '-0.3em',
						color: farben.akzent,
						opacity: sorte,
						transform: `translateY(${(1 - sorte) * 30}px)`,
					}}
				>
					{config.sorte.toUpperCase()}
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1250,
					left: SAFE.left,
					right: SAFE.left,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 34,
				}}
			>
				<div
					style={{
						fontFamily: BODY_FONT,
						fontWeight: 500,
						fontSize: 44,
						color: farben.text,
						opacity: slogan,
						transform: `translateY(${(1 - slogan) * 30}px)`,
					}}
				>
					{config.slogan}
				</div>
				<div
					style={{
						fontFamily: BODY_FONT,
						fontWeight: 700,
						fontSize: 50,
						color: farben.hintergrund,
						background: farben.akzent,
						padding: '26px 70px',
						borderRadius: 70,
						boxShadow: `0 0 60px ${farben.akzent}66`,
						transform: `scale(${button})`,
					}}
				>
					{config.aufruf}
				</div>
				<div style={{fontFamily: BODY_FONT, fontWeight: 500, fontSize: 36, color: farben.text, opacity: web * 0.8}}>
					{config.webseite}
				</div>
			</div>
		</>
	);
};

export const Texte: React.FC = () => (
	<AbsoluteFill>
		<Hook />
		<Merkmale />
		<Schluss />
	</AbsoluteFill>
);
