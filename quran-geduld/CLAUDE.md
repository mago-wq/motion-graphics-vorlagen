# CLAUDE.md – quran-geduld

Remotion-Projekt (TypeScript), 1080×1920, 30 fps, 58,13 s, **mit Ton** (Rezitation
al-Baqara 2:152–154 aus dem Referenz-TikTok). Bedienung in `README.md`. Aufbau aus
`welt-laerm` übernommen (Figur mit IK, Flacker-Licht, Glow).

## Regeln

- **Inhalte nur in `src/config.ts`:** `texts` (Arabisch je Teil, Deutsch, Zeiten) und
  `scenes` (Bildszene, an/aus, `mark` = Zeitpunkt des roten Kreuzes). Posen in `src/poses.ts`.
- **Koran-Text nie abtippen oder „korrigieren“.** Er stammt aus `quelle/al-baqara-152-154.txt`
  (Uthmani, api.alquran.cloud); `npm run check` vergleicht Codepunkt für Codepunkt. Vorsicht:
  Beim Abschreiben normalisiert sich die Reihenfolge der Zeichen (Fatha/Schadda) – sieht gleich
  aus, ist aber nicht die Quelle. Schrift: Amiri Quran (Versende-Zeichen U+06DD + Ziffern).
- **Übersetzung nur Deutsch** (Wunsch des Nutzers), eigene, wortgetreue Formulierung,
  Gottesbezug großgeschrieben („Meiner“, „Ich“, „Mir“). Keine Ergänzungen, die nicht im Vers stehen.
- **Zeiten:** Blockwechsel aus dem Referenz-TikTok abgelesen (Textbereich mit ffmpeg in
  0,5-s-Schritten gekachelt). Der Rezitator wiederholt zwei Stellen (11,3–27 s und 31,4–46,8 s):
  Text bleibt stehen, nur das Bild wechselt. Whisper-Wortzeiten sind bei gedehnter Rezitation
  grob (lange Wörter schlucken Pausen) – nur als Anhalt für `deSpan`.
- **Ton nie einchecken** (`public/ton/`, `out/` gitignored). Dieses Repo ist öffentlich.
- **Keine Gesichter** an den Figuren (`face` bleibt `none`), keine Nahaufnahmen von Händen –
  Bittgebet als ganze Figur.
- **Figuren = massive Piktogramme mit Vorwärtskinematik** (`components/Body.tsx`), nicht die
  Strichfigur aus `welt-laerm` (Nutzer: „bewegen sich unnatürlich, man erkennt nicht, was sie
  machen, Hände komisch platziert“). Eine Pose ist ein Satz Gelenkwinkel (`poses.ts`):
  Rumpfneigung, Kopf, Schulter/Ellbogen/Hand, Hüfte/Knie/Fuß. Übergänge mischen Winkel
  (`mixProfile`, Rumpf führt, Arme/Kopf folgen), Abläufe mit Haltezeiten über `sequence`.
- **Bodenkontakt automatisch** (`components/Person.tsx`): Hüfthöhe aus dem tiefsten Punkt der
  Pose; beim Gebet bleibt der hintere Knöchel an Ort (`anchor="ankle"`), beim Gehen hält
  `walkTravel` den Standfuß fest (kein Rutschen). Gehen startet/endet mit Übergang aus dem Stand.
- **Unterarm quer zum Körper** (Hände auf der Brust) im Profil mit `fs` verkürzen, sonst ragt
  die Hand weit nach vorn. Neue Posen erst im Prüfstand ansehen:
  `npx remotion still src/lab-index.ts PoseLab out/poselab.png`.
- **Leuchten nur über `Layer`/`Glow`**, Text-Leuchten per `text-shadow` (CSS-Filter auf
  fertigen Wörtern können arabische Glyphen beschneiden). Warm nur bei Emblem/Licht/Leben.
- **Bildbereich unter dem Text:** zweizeiliges Arabisch + zweizeiliges Deutsch reichen bis
  y ≈ 760. Embleme/Strahlenzentren nicht über y ≈ 860 setzen.

## Prüfen ohne Bildschirm

`npm run typecheck`, `npm run check`, `npm run stills` (`FRAMES="…"`, `SCALE=0.5`),
dann `npm run entwurf`. Bewegung prüfen: Ausschnitt kacheln, z. B.
`ffmpeg -ss 18.6 -t 8.4 -i out/quran-geduld-entwurf.mp4 -vf "fps=2.2,crop=540:330:0:500,tile=6x3" -frames:v 1 out/gebet.png`.

## Arbeitsweise

Erst Entwurf 540×960 (`npm run entwurf`, ~2 MB, ~4 min) schicken, Rückmeldung einarbeiten,
dann einmal `npm run render` (1080×1920).
