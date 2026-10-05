# CLAUDE.md – asmu-edit

Remotion-Projekt (TypeScript): Motivations-Edit, 1080×1920, 30 fps, ~41 s, mit Ton.
Nasheed „أسمو – I Rise“ (Muhammad al Muqit), nur Stimme. Bedienung und Ablauf in `README.md`.

## Wunsch des Auftraggebers

- Energie wie in Edits über Siegeswillen und Tatendrang: aufstehen, anpacken, die Welt
  erobern und besser machen. Dazu ein islamischer Rahmen.
- Das Video soll dem Kanal entsprechen, Politik kommt aber nicht ins Bild. „Erobern“ ist
  hier Selbstüberwindung, Aufbruch und Aufbau: Entdecker, Baumeister, Gelehrter.
  Keine Krieger, Schwerter oder Schlachten.
- **Nasheed aussuchen, nicht erzeugen.** Kein KI-Gesang, keine Musik mit Instrumenten.
- **Keine Nasheeds aus extremistischer Propaganda.** Auf TikTok laufen viele „harte“
  Nasheeds, die aus IS-Produktionen stammen, z. B. „Salil al-Sawarim“, „Ummati qad laha
  fajrun“ und „Dawlat al-Islam qamat“. Die sind tabu: Sie führen zur Kontosperre und sind in
  Deutschland auch strafrechtlich ein Risiko (Propaganda verbotener Organisationen,
  §§ 86, 86a StGB). Nur bekannte, unpolitische Munschids nehmen.
- Keine Menschen in den Clips (Vorgabe für alle Vorlagen): auch keine Reiter, Silhouetten
  oder Hände. **Ausnahme auf Wunsch:** die drei Vorbilder als Büsten (Ibn Battuta im
  Einstieg, Sinan und al-Chwarizmi über ihren Einstellungen), „nur Text fesselt nicht“.
  **Augen immer abgedeckt**: Ein schwarzer Balken mit dem Namen in Gold liegt im selben
  Container wie das Bild (`components/Portraet.tsx`, `VORBILDER[...].augen` in `config.ts`).
  Er folgt jeder Bewegung und wird nie getrennt vom Bild eingeblendet, auch nicht im
  Rückblick. Neue Bilder: Augen mit einem Raster über der Commons-Vorschau vermessen, mit
  Rand. Sinans Hand an der Messelle wird unten ausgeblendet (`ausblenden`).
- Bilder echter historischer Darstellungen vor KI-Bildern: Sinan stammt aus einer Miniatur
  von 1579. Für Ibn Battuta und al-Chwarizmi gibt es keine Porträts, daher gemeinfreie
  „gedachte“ Darstellungen (Skizze 1961 bzw. nach der sowjetischen Briefmarke 1983).

## Regeln

- **Inhalte und Zeiten nur in `src/config.ts`.** Das gilt für Einstellungen (`SHOTS`),
  Tafeln (`TAFELN`), Liedzeilen (`LIED`), Treffer (`TREFFER`), Geräusche (`SFX`),
  Funken und Blitze.
- **Liedzeiten in Originalzeit + `vt()`**, nie von Hand in Videozeit umrechnen. Wer den
  Schnitt in `src/schnitt.json` ändert, startet `npm run ton` neu. Dann wandern Liedzeilen,
  Pulsschläge (`BEATS`) und Videolänge mit.
- **Schnitte auf die Pulsschläge** des Gesangs (~65 BPM, `BEATS` in `timing.ts`).
- **Fakten nur mit Beleg** (Tabelle in README). Keine Zahlen erfinden, Bilder nicht mit
  fremden Bauwerken beschriften. Die *blaue* Sultan-Ahmed-Moschee ist **nicht** von Sinan
  (sondern von seinem Schüler Sedefkâr Mehmed Ağa). „Selimiye“ in Istanbul-Üsküdar ist
  eine andere Moschee als Sinans Selimiye in Edirne.
- **Nur Mixkit-Clips mit „Free“-Lizenz.** Die Lizenz steht im JSON-LD der Clipseite
  (`copyrightNotice`). „Mixkit Restricted License“ gilt nur für private, nicht
  monetarisierte Konten. Neue Clips in `scripts/assets.json` eintragen.
- **Fremdmaterial nie einchecken** (Nasheed, Clips, Geräusche, Bilder): `fetch_assets.py`
  lädt es. Ausgeliefert wird das fertige Video über den Chat (Entwurf/1080) – nicht über
  dieses öffentliche Repo.
- **Text in der Sicherheitszone** x 80–1000, y 250–1500. Größen werden mit `fitText`
  gegen die Breite begrenzt. Gemessen wird erst nach dem FontGate.

## Aufbau

- `src/AsmuEdit.tsx`: Kamera (Ruck/Stoß aus `TREFFER`), Einstellungen, Ebenen, Text, Ton.
- `components/Shot.tsx`: Clips mit Zeitrampe. Pro Frame wird über `<Sequence from={frame}>`
  und `trimBefore` neu eingesetzt, wie im Remotion-Rezept „accelerated video“. Die
  Interpolation ist monoton-kubisch, damit an Stützpunkten nichts stehen bleibt.
  `enter: 'zoom' | 'whip'`.
- `components/Portraet.tsx`: `Bueste` (Bild + Augenbalken), `Portraet` (Einstieg vor dem
  Zeitraffer 4357, der auf „أسمو“ hell wird) und `VorbildEbene` (Büste über einer laufenden
  Einstellung, `BUESTEN` in `config.ts`). Freistellen/hochrechnen: `scripts/prepare_bilder.py`
  (Real-ESRGAN ×4 + rembg/BiRefNet).
- `components/Karte.tsx`: Natural-Earth-Land + Route aus `src/karte.json` (`npm run karte`).
- `components/Muster.tsx`: Achtzackige Sterne, die sich von der Mitte aus zeichnen.
- `components/Overlays.tsx`: Korn, Vignette, Blitz/Lichtleck, Funken (Clip 3463 im
  Screen-Modus), gezeichnete Blitzstrahlen.

## Stolperfallen

- **Schnell nachbessern ohne Komplett-Render:** Nur die geänderten Frames rendern
  (`npx remotion render AsmuEdit out/.seg.mp4 --frames=A-B --crf=10 --muted`), Grenzen auf die
  Schlüsselbilder der fertigen Datei legen (`ffprobe … -show_entries frame=key_frame`), dann
  alte Teile + neuen Abschnitt per `concat`-Filter in einem 2-Pass neu kodieren und den Ton
  der fertigen Datei kopieren. Reines Aneinanderhängen per Stream-Copy geht nicht: x264 setzt
  den Start-QP im PPS je Kodierung anders (21 vs. 25), der neue Abschnitt würde falsch dekodiert.

- **Ton-Versatz**: `scripts/render.sh` kodiert AAC selbst, wie barber-ad.
- **Schnittstelle im Nasheed** (16,25 s): Der Schnitt liegt im leisen Summen. Er wird mit
  0,1 s überblendet und vom Donner (`donner_nah`) überdeckt. Ohne den Donner hört man den
  Sprung im Hintergrundchor.
- **Gewitterclip 4423 ist fast schwarz**, nur die Blitze sind hell. Bei kräftigem
  Abdunkeln wird er ganz schwarz, bei zu wenig wirkt er grau und flach. Jetzt:
  `brightness(0.82) contrast(1.45)`, dazu gezeichnete Blitze.
- **Arabische Zeile zu breit**: Wortabstand (0,24 em) plus Innenabstand ist breiter als ein
  Leerzeichen. `fitText` misst deshalb gegen 760 statt 900 px.
- **Mixkit drosselt** (Cloudflare 429) bei vielen parallelen Seitenabrufen. Clipseiten
  langsam und mit `curl_cffi` (Chrome-Imitat) abfragen. `assets.mixkit.co` selbst ist frei,
  1080p und teils 2160p gehen ohne Login.
- **Neue Mixkit-Clips** (IDs ab 100000) haben keine `<id>-1080.mp4`-Adresse mehr, sondern
  undurchsichtige Asset-URLs von der Clipseite.
