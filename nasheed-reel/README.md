# nasheed-reel – „Ya Hasafa“ Lyric-Reel (Prototyp)

31-s-Hochkantvideo (1080×1920, 30 fps) im Stil des Referenz-TikToks
[@7.x2_1 / 7690661372060781832](https://www.tiktok.com/@7.x2_1/video/7690661372060781832):
aufblühende Blumen und nächtliche, islamisch-romantische Traumbilder, darüber der
Nasheed-Text arabisch (Ruqaa-Kalligrafie) mit englischer Übersetzung, leuchtend.

**Das Video hat keinen Ton.** Die Musik („Ya Hasafa“) wird in TikTok hinzugefügt.

## Text und Timing

Zeitpunkte aus dem Referenzvideo abgelesen, stehen in `src/config.ts` (`LINES`):

| Zeit | Arabisch | Englisch |
|---|---|---|
| 0,75 s | يا حسافه! | Alas, what a pity. |
| 2,5 s | وين قومتك؟ | Where is your rise? |
| 4,35 s | أرفعك فوق النجوم | I'll raise you above the stars. |
| 8,2 s | راحت أحلامي بليله | My dreams vanished in a single night. |
| 11,9 s | وأثقلت قلبي هموم | And worries weighed down my heart. |
| 15,8 s – 30,6 s | dieselben fünf Zeilen noch einmal | |

**Synchron bleibt es nur mit demselben Tonausschnitt.** Am sichersten in TikTok im
Referenzvideo auf den Sound tippen („Original-Sound“) und „Diesen Sound verwenden“,
dann beginnt der Gesang an derselben Stelle. Bei einer anderen Version von
„Ya Hasafa“ alle Zeiten in `LINES` und `SCENES` um den Versatz verschieben.

## Bilder

Clips von [Mixkit](https://mixkit.co/license/#videoFree) (Mixkit Free License,
kommerziell nutzbar, ohne Namensnennung), liegen in `public/clips/`:

| Szene | Clip | Inhalt |
|---|---|---|
| 0–4,25 s | 17817 | Orchideenknospen gehen auf |
| 4,25–8 s | 46101 | Milchstraße mit Sternschnuppe |
| 8–11,6 s | 48016 | Mondsichel in Wolken |
| 11,6–15,7 s | 38387 | Magenta-Orchidee |
| 15,7–19,1 s | 4312 | Moschee bei Nacht |
| 19,1–22,8 s | 30316 | Flug durch Wolken zum Vollmond |
| 22,8–26,6 s | 25081 | Blitze am Nachthimmel |
| 26,6–31 s | 17835 | Helle Orchidee öffnet sich |

Schriften (SIL OFL, in `public/fonts/`): Aref Ruqaa (Arabisch), Amiri (Englisch).

## Bedienung

```bash
npm install
npx remotion browser ensure
npx remotion studio                 # Vorschau im Browser
npx remotion render NasheedReel out/nasheed-reel-stumm.mp4 --muted
```

Vorschau mit Ton zum Prüfen der Synchronität (Ton aus dem Referenzvideo, nur lokal,
nicht hochladen): `bash scripts/preview-with-audio.sh <ton.wav>`.
