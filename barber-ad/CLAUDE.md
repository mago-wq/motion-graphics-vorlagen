# CLAUDE.md – barber-ad

Remotion-Projekt (TypeScript) für ein 15-s-Werbevideo, 1080×1920, 30 fps. Vorlage der
Motion-Graphics-Agentur: wird pro Betrieb über `src/config.ts` angepasst und neu gerendert.
Bedienung steht in `README.md`.

## Regeln

- **Nur `src/config.ts` enthält Inhalte.** Keine Texte, Preise oder Farben in Szenen
  hartkodieren, sonst ist das Video nicht mehr in einer Minute umbaubar.
- **Zeitpunkte nur in `src/timing.ts`.** Szenen und `src/audio/cues.ts` lesen dieselben
  Werte. Wer eine Animation verschiebt, verschiebt den Ton automatisch mit. Ereignisse
  wie „Karte rastet ein“ werden aus der Feder berechnet (`framesToLand`), nicht geraten.
- **Sicherheitszone:** wichtiger Text nur in x 80–1000, y 250–1500 (`SAFE` in `video.ts`).
  Alles Textliche über `FitText`/`fitFontSize`, damit lange Namen schrumpfen statt zu
  überlaufen. Prüfen mit `npm run stills -- --safe`.
- **Bewegung nur mit `spring()`/`interpolate()` mit Easing**, nichts linear.
- **Letzte halbe Sekunde (`STILL_FROM` = 435) still:** keine Animation, kein Ton.
  `SoundTrack` schneidet jeden Effekt dort hart ab, als Sicherung.
- **Ton nur als Geräusch**, keine Musik, keine Tonfolgen. Ticks sind immer dieselbe Datei.

## Prüfen ohne Bildschirm

`npm run typecheck`, `npm run stills` (Bilder mit dem Read-Tool ansehen),
`npm run render`, `npm run check`. Für Bewegung: Frames aus der MP4 ziehen
(`npx remotion ffmpeg -i out/barber-ad.mp4 -vf scale=216:384 out/frames/f%03d.png`)
und Filmstreifen bauen. Remotions eingebautes ffmpeg ist abgespeckt (z. B. kein `xstack`), Kontaktbögen
deshalb mit Pillow (`scripts/contact_sheet.py`).

## Stolperfallen (gelöst, nicht wieder einbauen)

- **Ton 46 ms zu spät:** Remotion kodiert AAC als ADTS und kopiert es ins MP4, die
  Edit-List für den Encoder-Vorlauf (2048 Samples) fehlt dann. Lösung in
  `scripts/render.sh`: Ton als WAV (`--separate-audio-to`, `--audio-codec=pcm-16`),
  dann ffmpeg `-c:a aac` direkt ins MP4 (Edit-List `media_time 1024`). Nicht zurück auf
  reines `remotion render` mit AAC wechseln, ohne den Versatz neu zu messen.
- **`yuvj420p` (Full Range):** kam von JPEG-Frames. `Config.setColorSpace('bt709')`
  in `remotion.config.ts` ergibt `yuv420p`, TV-Range, BT.709.
- **Schriften messen:** `fitText` misst mit der geladenen Schrift. `FontGate` hält das
  Rendern per `useDelayRender` an, bis `fontsReady` erfüllt ist. Ohne das wird mit der
  Ersatzschrift gemessen, und die Breiten stimmen nicht.
- **Feder-Überschwingen bei Skalierung:** Ein Überschwingen von 25 % auf eine
  Skalierung von 2,6→1 ließ die Wörter auf 0,6 zusammenfallen. `SPRINGS.slam` ist
  deshalb auf ~4 % Überschwingen abgestimmt.
- **Leere Frames im Übergang:** Die hereinfahrende Szene braucht schon Inhalt, sonst
  schiebt der Slide ein leeres Bild herein. Deshalb liegen z. B. `OFFER.cardIn` und
  `SCISSORS.drawStart` vor oder am Szenenanfang.
- **Cloud-Container mit TLS-Proxy:** Chrome kannte die Proxy-CA nicht
  (`ERR_CERT_AUTHORITY_INVALID` beim Laden der Google Fonts). Behoben durch Import der
  Anthropic-CAs aus `/root/.ccr/ca-bundle.crt` in `~/.pki/nssdb` (`certutil`, Paket
  `libnss3-tools`). Betrifft nur diese Umgebung, nicht den Rechner des Nutzers. Nie mit
  `--ignore-certificate-errors` umgehen.
