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

Rezitation (echte Aufnahme, Vers für Vers von everyayah.com) plus selbst erzeugter
Regen (`npm run ambience`, loopt nahtlos). Anderer Vers oder Rezitator:

```bash
bash scripts/fetch_recitation.sh Alafasy_128kbps 94 5 6
```

Danach in `src/config.ts` die Dateien und den Rezitator eintragen und in
`src/timing.ts` die Einsätze (`RECITATION`) und `HIGHLIGHT_AT` an die Verslängen
anpassen.
