# Motion-Graphics-Vorlagen

Wiederverwendbare Werbevideos für Social Media (9:16), gebaut mit
[Remotion](https://www.remotion.dev). Jede Vorlage liegt in einem eigenen Ordner
und wird pro Kunde nur über ihre `src/config.ts` angepasst.

| Vorlage | Inhalt | Länge |
|---|---|---|
| [`barber-ad/`](barber-ad/) | Barbershop: Hook, Leistungen mit Preisen, Neukundenrabatt, Termin-Button | 15 s |
| [`welt-laerm/`](welt-laerm/) | Reminder-Clip: Originalton, deutsche Untertitel Wort für Wort, leuchtende Piktogramm-Figuren | 22,6 s |
| [`nokhchi-edit/`](nokhchi-edit/) | History-Edit tschetschenische Geschichte: Nasheed nur Stimme, animierte Karten, Tonfassungen ohne/mit Zitaten (de/ru); 1080p oder 4K | ~69 s |
| [`grab-reminder-de/`](grab-reminder-de/) | Deutsche Fassung eines TikTok-Clips (Retusche: englischer Text → deutscher Text im Originalstil) | 24 s |

Bedienung steht jeweils in der README der Vorlage. Kurz:

```bash
cd barber-ad
npm install
npx remotion browser ensure
npm run render   # -> out/barber-ad.mp4
npm run check    # Abnahme-Check
```
