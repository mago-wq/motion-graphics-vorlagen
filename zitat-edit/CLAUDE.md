# CLAUDE.md – zitat-edit

Remotion-Projekt (TypeScript) für ein Zitat-Video, 1080×1920, 30 fps, Länge folgt der
Stimme. Gesprochener Text mit Wort-für-Wort-Typo, Tauben, Lichtlecks, Blitz, Regen,
der sich beim Wendewort legt. Bedienung steht in `README.md`.

## Regeln

- **Nur `src/config.ts` enthält Inhalte** (Text, Tafeln, Akzente, Wendewort, Quelle,
  Farben, Bild, Stimm-Einstellungen). Die Python-Skripte lesen sie über Node, deshalb
  dort keine imports.
- **Zeitpunkte nur in `src/timing.ts`.** Wort-Zeiten kommen ausschließlich aus
  `src/stimme/woerter.json`, gemessen von `scripts/stimme_bearbeiten.py`. Nie von Hand
  setzen oder schätzen: Bild, Ton-Effekte und Ducking hängen daran.
- **Tafel-Wörter = gesprochene Wörter.** Geprüft in Python (`check_tafeln`) und in
  `timing.ts`. Wer Tafeln anders aufteilt, ändert nur die Zeilen, nicht die Wörter.
- **Ton nur als Geräusch: keine Musik, keine Instrumente.** Zielgruppe der Vorlage
  (islamische Zitat-Edits) lehnt Instrumente ab. Gesang aus fremden Videos nie übernehmen.
- **Die Stimme hat Vorrang.** Flächen laufen unter der Stimme per Ducking (-5 dB).
  Nach jeder Änderung am Mix `npm run check:sprache`: alle Wörter müssen erkannt werden.
- **Nur Quellen, die kommerzielle Nutzung erlauben** (CC0, Mixkit-Lizenz, OFL, MIT,
  Apache). Kein Modell mit NC-Lizenz in der Kette. Jede neue Quelle in `LIZENZEN.md`.
- **Keine Stimmen realer Personen klonen**, außer freigegeben (Thorsten-Voice, CC0)
  oder die eigene. Keine Gesichter zeigen (Person höchstens von hinten).
- **Sicherheitszone:** Text nur in x 80–1000, y 250–1500 (`SAFE`), alles über
  `fitFontSize`. Prüfen mit `npm run stills -- --safe`.

## Prüfen ohne Bildschirm

`npm run typecheck`, `npm run stills` (Bilder mit dem Read-Tool ansehen, Kontaktbogen
mit `python3 scripts/contact_sheet.py`), `npm run render`, `npm run check`,
`npm run check:sprache`. Bewegung: Frames aus der MP4 ziehen
(`ffmpeg -i out/zitat-edit.mp4 -vf "fps=3,scale=216:384" out/frames/f%03d.png`) und
als Filmstreifen ansehen. Stimme ohne Hören beurteilen: Grundton und Spektrum messen
(Original-Analyse: Median ~92 Hz, 70 % der Energie unter 500 Hz; aktuell ~101 Hz).

## Stolperfallen (gelöst, nicht wieder einbauen)

- **Chatterbox und kurze Texte:** Einzelne kurze Abschnitte („O Sohn Adams,“) bekommen
  angehängtes Kauderwelsch. Deshalb wird der ganze Text am Stück erzeugt, jeder Versuch
  per Whisper geprüft, und `stimme_bearbeiten.py` schneidet die Abschnitte heraus.
- **Alignment-Modell mit NC-Lizenz:** torchaudio `MMS_FA` basiert auf MMS
  (CC-BY-NC 4.0). Ersetzt durch `jonatasgrosman/wav2vec2-large-xlsr-53-german`
  (Apache-2.0) mit `torchaudio.functional.forced_align`.
- **Wortenden zu früh:** CTC-Alignment markiert das Ende des letzten Buchstabens,
  Ausklang (das „s“ in „Adams“) fehlt dann. Geschnitten wird deshalb nach dem hörbaren
  Ende (höchstens 36 dB unter dem Maximum; Atmer liegen darunter).
- **Plosiv am Wortende abgeschnitten:** Der leiseste Punkt zwischen zwei Abschnitten
  lag im Verschluss vor dem „t“ von „bittest“, das „t“ landete beim nächsten Abschnitt.
  Schnitt jetzt in der Mitte der längsten Stille (mehr als 50 dB unter Maximum).
- **Erstes Wort im Donner:** Der Nachhall des Einschlags verdeckte das „O“. Stimme
  startet 8 Frames nach dem Blitz, der Einschlag wird per `kuerzen` ausgeblendet.
- **Tafeln überlagerten sich:** Ausblenden endet jetzt, wenn das nächste Wort erscheint
  (mindestens 8 Frames Sichtbarkeit für das letzte Wort).
- **Glitch lief über den Bildrand:** Dehnung auf Bildbreite begrenzt (`measureText`).
- **Ton 46 ms zu spät / Spitzen nach AAC:** `scripts/render.sh` rendert den Ton als WAV,
  bringt ihn auf -14 LUFS mit Begrenzer bei -2 dBFS (AAC schwingt bis ~0,5 dB über) und
  kodiert erst dann ins MP4.
- **Stimm-Umgebung:** liegt in `~/.venvs/tts` (`STIMME_PYTHON` überschreibt).
  `chatterbox-tts` nur mit `--no-deps` installieren, sonst kommen gradio und GPU-torch mit.
- **ElevenLabs im Gratis-Abo:** Bibliotheksstimmen (auch die deutschen im Konto)
  liefern über die API 402 „paid_plan_required“, nur Standardstimmen gehen. Höchstens
  2 Anfragen gleichzeitig (sonst 429). Gratis-Ergebnisse: nicht kommerziell, Hinweis
  „elevenlabs.io“ im Titel nötig.
- **Weave über MCP:** Modelle laufen nur mit bezahltem Weave-Plan („Weave MCP tools are
  only available on a paid Weave plan“), auch wenn die Verknüpfung steht.
- **Kopiert aus barber-ad:** `FitText`, `FontGate`, `SafeZoneOverlay`,
  `contact_sheet.py` (nur Kommentare angepasst). Laut Haupt-CLAUDE.md wäre jetzt der
  Moment zum Auslagern in einen gemeinsamen Ordner. Das braucht eine gemeinsame
  Auflösung von `remotion` und Co. außerhalb der Vorlagen-Ordner (npm-Workspaces oder
  `resolve.modules` in beiden `remotion.config.ts`) und ist noch offen.
