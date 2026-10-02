# CLAUDE.md – tschetschenien-edit

Remotion-Projekt (TypeScript), 1080×1920, 30 fps, Länge ergibt sich aus den Beats.
Bedienung in `README.md`, Bildlizenzen in `CREDITS.md`.

## Regeln

- **Inhalte nur in `src/config.ts`**, Ton-Dynamik nur in `src/audio.json`. Szenen-Code
  (`src/Edit.tsx`) enthält keine Texte oder Bildnamen.
- **Schnitte in Beats, nie in Frames.** `timing.ts` rechnet Beats → Frames aus `bpm` und
  `firstBeat`; `scripts/prepare-audio.mjs` rechnet dieselben Beats → Sekunden.
- **Halal:** Nur Stimmen-Nasheed, keine Musikinstrumente – auch keine synthetischen Bass-Töne
  dazumischen. „Bass" heißt hier: EQ-Anhebung der Stimmen (`bass`-Filter), nicht ein Instrument.
  Keine Bilder mit Instrumenten, keine Kreuze/fremden religiösen Symbole im Vordergrund
  (deshalb sind Hoy-Ornamentturm und das Zelimkhan-Liedbild von 1925 rausgeflogen).
- **Keine Leichen- oder Gewaltbilder in Großaufnahme** (Zelimkhan-Foto von 1913 zeigt den Toten → nicht verwendet).
- **Nur historische Figuren bis Anfang 20. Jh.** Keine Politiker oder Kämpfer der
  Tschetschenienkriege der 1990er – das wäre ein politisches Statement, kein Geschichts-Edit.
- **Fakten auf Titeln nur, wenn belegt** (ru/en-Wikipedia-Artikel der Person). Neue Bilder nur
  mit freier Lizenz und Eintrag in `CREDITS.md`.
- Text nur in der Sicherheitszone (`SAFE` in `video.ts`), Titel über `fitFontSize`;
  lange Titel mit `\n` zweizeilig.

## Stolperfallen

- **Wikimedia blockt Cloud-IPs** (429 auf upload.wikimedia.org, `retry-after: 600`). Bilder
  wurden über `https://wsrv.nl/?url=upload.wikimedia.org/...` (URL **nicht** nochmal kodieren)
  geholt, Thumbnails nur in Standardbreiten (500/960/1280 px).
- **Remotions ffmpeg ist abgespeckt** (kein `bass`, `lowpass`, `aecho`). Tonspur deshalb mit
  System-ffmpeg in `prepare-audio.mjs`; Muxen in `render.sh` wie in `barber-ad` (AAC-Edit-List).
- `volume=…:eval=frame` wertet pro Audio-Frame aus – `asetnsamples=n=128` davor, sonst
  stufen die Laut/Leise-Rampen hörbar.
- Schriften lokal aus `public/fonts` (Oswald, PT Serif, OFL) mit `unicode-range` für Kyrillisch.
