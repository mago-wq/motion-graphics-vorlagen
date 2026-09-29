# Coral-Club-Ad: 15-Sekunden-Affiliate-Video (Remotion)

TikTok-Video für drei Coral-Club-Bestseller, 9:16, 1080×1920, 30 fps, 450 Frames.
Kein Sprecher, keine Musik, nur Geräusche. Das fertige Video liegt eingecheckt unter
`out/coralclub-ad.mp4`.

## Idee

Der Hook nutzt das Markenzeichen von Coral Club selbst: den fünffarbigen Streifen, der
auf jeder Packung unter dem Produktnamen steht. Im Video streicht dieser Streifen den
Normalpreis durch. Der Aufhänger ist echt: Registrierte Mitglieder zahlen den
Clubpreis, 20 % unter dem Normalpreis, und der Affiliate-Link ist genau diese
Registrierung. Der Streifen trägt das ganze Video: als Durchstreichung, als Zierlinie
und als Wischer zwischen den Szenen.

Vorbilder: Produktaufnahmen „Ton in Ton“ (Packung auf dem Farbton der eigenen Packung,
wie bei Glossier oder Apple), Deal-Hooks aus dem TikTok-Feed („Voller Preis? Nö.“) und
Sound-first-Formate, bei denen jedes Produkt sein eigenes Geräusch hat (Plopp ins
Wasser, Stick reißt auf, Glas klirrt).

## Ablauf

| Zeit | Szene | Ton |
|---|---|---|
| 0,0–2,3 s | Gelb. „VOLLER PREIS?“ schlägt ein, 26,25 € knallt darunter, der Packungsstreifen streicht ihn durch, er kippt weg, 21,00 € springt auf, „Nö.“-Stempel | Einschläge, Filzstift-Strich, Fallen, Münze, Stempel |
| 2,3–5,3 s | Coral-Mine auf Türkis: Bestseller-Stempel, Name, Fakt, Normalpreis wird durchgestrichen, Clubpreis, −20 % | Plopp ins Wasser mit Bläschen, Stempel, Strich, Plopp |
| 5,3–8,3 s | Oceanmin auf Himmelblau | Stick reißt auf, Pulver rieselt |
| 8,3–11,3 s | Promarine Collagen auf Pink | Glas setzt auf |
| 11,3–15,0 s | Lila. Die drei Packungen fallen zusammen, „−20 %“ zählt hoch, „Clubpreis sichern“, Button „Link in Bio ↑“ pulsiert; ab 14,5 s Stillstand | Klack je Packung, Ticks, Abschluss-Schlag, Pops; ab 14,5 s Stille |

Zwischen den Szenen fahren die fünf Streifenfarben als schräge Bänder durchs Bild
(Luftzug). „Werbung“ steht das ganze Video über oben links.

## Anpassen

Alles steht in `src/config.ts`: Produkte (Name, Bild, Inhalt, Fakt, Normal- und
Clubpreis, Hintergrundfarben, Geräusch), Hook-Texte, Abschluss-Texte, Farben,
Preisstand. Neue Produktfotos: URL in `scripts/prepare_products.py` eintragen und
`python3 scripts/prepare_products.py` ausführen (braucht numpy, scipy, Pillow).

**Vor jedem Posten die Preise auf de.coral.club prüfen** und `preisStand` anpassen.
Keine Heil- oder Wirkversprechen eintragen (siehe Kommentar in `config.ts`).

## Befehle

```bash
npm install
npx remotion browser ensure   # einmalig
npm run render   # -> out/coralclub-ad.mp4 (+ Ton als WAV)
npm run check    # Abnahme-Check (Format, Länge, Pegel, Stille am Ende, Sync)
npm run stills -- --safe      # Kontrollbilder mit Sicherheitszone
npm run sfx      # Toneffekte neu erzeugen
npm run typecheck
```

Die Schrift (Bricolage Grotesque, SIL OFL) liegt in `public/fonts/`, beim Rendern wird
nichts aus dem Netz geladen. Der Render-Weg (Ton als WAV, dann AAC per ffmpeg) ist aus
`barber-ad` übernommen, Begründung steht dort.
