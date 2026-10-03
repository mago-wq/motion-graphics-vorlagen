# quran-geduld

58-Sekunden-Reel (9:16, 1080×1920, 30 fps) nach dem Vorbild eines TikTok-Clips
(@jannat.al.firdous): **Rezitation von al-Baqara 2:152–154 im Originalton, Koranvers
in Uthmani-Schrift mit deutscher Übersetzung** (statt Englisch), leuchtende
Piktogramm-Figuren, die sich bewegen, und ein neuer Hintergrund.

| Zeit | Vers | Bild |
|---|---|---|
| 0–2,4 s | Gedenkt Meiner, so gedenke Ich euer. | Kniende Figur zählt mit der Gebetskette, Gedankenblase mit dem Emblem |
| 2,6–6,5 s | … Und dankt Mir | Licht fällt vom Emblem auf die Figur, sie hebt die Hände |
| 7–11 s | Und dankt Mir und seid Mir nicht undankbar. | Figur wendet sich vom Licht ab und geht davon, rotes Kreuz streicht durch |
| 11,3–18,5 s | O ihr, die ihr glaubt, sucht Hilfe in der Geduld und im Gebet. | Kniendes Bittgebet, Sanduhr rieselt und dreht sich |
| 18,6–27 s | (Wiederholung) | Gebetsablauf vor einer Nische: Stehen, Verbeugen, Hinknien, Niederwerfen, Sitzen |
| 27,4–31 s | Gewiss, Allah ist mit den Geduldigen. | Warmes Licht und Strahlen vom Emblem hüllen die kniende Figur ein |
| 31,4–40 s | Und sagt nicht von denen, die auf Allahs Weg getötet werden, sie seien tot. | Grabstein steigt auf, beim Wort „tot“ rotes Kreuz |
| 40,4–46,8 s | (Wiederholung) | Risse im Stein, warmes Licht dringt heraus und steigt auf |
| 47,3–50,8 s | Nein, sie sind lebendig, | Figur auf Lichtpodest öffnet die Arme, Strahlen |
| 51,2–57,7 s | … doch ihr nehmt es nicht wahr. | Mensch mit Blindenstock tastet sich heran; die lebendige Figur steht kaum sichtbar vor ihm |

Gegenüber dem Vorbild:

- **Hochformat statt 16:9**, Übersetzung **nur Deutsch**.
- **Mehr Licht als im Vorbild:** schwarz-weiß mit Lichtsäule, schwenkenden Strahlen, Dunst,
  fallendem Staub in drei Tiefen, Lichtfleck am Boden und Aufblitzen bei jedem Szenenwechsel.
- **Figuren bewegen sich:** weiße Piktogramm-Silhouetten ohne Umrisse mit Gelenkwinkeln
  (Gebetsablauf, Gehen, Bittgebet, Gebetskette, Blindenstock), mit Bodenkontakt.
- Warmes Licht nur dort, wo Allahs Nähe bzw. das Leben gemeint ist; sonst kaltweiß.

## Bedienung

```bash
npm install
npx remotion browser ensure
# Ton: einmalig aus dem Referenz-TikTok holen (nicht eingecheckt, fremdes Material)
yt-dlp --impersonate chrome -o ref.mp4 https://vm.tiktok.com/ZGdCdeVew/
ffmpeg -i ref.mp4 -vn -c:a pcm_s16le -ar 44100 public/ton/rezitation.wav
npm run check      # arabischer Text == Quelltext (Codepunkt für Codepunkt)
npm run entwurf    # schneller Entwurf 540×960 -> out/quran-geduld-entwurf.mp4 (~4 min)
npm run render     # Endfassung 1080×1920 -> out/quran-geduld.mp4
npm run stills     # Kontrollbilder -> out/stills/
```

Verse, Übersetzung, Zeiten und Farben stehen ausschließlich in `src/config.ts`.
Schriften lokal in `public/fonts/`: *Amiri Quran* und *Cormorant Garamond* (beide SIL OFL).

## Ton

Die Rezitation stammt aus dem Referenz-TikTok; die Rechte liegen beim Urheber. Vor einer
Veröffentlichung klären bzw. auf TikTok den Sound über „Sound verwenden“ verknüpfen.
