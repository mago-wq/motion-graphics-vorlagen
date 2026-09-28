# CLAUDE.md – agentur-ad

Remotion-Projekt (TypeScript), 30-s-Eigenwerbung der Motion-Graphics-Agentur, 1080×1920,
30 fps, mit eigener Musikspur. Bedienung in `README.md`.

## Design-Read (design-council, Stufe 4)

30-s-Hochformat-Spot für eine Motion-Design-Dienstleistung, Publikum Inhaber kleiner
Betriebe auf TikTok/Reels, Sprache Apple-Keynote-Kinetic-Type. Regler: Varianz 7,
Motion 8, Dichte 2. Stil-Skill: `minimalist-skill` (Fast-Schwarz/Fast-Weiß, eine Akzentfarbe).

## Regeln

- **Inhalte nur in `src/config.ts`**, Zeitpunkte nur in `src/timing.ts`, Musik-Ablauf
  (BPM, Drops, Riser, Schlussschlag) nur in `src/musik-plan.json`. Diese JSON lesen
  `timing.ts` **und** `scripts/generate_music.py`. Wer einen Drop verschiebt:
  `npm run musik`, dann neu rendern.
- **Beat-Raster:** 120 BPM = 15 Frames pro Beat, 60 pro Takt. Szenenwechsel sind harte
  Schnitte auf den Drops (0 | 4 | 8 | 12 | 18 | 24 s). Einblendungen starten 2–3 Frames
  vor dem Schnitt, sonst ist das erste Bild der Szene leer.
- **Bewegung:** Federn nach Apples Modell (`motion.ts`: Response + Dämpfungsverhältnis).
  Standard kritisch gedämpft (1,0). Überschwingen (0,78) nur bei Landungen mit Schwung:
  Akzent-Punkt, Button. Schnelle Bewegung bekommt vertikale Bewegungsunschärfe per
  SVG-`feGaussianBlur` (`stdDeviation="0 N"`), N aus der Geschwindigkeit pro Frame.
- **Eine Akzentfarbe**, nur an drei Stellen: Punkt hinter „Design“, „deine Kunden.“,
  das Stichwort im Button. Nicht verteilen.
- **Keine erfundenen Zahlen.** Der Zähler in Szene 5 zeigt die echte Zuschauzeit
  (`frame / FPS`), das ist der Beweis im Spot. Das Arbeitsbeispiel ist ein echter Render
  (`public/beispiel-barber.mp4` aus `../barber-ad`), kein nachgebautes UI.
- **Ton:** Musik (`public/musik.wav`) plus wenige Effekte nur an bedeutenden Momenten
  (`src/audio/cues.ts`). Ab 29,5 s Stille, auch in der Musik.

## Was die erste Fassung billig aussehen ließ (nicht wieder einbauen)

Neon-Akzent mit Glow, wanderndes Raster und Lichtfleck im Hintergrund, Bebas-Großbuchstaben
überall, Bildwackeln bei jedem Einschlag, Blitz bei jedem Schnitt, roter „REC“-Punkt,
nummerierte Karten „01/02/03“, aus Kästen nachgebaute Werbeanzeigen. Jedes davon steht
einzeln als KI-Tell in `taste-skill` §9 bzw. impeccable; zusammen wirkten sie wie ein
Template. Ersetzt durch: eine Groteske (Geist) mit größenabhängiger Laufweite,
Unschärfe-Einblendung Wort für Wort, Hell/Dunkel-Wechsel auf dem Beat.

## Stolperfallen

- **Globale Frames:** Szenen werden nicht in `<Sequence>` gepackt, sondern nach globalem
  Frame ein- und ausgeblendet. In einer `<Sequence>` liefert `useCurrentFrame()` den
  lokalen Frame, und alle Zeitpunkte aus `timing.ts` (global) lagen daneben: Szenen
  blieben leer. Ausnahme: das Beispielvideo, das bewusst ab seinem eigenen Frame 0 läuft.
- **Unschärfe in Frame 0:** Geschwindigkeit als Vorwärts-Differenz rechnen
  (`y(f+1) - y(f)`), sonst ist Frame 0 scharf, weil `y(-1)` auf `y(0)` geklemmt wird.
- **Musik und Handylautsprecher:** Unter ~60 Hz gibt ein Handy nichts wieder. Der
  Generator schneidet bei 42 Hz und hebt ab 2,5 kHz an; Kick-Grundton 52 Hz. Pegel prüfen
  mit der RMS-Analyse pro Sekunde (Drops ~−12 dB, Breakdown deutlich leiser).
- **Proxy-CA im Cloud-Container:** wie in `../barber-ad/CLAUDE.md` (certutil-Import).
- Übernommen aus barber-ad: `scripts/render.sh` (AAC-Versatz), `FontGate`, `FitText`.
