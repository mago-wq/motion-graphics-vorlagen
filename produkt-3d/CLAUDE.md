# CLAUDE.md – produkt-3d

Remotion-Projekt mit three.js (`@remotion/three` + `@react-three/fiber`), 1080×1920, 30 fps, 10 s.
Bedienung in `README.md`.

## Regeln

- **Inhalte nur in `src/config.ts`, Zeitpunkte nur in `src/timing.ts`.** Auch das Etikett liest config.ts.
- **Bewegung nur aus dem Frame berechnen** (`useCurrentFrame`, `spring`, `keyframes` aus `motion.ts`).
  Kein `useFrame` von react-three-fiber und kein `Math.random()`: Remotion rendert Frames parallel
  und in beliebiger Reihenfolge. Zufall nur über `random(seed)`.
- **Ab `STILL_FROM` steht alles still** (letzte halbe Sekunde).
- **Bildaufteilung:** Text oben ab y 250 und unten bis y 1500, die Dose dazwischen. Wer die Kamera
  (`Szene.tsx`, `Kamera`) näher holt, prüft die Stills 60, 140, 285 auf Überschneidungen.
- Ton gibt es noch nicht. Wenn Geräusche dazukommen: Ton-Weg aus `barber-ad/scripts/render.sh`.

## Stolperfallen (gelöst)

- **WebGL im Cloud-Container:** `angle` scheitert mit „Error creating WebGL context“.
  `Config.setChromiumOpenGlRenderer('swangle')` in `remotion.config.ts` (Software, reicht für Entwürfe
  und 1080p). Auf einem Rechner mit Grafikkarte ist `angle` schneller.
- **Schriften lokal statt Google Fonts:** Chrome im Container kannte die Proxy-CA nicht
  (`ERR_CERT_AUTHORITY_INVALID`). Deshalb liegen die Schriften in `public/fonts`.
  Das Etikett wird erst nach `fontsReady` gezeichnet (`FontGate`), sonst steht die Ersatzschrift auf der Dose.
- **Etikett-Naht:** Der Zylinder hat `thetaStart = π`, damit die Bildmitte des Etiketts vorn liegt und die
  Naht hinten. Wellen haben ganze Perioden auf der Breite, Rückseitentext steht doppelt bei x = 0 und x = 2048.
