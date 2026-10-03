# CLAUDE.md – grab-reminder-de

Kein Remotion-Projekt, sondern eine **Retusche eines fremden Videos**: Der TikTok-Clip
„one squeeze from the grave…“ (24 s, 1080×1920, 60 fps, POV aus dem Grab) bekommt statt
der zehn englischen Einblendungen deutsche, im exakt gleichen Schriftstil. Bild, Schnitt,
Übergänge und Ton (arabischer Vortrag, kein Englisch) bleiben unverändert.
Bedienung steht in `README.md`.

## Regeln

- **Inhalte nur in `config.json`:** Texte, Frame-Bereiche je Satz (`segments`) und alle
  Stilwerte (`style`). `scripts/build.py` enthält keine Texte.
- **Anführungszeichen deutsch:** „…“ (U+201E / U+201C), Versalien, Punkte wie im Original
  („..“ statt „…“).
- **Eine Zeile pro Satz**, wie im Original. Zu lange Sätze skaliert das Skript automatisch
  auf `max_width` (985 px) herunter, nicht umbrechen.
- **Der Nutzer will den Stil 1:1.** Abweichungen bei der Schrift fallen ihm sofort auf.
  Vor jedem vollen Render erst Einzel-Frames prüfen (Debug-Modus) und Ausschnitte
  4-fach vergrößert neben das Original legen.

## Der Schriftstil (aus dem Original vermessen)

- **Impact**, horizontal gestaucht (`squeeze` 0.53), Laufweite +3 px (`tracking`),
  Versalhöhe ~117 px, Versalmitte bei y = 969,5 (`cap_center_y`). Ausgerichtet wird an
  der Versalhöhe, nicht an der Box, sonst zieht das tiefe „ den Text nach oben.
- Füllung fast weiß (244/245/248), **leicht durchscheinend** (`fill_alpha` 0.97):
  im Original sieht man Hintergrund durch die Buchstaben.
- Kontur navy (11/16/44), 4 px; dazu ein weicher navy Glow (sigma 9).
- **Die Kanten sind gewollt kaputt**, das ist kein Kompressionsfehler: kleine Kerben und
  Ausbrüche, meist quer in senkrechte Kanten, die Kontur läuft hinein. Erzeugt in
  `distress()` mit 3-fachem Supersampling. `notch_density` 0.008 passt; 0.035 war viel
  zu stark und sah aus wie angefressen.
- Helligkeit pro Frame wird vom Originaltext übernommen (Fade-in/-out, dunkle
  Zwischenphase ~0,4 s am Ende jedes Satzes, Text dort auf ~77 %).

## Wie das Entfernen funktioniert

Der Film ist schwarzweiß, die Textkontur und der Glow sind blau → Maske = Pixel mit
B − R > 10, pro Satz über alle Frames vereinigt, Löcher gefüllt (Buchstabeninneres),
um 8 px erweitert. Dann `cv2.inpaint` (Telea) plus etwas Filmkorn. Funktioniert, weil
der Text meist über dem gleichmäßig hellen Himmel liegt.

## Stolperfallen

- **TikTok-Download** klappt nur mit `yt-dlp --impersonate chrome` (Paket
  `yt-dlp[default,curl-cffi]`), sonst „Unexpected response from webpage request“.
- **Impact** ist nicht auf Google Fonts. Quelle: `impact32.exe` aus den Microsoft Core
  Fonts (sourceforge corefonts), mit `cabextract` entpacken. github.com/google/fonts
  liefert hier 403; Google-Fonts-Ersatz (Anton, Oswald, Bebas, League Gothic) passt
  sichtbar nicht (spitzes „A“, andere Anführungszeichen).
- **Voller Render dauert ~17 min** (Inpainting je Frame, 1437 Frames, x264 `slow`,
  CRF 14). Im Hintergrund starten, nicht im Vordergrund-Timeout.
- Quellvideo, Schrift und `out/` sind per `.gitignore` nicht eingecheckt.
- Im Bild bleiben das Wasserzeichen „crushis“ (Ersteller) und das Senderlogo oben
  links. Entfernen nur auf ausdrücklichen Wunsch.
