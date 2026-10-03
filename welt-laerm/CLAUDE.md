# CLAUDE.md – welt-laerm

Remotion-Projekt (TypeScript), 22,6 s, 1080×1920, 30 fps. Bild zum vorhandenen
Originalton (`public/originalton.m4a`); Bedienung in `README.md`.

## Regeln

- **Inhalte nur in `src/config.ts`** (Texte, Schlüsselwörter, Sprecher- und Szenenzeiten in
  Sekunden, Farben). Frames nur über `src/timing.ts` ableiten.
- **Sprecherzeiten sind gemessen**, nicht geschätzt (faster-whisper, Modell `small`,
  `word_timestamps=True`). Wer den Ton tauscht, misst neu; die Untertitel verteilen ihre
  Wörter nach Wortlänge über `voice: [start, ende]`.
- **Figuren über `components/Figure.tsx`:** Hände/Füße als Zielpunkte, Ellbogen/Knie per IK.
  Kippt ein Gelenk falsch herum, das Vorzeichen in `bend` umdrehen, nicht die Punkte
  verbiegen. `far` färbt die hinteren Gliedmaßen dunkler (Tiefe), `outline` zieht die
  schwarze Piktogramm-Fuge; bei Silhouetten (`ParadiesScene`) aus.
- **Leuchten nur über `Glow`/`glowFilter`**, Farben aus `CONFIG.colors`. Warm (`warm`)
  ausschließlich in der Paradies-Szene – das ist die Dramaturgie.
- **Text-Sicherheitszone** x 80–1000, y 250–1500 (`SAFE`). Untertitel sitzen oben (y ≈ 270–750).

## Prüfen ohne Bildschirm

`npm run typecheck`, `npm run stills` (Bilder mit dem Read-Tool ansehen; `FRAMES="…"` für
eigene Frames), `npm run render`. Filmstreifen:
`ffmpeg -i out/welt-laerm.mp4 -vf "fps=2,scale=180:320,tile=9x5" -frames:v 1 out/strip.png`.

## Stolperfallen

- **Ton-Versatz:** wie in `barber-ad` – Ton als WAV aus Remotion, dann ffmpeg → AAC
  (`scripts/render.sh`). Nicht auf reines `remotion render` mit AAC umstellen.
- **Dateigröße:** Das Filmkorn (`Grain`) ändert sich jedes Frame; bei CRF 18 wurden es
  ~90 MB. CRF 22 → ~15 MB ohne sichtbaren Verlust.
- **Schrift lokal statt Google Fonts:** Im Cloud-Container kennt Chrome die Proxy-CA nicht,
  Google-Fonts-Abrufe scheitern. Deshalb `public/fonts/unbounded-latin.woff2` + `FontFace`.
- **Schmier-Blende:** horizontale Unschärfe per SVG-Filter `feGaussianBlur stdDeviation="x y"`
  über CSS `filter: url(#smear)` – CSS `blur()` kann nur gleichmäßig.
