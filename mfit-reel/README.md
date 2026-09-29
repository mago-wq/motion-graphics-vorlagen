# MFit-Reel: 35-Sekunden-Werbevideo (Remotion)

Instagram-Reel für **MFit Smart** (Premium SmartGym 24/7, Bremen und Umgebung).
9:16, 1080×1920, 30 fps, 1056 Frames = 35,2 s. Eigene Musik und eigenes Sounddesign,
alles synthetisiert, keine fremden Rechte.

Das fertige Video liegt eingecheckt unter `out/mfit-reel.mp4` (1080×1920, für den
Instagram-Upload). Dazu gibt es einen **4K-Master** (2160×3840, `npm run render:4k` →
`out/mfit-reel-4k.mp4`) als Lieferfassung in hoher Qualität. Instagram zeigt Reels
höchstens in 1080×1920 an und rechnet größere Uploads herunter.
Idee und Marketing-Psychologie dahinter: [`KONZEPT.md`](KONZEPT.md).

## Inhalte ändern

Alle Texte, Preise, Studios und Farben stehen in `src/config.ts`. Stand der Angaben:
mfit-smart.de am 29.09.2026. **Vor jeder Veröffentlichung Preis (17,90 € statt
29,90 €) und Studioliste mit MFit abgleichen.**

1. `src/config.ts` anpassen. Lange Zeilen werden automatisch kleiner gesetzt.
2. `npm run stills -- --safe` erzeugt Kontrollbilder mit roter Sicherheitszone.
3. `npm run render` erzeugt `out/mfit-reel.mp4` (Tonspur wird bei Bedarf neu erzeugt).
4. `npm run check` prüft die fertige Datei.

Die Anzahl der Häkchen (7) und der Studios (6) ist mit Zeitplan und Musik verzahnt.
Texte dürfen sich ändern, die Anzahl nicht. Zeitpunkte stehen in `src/timeline.json`
(in Beats), dort verschiebt man Bild und Ton gemeinsam.

## Einrichtung

```bash
npm install
npx remotion browser ensure          # Chrome Headless Shell, einmalig
pip install numpy scipy pyloudnorm pillow   # nur für Tonspur, Check, Kontaktbögen
```

Node ≥ 18, Python 3. Schriften und Logo liegen lokal in `public/`, Rendern braucht
kein Internet.

## Befehle

| Befehl | Was passiert |
|---|---|
| `npm run studio` | Vorschau im Browser (mit Ton) |
| `npm run render` | Video rendern: `out/mfit-reel.mp4` (1080×1920) |
| `npm run render:4k` | 4K-Master: `out/mfit-reel-4k.mp4` (2160×3840, verlustfreie Einzelbilder, x264 slow, CRF 14) |
| `npm run check` | Abnahme-Check: H.264, 1056 Frames, AAC 48 kHz Stereo, 35,2 s, Lautheit ≈ −12 LUFS, True Peak im MP4, Ton-Versatz, stilles Standbild-Ende |
| `npm run check:4k` | derselbe Check für den 4K-Master |
| `npm run assets` | Logo in doppelter Auflösung und Filmkorn neu erzeugen (`scripts/prepare_assets.py`) |
| `npm run stills` | Standbilder der Schlüsselmomente nach `out/stills/` + `out/kontaktbogen.png` |
| `npm run stills -- --safe` | dasselbe mit Sicherheitszone |
| `npm run stills -- 0 192 672` | beliebige Frames |
| `npm run soundtrack` | Tonspur neu erzeugen: `public/audio/mfit-soundtrack.wav` + Stems in `out/stems/` |
| `npm run typecheck` | TypeScript prüfen |
| `npm run render:film` | Der Film (40 s, Lottie-Figur): `out/mfit-film.mp4` (1080×1920) |
| `npm run render:film:4k` | Film als 4K-Master: `out/mfit-film-4k.mp4` (2160×3840) |
| `npm run check:film` / `check:film:4k` | Abnahme-Check für den Film (gleiche Prüfungen wie beim Reel) |
| `npm run sound:film` | Film-Tonspur neu erzeugen: `public/audio/mfit-film.wav` |
| `npm run figuren` | Lottie-Figur für den Figuren-Vergleich laden (`public/figuren/`, nicht eingecheckt) |
| `npm run vergleich` | Figuren-Vergleich rendern: `out/figuren-vergleich.mp4` (2160×1920, beide Varianten nebeneinander) |
| `npm run stills -- --comp=FigurenVergleich 0 120` | Standbilder einer anderen Komposition |

## Ablauf

150 BPM: 1 Beat = 12 Frames, 1 Takt = 1,6 s. Jeder Schnitt, jeder Einschlag und
jeder Effekt liegt auf dem Beat.

| Zeit | Szene | Musik |
|---|---|---|
| 0,0–1,6 s | **„PREMIUM-GYM FÜR 17,90 €?“** Preis rollt wie eine Walze und rastet auf dem Clap ein | voller Beat ab Frame 0 |
| 1,6–3,2 s | **„WO IST DER HAKEN?“** Ein goldener Angelhaken fällt an der Schnur ins Bild | voll |
| 3,2–6,4 s | **„GANZ EHRLICH? ES GIBT 7.“** Der Haken vermehrt sich auf sieben, jeder mit Ping in E-Dur | Breakdown, Riser, Stille |
| 6,4 s | **Drop:** Die sieben Haken werden zu sieben Häkchen und rasten unter dem MFit-Logo ein | Drop auf a-Moll |
| 6,4–19,2 s | Die 7 Häkchen, jedes mit eigenem Piktogramm: monatlich kündbar (Kette reißt), keine Anmeldegebühr (0 €), rund um die Uhr* (Ring schließt sich), Face-ID (Scan, „NUR DEIN GESICHT.“), kostenlose Getränke, kostenlose Parkplätze, alle 6 Studios (Liniennetz, 3× NEU) | voll; jedes Häkchen einen Ton höher |
| 19,2–20,8 s | **„KEIN HAKEN. NUR HÄKCHEN.“** Alle sieben als Liste | Kaskade |
| 20,8–22,4 s | **„UND DAS ALLES FÜR“** 29,90 € wird in der Stille durchgestrichen | Pause, Stille |
| 22,4–25,6 s | **„NUR 17,90 € IM MONAT“** Zweiter Drop, Rahmen wie im Logo, „statt 29,90 €“ | Drop |
| 25,6–30,4 s | **„NOCH UNSICHER? PROBIER'S EINFACH.“** → Kostenloses Probetraining, mfit-smart.de, Wellpass & Hansefit* | voll |
| 30,4–35,2 s | Das letzte Häkchen wird zum Chevron des MFit-Logos, Logo baut sich auf, Claim, ab 34,4 s Standbild | Build, Schlussschlag + Audio-Logo |

Fußnoten stehen jeweils auf demselben Bild wie ihr Sternchen.

## Aufbau

```
src/
  config.ts        ← alle Inhalte (Texte, Preise, Studios, Farben)
  timeline.json    ← Zeitplan in Beats; Bild UND Ton lesen von hier
  timing.ts        Frames aus dem Zeitplan, Prüfungen (Anzahl Häkchen/Studios)
  motion.ts        Easing, Federn, Einschläge
  video.ts         Format, Sicherheitszone für Reels-Anzeigen
  theme.ts         Farben, Metallic-Gold der MFit-Website, Zahlenformat
  fonts.ts         Rubik One + Rubik (Schriften der MFit-Website), lokal
  MfitReel.tsx     Hintergrund + Szenen + Haken + Kopfzeile + Filmkorn + Ton
  scenes/          eine Datei je Szene
  components/      Haken↔Häkchen, Logo, Piktogramme, Walze, Liniennetz, Schrift …
  story/           Vorstufe zweites Video: Stilbilder, Nachtszene, Figuren-Vergleich
    figuren/       Lottie-Werkzeuge und -Player, Lottie-Figur, Humaaans-Figur mit Rig, Gang
public/
  brand/           MFit-Logo freigestellt (mit und ohne Rahmen), von mfit-smart.de
  fonts/           Rubik One, Rubik (SIL Open Font License)
  audio/           fertige Tonspur
  grain/           Filmkorn-Kacheln
scripts/           Tonspur, Render, Check, Standbilder, Kontaktbogen
```

## Der Film (Komposition `MfitFilm`, 40 s)

Zweites Video mit der Lottie-Figur: eine kleine Geschichte statt einer Liste. Zeitplan in
Beats in `src/story/film/film.json` (120 BPM, 15 Frames/Beat), Bild und Ton lesen dieselbe
Datei. Szenen in `src/story/film/`.

| Zeit | Szene | Was man sieht | Angebot |
|---|---|---|---|
| 0–4 s | Problem | 22:47 Uhr, er kommt müde zu einem (beliebigen) Studio, der Rollladen fällt. „Studio zu.“ | – |
| 4–10 s | Handy | Anfrageformular von mfit-smart.de: Studio, Tag, Uhrzeit, Name, „Probetraining anfragen“ → „Anfrage gesendet!“ | kostenloses Probetraining |
| 10–18 s | Tür | 03:17 Uhr, gut gelaunt: Face-ID-Scan, Tür gleitet auf, er geht hinein | 24/7*, Face-ID |
| 18–26 s | Rundgang | Kamera läuft mit, an jeder Station eine Karte | keine Anmeldegebühr, Getränke, Parkplätze, monatlich kündbar |
| 26–30 s | Studios | Karte mit sechs Pins, NEU-Schilder | eine Mitgliedschaft, alle Studios |
| 30–34 s | Preis | 17,90 € statt 29,90 €, Details, Wellpass/Hansefit* | Preis |
| 34–38 s | Einladung | „Noch unsicher? Probier's einfach.“, drei Punkte, Tipp auf „Jetzt anfragen“ | Probetraining |
| 38–40 s | Logo | Logo, Claim, Adresse, Standbild | – |

Ohne Sprecherstimme: Hier stehen nur Sprachsynthesen zur Verfügung, die nicht wie ein
professioneller Sprecher klingen. Alle Aussagen stehen deshalb als Text im Bild (das Video
funktioniert auch stumm). Eine echte Sprecheraufnahme lässt sich später auf die Tonspur legen.

## Figuren-Vergleich (Vorstufe für das zweite Video)

Dieselbe Szene zweimal nebeneinander (Komposition `FigurenVergleich`, 9 s): nachts zum
Studio, Face-ID-Scan, Tür gleitet auf, die Figur geht hinein. Beide Figuren gehen denselben
Weg zur selben Zeit, nur die Technik unterscheidet sich. Einzeln im Reel-Format:
`FigurLottie`, `FigurKit`.

1. **Lottie-Figur**: fertig animierte Figur von LottieFiles, in MFit-Farben umgefärbt. Die
   Choreografie wird aus dem Gehzyklus „gebacken“ (`figuren/lottie.ts`): Schrittphase am Weg
   gekoppelt, Beiziehschritt zum Stehen, Anlaufen. Nur die Bewegungen, die die Datei
   mitbringt (hier: Gehen), sind sauber; neue Posen heißt: Keyframes im Rig setzen.
2. **Baukasten (Humaaans)**: Kopf, Jacke, Hände, Sneaker aus dem Humaaans-Baukasten, Beine
   und Arme selbst geriggt (`figuren/KitFigur.tsx`). Jede Pose möglich, aber alle Bewegung
   ist Handarbeit; der Stil ist flacher (keine Gesichter).

## Ton

`scripts/make_soundtrack.py` komponiert und mischt alles selbst: Trap/Phonk-Beat
(150 BPM, Halftime, a-Moll, Am–F–Dm–E), 808-Bass mit Obertönen für
Handy-Lautsprecher, Phonk-Cowbell-Melodie, Hi-Hat-Rolls, Riser und Stille vor den
Drops. Das Sounddesign (Pings, Klicks, Walzen, Scan, Kette, Glitzern) liest seine
Zeitpunkte aus `src/timeline.json`. Das Face-ID-Entsperren (A–E–A) kommt am Ende als
Audio-Logo wieder. Mastering: True-Peak-Limiter, ≈ −12,7 LUFS, im MP4 unter −1 dBTP.
`out/stems/` enthält Musik und Effekte getrennt, falls MFit eigene Musik darunterlegen will.

## Rechtliches (vor Veröffentlichung)

- Preise und Angebote stammen von mfit-smart.de (Stand 29.09.2026). MFit muss sie freigeben.
- „24/7“ trägt die Fußnote „*an den meisten Standorten“, so steht es auf der Website.
- Wellpass/Hansefit gibt es laut Website nur in einzelnen Studios, daher „*in ausgewählten Studios“.
- Logo und Marke gehören MFit. Das Video ist als Angebot an MFit gebaut.
- Musik und Effekte sind in diesem Projekt erzeugt, ohne Samples oder fremde Aufnahmen: keine Rechte Dritter.
- Schriften: Rubik und Rubik One, SIL Open Font License (`public/fonts/OFL-*.txt`).
- Film und Figuren-Vergleich: „The guy walks and smiles“ und „Sad guy is walking“ von konstaner (LottieFiles, Lottie Simple
  License: kommerziell nutzbar und veränderbar, ohne Namensnennung; Weitergabe der Datei nur
  unter derselben Lizenz). Sie liegt deshalb nicht im Repo, sondern wird per `npm run figuren`
  geladen. Humaaans von Pablo Stanley: CC0.
