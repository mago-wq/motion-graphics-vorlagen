// Rendert erst, wenn die Schriften geladen sind – sonst blitzt die Ersatzschrift auf.
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
