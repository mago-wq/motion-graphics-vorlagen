// Prüfstand: alle Posen nebeneinander, groß. Nur zum Ansehen (npx remotion still … PoseLab).
import {AbsoluteFill} from 'remotion';
import {Front, Profile} from './components/Person';
import {BEND_DOWN, F_HIPS, F_OPEN, F_STAND, KNEEL_DUA, KNEEL_UP, LEAVE, QIYAM, RUKU, SUJUD, walkPose} from './poses';

const ROW = [QIYAM, RUKU, BEND_DOWN, KNEEL_UP, SUJUD, KNEEL_DUA];
export const PoseLab: React.FC = () => (
	<AbsoluteFill style={{background: '#0a0e1c'}}>
		<svg width={1920} height={1080}>
			<line x1={0} x2={1920} y1={500} y2={500} stroke="#456" strokeWidth={2} />
			<line x1={0} x2={1920} y1={1040} y2={1040} stroke="#456" strokeWidth={2} />
			{ROW.map((p, i) => (
				<Profile key={i} pose={p} x={150 + i * 310} ground={500} scale={1.1} anchor="ankle" />
			))}
			{[0, 0.25, 0.5, 0.75].map((ph, i) => (
				<Profile key={`w${i}`} pose={walkPose(ph, LEAVE)} x={130 + i * 250} ground={1040} scale={1.1} />
			))}
			{[F_STAND, F_HIPS, F_OPEN].map((p, i) => (
				<Front key={`f${i}`} pose={p} x={1150 + i * 260} ground={1040} scale={1.1} />
			))}
		</svg>
	</AbsoluteFill>
);
