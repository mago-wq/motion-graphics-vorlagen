# CLAUDE.md – nasheed-reel

Remotion-Projekt (TypeScript), Lyric-Reel, Komposition 1080×1920, gerendert mit
`--scale=2` in 4K, 30 fps, 31 s, **mit Ton** (Nasheed + Geräusche). Bedienung in
`README.md`.

- **Immer nur eine Datei rendern: `npm run render` → `out/nasheed-reel.mp4` mit Ton.**
  Keine stumme Zweitversion (Wunsch des Nutzers).
- **Übersetzung auf Deutsch** (`de` in `LINES`), nicht Englisch.

## Regeln

- **Inhalte und Zeitpunkte nur in `src/config.ts`.** `LINES` (Text, Wortzeiten,
  Ausblendzeit) und `SCENES` (Clip, Start, Zeitraffer, Bildausschnitt, Glow).
- **Zeiten stammen aus dem Referenz-TikTok**, nicht geraten. Bei Änderungen am Ton die
  Zeiten neu ablesen: Referenz mit `yt-dlp --impersonate chrome` laden (braucht
  `curl_cffi`), dann Textbereich mit ffmpeg in 0,25-s-Schritten kacheln
  (`fps=4,crop=…,drawtext=text='%{pts\:hms}',tile=6x21`).
- **Nasheed-Ton nie einchecken** (`public/ton/`, gitignored, fremdes Material).
  Geräusche in `public/sfx/` sind Mixkit (frei) und eingecheckt, auf -31 LUFS
  angeglichen; Mischung wird in `scripts/render.sh` auf -14 LUFS gehoben.
- **Geräusche ohne Instrumente/Klangspiele** (Nasheeds sind oft bewusst ohne).
- **Arabisch:** Wörter in Lesereihenfolge im Array, Container `dir="rtl"`. Wort für
  Wort einblenden (rechts beginnend), Englisch läuft parallel von links ein. Jede
  Zeile bleibt einzeilig: `fitText` verkleinert auf `STYLE.textWidth`, gemessen erst
  nach dem FontGate in `NasheedReel.tsx`.
- **Kein Ruqaa.** Aref Ruqaa staffelt Buchstaben schräg („النجوم“) und macht aus den
  ق-Punkten einen Strich („فوق“ sah wie „فوه“ aus); der Nutzer las das als verrutschte,
  abgeschnittene Buchstaben. Jetzt Scheherazade New Bold.
- **Text geprüft:** Nasheed „يا حسافة وين قولك“. „قولك“ = dein Wort/Versprechen, nicht
  „your rise“ wie in der Referenz. Schreibung mit ة (حسافة, بليلة).
- **Kein CSS-`filter` auf fertigen Wort-Spans** (nur während der Einblendung): Filter
  können überhängende Glyphen am Elementrand beschneiden.
- **Retro-Look nur auf der Schrift** (`RETRO` in `config.ts`): harte rot/blaue
  `text-shadow`-Säume, weichgezeichnete Halo-Kopie, Zeilenstreifen per Maske.
  **Kein Retro-Filter auf den Bildern** – Kanalversatz + Posterize ließ sie unklar
  wirken (Nutzer-Feedback). Bilder nur mit leichtem Bloom (`SCENES.glow` ≈ 0,3).

## Bildquellen in diesem Container

- Pinterest (`i.pinimg.com`), Pixabay, Pexels-Webseite: vom Proxy/Cloudflare
  gesperrt. YouTube: Suche geht, Download scheitert am Bot-Check.
- **Mixkit geht** (`mixkit.co/free-stock-video/<begriff>/`, Clips unter
  `assets.mixkit.co/videos/<id>/<id>-720.mp4`, Vorschaubild `<id>-thumb-360-0.jpg`).
  1080p ist ohne Login gesperrt (403), daher 720p hochskaliert.
- Apify (Pexels-Scraper) war am Monatslimit.
