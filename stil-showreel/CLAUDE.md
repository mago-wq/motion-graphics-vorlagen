# CLAUDE.md – stil-showreel

Remotion-Projekt, 1080×1920, 30 fps, 15 s (450 Frames): 40 Stile in 30 Einstellungen. Bedienung in `README.md`.

## Regeln

- **Inhalte nur in `src/config.ts`** (Stilnamen, Texte, Farben), **Zeitpunkte nur in `src/timing.ts`**
  (Einstellungen, ab welchem Frame welche Stil-Nummer im HUD steht, Ton-Einsätze `CUES`). Wer eine Einstellung
  verlängert, verschiebt Bild und Ton zusammen. Summe der Längen = `DURATION`.
- **Bewegung nur aus dem Frame berechnen**, nie `Math.random()`: Zufall über `src/lib/rand.ts` (Seed + Frame).
  Simulationen (Partikel, Strömungsfeld, Bänder) sind geschlossene Formeln oder rechnen ab Frame 0 neu.
- **Match-Cuts** (VHS → Pixel → ASCII → Matrix, Drahtgitter → Blaupause, Knete → Cel) nutzen dieselbe Szenenzeit
  über die Schnitte hinweg; diese Einstellungen stehen in `NO_PUNCH` (`src/Showreel.tsx`), sonst ruckt der Zoom.
- **Ab `STILL_FROM` (435) steht alles still**, der Mix ist dort stumm.
- **Nur Geräusche, keine Musik.** Jede Rolle in `audio/kit.json` hat eine `note`, zu welchem Bildereignis sie gehört.
- Auftraggeber-Regeln aus der Haupt-`CLAUDE.md` gelten: keine Gesichter/Körperteile, keine unwahren Aussagen.
  Die Endkarte sagt nur Prüfbares („100 % Code“, „kein Stock-Material“).

## Prüfen

`npm run typecheck`, `npm run stills -- <frames>` (Bilder mit dem Read-Tool ansehen, Kontaktbogen:
`python3 scripts/contact_sheet.py out/sheet.png out/stills/*.png`). Ton: `earshot timeline <mp4> --cues audio/cues.json`,
`earshot sheet … -o sheet.png`, `earshot critique <mp4>`.

`earshot critique` meldet zwei Punkte, die zum Format gehören und bewusst so bleiben:
„music presence“ kritisch (es gibt absichtlich keine Musik) und „salient hit density“ 1,93/s (Profi-Filme bis
1,86/s): ohne Musikbett hebt sich jedes Geräusch aus der Stille ab, und das Bild schneidet mit 2,26 Ereignissen/s.
Nebentreffer 3 dB leiser zu machen änderte den Wert nicht.

## Stolperfallen (gelöst)

- **WebGL2 im Cloud-Container:** `Config.setChromiumOpenGlRenderer('swangle')`, sonst kein Kontext. Shader zeichnen mit
  `preserveDrawingBuffer` und `gl.finish()`, damit der Screenshot das Bild hat.
- **Auflösung:** Canvas und Shader rechnen in `WIDTH·RES`. Der Entwurf setzt `--scale=0.5 --props='{"res":0.5}'`,
  4K `--scale=2` mit `res 2`. Nur `--scale` ohne `res` rechnet unnötig groß bzw. unscharf.
- **ASCII/Matrix** lesen die Synthwave-Szene über einen unsichtbaren 40×71-Shader (`useShaderPixels`, `readPixels`;
  Zeile 0 ist unten).
- **`backdrop-filter` über dem WebGL-Canvas** (Glaskarte) funktioniert in Remotions Headless-Chrome.
- **Schriften lokal** (`public/fonts`), Chrome im Container kennt die Proxy-CA nicht. Canvas-Text erst nach `FontGate`.
- **earshot-Rollennamen** müssen klein und mit Punkt geschrieben sein (`flap.land`, nicht `flapLand`).
- **AAC legt bei harten Klicks bis 2,5 dB auf die Spitze:** Mix mit wahrer Spitze -3,5 dBTP (4-fach überabgetastet)
  begrenzen, dann landet das MP4 bei etwa -1,8 dBTP.
- **Ton nie über Remotions AAC:** Bild `--muted` rendern, `public/ton/mix.wav` mit ffmpeg als AAC dazu (sonst 46 ms
  Versatz, siehe `barber-ad`).
- `scripts/cues.mjs` lädt `src/timing.ts` direkt mit Node (Typen entfernen, Node ≥ 22.18); deshalb hat
  `timing.ts` keine Importe.
