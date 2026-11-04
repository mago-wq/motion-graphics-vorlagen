// Schriften lokal aus public/fonts (alle SIL OFL, Google Fonts / JetBrains).
// Keine Netzabfrage beim Rendern: Chrome im Cloud-Container kennt die Proxy-CA nicht.
import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

export const F = {
	black: 'ArchivoBlack',
	grotesk: 'SpaceGrotesk',
	mono: 'JetBrainsMono',
	monoX: 'JetBrainsMonoX',
	spaceMono: 'SpaceMonoBold',
	comic: 'Bangers',
	pixel: 'PressStart',
	deco: 'PoiretOne',
	decoBold: 'Limelight',
	chalk: 'Caveat',
} as const;

const FILES: [string, string, string?][] = [
	[F.black, 'ArchivoBlack-Regular.ttf'],
	[F.grotesk, 'SpaceGrotesk.ttf', '300 700'],
	[F.mono, 'JetBrainsMono-Bold.ttf'],
	[F.monoX, 'JetBrainsMono-ExtraBold.ttf'],
	[F.spaceMono, 'SpaceMono-Bold.ttf'],
	[F.comic, 'Bangers-Regular.ttf'],
	[F.pixel, 'PressStart2P-Regular.ttf'],
	[F.deco, 'PoiretOne-Regular.ttf'],
	[F.decoBold, 'Limelight-Regular.ttf'],
	[F.chalk, 'Caveat.ttf', '400 700'],
];

const faces = FILES.map(
	([name, file, weight]) => new FontFace(name, `url(${staticFile(`fonts/${file}`)})`, weight ? {weight} : {}),
);

/** Erfüllt, sobald alle Schriften geladen sind. Canvas-Text erst danach zeichnen. */
export const fontsReady: Promise<void> = Promise.all(faces.map((f) => f.load()))
	.then((loaded) => {
		loaded.forEach((f) => document.fonts.add(f));
	})
	.catch((err) => {
		console.error('Schriften', err);
	});

/** Rendert die Kinder erst nach dem Laden der Schriften und hält so lange das Rendern an. */
export const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
	const [ok, setOk] = useState(false);
	const [handle] = useState(() => delayRender('Schriften laden'));
	useEffect(() => {
		fontsReady.then(() => setOk(true));
	}, []);
	useEffect(() => {
		if (ok) continueRender(handle);
	}, [ok, handle]);
	return ok ? React.createElement(React.Fragment, null, children) : null;
};
