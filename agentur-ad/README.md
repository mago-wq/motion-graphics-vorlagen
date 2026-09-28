# agentur-ad

30-Sekunden-Eigenwerbung (9:16) für die Motion-Graphics-Agentur. Ziel: Zuschauer schreiben
per DM, weil sie so ein Video für ihre Firma wollen.

Ablauf, geschnitten auf eine eigene 120-BPM-Musikspur:

| Zeit | Szene | Musik |
|---|---|---|
| 0–4 s | Werbesprüche rauschen vorbei, der Feed bremst und bleibt auf „Du hast angehalten.“ stehen. „Das war kein Zufall.“ | Riser, Einschlag auf dem Stopp |
| 4–8 s | „Das ist Motion Design.“ Der Punkt wächst über das ganze Bild | Drop 1 |
| 8–12 s | „Die meisten Anzeigen werden weggewischt.“ Der Satz wird selbst weggewischt. „Weil sie aussehen wie alle anderen.“ | Groove |
| 12–18 s | „So könnte deine Werbung aussehen.“ Ein echtes Arbeitsbeispiel (Barber-Spot) | Drop 2 |
| 18–24 s | „Du schaust seit 18 Sekunden zu.“ Der Zähler zeigt die echte Zuschauzeit. „Stell dir vor, das wären deine Kunden.“ | Breakdown, Uhr tickt |
| 24–30 s | „Willst du so ein Video für deine Firma?“ Button „Schreib mir ‚VIDEO‘“ | Finaler Drop, Schlussschlag |

Anpassen: `src/config.ts` (Handle, Stichwort, Farben, Texte, Beispielvideo).

```bash
npm install
npm run musik    # Musikspur neu erzeugen (nach Änderungen an src/musik-plan.json)
npm run stills   # Kontrollbilder
npm run render   # -> out/agentur-ad.mp4
npm run check
```
