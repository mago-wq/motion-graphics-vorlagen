# CLAUDE.md – nokhchi-edit

Remotion-Projekt (TypeScript): schnelles History-Edit über tschetschenische Geschichte,
9:16, komponiert in 1080×1920 und mit `--scale=2` als **4K (2160×3840)** gerendert, 30 fps.
Bedienung steht in `README.md`.

## Regeln (Wünsche des Auftraggebers – nicht aufweichen)

- **Halal: keine Instrumente.** Der Ton ist das Nasheed „Джохар Дудаев“ *nur als Stimme*
  (Beat per KI entfernt). Bass und „Dum“-Schläge werden in `scripts/build_audio.py` **aus der
  Stimme selbst** geformt (verlangsamter Vokal, Tonhöhe fällt wie bei einem 808; Sub-Bass =
  Stimme eine Oktave tiefer, nur < 95 Hz). Dazu nur natürliche Geräusche (Donner, Stahl, Wind,
  Wolf, Pferde, Schritte, Feuer). Keine Synthesizer-Töne, keine Trommeln.
- **Keine gesprochenen Wörter** (Sprachsynthese wurde abgelehnt – klang wie „Naschid“).
- **Kein neues Nasheed generieren** – es wird ein bestehendes verwendet.
- **Einstieg kurz**: 1 s Wind/Wolf, dann gedämpfter Chant, nach 4 Schlägen offen.
- **Schläge schwer und tief, nicht hell/nervig**: keine Achtel-Klicks, keine hellen Transienten.
- **Echte Personen nur mit echten Bildern** (keine KI-Porträts). Fakten belegt halten; Bilder
  nicht mit fremden Ereignissen beschriften.

## Aufbau

- `scripts/build_audio.py` erzeugt `public/audio/mix.wav` **und** `src/timeline.json`
  (Abschnitte, Marken, Schläge, Treffer in Sekunden). Der Bildschnitt (`src/Edit.tsx`) hängt
  ausschließlich an dieser Zeitleiste – wer Ton verschiebt, verschiebt das Bild mit.
- Ablauf (`ARR` in build_audio.py): cold → chant → verse → build/stutter/tapestop/breath →
  drop1 (Baysangur) → deep → abrek → y1944 (0,8×, gedämpft) → rise → stutter2 → finale
  (Dudayev) → stutter3 → end.
- Bilder: `scripts/fetch_commons.py` → `upscale.py` (Real-ESRGAN, Original bleibt in
  `assets-src/hist-orig/`) → `make_cutouts.py` (BiRefNet) → `index_assets.py`
  (`src/assets.json`, Pfade + Seitenverhältnis). Fehlende Bilder rendern als dunkler Grund.
- Nachweise: `credits/commons.json` → `npm run credits` → `CREDITS.md` (für die Beschreibung).

## Stolperfallen (gelöst)

- **JSX nicht auf Modulebene erzeugen** (`ReferenceError: React is not defined` beim Laden):
  die Einstellungsliste entsteht in `buildShots()` erst beim Rendern.
- **Wikimedia drosselt geteilte IPs (429)**: Originale und krumme Breiten werden abgewiesen,
  Standard-Vorschaubreiten (3840/1920/1280/960/500/330/250/120) gehen. API-Endpunkte rotieren
  (commons/ru/en/de). Lauf ist fortsetzbar – einfach erneut starten.
- **Proxy-CA für Chrome** (Google Fonts beim Rendern): wie in barber-ad per `certutil` in
  `~/.pki/nssdb` importieren. Betrifft nur die Cloud-Umgebung.
- **Ton-Versatz**: `scripts/render.sh` kodiert AAC per ffmpeg selbst (wie barber-ad).
- `pkill -f fetch_commons.py` trifft auch die eigene Shell – Muster mit `^python3 …` verwenden.

## Prüfen

`npm run typecheck`, `npm run stills` (Kontaktbogen `out/stills/_sheet.png`),
`npm run render`, `npm run check -- out/<name>.mp4` (Standard: die 4K-Datei; Zitatfassungen
werden gegen `public/audio/mix_zitate_<sprache>.wav` geprüft).

## Zitatstimme nachjustieren (ohne neuen Bildrender)

Stimmlage je Sprache steht in `QUOTE_VOICE` (`scripts/build_audio.py`): Grundton-Median in Hz,
Formanten (Klangfarbe, < 1 = dunkler/voller) und Tonhöhenspanne (Satzmelodie) – über Praat
„Change gender“, also getrennt verstellbar statt nur heruntergestimmt (Rückmeldung des
Auftraggebers). Danach `python3 scripts/build_audio.py --nur-zitate` (lässt `mix.wav` und damit
das Bild unberührt) und `SKIP_RENDER=1 bash scripts/render.sh --hd` – dauert Minuten statt
eines Renders. Benötigt `pip install praat-parselmouth`.
