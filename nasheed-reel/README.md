# nasheed-reel – „Ya Hasafa“ Lyric-Reel (Prototyp)

31-s-Hochkantvideo in 4K (2160×3840, 30 fps) im Stil des Referenz-TikToks
[@7.x2_1 / 7690661372060781832](https://www.tiktok.com/@7.x2_1/video/7690661372060781832):
aufblühende Blumen und nächtliche, islamisch-romantische Traumbilder, darüber der
Nasheed-Text arabisch mit deutscher Übersetzung. Die Schrift im Retro-/VHS-Look
(Farbsaum rot/blau, weiches blaues Leuchten, Zeilenstreifen), die Bilder klar, aber
traumhaft abgestimmt (tiefes Schwarz, kräftige Farben, Leuchten, leichter Lila-Stich;
`GRADE` in `src/config.ts`).

**Es wird nur eine Datei gerendert: mit Ton.** Nasheed (`public/ton/nasheed.wav`,
nicht eingecheckt) plus passende Geräusche, gemischt auf -14 LUFS.

## Text und Timing

Zeitpunkte aus dem Referenzvideo abgelesen, stehen in `src/config.ts` (`LINES`):

| Zeit | Arabisch | Deutsch |
|---|---|---|
| 0,75 s | يا حسافة! | Ach, wie schade! |
| 2,5 s | وين قولك؟ | Wo ist dein Versprechen? |
| 4,35 s | أرفعك فوق النجوم | „Ich erhebe dich über die Sterne.“ |
| 8,2 s | راحت أحلامي بليلة | Meine Träume vergingen in einer Nacht. |
| 11,9 s | وأثقلت قلبي هموم | Und Sorgen beschwerten mein Herz. |
| 15,8 s – 30,6 s | dieselben fünf Zeilen noch einmal | |

Das Nasheed heißt „يا حسافة وين قولك“. Zeile 2 und 3 gehören zusammen: „Wo ist dein
Wort: ‚Ich erhebe dich über die Sterne‘?“ Deshalb steht Zeile 3 in Anführungszeichen.
Das Referenzvideo übersetzt „قولك“ falsch mit „your rise“ (der Ersteller schreibt selbst
„إن شاء الله الترجمه صح“, also „hoffentlich stimmt die Übersetzung“).

## Geräusche

Mixkit-Soundeffekte (freie Lizenz) in `public/sfx/`, auf -31 LUFS angeglichen
(= Pegel des Nasheeds), Einsätze in `src/config.ts` (`SFX`): Wind zu Blüten und
Wolken, Luftzug bei Szenenwechseln, Herzschlag zu „Sorgen beschwerten mein Herz“,
Grillen bei der Moschee, Gewitter mit Regen und einem Donnerschlag genau auf dem
stärksten Blitz (25,66 s). Bewusst keine Instrumente oder Klangspiele.

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

Schriften (SIL OFL, in `public/fonts/`): Scheherazade New Bold (Arabisch, mit
Kashida-Dehnung „ـ“ wie im Original), Amiri (Deutsch). Der Retro-Look wird in
`src/config.ts` unter `RETRO` eingestellt.

## Bedienung

```bash
npm install
npx remotion browser ensure
npx remotion studio      # Vorschau im Browser
npm run render           # -> out/nasheed-reel.mp4 (4K, mit Ton), ~10 min
npm run render -- --echt-4k   # nativ in 4K gerendert, ~30 min
```

Vorher den Nasheed-Ton als `public/ton/nasheed.wav` ablegen (z. B. aus dem
Referenz-TikTok mit `yt-dlp` laden und mit ffmpeg nach WAV wandeln).

Die Clips sind 720p (Mixkit ohne Login); das 4K-Rendering macht Schrift, Leuchten
und Lichtpunkte gestochen scharf, die Filmaufnahmen selbst bleiben hochskaliert.
