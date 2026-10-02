# tschetschenien-edit

Schnelles Geschichts-Edit (9:16, 27 s, 30 fps) über tschetschenische Geschichte und Krieger,
geschnitten auf einen Nasheed: von den Petroglyphen und Türmen von Hoy über Dzurdzuketien und
Simsir bis Scheich Mansur, Beibulat Taimiev, Valerik 1840, Baisangur von Benoy und Zelimkhan.

```bash
npm install
npx remotion browser ensure
npm run render   # -> out/tschetschenien-edit.mp4 (baut vorher die Tonspur neu)
npm run stills   # ein Kontrollbild pro Schnitt -> out/stills/
npx remotion studio   # Vorschau im Browser (vorher einmal: npm run audio)
```

Braucht ein **System-ffmpeg** (`ffmpeg` im PATH) für die Tonbearbeitung – Remotions eingebautes
ffmpeg kann keinen Bass-Boost und keinen Tiefpass.

## Anpassen

| Was | Wo |
|---|---|
| Bilder, Titel, Jahreszahlen, Schnittlänge (in Beats) | `src/config.ts` (`SHOTS`) |
| Farbstimmung, Akzentfarbe | `src/config.ts` (`GRADE`, `ACCENT`) |
| Laut/leise-Verlauf, Bass, Bass-Schläge, Echo | `src/audio.json` (`dynamics`) |
| Anderer Nasheed | Datei nach `public/audio/`, in `src/audio.json` `source`, `bpm`, `firstBeat` setzen |

### Ablauf des Tons (`src/audio.json`)

1. **Beat 0–9 laut**, Stimmen mit Bass angehoben (`bassGainDb`)
2. **Beat 9–28 leise und dumpf** (Tiefpass + Bergecho) – die alte Zeit, ruhigere Schnitte
3. **½ Beat Stille**, dann der **Drop**: laut, Bass, und auf jedem Titel-Beat (`punchBeats`)
   ein zusätzlicher Schlag – im Bild weißer Blitz + Wackeln auf genau diesen Beats
4. am Ende ausblenden

Bild und Ton lesen dieselben Beats. Wer in `config.ts` Beats ändert, muss `punchBeats` und
`quietUntilBeat` mitziehen, wenn Titel oder Drop wandern sollen.

### Eigener Nasheed

`bpm` und `firstBeat` (Sekunde des ersten Schlags) müssen stimmen, sonst schneidet das Bild
neben den Takt. Grob ermitteln: Takt mitklopfen (z. B. Online-Tap-Tempo), ersten deutlichen
Schlag in einem Audio-Editor ablesen.

## Quellen

Bildnachweise und der fertige Text für die Videobeschreibung stehen in [CREDITS.md](CREDITS.md).
Die CC-BY/CC-BY-SA-Bilder **müssen** dort genannt werden, wo das Video gepostet wird.
