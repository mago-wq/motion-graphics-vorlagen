// Getränkedose aus Grundformen: Mantel (Zylinder mit Etikett), Schulter mit Deckel und Boden
// als Drehkörper (Lathe), Lasche als Torus. Maße in Szene-Einheiten, Mitte bei y = 0.
import {useMemo} from 'react';
import {Vector2} from 'three';
import {config} from '../config';
import {zeichneEtikett} from './etikett';

export const RADIUS = 0.66;
const MANTEL = 1.9;
const OBEN = MANTEL / 2;

const schulter = [
	[RADIUS, OBEN],
	[RADIUS - 0.01, OBEN + 0.05],
	[RADIUS - 0.06, OBEN + 0.13],
	[RADIUS - 0.1, OBEN + 0.18],
	[RADIUS - 0.09, OBEN + 0.215], // Bördelrand
	[RADIUS - 0.115, OBEN + 0.22],
	[RADIUS - 0.13, OBEN + 0.19],
	[RADIUS - 0.14, OBEN + 0.175],
	[0, OBEN + 0.175],
].map(([x, y]) => new Vector2(x, y));

const boden = [
	[0, -OBEN - 0.1],
	[0.3, -OBEN - 0.12],
	[0.47, -OBEN - 0.17],
	[0.54, -OBEN - 0.15],
	[RADIUS - 0.03, -OBEN - 0.06],
	[RADIUS, -OBEN],
].map(([x, y]) => new Vector2(x, y));

/** Unterkante der Dose, für die Bodenebene */
export const DOSE_UNTEN = -OBEN - 0.17;

export const Dose: React.FC = () => {
	const etikett = useMemo(() => zeichneEtikett(config), []);
	const metall = <meshStandardMaterial color={config.farben.metall} metalness={1} roughness={0.28} />;

	return (
		<group>
			{/* thetaStart = π legt die Bildmitte des Etiketts nach vorn (+z) */}
			<mesh castShadow>
				<cylinderGeometry args={[RADIUS, RADIUS, MANTEL, 128, 1, true, Math.PI]} />
				<meshPhysicalMaterial
					map={etikett}
					roughness={0.32}
					metalness={0.35}
					clearcoat={1}
					clearcoatRoughness={0.18}
				/>
			</mesh>
			<mesh castShadow>
				<latheGeometry args={[schulter, 96]} />
				{metall}
			</mesh>
			<mesh castShadow>
				<latheGeometry args={[boden, 96]} />
				{metall}
			</mesh>
			{/* Lasche und Niete */}
			<mesh position={[0, OBEN + 0.19, 0.17]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.5, 1]}>
				<torusGeometry args={[0.085, 0.022, 12, 40]} />
				{metall}
			</mesh>
			<mesh position={[0, OBEN + 0.185, 0.03]}>
				<cylinderGeometry args={[0.035, 0.035, 0.03, 24]} />
				{metall}
			</mesh>
		</group>
	);
};
