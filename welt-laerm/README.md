# welt-laerm

22-Sekunden-Reminder-Video (9:16, 1080×1920, 30 fps) nach dem Vorbild eines
TikTok-Clips: **Originalton (russischer Sprecher + Musik), deutsche Untertitel**,
eigene leuchtende Piktogramm-Figuren und eigene Bewegungen.

| Zeit | Untertitel | Bild |
|---|---|---|
| 1,2–4,8 s | Bist du nicht müde vom Lärm dieser Welt? | Lärmwellen drängen heran, Figur hält sich die Ohren zu und zittert |
| 5,1–7,5 s | Hast du sie nicht satt? | Figur sitzt am Tisch, Kopf in der Hand, Handy spuckt Benachrichtigungen, Zähler läuft bis 99+ |
| 7,6–12,6 s | Siehst du nicht, wie viel Müdigkeit und Unruhe in ihr steckt? | Brustbild mit schweren Lidern, nickt weg und schreckt hoch; nervöses Gedankenknäuel über dem Kopf |
| 12,8–16,8 s | Rennst du noch immer atemlos ihren Krümeln hinterher? | Figur jagt eine Münze, die an einer Angel an ihrem *eigenen* Rücken hängt; nur Krümel fallen ab |
| 17,0–21,0 s | Reicht dir das Paradies etwa nicht? | Erstmals warmes Licht: Tor öffnet sich, Strahlen, aufsteigende Funken, Figur als Silhouette streckt die Hand aus |
| 21–22,6 s | – | Bild verwischt seitlich, ein Lichtpunkt bleibt und verglimmt |

Gegenüber dem Vorbild verbessert:

- **Hochformat statt 16:9** – füllt den TikTok/Reels-Bildschirm, kein schwarzer Rand.
- **Untertitel Wort für Wort im Sprechrhythmus** (aus Whisper-Wortzeiten des Originaltons), Schlüsselwörter glühen nach.
- **„его“ aufgelöst:** Im Russischen steht nur „sein Lärm“; gemeint ist die Welt (Dunya). Deutsch daher „vom Lärm *dieser Welt*“, danach „sie/ihr“.
- **Erzählendes Licht:** vier Szenen kaltweiß, das Paradies als einzige warm.
- Kein versehentlicher „WINDOWS“-Schriftzug (Überbleibsel im Original).

## Bedienung

```bash
npm install
npx remotion browser ensure
npm run render     # -> out/welt-laerm.mp4
npm run stills     # Kontrollbilder -> out/stills/
npx remotion studio  # Vorschau im Browser
```

Texte, Sprecherzeiten und Farben stehen ausschließlich in `src/config.ts`.
Die Schrift *Unbounded* (SIL Open Font License) liegt lokal in `public/fonts/`.

## Ton

`public/originalton.m4a` ist der Originalton des TikTok-Clips
(@zakariya1_2, „оригинальный звук“). Die Rechte daran liegen beim Urheber –
vor einer Veröffentlichung klären bzw. auf TikTok den Sound über die App-Funktion
„Sound verwenden“ verknüpfen.
