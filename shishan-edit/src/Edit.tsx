// Setzt den Plan (plan.ts) Frame für Frame zusammen:
// Einstellungen → Blitzbilder → hintere Wörter → Freisteller → vordere Wörter → Blitze/Raster → Vignette.
// Wackler und Druckstoß kommen aus den Treffern der Tonspur (hitTransform).
import {useMemo} from 'react';
import {AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Shot} from './components/Media';
import {Word} from './components/Word';
import {BlobFilter, hitTransform, Scanlines, Vignette} from './fx/Overlays';
import {C} from './look';
import {buildPlan} from './plan';
import {SEC} from './timeline';

export const Edit: React.FC = () => {
	const frame = useCurrentFrame();
	// Plan erst beim Rendern bauen (kein JSX/keine Berechnung auf Modulebene)
	const plan = useMemo(buildPlan, []);
	const blob = plan.blobs.find(([a, b]) => frame >= a && frame < b);
	const scan = plan.scans.some(([a, b]) => frame >= a && frame < b);
	const flashes = plan.flashes.filter((x) => frame >= x.at && frame < x.at + x.len);
	const end = SEC.end.from;
	const fade = interpolate(frame, [end + 30, end + 56], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const blobScale = blob ? 90 + 60 * ((frame - blob[0]) / Math.max(1, blob[1] - blob[0])) : 0;

	return (
		<AbsoluteFill style={{backgroundColor: C.black, overflow: 'hidden'}}>
			{blob ? <BlobFilter frame={frame} scale={blobScale} /> : null}
			<AbsoluteFill style={{transform: hitTransform(frame)}}>
				<AbsoluteFill style={{filter: blob ? 'url(#blob)' : undefined}}>
					{plan.shots.map((s, i) => (
						<Sequence key={`s${i}`} from={s.from} durationInFrames={Math.max(1, s.to - s.from)} layout="none">
							<Shot spec={s} />
						</Sequence>
					))}
					{plan.tops.map((s, i) => (
						<Sequence key={`t${i}`} from={s.from} durationInFrames={Math.max(1, s.to - s.from)} layout="none">
							<Shot spec={s} />
						</Sequence>
					))}
				</AbsoluteFill>
				{plan.words
					.filter((w) => w.layer === 'back')
					.map((w) => (
						<Word key={w.id} w={w} frame={frame} />
					))}
				{plan.shots
					.filter((s) => s.fg)
					.map((s, i) => (
						<Sequence key={`f${i}`} from={s.from} durationInFrames={Math.max(1, s.to - s.from)} layout="none">
							<Shot spec={s} variant="cut" />
						</Sequence>
					))}
				{plan.words
					.filter((w) => w.layer !== 'back')
					.map((w) => (
						<Word key={w.id} w={w} frame={frame} />
					))}
			</AbsoluteFill>
			{scan ? <Scanlines frame={frame} /> : null}
			{flashes.map((x, i) => (
				<AbsoluteFill
					key={`x${i}`}
					style={{
						backgroundColor: x.kind === 'white' ? C.white : x.kind === 'red' ? C.red : '#000',
						opacity: x.kind === 'white' ? (frame === x.at ? 0.92 : 0.38) : 1,
						// Rot multipliziert: Weiß wird Blutrot, Schwarz bleibt Schwarz (Referenz: rote Treffer-Frames)
						mixBlendMode: x.kind === 'red' ? 'multiply' : 'normal',
					}}
				/>
			))}
			<Vignette strength={frame >= SEC.drop.from ? 0.82 : 0.6} />
			<Html5Audio src={staticFile('audio/mix.wav')} />
			{fade > 0 ? <AbsoluteFill style={{backgroundColor: '#000', opacity: fade}} /> : null}
		</AbsoluteFill>
	);
};
