# CLAUDE.md – zitat-reel

Remotion-Projekt (TypeScript), 15 s, 1080×1920, 30 fps. Bedienung in `README.md`,
Herleitung des Looks in `ANALYSE.md`.

## Regeln

- **Nur `src/config.ts` enthält Inhalte**, nur `src/timing.ts` Zeitpunkte.
- **Nur Texte mit echter Quelle.** Vers mit Sure:Vers, Zitat mit Werk Band/Seite.
  Nichts erfinden, nichts „sinngemäß“ zuschreiben. Arabisch mit Vokalzeichen aus
  einer verlässlichen Quelle kopieren, nicht abtippen.
- **Keine Optik dschihadistischer Propaganda** (schwarze Flagge, Kampf-Naschids,
  al-Hayat-Stil, Waffen, Marschszenen), auch nicht auf Wunsch „nur als Stil“.
  Sperrrisiko für jedes Konto, siehe `ANALYSE.md`.
- **Loop-Regel:** Jede Bewegung in `RainWindow` ist periodisch in `DURATION`
  (`cyc(frame, k)` mit ganzzahligem k). Kein Push-in, keine einmalige Drift. Prüfen:
  Differenz Frame 449→0 darf nicht deutlich größer sein als 0→1 (gemessen 0,92 vs 0,65,
  der Rest ist Filmkorn und Text).
- **Ton:** keine synthetische Rezitation, keine fremden Aufnahmen in `public/`. Nur das
  selbst erzeugte Regenbett. Stimme kommt in der App dazu.
- Text bleibt im Kinoband (`BAND` in `video.ts`, y 285–1635). Die Zeilen sitzen mittig
  und damit sicher in der TikTok-Zone (y 250–1500).

## Prüfen ohne Bildschirm

`npm run typecheck`, `npx remotion still ZitatReel out/f.png --frame=300` (mit dem
Read-Tool ansehen), `npm run render`, Kontaktbogen aus Frames (Pillow).

## Stolperfallen

- Schriften sind lokal (`public/fonts`, aus @fontsource, OFL). Für Umschrift-Zeichen
  wie „Ḥ“ braucht es die latin-ext-Datei, sonst springt eine Ersatzschrift ein.
- Leuchtwort wird per `split` am Wort getrennt. Bei Arabisch nur ganze Wörter
  markieren, sonst bricht die Verbindung der Buchstaben.
