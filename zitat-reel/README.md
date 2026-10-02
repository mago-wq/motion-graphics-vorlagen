# zitat-reel

Ruhiges Vers- oder Zitat-Reel, 15 s, 9:16. Nachts hinter einer nassen Scheibe, Arabisch
mit Übersetzung, nahtlos loopend. Warum es so aussieht, steht in [`ANALYSE.md`](ANALYSE.md).

## Benutzen

```bash
npm install
npx remotion browser ensure
npm run render        # -> out/zitat-reel.mp4
npx remotion studio   # Vorschau im Browser
```

## Anpassen

Nur `src/config.ts`:

- `lines`: Original + Übersetzung, optional ein Leuchtwort (`highlight`)
- `source`: Quellenangabe (Sure:Vers oder Buch Band/Seite), **immer echt**
- `handle`: Kanal-Kürzel unten links
- `ambience`: Regenbett an/aus

Mehr oder weniger Zeilen: Zeitpunkte in `src/timing.ts` mitändern (eine Zeile pro
Eintrag in `LINES`, je ~5–6 s).

## Ton

Gerendert wird nur Regen (`public/regen.wav`, selbst erzeugt mit
`npm run ambience`, loopt nahtlos). Rezitation oder Naschid kommt beim Hochladen als
TikTok-Sound dazu, siehe `ANALYSE.md`.
