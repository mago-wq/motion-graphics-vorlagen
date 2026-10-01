# CLAUDE.md – coralclub-teleshop

Remotion-Projekt (TypeScript), ca. 35 s, 1080×1920, 30 fps. Affiliate-Video für Coral Club
(Oceanmin) im Stil der Teleshopping-Werbung der 2000er, mit Sprecher. Bedienung in
`README.md`. Grundregeln wie `../barber-ad` (Inhalte nur in `src/config.ts`, Sicherheitszone
x 80–1000 / y 250–1500, letzte halbe Sekunde still), mit diesen Abweichungen:

## Design-Read (design-council, Stufe 4)

Gelesen als: Hochformat-Affiliate-Spot für ein Nahrungsergänzungsmittel, Publikum
deutschsprachige Erwachsene im TikTok/Reels-Feed, Sprache Teleshopping der 2000er
(begeisterter Sprecher, „Kennen Sie das?“-Schwarzweiß, Störer, Chrom-Schrift,
Strahlenkranz, „Aber das ist noch nicht alles!“, Bestell-Banner). Regler: Varianz 8,
Motion 9, Dichte 5. impeccable-Modus: Persuade. Kein Stil-Skill aus der taste-Familie
(alle fünf sind Web-UI-Stile); das Genre-Zitat übernimmt die Rolle.

**Bewusste Abweichung von Stufe 1:** Verlaufsschrift und Strahlenkranz stehen dort als
KI-Default-Optik. Hier sind sie das Zitat, das der Auftrag verlangt („wie die TV-Werbungen
um 2000“), also gewählt, nicht ausgesessen. Was trotzdem gilt: eine Palette (Königsblau aus
der Oceanmin-Packung, Gelb/Rot nur für Störer und Preis), eine Schrift (Archivo, Breite
und Kursiv als Achsen), alle Bewegung auf Federn und auf Wörter des Sprechers getaktet,
VHS-Anmutung zurückhaltend (Zeilen 7 %, Korn 7 %), damit es nach Zitat aussieht und nicht
nach Defekt. Wenn die Optik zurück zu modern soll: Sprecher, Ablauf und Recht bleiben,
nur `ChromeText`, `Sunburst`, `Starburst` und `VhsOverlay` tauschen.

## Der Sprecher bestimmt die Zeit

- **Kette:** `src/sprechertext.json` → `scripts/generate_voice.py` → `public/ton/sprecher.wav`
  + `src/sprecher.json` (Zeilen und Wörter mit Zeitstempeln) → `scripts/generate_music.py` →
  `public/ton/musik.wav` + `src/musik-ereignisse.json` → `src/timing.ts`. Szenen, Effekte
  (`src/audio/cues.ts`) und Videolänge lesen nur `timing.ts`. Wer am Text dreht, lässt die
  ganze Kette laufen, nie nur einen Teil, sonst laufen Bild und Ton auseinander.
- **Wörter per Namen:** `word('preis', 'neunzehn')` sucht im *Solltext*. `generate_voice.py`
  richtet die Whisper-Zeiten zeichengenau auf den Solltext aus (`align()`), weil Whisper
  „hundertzwanzig“ als „120“ und „Oceanmin“ als „Oshin Min“ schreibt. Neue Wörter im
  Sprechertext lassen sich so sofort ansprechen.
- `sprecher.json` und `musik-ereignisse.json` sind erzeugt, nicht von Hand ändern.

## Stimme (Qwen3-TTS, lokal auf CPU)

- **Modelle:** Qwen3-TTS-12Hz-1.7B VoiceDesign + Base, Apache-2.0, also kommerziell nutzbar.
  Kein API-Schlüssel, keine Kosten. Läuft in eigener Python-Umgebung (siehe README), nicht
  im Node-Projekt. Ca. 6× Echtzeit auf 4 CPU-Kernen; 66 Takes ≈ 60 Minuten.
- **Klangfarbe:** Die Beschreibung in `sprechertext.json` (`sprecher.klangfarbe`) ist auf
  Chinesisch, weil die englischen Beschreibungen („Male … deep baritone“) trotzdem gepresste
  Stimmen um 320–400 Hz ergaben (UTMOS 1,5–2,1). Die chinesische Beschreibung „低沉有磁性的
  中年男低音 … 兴奋但不尖叫“ ergab ~200–250 Hz und die natürlichsten Takes (UTMOS ~3,4).
  `stimme/referenz.wav` ist der damit erzeugte Referenz-Take für das Klonen.
- **Takes werden gemessen, nicht angehört:** Textabgleich (Whisper), Sprecher-Ähnlichkeit zur
  Referenz, Natürlichkeit (UTMOS22), Tonhöhe (Praat), Geschlecht (Klassifikator, gegengeprüft
  mit einer Frauenstimme). Formel in `score()`. Einen bestimmten Take erzwingen: `"take"` in
  der Zeile von `sprechertext.json`, dann `--nur-zusammensetzen`.
- **Pitch nicht mit pYIN messen:** pYIN (librosa) lag bei diesen Stimmen um eine Oktave
  daneben; Praat (`parselmouth`, `to_pitch_ac`) misst richtig.

## Recht (Nahrungsergänzungsmittel, Werbung in Deutschland)

- **Nur der zugelassene Claim** „Magnesium trägt zur Verringerung von Müdigkeit und Ermüdung
  bei.“ (VO (EU) 432/2012), im Wortlaut. Er gilt, weil 1 Stick 120 mg Mg = 32 % NRV liefert
  (Schwelle 15 %). Keine Umformulierung zu „gegen Müdigkeit“, „macht wach“ o. Ä. Der Gag
  „platt wie ein Pfannkuchen“ beschreibt das Problem, nicht eine Wirkung des Produkts.
- **Pflichtangaben** zum Claim (Art. 10 Abs. 2 VO (EG) 1924/2006) stehen in der Claim-Szene:
  Hinweis auf ausgewogene Ernährung und Lebensweise, Verzehrmenge.
- **„Damit ist jetzt Schluss!“ bewusst nicht verwendet**, obwohl es zum Teleshopping gehört:
  direkt nach „Kennen Sie das? … platt“ wäre es ein Wirkversprechen.
- **Preise:** Normalpreis = „Dein Preis“ ohne Registrierung, Clubpreis = registrierte
  Mitglieder, 20 % auf alle Produkte laut Registrierungsbedingungen. Keine erfundenen
  Zwischenpreise („nicht 30, nicht 25 …“), das wären Mondpreise. Stand in `config.ts`.
- **Kein „Werbung“-Logo im Bild** (Wunsch des Auftraggebers, 01.10.2026; das frühere
  `WerbungBug` oben links ist entfernt). „Werbung · Affiliate-Link“ steht nur noch im
  Kleingedruckten des Abschlusses. Die Kennzeichnung nach § 5a Abs. 4 UWG muss deshalb beim
  Posten passieren: „Werbung“ am Anfang der Caption und auf TikTok der Schalter für
  Markeninhalte, auf Instagram „Bezahlte Partnerschaft“. Nicht stillschweigend wieder einbauen.
- Keine Personenfotos aus der Produktgalerie (ausdrücklicher Wunsch), nur Produktfotos.

## Stolperfallen (gelöst, nicht wieder einbauen)

- **Schrift einpassen:** `ChromeText` rechnet Innenabstand, Kontur und Schatten in em
  (wachsen mit der Schrift). Eine erste Fassung zog sie als Anteil der *Breite* ab, alle
  Schriften waren ~40 % zu klein. Zähler bekommen `fitTo` (Endstand), sonst springt die
  Größe beim Hochzählen.
- **Blitz vor dem Ereignis:** `interpolate(frame, [t, t+5], [1, 0], clamp)` ist *vor* t auch 1.
  Ein Blitz muss zusätzlich an `frame >= t` hängen (RevealScene), sonst ist das Bild weiß.
- **Clipping in der Summe:** Remotion schreibt 16-bit; Sprecher + Musik + Effekte liefen über
  0 dBFS. `SoundTrack` mischt mit `MIX_GAIN` 0,5, `scripts/master.py` hebt danach auf
  −14 LUFS an und begrenzt bei −1 dBFS (Remotions ffmpeg hat kein `loudnorm`).
- **Kontaktbogen:** Muster `frame-???.png` übersah vierstellige Frames; jetzt nach Zahl sortiert.
- Übernommen aus barber-ad: `scripts/render.sh` (AAC-Versatz), `FontGate`; aus coralclub-ad:
  Freistellen der Shopfotos, Effekt-Generator, Packungsstreifen.
