// Stellt eine Figur auf den Boden: berechnet die Hüfthöhe aus dem tiefsten Punkt der
// Pose (Füße, Knie, Hände, Stirn) und hält auf Wunsch einen Fuß an fester Stelle.
import {CONFIG} from '../config';
import {GROUND} from '../video';
import {FRONT_LIFT, FrontBody, lowestProfile, ProfileBody, solveProfile, type FrontPose, type Pt, type ProfilePose} from './Body';

export const Profile: React.FC<{
	pose: ProfilePose;
	/** x-Position des Ankers in Pixeln. */
	x: number;
	/** 'ankle': hinterer Knöchel bleibt bei x (Gebet), 'pelvis': Hüfte bei x. */
	anchor?: 'ankle' | 'pelvis';
	scale?: number;
	ground?: number;
	flip?: boolean;
	/** Drehung um die Hochachse: 1 = schaut nach rechts, -1 = nach links, dazwischen = dreht sich. */
	turn?: number;
	color?: string;
	far?: string;
	rise?: number;
	handProp?: (hand: Pt[]) => React.ReactNode;
}> = ({pose, x, anchor = 'pelvis', scale = 1.5, ground = GROUND, flip = false, color = CONFIG.colors.ink, far = '#aab3cc', rise = 0, turn, handProp}) => {
	const j = solveProfile(pose);
	const low = lowestProfile(j);
	const ax = anchor === 'ankle' ? j.leg.F[2][0] : 0;
	const sx = (turn ?? (flip ? -1 : 1)) * scale;
	return (
		<g transform={`translate(${x - ax * sx} ${ground - low * scale - rise}) scale(${sx} ${scale})`}>
			<ProfileBody pose={pose} color={color} far={far} handProp={handProp} />
		</g>
	);
};

export const Front: React.FC<{pose: FrontPose; x: number; scale?: number; ground?: number; color?: string; rise?: number}> = ({
	pose,
	x,
	scale = 1.5,
	ground = GROUND,
	color = CONFIG.colors.ink,
	rise = 0,
}) => (
	<g transform={`translate(${x} ${ground - FRONT_LIFT * scale - rise}) scale(${scale})`}>
		<FrontBody pose={pose} color={color} />
	</g>
);
