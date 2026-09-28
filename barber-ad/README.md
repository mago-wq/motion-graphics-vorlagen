# Barber-Ad: 15-Sekunden-Werbevideo (Remotion)

Beispielvideo für einen fiktiven Barbershop („Cutline Barber“), 9:16, 1080×1920,
30 fps, 450 Frames. Die Daten für einen echten Betrieb stehen alle in einer Datei.

Das fertige Video liegt eingecheckt unter `out/barber-ad.mp4`.

## Für einen echten Betrieb umbauen

1. `src/config.ts` öffnen und Name, Stadt, Adresse, Instagram, die drei
   Leistungen mit Preis und Icon (`schere` | `rasierer` | `kamm`), Neukundenrabatt,
   Farben und Texte eintragen.
2. `npm run stills -- --safe` erzeugt Kontrollbilder mit eingeblendeter
   Sicherheitszone nach `out/stills/`.
3. `npm run render` erzeugt `out/barber-ad.mp4` (dazu den Ton einzeln als WAV).
4. `npm run check` prüft die fertige Datei (Format, Tonspur, Länge, Pegel, Sync).

Lange Namen oder Texte werden automatisch kleiner gesetzt, damit sie in die
Sicherheitszone passen. Die Hook-Zeilen stehen als Liste in `texte.hook`: Jeder
Eintrag ist eine Zeile, und jedes Wort schlägt einzeln ein. Die Einschläge und ihr
Ton verteilen sich automatisch auf die Wortzahl. Ändert sich der Rabatt, passen
sich Hochzählen, Ticks und Abschluss-Schlag von selbst an.

## Einrichtung

```bash
npm install
npx remotion browser ensure   # lädt Chrome Headless Shell (einmalig)
```

Braucht Node ≥ 18 und Python 3 mit numpy (nur für `npm run sfx` und `npm run check`).
Beim Rendern lädt Chrome Bebas Neue und Inter über `@remotion/google-fonts` von
fonts.gstatic.com, der Rechner braucht dafür Internet. Die Schriften stecken danach
als Pixel im Video, Zuschauer machen keine Anfrage an Google.

Fehlen unter Linux Systembibliotheken für Chrome, zeigt
`ldd node_modules/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell | grep "not found"`,
welche es sind.

## Befehle

| Befehl | Was passiert |
|---|---|
| `npm run render` | Video rendern: `out/barber-ad.mp4` + `out/barber-ad-ton.wav` |
| `npm run check` | Abnahme-Check der MP4 (H.264, 450 Frames, AAC 44,1 kHz Stereo, 15,000 s, Spitze ≈ −3 dBFS, letzte 0,5 s still, Sync) |
| `npm run stills` | Standbilder der Frames 0, 30, 60, 120, 200, 300, 400, 449 nach `out/stills/` |
| `npm run stills -- --safe` | dasselbe mit rot markierter Sicherheitszone |
| `FRAMES="10 20" npm run stills` | beliebige Frames |
| `npm run sfx` | Toneffekte neu erzeugen (`scripts/generate_sfx.py`) |
| `npm run typecheck` | TypeScript prüfen |

`scripts/contact_sheet.py` (braucht Pillow) setzt die Standbilder zu einem
Kontaktbogen zusammen.

### Warum `npm run render` und nicht direkt `npx remotion render`

`npm run render` ruft `npx remotion render` auf und ergänzt einen Schritt:
Remotion kodiert AAC zuerst als ADTS-Datei und kopiert sie dann ins MP4. Dabei geht
der Hinweis auf den Encoder-Vorlauf verloren, und der Ton liefe im Player 46 ms
hinter dem Bild. Deshalb gibt Remotion den Ton verlustfrei als WAV aus, und ffmpeg
kodiert ihn direkt ins MP4. Gemessen per Kreuzkorrelation sitzt danach jeder Effekt
auf ±0,3 ms genau auf seinem Frame. Ein reines `npx remotion render BarberAd out/x.mp4`
funktioniert auch, dann aber mit diesen 46 ms Versatz.

## Ablauf

| Zeit | Szene | Ton |
|---|---|---|
| 0,0–1,5 s | Hook: fünf Wörter schlagen einzeln ein, Screenshake | tiefer Einschlag je Wort, der letzte kräftiger |
| 1,5–4,0 s | Schere zeichnet sich, schnippt zweimal; „Nicht bei uns.“, Name | leises Kratzen, zwei Schnipp-Geräusche |
| 4,0–8,5 s | drei Leistungen fliegen gestaffelt herein (0,4 s), Goldstreifen als Trenner | Whoosh + Klack je Karte, Swish für die Streifen |
| 8,5–12,0 s | Angebotskarte, Zahl zählt hoch, Goldrahmen zeichnet sich einmal herum | Ticks (gleiche Tonhöhe), Swipe, Abschluss-Schlag |
| 12,0–15,0 s | Name, Adresse, Instagram, pulsierender Button; ab 14,5 s Stillstand | sehr leises Pop je Puls, ab 14,5 s Stille |

Jeder Szenenwechsel ist ein Slide-Übergang von 10 Frames (`@remotion/transitions`)
mit kurzem Whoosh. Der Barber-Pole-Hintergrund läuft durchgehend hinter allen Szenen.

## Aufbau

```
src/
  config.ts        ← alle anpassbaren Daten (Texte, Preise, Farben)
  timing.ts        Zeitplan in Frames; Animationen UND Ton lesen von hier
  motion.ts        Federn (spring) und Hilfsfunktionen
  video.ts         Format und Sicherheitszone
  theme.ts         Farben, Preisformat
  fonts.ts         Bebas Neue + Inter über @remotion/google-fonts
  BarberAd.tsx     Hintergrund + Szenen + Übergänge + Tonspur
  scenes/          eine Datei je Szene
  components/      Icons, Schere, Streifen, Button, Goldstreifen, FitText …
  audio/cues.ts    Ton-Drehbuch: welcher Effekt auf welchem Frame
public/sfx/        die erzeugten Effekte (44,1 kHz, Stereo)
scripts/           Render, Check, Standbilder, Effekt-Generator
```

## Ton

Keine Musik, keine Samples. `scripts/generate_sfx.py` baut alle Effekte aus
gefiltertem Rauschen, gedämpften Schwingungen und Klicks (geseedet, also
reproduzierbar) und schreibt pro Effekt einen „Anker“ nach
`src/audio/sfx-manifest.json`: den Moment im Klang, der auf das Bild-Ereignis
fallen soll, etwa den Klick beim Schließen der Schere. `src/audio/cues.ts` legt die
Effekte damit framegenau an. Die Pegel stehen in `generate_sfx.py` (`SOUNDS`) und
sind so abgestimmt, dass die Mischung bei etwa −3 dBFS liegt.
