# asmu-edit – Motivations-Edit auf „أسمو – I Rise“

Hochkant-Edit (9:16, 30 fps, ~41 s) zum Aufstehen und Anpacken, mit islamischem Rahmen.
Ton ist das Nasheed **„أسمو – I Rise“ von Muhammad al Muqit** (nur Stimme, offizieller
Upload des Künstlers, 2016). Es wurde ausgesucht, nicht erzeugt. Im Bild sind **keine Menschen**
zu sehen: Landschaft, Naturgewalt, Architektur, Handschrift und Grafik. Die einzige Ausnahme ist
die drei Vorbilder als Büsten: Ibn Battuta (gedachte Skizze, ein echtes Porträt gibt es nicht),
Mimar Sinan (Miniatur von Nakkaş Osman, 1579) und al-Chwarizmi (gedachtes Porträt nach der
sowjetischen Briefmarke von 1983). **Die Augen sind immer von einem Balken mit dem Namen in
arabischer Schrift verdeckt** („ابن بطوطة“, „معمار سنان“, „الخوارزمي“).

## Ablauf

| Zeit | Ton | Bild und Text |
|---|---|---|
| 0–1,3 s | Wind | Ibn Battuta steigt aus dem Dunkel ins Bild (Augenbalken mit „ابن بطوطة“): **ER REISTE WEITER ALS JEDER VOR IHM.** |
| 1,35 s | „أسمو“ (allein gesungen) | hinter ihm bricht der Morgen an, Titel **أسمو – ICH STEIGE AUF** über Sternmuster |
| 3,5–7,8 s | Summen | **Ibn Battuta:** *Mit 21 brach er auf. Allein.* Karte mit der Route 1325–1354, Zähler bis **117.000 km** |
| 7,8–11,6 s | Summen | **Mimar Sinan** als Büste (Augenbalken „معمار سنان“): *Mehr als 300 Bauwerke* (Süleymaniye), *Sein Meisterwerk vollendete er mit über 80* (Kuppel der Selimiye, Edirne) |
| 11,6–15,4 s | Summen | **al-Chwarizmi** als Büste (Augenbalken „الخوارزمي“): *Der Algorithmus, der dir das hier zeigt, trägt seinen Namen.* (Handschrift seines Algebra-Buchs) |
| 15,4–16,25 s | Sog | Rückblick im Stroboskop |
| 16,25 s | Schnitt im Nasheed, Donnerschlag | Gewitter, gezeichnete Blitze |
| 16,5–21,4 s | „لا تسأل المقدام عن سبل العلا“ | *Frag den Furchtlosen nicht nach dem Weg nach oben –* (Gewitter, Flammen, Gipfel im Nebel) |
| 21,4–27,2 s | „ستراه طيرا بالعزيمة جالا“ | *du siehst ihn: ein Vogel, der voller Entschlossenheit kreist.* (Wolkenmeer, Adler, Felsgipfel) |
| 27,3–33 s | Refrain „أسمو وأجتاز السماء جلالا“ | *Ich steige auf und durchquere den Himmel – voller Erhabenheit.* (Zeitraffer Matterhorn, Sonne) |
| 33,1 / 34,9 s | „فأزيد أسراب الغيوم جمالا“ | **ERST DICH SELBST.** (Glut) – **DANN DIE WELT.** (Tag) |
| 35,9–41 s | Nachhall | Koran 13:11 über dem Sternmuster, Abblende |

Alle Inhalte und Zeiten stehen in `src/config.ts`, der Nasheed-Schnitt in `src/schnitt.json`.

## Bedienung

```bash
npm install
npx remotion browser ensure
npm run assets        # Nasheed, Clips, Geräusche, Bilder laden (nicht im Repo) + CREDITS.md
npm run ton           # Nasheed-Ausschnitt bauen: public/ton/asmu-schnitt.wav + src/huelle.json
npm run bilder        # Büsten (Ibn Battuta, Sinan, al-Chwarizmi) freistellen + hochrechnen, Handschrift hochrechnen
npm run stills        # Kontrollbilder + Kontaktbogen out/stills/_bogen.jpg
npm run render -- --entwurf   # 540×960, schnell (~5 min) – erst den zeigen
npm run render -- --1080      # Endfassung 1080×1920 (Chat-Upload)
npm run render                # Endfassung 4K (1080 gerendert, Lanczos hochgerechnet)
```

`npm run karte` baut `src/karte.json` neu (nur nötig, wenn Route oder Ausschnitt geändert
werden; braucht `shapely`). Python-Pakete: `numpy scipy soundfile shapely pillow yt-dlp`.
Für 4K-Clips: `python3 scripts/fetch_assets.py --4k` (vorher `public/clips/` leeren). Auch für die
1080er Endfassung lohnt das: Der Hochkant-Ausschnitt aus 4K ist scharf, aus 1080p hochgerechnet.

## Text und Fakten

| Aussage | Beleg |
|---|---|
| Ibn Battuta reiste weiter als jeder vor ihm | „travelled more than any other explorer in pre-modern history“, Wikipedia EN „Ibn Battuta“ |
| Ibn Battuta brach mit 21 allein von Tanger auf | 14. Juni 1325, „I set out alone …“ (Rihla), Wikipedia EN „Ibn Battuta“ |
| 30 Jahre, rund 117.000 km | Reisen 1325–1354, Wikipedia EN „Ibn Battuta“ |
| Mimar Sinan: mehr als 300 Bauwerke | „more than 300 major structures“, Wikipedia EN „Mimar Sinan“ |
| Meisterwerk (Selimiye) mit über 80 vollendet | nach seiner Autobiografie, Wikipedia EN „Mimar Sinan“ |
| „Algorithmus“ kommt von al-Chwarizmis Namen | latinisiert „Algoritmi“, Wikipedia EN „Muhammad ibn Musa al-Khwarizmi“; Bagdad um 820 |

Die Karte zeigt die Route **vereinfacht** (Hauptstationen in Reihenfolge, Rückweg als Bogen).

**Liedtext:** In der Beschreibung des offiziellen Uploads steht „لا تسأل العلياء …“, gesungen
wird aber „لا تسأل المقدام …“ (Whisper large-v3-turbo, Wahrscheinlichkeit 1,0, obwohl der
Liedtext als Vorgabe dabei war). Das Video folgt dem Gesang. Die deutschen Übersetzungen sind
eigene; Koran 13:11 nah an Bubenheim/Elyas. **Vor dem Posten gegenlesen lassen.**

## Quellen und Lizenzen

- Nasheed: Rechte beim Künstler, liegt nicht im Repo. Für TikTok das Video mit Ton hochladen
  oder dasselbe Nasheed aus der TikTok-Tonbibliothek darüberlegen.
- Clips: Mixkit, **nur Stock Video Free License** (kommerziell nutzbar). Mixkit kennzeichnet
  viele Clips (Wellen, Pferde, Moscheen von oben) als „Restricted“ – die sind nur für private,
  nicht monetarisierte Konten erlaubt und deshalb hier nicht verwendet.
- Bilder: Wikimedia Commons, CC BY-SA 4.0 bzw. gemeinfrei – Namensnennung aus `CREDITS.md`
  in die Videobeschreibung übernehmen. Die Ibn-Battuta-Skizze stammt aus „Sayr mulhimah min
  al-Sharq wa-al-Gharb“ (Kairo 1961, Zeichner unbekannt) und ist auf Commons als gemeinfrei
  eingestuft.
- Geräusche: Mixkit Sound Effects Free License, nur Natur und Luft (Wind, Donner, Feuer, Adler,
  Herzschlag), keine Instrumente.
- Schriften (SIL OFL): Anton, Barlow Condensed, Scheherazade New.
- Karte: Natural Earth, gemeinfrei.
