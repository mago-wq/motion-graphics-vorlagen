# Motion-Graphics-Vorlagen

Wiederverwendbare Werbevideos für Social Media (9:16), gebaut mit
[Remotion](https://www.remotion.dev). Jede Vorlage liegt in einem eigenen Ordner
und wird pro Kunde nur über ihre `src/config.ts` angepasst.

| Vorlage | Inhalt | Länge |
|---|---|---|
| [`barber-ad/`](barber-ad/) | Barbershop: Hook, Leistungen mit Preisen, Neukundenrabatt, Termin-Button | 15 s |

Bedienung steht jeweils in der README der Vorlage. Kurz:

```bash
cd barber-ad
npm install
npx remotion browser ensure
npm run render   # -> out/barber-ad.mp4
npm run check    # Abnahme-Check
```
