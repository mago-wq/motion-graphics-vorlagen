# agentur-ad

30-Sekunden-Eigenwerbung (9:16) für die Motion-Graphics-Agentur. Ziel: Zuschauer schreiben
per DM, weil sie so ein Video für ihre Firma wollen.

Dramaturgie: Stopp-Hook → „Das war kein Zufall. Das ist Motion Design.“ → langweilige
Anzeigen werden weggewischt → drei Leistungen → **Beweis**: ein Zähler zeigt die echte
Zuschauzeit („Du schaust seit 23,3 s zu. Stell dir vor, das wären deine Kunden.“) → CTA mit
DM-Stichwort.

Anpassen nur in `src/config.ts` (Handle, Stichwort, Farben, Texte), Zeitpunkte in `src/timing.ts`.

```bash
npm install
npm run stills   # Kontrollbilder
npm run render   # -> out/agentur-ad.mp4
npm run check
```
