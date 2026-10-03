# CLAUDE.md – rahil-reel

Remotion-Projekt, Lyric-Reel 1080×1920, 30 fps, 15,7 s, mit Ton. Bedienung in `README.md`.

- **Inhalte, Zeiten, Effektstärken nur in `src/config.ts`** (`LINES`, `SCENES`, `TINTS`, `FX`, `SFX`).
- **Ton nie einchecken** (`public/ton/rahil.wav`, gitignored). Der Rohton des Nutzers hatte am
  Anfang eine Wiederholung: Schnitt ab 2,228 s (siehe README).
- **Keine Widmungs-/Hook-Zeile** („für alle, die jemanden vermissen“) – Nutzer fand das kitschig.
- **Effekte sind an die Stimme gekoppelt** (`src/envelope.ts`, 1 Wert je Frame): Zittern der
  Schrift, Ruck bei Worteinsätzen, Farbversatz nur auf Höhepunkten, Kamerawackeln. Nutzer
  wünscht ausdrücklich Effekte wie Wackeln/Zittern der Schrift. Nach Tonänderung neu erzeugen:
  `librosa.feature.rms(hop_length=sr//30)`, dB auf -24…-6 → 0…1, 3er-Glättung.
- **Kerze: Clip 48919, nicht 6925** – 6925 ist bei 9:16 so stark angeschnitten, dass die Flamme
  das Bild sprengt.
- „قلبي“ in Zeile 2 ist unsicher (Whisper: „حرفي“), vor Veröffentlichung gegenhören lassen.
