// Kaffeebohnen auf einem schrägen Ring um die Dose, dazu einige größere weiter hinten.
// Feste Zufallswerte über random(seed), damit jeder Frame gleich gerendert wird.
import {random, spring, useVideoConfig} from 'remotion';
import {HELD} from '../timing';

const RING = Array.from({length: 18}, (_, i) => ({
	winkel: (i / 18) * Math.PI * 2 + random(`w${i}`) * 0.25,
	radius: 1.35 + random(`r${i}`) * 0.35,
	hoehe: (random(`h${i}`) - 0.5) * 0.35,
	groesse: 0.8 + random(`g${i}`) * 0.45,
	drehung: [random(`a${i}`) * 6, random(`b${i}`) * 6, random(`c${i}`) * 6] as const,
	verzug: Math.floor(random(`v${i}`) * 14),
}));

const HINTEN = Array.from({length: 7}, (_, i) => ({
	x: (random(`hx${i}`) - 0.5) * 6,
	y: (random(`hy${i}`) - 0.5) * 7,
	z: -2.5 - random(`hz${i}`) * 2,
	groesse: 1.6 + random(`hg${i}`) * 0.8,
	drehung: [random(`ha${i}`) * 6, random(`hb${i}`) * 6, 0] as const,
}));

const Bohne: React.FC<{
	position: [number, number, number];
	rotation: readonly [number, number, number];
	scale: number;
}> = ({position, rotation, scale}) => (
	<group position={position} rotation={[...rotation]} scale={scale}>
		<mesh castShadow scale={[1, 0.72, 0.55]}>
			<sphereGeometry args={[0.09, 20, 14]} />
			<meshStandardMaterial color="#5A3420" roughness={0.45} />
		</mesh>
		{/* Mittelfurche */}
		<mesh position={[0, 0, 0.047]} scale={[1, 0.12, 0.2]}>
			<sphereGeometry args={[0.085, 16, 8]} />
			<meshStandardMaterial color="#1E0F08" roughness={0.8} />
		</mesh>
	</group>
);

export const Bohnen: React.FC<{frame: number}> = ({frame}) => {
	const {fps} = useVideoConfig();
	const lauf = (frame - HELD.bohnen) * 0.012;
	return (
		<group rotation={[0.32, 0, -0.18]}>
			{RING.map((b, i) => {
				const auf = spring({frame: frame - HELD.bohnen - b.verzug, fps, config: {damping: 16}});
				if (auf <= 0.001) return null;
				const w = b.winkel + lauf;
				return (
					<Bohne
						key={i}
						position={[Math.sin(w) * b.radius, b.hoehe, Math.cos(w) * b.radius]}
						rotation={[b.drehung[0] + lauf * 2, b.drehung[1] + lauf, b.drehung[2]]}
						scale={b.groesse * auf}
					/>
				);
			})}
			{HINTEN.map((b, i) => {
				const auf = spring({frame: frame - HELD.bohnen - 6 - i * 2, fps, config: {damping: 20}});
				if (auf <= 0.001) return null;
				return (
					<Bohne
						key={`h${i}`}
						position={[b.x, b.y + lauf * 0.6, b.z]}
						rotation={[b.drehung[0] + lauf, b.drehung[1] + lauf * 0.7, 0]}
						scale={b.groesse * auf}
					/>
				);
			})}
		</group>
	);
};
