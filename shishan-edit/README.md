# shishan-edit

Krieger-Edit (9:16, 1080×1920, 30 fps, ~30 s) über den tschetschenischen Kampf- und Freiheitswillen,
geschnitten auf das arabische Nasheed **„ملحمة الشيشان“** („Epos Tschetschenien“, Tarek Jaber) –
im Stil der TikTok-Referenz 1 (Kaneki-Edit von @eolnski_edits): erst Frage und Antwort Wort für Wort
über Nahaufnahmen, dann der Drop mit Schnitten auf den Schlägen, Schwarz-Weiß mit Rot, Negativ-Blitze.

| Zeit | Ton (Nasheed, 1,18×) | Bild / Text |
|---|---|---|
| 0–0,35 s | Wind, Wolfsgeheul | Wolfsauge blitzt auf |
| 0,35–7,0 s | „حسبوا اقتحامك نزهة لجيوشهم“ | Zarenheere (Horschelt: Kolonne nach Wedeno 1859, Sturm auf Gunib; Roubaud: Dargo, Schlacht in den Bergen) · SIE DACHTEN, DICH ZU STÜRMEN SEI EIN SPAZIERGANG FÜR IHRE HEERE. |
| 7,0 s | „كلا!“ + Donner | tschetschenischer Krieger im Kettenhemd (Stich, 19. Jh.) auf Schwarz, Schrift **hinter** ihm: NEIN. |
| 7–11,5 s | „فتلك عرائن الشجعان“ | Adler, Wehrtürme, Männer aus Zumsoi (Foto 1906) · DAS IST DAS REVIER DER TAPFEREN. |
| 11,5–27,4 s | sechs Rufe „شيشان!“, Bass aus der Stimme | Drop, dunkel (weiß auf Schwarz): الشيشان → НОХЧИЙЧОЬ → TSCHETSCHENIEN, Reiter, Dolche, Tschetschenen in Tracht (Krieger mit Gewehr, КЪОНАХ und НОХЧО hinter dem Kopf), Gesicht nach Mikeschin 1876, Wolf, Adler, Schmiede … МАРШО → FREIHEIT. (Wolf auf dem Fels) |
| 27,4–30,1 s | Nachhall, Wolfsgeheul | Abblende auf Schwarz |

Menschen nur als anonymer tschetschenischer Typ in Tracht – keine bekannten Personen (siehe `CLAUDE.md`).
КЪОНАХ = der Ehrenhafte, Tapfere (Ideal des tschetschenischen Mannes), НОХЧО = Tschetschene, МАРШО = Freiheit.

Text-Übersetzung: „Sie dachten, dich zu stürmen sei ein Spaziergang für ihre Heere. – Nein. Das ist das
Revier der Tapferen.“ (wörtlich: „…das sind die Löwenhöhlen der Tapferen“). Nur diese Anfangsstrophe und
der Ruf „شيشان“ werden verwendet; der Text des ganzen Nasheeds wurde geprüft (Solidaritäts-Nasheed aus der
Zeit der Tschetschenienkriege, kein Material einer Terrorgruppe).

## Ablauf

```bash
npm ci
npx remotion browser ensure
bash scripts/fetch_nasheed.sh   # Nasheed von SoundCloud (nicht im Repo)
npm run assets                  # Commons-Bilder/-Videos, Mixkit-Clips, Looks + Freisteller vorrechnen
npm run audio                   # Tonspur → public/audio/mix.wav + src/timeline.json
npm run stills                  # Kontrollbilder (540×960) + Kontaktbogen out/stills/_sheet.png
bash scripts/render.sh --draft  # schneller Entwurf 540×960 – erst den zeigen
bash scripts/render.sh          # Endfassung 1080×1920 → out/shishan-edit-1080p.mp4
bash scripts/deliver.sh         # Chat-Fassung < 30 MB (2-Pass) → out/shishan-edit-chat.mp4
npm run check                   # Format, Frames, Ton-Synchronität
npm run credits                 # CREDITS.md – Nachweise für die Videobeschreibung
```

## Regeln aus der Analyse der Referenz 1 (Bild für Bild, 30 fps)

- **Wörter** erscheinen 2–4 Frames *vor* dem gesprochenen Wort (Mittel −0,1 s); betonte Treffer
  (Drop-Wort) genau auf dem Schlag. Farbe springt alle 2–3 Frames zwischen Rot, Weiß, Eisblau;
  Geisterbild, Streifen-Versatz, RGB-Versatz, einzelne Frames ohne Schrift.
- **Ein Bild pro Phrase**, 4–7 Frames vor dem ersten Wort, noch ohne Text. Wechsel zwischen Fragendem und
  Antwortendem (hier: Heere ↔ Krieger/Land).
- **Drop genau auf dem letzten Wort** der Antwort. Danach vor fast jedem Schlag 1–2 Frames Negativ (Median
  −2 Frames), der Schnitt landet auf dem Schlag (±1 Frame); dazwischen Schnitte alle 3–6 Frames.
- Erst chaotisch schnell, zum Ende ruhigere Nahaufnahmen mit Blitz pro Schlag; Bild wird ~2,5 s vor dem
  Tonende schwarz.
- **Dunkel**: Referenz-Drop hat im Mittel Helligkeit 47/255 und 74 % schwarze Pixel (Intro 87 / 54 %).
  Erster Entwurf lag bei 103 / 30 % – deshalb Look `crush` (Schwarz zugedrückt), `inv` (helle Museumsfotos
  → weißes Motiv auf Schwarz), Freisteller auf Schwarz (`cutOnly`), Himmel abgedunkelt (`burn`).
- Referenz 2 (Phonk-Instrumental) und 3 (Aizen-Zitate: „I alone will stand at the top“) liefern nur die
  Grundstimmung: kalt, überlegen, dominant.

## Nachweise

Bilder/Videos von Wikimedia Commons (gemeinfrei, CC0, CC BY, CC BY-SA) – Liste in `CREDITS.md`
(`npm run credits`), Text für die Beschreibung steht dort unten. Clips von Mixkit (frei, nicht im Repo).
Das Nasheed ist urheberrechtlich geschützt und liegt nicht im Repo; die fertigen Videos auch nicht.
