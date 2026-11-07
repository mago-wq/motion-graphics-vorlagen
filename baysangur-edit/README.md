# baysangur-edit

History-Edit (9:16, 22 s) über **Baysangur von Benoy** im Stil eines TikTok-Philosophie-Edits:
alte Farbfilm-Optik im 4:3-Streifen mit schwarzen Balken, große schmale Schrift links und
rechts der Figur, Bildkästchen als Collage auf dem Schlag, Einzelwörter (КЪОНАХ, МАРШО).

Ton: das Nasheed „Джохар Дудаев“ **nur als Stimme** (wie `nokhchi-edit`), gedämpfter Einstieg
mit Wind und Wolf, nach 4 s offen; Wärme unten aus der Stimme selbst (eine Oktave tiefer,
nur < 95 Hz), dazu tiefer Donner. Keine Instrumente.

## Texte

Tschetschenische Sprichwörter, Original groß im Bild, deutsche Übersetzung klein darunter.
Quelle: rus4all.ru, „Чеченская народная мудрость“ (14.08.2024),
https://rus4all.ru/che/20240814/61848/Chechenskaya-narodnaya-mudrost.html

| Nr. | Tschetschenisch | Russisch (Quelle) | Deutsch (im Bild) |
|---|---|---|---|
| 206 | Стеган мах ша хадийнарг бу. | Цена мужчине та, которую он сам себе дает. | Der Wert eines Mannes ist der, den er sich selbst gibt. |
| 203 | Собар — толаман лард йу. | Терпение — основа победы. | Geduld ist das Fundament des Sieges. |

Einzelwörter: **КЪОНАХ** (würdiger, mutiger Mann; steht so auch in Sprichwort 217 derselben
Quelle: „ТIелхигаш кIелара а волу къонах“ – „И из-под лохмотьев может выйти храбрец“),
**МАРШО** (Freiheit).

## Ablauf

```bash
npm install
npx remotion browser ensure
bash ../nokhchi-edit/scripts/fetch_nasheed.sh   # Nasheed holen, Stimme trennen (nicht im Repo)
npm run figure                  # Baysangur ohne Papierrand freistellen → public/img/baysangur_fig.png
npm run audio                   # Tonspur → public/audio/mix.wav + src/timeline.json
bash scripts/render.sh --draft  # schneller Entwurf 540p – erst den zeigen
bash scripts/render.sh --hd     # Endfassung 1080p
npm run render                  # Endfassung 4K
```

Falls `audio-separator` fehlt: `pip install "audio-separator[cpu]" audioread librosa pyloudnorm`.

## Nachweise

Bilder von Wikimedia Commons, Liste in `CREDITS.md` (für die Videobeschreibung). Das Porträt ist
eine Zeichnung von Faruk Kutlu (2019, CC BY 3.0); ein Foto von Baysangur ist nicht überliefert.
