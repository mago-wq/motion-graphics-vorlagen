# CLAUDE.md – shishan-edit

Remotion-Projekt (TypeScript): Krieger-Edit über den tschetschenischen Freiheitswillen, 9:16,
1080×1920, 30 fps, ~30 s. Bedienung und Ablauf in `README.md`.

## Wünsche des Auftraggebers (nicht aufweichen)

- **Schnitt wie TikTok-Referenz 1** (Kaneki-Edit, https://vm.tiktok.com/ZGdXAN8Rt/). Referenz 2 und 3 sind nur
  Grundstimmung. Er will ausdrücklich, dass Ton und Bild Bild für Bild analysiert werden (wann welches Wort,
  welcher Schnitt auf welchem Schlag) – die Regeln stehen in `README.md` und `src/plan.ts`. Übertreffen erlaubt.
- **Kriegerisch, brutal, motivierend – ohne kitschige Phrasen.** Text nur aus dem Nasheed (übersetzt) und
  einzelne tschetschenische Wörter (شيشان / НОХЧИЙЧОЬ / TSCHETSCHENIEN, КЪОНАХ, НОХЧО, МАРШО / FREIHEIT).
- **Keine bekannten Personen – nur der tschetschenische Typ in kaukasischer Tracht** (Papacha, Tscherkeska,
  Gasyri, Kindschal). Rückmeldung des Auftraggebers: Baysangur, Zelimkhan, Scheich Mansur, der
  Jermakow-Krieger mit Kapuze und die Kennan-Gruppe kamen im Kanal schon zu oft vor. Anonyme Figuren aus
  Commons, als „Tschetschene“ beschriftet: Krieger im Kettenhemd (Stich), Mikeschin 1876, „Tchetchenze“ mit
  Gewehr, Lithografie in weißer Tscherkeska, Zumsoi 1906, Seidlitz (vor 1900), Reiter 1910.
- **Arabisches Nasheed, in dem „Shishan“ (الشيشان) vorkommt**: „ملحمة الشيشان“. Viele arabische
  Tschetschenien-Nasheeds sind dschihadistisch (IS, Kaukasus-Emirat) – die nie verwenden. Diesen Text
  vollständig geprüft; nur Strophe 1 und der Ruf „شيشان“ sind drin.
- **Halal wie im nokhchi-edit: keine Instrumente, keine Synthesizer, keine Trommeln.** Bass und „Dum“ aus
  der Stimme (`scripts/build_audio.py`), dazu nur natürliche Geräusche. Keine gesprochenen Wörter (TTS).
- **Echte Personen nur mit echten Bildern** (keine KI-Porträts). Keine modernen Politiker.

## Aufbau

- `scripts/build_audio.py` → `public/audio/mix.wav` + `src/timeline.json` (Wortanfänge, Rufe „Shi/shan“,
  Schläge, Treffer). `src/plan.ts` setzt den ganzen Schnitt daraus zusammen – nie Frames von Hand setzen.
- Quellzeiten im Nasheed (Original): Strophe 31,20–44,31 s, Rufe 138,42–157,22 s. Rufe: Reibelaut-Spitzen
  von „sch“ (2,2–3,9 kHz) werden eingerastet; Schlag = (nächster „shan“ − dieser) / 4.
- Die Aufnahme endet bei ~4 kHz (alt): `exciter()` ergänzt Obertöne aus der Stimme, erst ab „كلا“.
- Looks: CSS-Filter in `src/look.ts`; „red“ (Schwarz-Weiß, nur Rot bleibt) und „half“ (Rasterpunkte) vorab in
  `scripts/bake_looks.py`. Freisteller per BiRefNet (rembg) für „Text hinter dem Motiv“ (NEIN., КЪОНАХ, НОХЧО).
- `bake_looks.py` kann vorher zuschneiden (`CROPS`, z. B. nur die rechte Figur einer Tafel), kleine Vorlagen
  mit Real-ESRGAN x4 hochrechnen (`UPSCALE`, Modell `~/.esrgan/real_esrgan_x4.onnx` von Hugging Face
  SceneWorks/real-esrgan-onnx) und Masken ergänzen (`MASK_ADD`: Ellipse für Teile, die BiRefNet verliert).

## Bildsprache (aus dem Vergleich mit der Referenz gemessen)

- Drop **dunkel**: Ziel Helligkeit ≈ 50/255, ≥ 60 % schwarze Pixel (Referenz 47 / 74 %). Erster Entwurf
  war mit 103 / 30 % viel zu hell und wirkte wie Stockfotos. Looks dafür: `crush`, `inv`, `cutOnly`, `burn`.
- Nur Schwarz-Weiß + Rot; Eisblau/Cyan nur für Negativ-Blitze und kurzes Flackern.
- Keine weißen Standbilder über mehrere Frames (Schneefoto mit `hard` war 10 Frames reines Weiß).
- Wörter hinter dem Kopf: Schrift knapp über dem Scheitel, Kopf verdeckt nur den unteren Rand der Buchstaben
  (sonst unlesbar). Kopf unter einen schmalen Buchstaben legen: bei „NEIN.“ unter dem E las es sich als
  „NFIN.“ (unterer Balken weg) – Krieger nach rechts unter das I geschoben.
- Freisteller auf Schwarz: dunkle Kleidung säuft mit `crush` ab (Tschetschene mit Gewehr) → `bright`.
- Schwarze Papacha vor dunklem Hintergrund fehlt in der BiRefNet-Maske (Reiter 1910) → `MASK_ADD`.

## Stolperfallen (gelöst)

- **Chrome und Proxy-CA**: Chrome geht nicht über HTTPS_PROXY, sondern direkt – dort fängt das
  „Egress Gateway“ ab. Alle Anthropic-CAs aus `/root/.ccr/ca-bundle.crt` per `certutil` in `~/.pki/nssdb`
  importieren (nicht nur „ccr-agent-proxy“). Sonst laden die Google Fonts nicht.
- **BiRefNet läuft aus dem Speicher** (14 GB), wenn mehrere Bilder in einem Prozess freigestellt werden:
  je Bild ein eigener Prozess. Modell-Download über GitHub bricht ab → `curl -C -` in eine Schleife.
- **Commons drosselt (429)**: nur Standard-Vorschaubreiten unterhalb der Originalbreite laden.
- **Arabische Schrift**: `measureText` unterschätzt die Breite → `maxW` für شيشان klein halten (640).
- **YouTube-Download** scheitert am Bot-Check; SoundCloud und TikTok gehen mit yt-dlp.

## Auslieferung

Das Video enthält das fremde Nasheed: **nie ins (öffentliche) Repo**. Entwurf und Endfassung im Chat
schicken (1080p bleibt unter 30 MB).
