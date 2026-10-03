# Zitat-Edit: gesprochenes Zitat als Hochformat-Video (Remotion)

Ein kurzes Video im Stil viraler Zitat-Edits: Eine tiefe, verhallte Stimme spricht
ein Zitat, die Wörter erscheinen genau im Takt der Stimme, einzelne Wörter leuchten
als Neon, glitchen oder zeichnen sich als Umriss. Davor fliegen Tauben durchs Bild,
farbige Lichtlecks laufen in einen weißen Blitz. Der Sturm legt sich beim Wendewort:
Der Regen wird leiser, Vögel setzen ein, Licht bricht durch die Wolken.

9:16, 1080×1920, 30 fps. Die Länge richtet sich nach der Stimme (Beispiel: 18,7 s).
Beispieltext ist ein Hadith Qudsi (at-Tirmidhi 3540). Alles Inhaltliche steht in
`src/config.ts`.

## Ablauf

| Zeit | Bild | Ton |
|---|---|---|
| 0,0–2,8 s | Aufblende aus Schwarz, warmes Lichtleck, Taubenschwarm, einige nah an der Kamera | Regen, Wind, fernes Donnergrollen, Flügelschlag je naher Taube |
| 1,9–2,8 s | Lichtleck Lila, dann Türkis, weißer Blitz bei 2,8 s mit kurzem Stoß nach vorn | Whoosh läuft auf den Blitz zu, tiefer Einschlag |
| ab 3,1 s | Tafeln, ein Wort pro Zeile, jedes Wort erscheint mit seinem Ton | Stimme; Regen und Wind gehen beim Sprechen zurück |
| Wendewort | Bild wird heller und wärmer, Lichtstrahlen von oben | Regen und Wind lassen nach, Vögel setzen leise ein |
| Ende | letzte Tafel füllt sich, Quellenangabe, drei Tauben fliegen weg, Abblende | Vögel, Hall klingt aus |

Wortstile (in den Tafeln als `{WORT|stil}`):

- **normal**: weiß, kippt mit leichter Unschärfe nach vorn in die Zeile
- **neon-rot / neon-gruen / neon-gelb / neon-blau**: zündet flackernd wie eine
  Neonröhre und wirft farbiges Licht in den Himmel
- **glitch**: kommt gedehnt mit Rot-Türkis-Versatz und zerhackten Streifen, zieht
  sich zusammen, setzt später kurz noch einmal aus
- **umriss**: zeichnet sich als Kontur nach. Ist es das letzte Wort des Videos,
  füllt es sich danach langsam.

## Anpassen

1. `src/config.ts` öffnen:
   - `abschnitte`: was gesprochen wird, mit Pause danach (Sekunden), optional
     `leiser` (wie der weiche Schluss im Original) und eigenem `tempo`.
   - `tafeln`: was eingeblendet wird. Die Wörter aller Tafeln müssen zusammen genau
     den gesprochenen Text ergeben (Satzzeichen und Groß/Klein egal), sonst bricht
     `npm run stimme` mit einer Meldung ab.
   - `wendeWort`: bei diesem Wort legt sich der Sturm.
   - `textWinkel`: Schräglage der Schrift in Grad wie im Original (0 = gerade).
   - `quelle`, `farben`, `bild`, `stimme` (Tonhöhe, Tempo, Hall).
2. Gesprochenen Text oder Pausen geändert: `npm run stimme` (siehe unten).
   Nur Tafeln, Akzente oder Farben geändert: direkt weiter mit Schritt 3.
3. `npm run stills -- --safe` zeigt Kontrollbilder mit Sicherheitszone,
   `npm run render` erzeugt `out/zitat-edit.mp4`, `npm run check` prüft die Datei,
   `npm run check:sprache` prüft, ob im fertigen Mix jedes Wort zu verstehen ist.

## Stimme

Alle Wege enden in `stimme/roh.wav` (der ganze Text, am Stück gesprochen).
`npm run stimme:bearbeiten` macht daraus die fertige Stimme: Wort-Grenzen messen,
Abschnitte mit exakt den eingestellten Pausen neu zusammensetzen, tiefer und
langsamer stellen, warmer Klang, breiter Hall, -18 LUFS. Die gemessenen
Wort-Zeiten landen in `src/stimme/woerter.json`, das Video liest sie von dort.

- **Kostenlos (Standard)**: `npm run stimme`. Erzeugt lokal auf der CPU mehrere
  Versuche (je etwa eine Minute), prüft jeden per Spracherkennung und nimmt den
  besten. Modell: Chatterbox Multilingual (MIT), Klangvorlage Thorsten-Voice (CC0,
  vom Sprecher für Sprachsynthese freigegeben). Alle Versuche liegen in
  `stimme/versuche/`. Klingt ein anderer besser:
  `npm run stimme -- --auswahl 3`. Mehr Versuche: `npm run stimme -- --versuche 8`.
- **ElevenLabs** (aktuell eingestellt: „Rob – Warm Bass German Narrator“): Den API-Schlüssel in
  den Einstellungen der Umgebung als `ELEVENLABS_API_KEY` hinterlegen (nie in Dateien
  schreiben), neue Sitzung starten. Dann `npm run stimme:elevenlabs -- --liste` (Stimmen
  im Konto) oder `-- --suche` (tiefe deutsche Männerstimmen aus der Bibliothek), die ID in
  `stimme.elevenlabs.stimmeId` eintragen, `npm run stimme:elevenlabs`. ElevenLabs-Stimmen
  sprechen schon ruhig: `stimme.tiefer` 0 bis 1, `stimme.tempo` 0,95 bis 1.
  Mehrere Stimmen vergleichen, ohne das Projekt zu ändern:
  `stimme_elevenlabs.py --stimme <id> --aus out/stimmen/x-roh.wav`, dann
  `stimme_bearbeiten.py --roh out/stimmen/x-roh.wav --aus out/stimmen/x.wav --tiefer 1 --tempo 0.95`.
  Gratis-Abo: nur die Standardstimmen (Brian, Bill, George …) gehen über die
  Schnittstelle, Bibliotheksstimmen wie „Rob – Warm Bass German Narrator“ erst ab dem
  kleinsten Bezahl-Abo. Gratis erzeugte Stimmen dürfen laut ElevenLabs nicht
  kommerziell genutzt werden und brauchen den Hinweis „elevenlabs.io“ im Titel.
- **Eigene Aufnahme**: den ganzen Text am Stück einsprechen, als `stimme/roh.wav`
  speichern, `npm run stimme:bearbeiten`.

Die Stimme eines realen Menschen wird nie nachgebaut, außer er hat sie dafür
freigegeben (wie Thorsten-Voice) oder es ist die eigene.

## Bild

- **Hintergrund**: `public/bilder/hintergrund.jpg` (Hochformat, mindestens
  1080×1920) oder ein Video über `bild.hintergrundVideo` (mindestens so lang wie
  das fertige Video, sonst bleibt am Ende das letzte Bild stehen). Langsame Kamerafahrt,
  kühle Farbgebung und Vignette kommen per Code dazu. Das Beispielbild ist ein
  CC0-Foto (siehe `LIZENZEN.md`) und dient als Platzhalter für eine eigene Szene.
- **Tauben**: per Code gezeichnet (`src/components/Tauben.tsx`), Flugbahnen mit
  Nähe, Flügelschlag und Bewegungsunschärfe in `src/timing.ts` (`FLUEGE`).
- **Lichtlecks, Blitz, Lichtstrahlen, Regen, Filmkorn**: per Code.

## Ton

Nur Geräusche, keine Musik und keine Instrumente. `npm run toene` lädt die
Geräusche von Mixkit (IDs in `scripts/toene_vorbereiten.py`; die Dateien selbst
dürfen nicht weitergegeben werden und liegen deshalb nicht im Repo), schneidet sie zu,
gleicht die Pegel an und erzeugt zwei kurze Effekte (Neon-Knistern, Glitch) per Code.
`src/audio/cues.ts` legt alles framegenau an. Solange gesprochen wird, gehen die
Flächen um etwa 5 dB zurück, damit die Stimme frei steht.

## Einrichtung

```bash
npm install
npx remotion browser ensure          # Chrome Headless Shell (einmalig)
pip install numpy scipy soundfile librosa pyloudnorm   # für render, check, toene
npm run toene                        # Geräusche von Mixkit laden (nicht im Repo, Lizenz)
bash scripts/stimme-umgebung.sh      # nur für npm run stimme* und check:sprache
```

Braucht Node ≥ 22.18 (die Python-Skripte lesen `config.ts` direkt über Node) und
Python 3. Die Schrift (Montserrat) liegt in `public/fonts`, beim Rendern wird nichts
aus dem Netz geladen. Die Stimm-Umgebung liegt in `~/.venvs/tts` und lädt beim
ersten Gebrauch etwa 5 GB Modelle.

## Befehle

| Befehl | Was passiert |
|---|---|
| `npm run stimme` | kostenlose Stimme erzeugen und bearbeiten (`-- --versuche N`, `-- --auswahl N`) |
| `npm run stimme:elevenlabs` | Stimme über ElevenLabs (`-- --suche`, `-- --liste`, `-- --stimme <id>`) |
| `npm run stimme:bearbeiten` | nur bearbeiten: nach Änderung von Pausen, Tempo, Tonhöhe, Hall oder bei eigener Aufnahme |
| `npm run toene` | Geräusche neu laden und vorbereiten |
| `npm run stills` | Standbilder nach `out/stills/` (`-- --safe` mit Sicherheitszone, `FRAMES="10 20"` beliebige) |
| `npm run render` | Video rendern: `out/zitat-edit.mp4` + Ton als `out/zitat-edit-ton.wav` |
| `npm run check` | Abnahme: H.264 1080×1920, Frames, AAC 44,1 kHz Stereo, -14 LUFS, Spitzen ≤ -1 dBFS, Abblende, Sync |
| `npm run check:sprache` | Spracherkennung auf dem fertigen Mix: wird jedes Wort verstanden? |
| `npm run typecheck` | TypeScript prüfen |

`npm run render` macht drei Schritte: Remotion rendert Bild und Ton getrennt,
`scripts/lautheit.py` bringt den Ton auf -14 LUFS (Spitzen ≤ -2 dBFS), ffmpeg kodiert
ihn direkt ins MP4 (sonst 46 ms Versatz, siehe `barber-ad`).

## Vor dem Posten

- Die Stimme ist KI-erzeugt (und enthält ein unhörbares Wasserzeichen von
  Chatterbox). TikTok verlangt für realistische KI-Inhalte die Kennzeichnung
  „KI-generiert“ beim Hochladen.
- Religiöse Texte vor dem Posten gegenlesen lassen, auch die Quellenangabe. Die
  deutsche Fassung des Beispiel-Hadith ist eine eigene Übersetzung.
- Herkunft und Lizenzen aller Bausteine: `LIZENZEN.md`.
