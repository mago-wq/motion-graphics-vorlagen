# CLAUDE.md – baysangur-edit

Remotion-Projekt (TypeScript): 22-s-Edit über Baysangur von Benoy, 9:16 (1080×1920, 4K mit
`--scale=2`), 30 fps. Vorbild: TikTok @obscura.theories (Philosophie-Edit mit alter Farbfilm-Optik,
Video 7705455444269075743). Bedienung in `README.md`.

## Regeln (Wünsche des Auftraggebers)

- Gleiche Ton-Regeln wie `nokhchi-edit`: **keine Instrumente**, Nasheed nur Stimme, nur natürliche
  Geräusche, keine Sprachsynthese, kein neues Nasheed. Gewählt: „Нохчо Нашид“ (Quelle in
  `scripts/fetch_nasheed.sh`), das Dudayev-Nasheed wurde abgelehnt.
- **Stimmung wie das Vorbild:** satt, dunkel, nostalgisch und lebendig – nicht blass-sepia.
  Keine Wehrturm-Paare als Hintergrund (Rückmeldung zum 1. Entwurf).
- **Keine erfundenen Zitate.** Texte sind belegte tschetschenische Sprichwörter (Quelle in README),
  Wortlaut wie in der Quelle.
- **Echte Personen nur mit echten Bildern**; von Baysangur gibt es kein Foto, verwendet wird die
  Zeichnung von Faruk Kutlu (Commons). Bilder nicht mit fremden Ereignissen beschriften.

## Aufbau

- `scripts/build_audio.py` liest Stimme und Taktraster aus `assets-src/nasheed/` (nicht im Repo,
  `scripts/fetch_nasheed.sh`), Geräusche aus `../nokhchi-edit/assets-src/sfx/`, und schreibt
  `public/audio/mix.wav` und `src/timeline.json`. `src/Edit.tsx` legt die Schnitte in Sekunden fest
  (Rhythmus des Vorbilds) und rastet sie mit `at()` auf den nächsten Schlag ein.
- `src/components/Film.tsx`: Filmstreifen (4:3-Band, Bildstand-Wackeln, Flackern, Staub, Kratzer),
  `Shot` (Fahrt um Fokuspunkt), `PopBox` (Collage-Kästchen), `Outline` (Schrift mit Kontur).
  Korn kommt in `scripts/render.sh` per ffmpeg dazu.
- `scripts/make_figure.py`: freigestellte Figur ohne Papierrand (Tinte erkennen, schließen, füllen).

## Stolperfallen

- **Wikimedia drosselt stark (429).** API über ru/en/de.wikipedia statt commons abfragen; Bilder nur
  als Standard-Vorschaubreite (`/thumb/…/500px-…`) laden, mit User-Agent samt Kontakt-URL und
  Pausen von mehreren Sekunden. Originale und `Special:FilePath` werden abgewiesen.
- YouTube-Downloads sind in der Cloud gesperrt (Bot-Prüfung); SoundCloud und TikTok gehen.

- Mehrere `remotion still` parallel bleiben manchmal beim Laden der Google Fonts hängen:
  einzeln oder mit `timeout` starten. Proxy-CA für Chrome wie in `nokhchi-edit` beschrieben.
- Die alte Freistellung `baysangur_cut.png` enthält noch Papier; als normales Bild über Himmel
  wirkt das wie ein Fleck. Darum `baysangur_fig.png` verwenden.
