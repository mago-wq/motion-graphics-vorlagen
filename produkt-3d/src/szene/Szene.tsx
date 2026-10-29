// Die 3D-Szene. Alle Bewegungen hängen nur am Frame (Remotion rendert Frames parallel
// und in beliebiger Reihenfolge), deshalb kein useFrame von react-three-fiber.
import {useThree} from '@react-three/fiber';
import {useLayoutEffect, useMemo} from 'react';
import {PMREMGenerator} from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {config} from '../config';
import {easeOut, keyframes} from '../motion';
import {DROP, HELD, HOOK, MERKMALE, STILL_FROM} from '../timing';
import {Bohnen} from './Bohnen';
import {Dose, DOSE_UNTEN} from './Dose';

/** Spiegelungen für das Metall: eingebaute Studio-Umgebung, ohne Bilddatei aus dem Netz */
const Umgebung: React.FC = () => {
	const {gl, scene} = useThree();
	useLayoutEffect(() => {
		const pmrem = new PMREMGenerator(gl);
		const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
		scene.environment = env;
		scene.environmentIntensity = 0.55;
		return () => {
			env.dispose();
			pmrem.dispose();
		};
	}, [gl, scene]);
	return null;
};

const Kamera: React.FC<{frame: number}> = ({frame}) => {
	const camera = useThree((s) => s.camera);
	// [x, y, z] der Kamera und Blickziel-Höhe je Abschnitt
	const z = keyframes(frame, [
		[0, 14.4],
		[MERKMALE.start, 13.6],
		[HELD.schwenk, 13.8],
		[HELD.schwenk + 18, 8],
		[HELD.steht, 13.4],
		[STILL_FROM, 12.9],
	]);
	const y = keyframes(frame, [
		[0, 0.6],
		[MERKMALE.start, 0.3],
		[HELD.schwenk, 0.5],
		[HELD.schwenk + 18, -1.4],
		[HELD.steht, -0.5],
	]);
	const orbit = keyframes(frame, [
		[0, 0],
		[MERKMALE.start, 0],
		[MERKMALE.aus, 0.32],
		[HELD.steht, -0.12],
		[STILL_FROM, 0.04],
	]);
	const ziel = keyframes(frame, [
		[0, 0.3],
		[HOOK.aus, 0.3],
		[MERKMALE.start, -0.55],
		[HELD.schwenk, -0.55],
		[HELD.steht, -0.2],
	]);
	useLayoutEffect(() => {
		camera.position.set(Math.sin(orbit) * z, y, Math.cos(orbit) * z);
		camera.lookAt(0, ziel, 0);
	}, [camera, orbit, y, z, ziel]);
	return null;
};

export const Szene: React.FC = () => {
	const {fps} = useVideoConfig();
	// Letzte halbe Sekunde steht alles still
	const frame = Math.min(useCurrentFrame(), STILL_FROM);

	const fall = spring({frame: frame - DROP.start, fps, config: {damping: 13, stiffness: 110}});
	const doseY = Math.max(0, (1 - fall) * 5.5);
	// Kurzes Stauchen beim Aufsetzen
	const aufsetzen = spring({frame: frame - DROP.landed + 14, fps, config: {damping: 9, stiffness: 260}});
	const stauch = 1 - Math.sin(Math.min(aufsetzen, 1) * Math.PI) * 0.035;

	const drehung =
		keyframes(frame, [[0, -Math.PI * 5], [DROP.spinEnd, 0]], easeOut) +
		keyframes(frame, [
			[DROP.spinEnd, 0],
			[MERKMALE.start + 8, Math.PI], // Rückseite mit den Merkmalen
			[MERKMALE.aus, Math.PI + 0.25],
			[HELD.steht, Math.PI * 2], // Vorderseite zum Schlussbild
			[STILL_FROM, Math.PI * 2 + 0.22],
		]);
	const neigung = keyframes(frame, [
		[HELD.schwenk, 0],
		[HELD.steht, -0.1],
	]);

	const lichtfarbe = useMemo(() => config.farben.akzent2, []);

	return (
		<>
			<Umgebung />
			<Kamera frame={frame} />
			<ambientLight intensity={0.15} />
			<spotLight
				position={[-4, 7, 6]}
				angle={0.45}
				penumbra={0.8}
				intensity={140}
				castShadow
				shadow-mapSize={[1024, 1024]}
				shadow-bias={-0.0004}
			/>
			{/* Kantenlichter von hinten, eins in Akzentfarbe */}
			<directionalLight position={[5, 3, -5]} intensity={2.2} color={lichtfarbe} />
			<directionalLight position={[-5, 2, -4]} intensity={1.4} color={config.farben.akzent} />

			<group position={[0, doseY, 0]} rotation={[0, drehung, neigung]} scale={[1, stauch, 1]}>
				<Dose />
			</group>
			<Bohnen frame={frame} />

			{/* unsichtbarer Boden, zeigt nur den Schatten */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DOSE_UNTEN, 0]} receiveShadow>
				<planeGeometry args={[20, 20]} />
				<shadowMaterial opacity={0.55} />
			</mesh>
		</>
	);
};
