# produkt-3d

3D-Produktspot (9:16, 10 s, 30 fps) mit [three.js](https://threejs.org) über
[`@remotion/three`](https://www.remotion.dev/docs/three) und React Three Fiber.
Eine Getränkedose fällt ins Bild, zeigt auf der Rückseite die Merkmale, die Kamera
schwenkt von unten heran, Kaffeebohnen kreisen um die Dose, dann folgt das Schlussbild mit Button.

Die Dose ist nur aus Grundformen gebaut (Zylinder, Drehkörper, Torus), das Etikett wird
zur Laufzeit aus `src/config.ts` auf ein Canvas gezeichnet. Es braucht also kein 3D-Modell
und keine Bilddateien. Die Marke „Nordlicht Cold Brew“ ist erfunden.

## Anpassen

Nur `src/config.ts`: Marke, Sorte, Füllmenge, Hook, drei Merkmale, Slogan, Button, Webseite,
Farben. Zeitpunkte stehen in `src/timing.ts`.

## Bedienung

```bash
npm install
npx remotion browser ensure
npm run studio                    # Vorschau im Browser
npm run render -- --entwurf       # 540×960, ~0,4 MB, ~2 min
npm run render                    # 1080×1920
npm run render -- --4k            # 2160×3840
npx remotion still Produkt3D out/f.jpg --frame=200 --scale=0.5   # Kontrollbild
```

## Aufbau

| Datei | Inhalt |
|---|---|
| `src/szene/Dose.tsx` | Dose aus Mantel, Schulter/Deckel, Boden, Lasche |
| `src/szene/etikett.ts` | zeichnet das Etikett (Vorderseite Marke, Rückseite Merkmale, Nordlicht-Wellen) |
| `src/szene/Szene.tsx` | Licht, Studio-Spiegelung, Kamerafahrt, Bewegung der Dose |
| `src/szene/Bohnen.tsx` | Kaffeebohnen-Ring und Hintergrundbohnen |
| `src/overlay/Texte.tsx` | Hook, Merkmal-Leisten, Schlussbild (HTML über der 3D-Fläche) |

Schriften: Bebas Neue und Inter (SIL OFL, lokal in `public/fonts`).
