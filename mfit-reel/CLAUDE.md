# CLAUDE.md – mfit-reel

Remotion-Projekt (TypeScript) für ein 35,2-s-Instagram-Reel für MFit Smart, 1080×1920,
30 fps, 1056 Frames. Bedienung in `README.md`, Idee und Psychologie in `KONZEPT.md`.
Bewusst eigenständig gebaut, nicht aus barber-ad abgeleitet.

## Regeln

- **Inhalte nur in `src/config.ts`.** Keine Texte, Preise oder Farben in Szenen.
  Angaben stammen von mfit-smart.de; keine eigenen Zahlen oder Claims erfinden.
- **Zeitpunkte nur in `src/timeline.json`, in Beats** (150 BPM → 12 Frames/Beat,
  3 Frames/Sechzehntel). `timing.ts` rechnet Frames daraus, `scripts/make_soundtrack.py`
  liest dieselbe Datei. Wer ein Ereignis verschiebt, verschiebt Bild und Ton gemeinsam.
  `render.sh` erzeugt die Tonspur neu, wenn Zeitplan oder Generator neuer sind.
- **Schlüsselposen landen auf dem Beat.** Eintritte beginnen vor dem Beat und stehen auf
  ihm (Drop: der erste Inhalt ist auf Frame 192 komplett da). Haken fallen `DROP_PEAK`
  Frames früher los und rasten auf ihrem Beat ein – dort liegt ihr Ping.
- **Wechsel ohne Überlagerung:** Gleiche Position → als Block rollen (`RollBlock`,
  alt raus / neu rein im selben Fenster, wie ein Zählwerk). Andere Position → erst
  raus, dann rein. Nie zwei Texte gleichzeitig im selben Bereich.
- **Sicherheitszone für Reels-Anzeigen:** wichtiger Text nur in x 65–1015, y 270–1250
  (`SAFE` in `video.ts`, Meta: oben 14 %, unten 35 %, seitlich 6 %). Prüfen mit
  `npm run stills -- --safe`. Schnüre und Haken dürfen dekorativ darüber hinaus.
- **Fußnote auf demselben Bild wie ihr Sternchen** (24/7, Wellpass/Hansefit, Recap).
- **Letzte 0,8 s Standbild** (`STILL_FROM`), Ton ab 0,3 s vor Schluss still.
- Bewegung nur mit Easing/Federn, nichts linear (Ausnahme: Glanz- und Scan-Durchläufe).

## Prüfen ohne Bildschirm

`npm run typecheck`, `npm run stills` (Bilder mit dem Read-Tool ansehen), `npm run render`,
`npm run check`. Für Bewegung: Frames aus der MP4 ziehen und Filmstreifen bauen. Remotions
eingebautes ffmpeg ist abgespeckt (kein `rawvideo`, kein `select`, kein `pcm_f32le`);
für Analysen `pip install imageio-ffmpeg` und dessen ffmpeg nehmen, Standbilder als PNG.
Musik lässt sich nicht anhören: Spektrogramm, Bandbalance und Pegel messen.

## Stolperfallen (gelöst, nicht wieder einbauen)

- **Leeres Bild auf dem Drop:** Eintritte, die erst auf dem Beat beginnen, zeigen auf dem
  Beat noch nichts. Deshalb `rollIn(frame, beat)` = Fenster *vor* dem Beat.
- **Zeilen überlagerten sich beim Wechsel:** Masken benachbarter Zeilen (mit Rand für
  Umlaute) überlappen. Lösung: die ganze Überschrift als *ein* Block rollen. Einzeln rollt
  nur Zeile 2 bei Getränke → Parkplätze („KOSTENLOSE“ bleibt stehen), mit schmalem Rand.
- **Zufallspreise lesbar:** Die Walze zeigte beim Rollen lesbare Preise („97,04“).
  Senkrechte Bewegungsunschärfe (`vblur-N`-Filter) nach Walzengeschwindigkeit.
- **AAC übersteuerte (+2,6 dBFS) trotz −2,5 dBTP in der Quelle:** Der native AAC-Encoder
  ersetzt mit PNS rauschartige Anteile (Claps, Hats) durch synthetisches Rauschen.
  `-aac_pns 0` in `render.sh`. Dazu Pre-Echo: Klicks ohne Anstieg auf demselben Sample
  wie ein Clap → Anstiege ≥ 0,8 ms, Uhr-Klick auf dem Clap entfällt.
- **Limiter hielt nur Abtastwerte:** Spitzen zwischen den Samples lagen 1,8 dB höher.
  Limiter erkennt True Peak (4-fach überabgetastet).
- **Tiefbass fraß die Lautheit:** 808-Grundton < 60 Hz dominierte; auf Handys unhörbar.
  Gesättigte Mittenlage für den 808, weniger Sub, Hochpass 32 Hz im Master.
- **Ton-Versatz im MP4:** Remotion kodiert AAC als ADTS und verliert die Edit-List (46 ms).
  Deshalb rendert Remotion nur das Bild (`--muted`), ffmpeg kodiert die WAV direkt ins MP4.
- **Farbraum:** `Config.setColorSpace('bt709')` → yuv420p TV-Range statt yuvj420p.
- **Schriften messen:** `FontGate` hält das Rendern an, bis Rubik/Rubik One geladen sind;
  sonst misst `fitText` mit der Ersatzschrift.
- **Cloud-Container:** `npx remotion browser ensure` klappte hier ohne Umwege. Schriften
  lokal, daher keine TLS-Probleme mit Google Fonts beim Rendern.

## Entscheidungen (Design-Council, projektgebunden)

- **Schrift:** Rubik One + Rubik statt der Schriftliste des Stil-Skills (`gpt-tasteskill`):
  es sind die Schriften der MFit-Website – Markenmaterial geht vor (Stufe 0/4).
- **Metallic-Gold als Textverlauf** ist hier kein AI-Tell, sondern der Verlauf aus dem CSS
  von mfit-smart.de. Nur für Logo, Preis und goldene Schlüsselwörter, nicht für Fließtext.
- **Regler:** DESIGN_VARIANCE hoch (Werbung, Fitness), MOTION_INTENSITY hoch (Reel,
  beat-synchron), VISUAL_DENSITY niedrig (eine Aussage pro Bild). Stil-Skill: `gpt-tasteskill`
  (AIDA, breite Typografie, max. 2–3 Zeilen, keine Meta-Labels).
