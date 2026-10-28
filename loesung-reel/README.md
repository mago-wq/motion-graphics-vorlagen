# loesung-reel

Deutsche Fassung des TikToks [@nurolikaya / 7698326206197861654](https://www.tiktok.com/@nurolikaya/video/7698326206197861654)
(27 s, russische Einblendungen, Talbiya-Gesang als Originalton): Erst zählt der Text auf, was belastet,
dann kommt „Lösung:“ und das Bild wird warm. 9:16 statt 16:9 wie im Original, 1080×1920, 30 fps.

Anders als im Original sind **keine Menschen im Bild** (Vorgabe des Auftraggebers). Statt der
Betenden zeigen die Bilder Orte und Dinge des Gebets.

## Text und Bilder

Schnittzeiten aus dem Original (ffmpeg-Szenenerkennung), alles in `config.json`.

| Zeit | Text | Bild (Mixkit) |
|---|---|---|
| 0–2,2 s | „ständige Unruhe“ / „Stress“ / „Müdigkeit“ / „keine Lust auf irgendwas“ | 9704 Gewitterwolken, starker Glitch |
| 2,2–4,7 s | | 28901 Sanduhr |
| 4,7–7,2 s | | 17776 Kerze im Dunkeln, flackert |
| 7,2–9,9 s | | 34515 Pfingstrose, rückwärts: sie schließt sich |
| 9,9–13,2 s | Lösung: | 9736 Moschee über den Wolken bei Sonnenaufgang, Lichtblitz beim Wechsel |
| 13,2–15 s | | 4312 Moschee bei Nacht |
| 15–17,8 s | | 39184 leerer Gebetsraum mit Kronleuchter |
| 17,8–21,3 s | | 11924 Koran auf dem Lesepult mit Gebetskette |
| 21,3–25,1 s | | 39179 Gebetsteppich einer großen Moschee, leer |
| 25,1–27,1 s | | 35194 aufgeschlagener Koran im Licht |

Übersetzung aus dem Russischen: «постоянная тревога» = ständige Unruhe, «стресс» = Stress,
«усталость» = Müdigkeit, «нежелание что-либо делать» = keine Lust auf irgendwas, «Решение:» = Lösung:.

Look: Teil 1 schwarzweiß mit Petrol-Stich, Korn, analoger Glitch (stark in der ersten Szene,
kurz an jedem Schnitt). Teil 2 warm, mit leichtem Leuchten. Schrift wie im Original: schlicht,
weiß, dünne schwarze Kontur.

## Ton

Originalton des TikToks (@nurolikaya, „оригинальный звук“): ab 9,4 s gesungen
„لبيك اللهم لبيك، لبيك لا شريك لك لبيك، إن الحمد والنعمة لك والملك، لا شريك لك لبيك“ (Talbiya).
Er wird beim Rendern direkt aus `src.mp4` genommen und nicht eingecheckt. Die Rechte liegen beim
Urheber; auf TikTok den Sound besser über „Sound verwenden“ verknüpfen.

## Bauen

```bash
pip install "yt-dlp[default,curl-cffi]" numpy pillow
python3 -m yt_dlp --impersonate chrome -o src.mp4 "https://www.tiktok.com/@nurolikaya/video/7698326206197861654"
python3 scripts/build.py --entwurf          # 540×960, ~1 min -> out/loesung-reel-entwurf.mp4
python3 scripts/build.py                    # 1080×1920 -> out/loesung-reel.mp4
python3 scripts/build.py --bilder 1,8.5,12  # nur Standbilder -> out/bilder/
python3 scripts/clips.py                    # Clip-Ausschnitte neu schneiden (nach Änderung an clip/ab/tempo/Zeiten)
```

Clips: [Mixkit Free License](https://mixkit.co/license/#videoFree), 720p, in `clips/` nur die
benutzten Ausschnitte. Schrift: Arimo Medium (SIL OFL, `fonts/OFL.txt`).
