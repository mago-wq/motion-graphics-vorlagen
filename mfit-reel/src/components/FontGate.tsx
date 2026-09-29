// Rendert erst, wenn beide Schriften geladen sind. Nötig, weil Zeilenbreiten
// mit der echten Schrift gemessen werden – mit Ersatzschrift wären sie falsch.
import {useEffect, useState} from 'react';
import {useDelayRender} from 'remotion';
import {fontsReady} from '../fonts';

export const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
	const {delayRender, continueRender, cancelRender} = useDelayRender();
	const [handle] = useState(() => delayRender('Schriften laden'));
	const [ready, setReady] = useState(false);

	useEffect(() => {
		fontsReady
			.then(() => {
				setReady(true);
				continueRender(handle);
			})
			.catch((err) => cancelRender(err));
	}, [handle, continueRender, cancelRender]);

	return ready ? <>{children}</> : null;
};
