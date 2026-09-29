// Spielt Lottie-Daten bildgenau ab: Remotion gibt das Bild vor, lottie-web zeichnet es
// als SVG (scharf in jeder Auflösung, auch 4K). Keine eigene Zeitsteuerung, kein Autoplay.
import lottie, {type AnimationItem} from 'lottie-web';
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {staticFile, useDelayRender} from 'remotion';
import type {LottieData} from './lottie';

/** Lädt eine Lottie-Datei aus public/ (per `npm run figuren` geholt, nicht eingecheckt). */
export const useLottieFile = (file: string): LottieData | null => {
	const {delayRender, continueRender, cancelRender} = useDelayRender();
	const [handle] = useState(() => delayRender(`Lottie laden: ${file}`));
	const [data, setData] = useState<LottieData | null>(null);
	useEffect(() => {
		fetch(staticFile(file))
			.then((res) => {
				if (!res.ok) throw new Error(`public/${file} fehlt – erst "npm run figuren" ausführen`);
				return res.json();
			})
			.then((json: LottieData) => {
				setData(json);
				continueRender(handle);
			})
			.catch((err) => cancelRender(err));
	}, [file, handle, continueRender, cancelRender]);
	return data;
};

export const LottiePlayer: React.FC<{data: LottieData; frame: number; width: number; height: number}> = ({data, frame, width, height}) => {
	const container = useRef<HTMLDivElement>(null);
	const anim = useRef<AnimationItem | null>(null);
	const {delayRender, continueRender} = useDelayRender();

	useLayoutEffect(() => {
		if (!container.current) return;
		const handle = delayRender('Lottie aufbauen');
		const a = lottie.loadAnimation({
			container: container.current,
			renderer: 'svg',
			loop: false,
			autoplay: false,
			animationData: data,
			rendererSettings: {preserveAspectRatio: 'xMidYMid meet', progressiveLoad: false},
		});
		anim.current = a;
		const ready = () => continueRender(handle);
		if (a.isLoaded) ready();
		else a.addEventListener('DOMLoaded', ready);
		return () => {
			a.destroy();
			anim.current = null;
		};
	}, [data, delayRender, continueRender]);

	useLayoutEffect(() => {
		anim.current?.goToAndStop(frame, true);
	}, [frame, data]);

	return <div ref={container} style={{width, height}} />;
};
