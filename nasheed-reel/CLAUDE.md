# CLAUDE.md – nasheed-reel

Remotion-Projekt (TypeScript), Lyric-Reel 1080×1920, 30 fps, 31 s, **ohne Ton** (die
Musik kommt in TikTok dazu). Bedienung in `README.md`.

## Regeln

- **Inhalte und Zeitpunkte nur in `src/config.ts`.** `LINES` (Text, Wortzeiten,
  Ausblendzeit) und `SCENES` (Clip, Start, Zeitraffer, Bildausschnitt, Glow).
- **Zeiten stammen aus dem Referenz-TikTok**, nicht geraten. Bei Änderungen am Ton die
  Zeiten neu ablesen: Referenz mit `yt-dlp --impersonate chrome` laden (braucht
  `curl_cffi`), dann Textbereich mit ffmpeg in 0,25-s-Schritten kacheln
  (`fps=4,crop=…,drawtext=text='%{pts\:hms}',tile=6x21`).
- **Ton nie einchecken.** Der Referenzton ist fremdes Material und dient nur der
  Vorschau (`scripts/preview-with-audio.sh`, Ausgabe in `out/`, gitignored).
- **Arabisch:** Wörter in Lesereihenfolge im Array, Container `dir="rtl"`. Wort für
  Wort einblenden (rechts beginnend), Englisch läuft parallel von links ein.

## Bildquellen in diesem Container

- Pinterest (`i.pinimg.com`), Pixabay, Pexels-Webseite: vom Proxy/Cloudflare
  gesperrt. YouTube: Suche geht, Download scheitert am Bot-Check.
- **Mixkit geht** (`mixkit.co/free-stock-video/<begriff>/`, Clips unter
  `assets.mixkit.co/videos/<id>/<id>-720.mp4`, Vorschaubild `<id>-thumb-360-0.jpg`).
  1080p ist ohne Login gesperrt (403), daher 720p hochskaliert.
- Apify (Pexels-Scraper) war am Monatslimit.
