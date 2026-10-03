# rahil-reel – „Ya Rahilan“ Lyric-Reel (+ SommerReel)

Zwei Kompositionen auf denselben Ton: `RahilReel` (Abschied, unten) und `SommerReel`
(„und schon sind die Sommertage Vergangenheit“, Abschnitt am Ende).

15,7-s-Hochkantvideo (9:16, 30 fps) zum Nasheed-Ausschnitt „يا راحلًا والله لن أنساك“.
Die Bilder erzählen den Text, ganz ohne Menschen: Regen an der Scheibe (Abwesenheit, kalt) →
aufsteigender Rauch → eine Kerzenflamme (Erinnerung, warm) → der Mond verschwindet in den
Wolken (Abschied). Darüber arabischer Text Wort für Wort mit deutscher Übersetzung.
Die Schrift zittert mit der Stimme, auf den Höhepunkten wackelt die Kamera und die Schrift
bekommt einen Rot/Cyan-Farbversatz. Die letzte Zeile löst sich wie Rauch nach oben auf.

## Text und Timing (`src/config.ts`, `LINES`)

| Zeit | Arabisch | Deutsch |
|---|---|---|
| 0,05 s | يا راحلًا والله لن أنساك | Du, der gegangen ist – bei Gott, ich vergesse dich nie. |
| 6,4 s | أنت الذي في قلبي سُكناك | Du bist es, dessen Zuhause mein Herz ist. |
| 12,3 s | يا راحلًا… | Du, der gegangen ist … |

Wortzeiten aus Whisper large-v3 (Wortzeitstempel) und Einsatzerkennung. Das Wort „قلبي“ ist
nicht ganz sicher (Whisper hört ohne Vorgabe „حرفي“) – vor dem Veröffentlichen anhören.

## Ton

Quelle: Bildschirmaufnahme eines TikToks durch den Nutzer. Die Aufnahme beginnt mit dem
Ende einer Wiederholung; der Ton wird deshalb ab 2,228 s bis 17,93 s geschnitten:

```bash
ffmpeg -ss 2.228 -to 17.93 -i aufnahme.mp4 -vn \
  -af "afade=t=in:d=0.02,afade=t=out:st=15.55:d=0.15" -ar 48000 -ac 2 public/ton/rahil.wav
```

`public/ton/` ist gitignored (fremdes Material). `src/envelope.ts` ist der Lautstärkeverlauf
des Gesangs (RMS je Frame, -24 dB = 0, -6 dB = 1) und steuert alle Effekte (`FX`). Bei anderem
Ton neu erzeugen (librosa, Python-Schnipsel siehe Git-Historie bzw. CLAUDE.md).
Geräusche (Mixkit, frei): Regen, Luftzug, Nachtwind, leise unter dem Gesang.

## Bilder

Mixkit Free License, 720p, in `public/clips/`: 2846 (Regen an der Scheibe), 50956 (Rauch),
48919 (Kerzenflamme), 45585 (Mond in Wolken). Schriften (SIL OFL): Scheherazade New Bold, Amiri.

## Bedienung

```bash
npm install
npx remotion browser ensure
npx remotion studio                 # Vorschau
npm run render -- --entwurf         # 540×960, schnell, für Feedback
npm run render                      # Endfassung 4K (1080 gerendert, Lanczos hochgerechnet)
npm run render -- --1080            # Endfassung 1080×1920 (für den Chat-Upload)
npm run render -- --echt-4k         # nativ 4K
KOMP=SommerReel npm run render -- --entwurf   # dasselbe für das SommerReel
```

## SommerReel

Gleicher Ton, andere Aussage: „يا راحلًا“ meint hier den Sommer. Deutsche Feststellung in
Cormorant Garamond (SIL OFL), erst am Ende die gesungene Zeile auf Arabisch.
Inhalte und Zeiten in `src/sommer/config.ts`.

| Zeit | Text | Bild (Mixkit) |
|---|---|---|
| 0 s | und schon | 38365 Rosen gehen auf |
| 1,6 s | sind die Sommertage | 15977 Schloss im Abendlicht, Spiegelung |
| 3,7 s | *Vergangenheit.* (Farbe läuft aus, Sepia) | 4119 Sonne versinkt im Meer |
| 6,35 s | die langen Abende, | 4353 Paris bei Nacht |
| 8,1 s | das warme Licht, | 17848 Sonnenuntergang über Lavendel |
| 10,05 s | *die Leichtigkeit.* | 34515 weiße Pfingstrose im Dunkeln |
| 12,2 s | يا راحلًا… / Du, der du gegangen bist … | 29420 Rose fällt ins Dunkel (Aufprall auf „راحلًا“) |

Look (`LOOK`): nostalgisch-düster – angehobene braune Schwärzen, Petrol in den Schatten,
Bernstein in den Lichtern, rote Film-Halation, Korn, Projektorflackern, Bildstand-Wackeln,
Staub und Kratzer, warme Lichtlecks an den Schnitten. Schrift-Effekte wie im RahilReel
(Zittern mit der Stimme, Ruck, Farbversatz). Geräusche: Grillen (Sommerabend), Wind, Luftzug.
