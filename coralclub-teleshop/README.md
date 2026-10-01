# Coral-Club-Teleshop: 40-Sekunden-Affiliate-Video mit Sprecher (Remotion)

TikTok/Reels-Video für **Oceanmin** von Coral Club im Stil der Teleshopping-Werbung um 2000:
begeisterter Werbesprecher, „Kennen Sie das?“ in Schwarzweiß, Störer, Chrom-Schrift,
„Aber das ist noch nicht alles!“ und ein Bestell-Banner mit „Link in Bio“ statt Hotline.
9:16, 1080×1920, 30 fps, 40,4 s. Das fertige Video liegt unter `out/coralclub-teleshop.mp4`.

## Warum so (gegenüber dem ersten Coral-Club-Video)

Das erste Video (`coralclub-ad`, 15 s, drei Produkte, nur Geräusche) kam auf 212 Aufrufe.
Was hier anders ist:

- **Eine Stimme statt Stille.** Ein begeisterter Sprecher trägt das ganze Video, vom ersten
  Bild an („Meine Damen und Herren – aufgepasst!“). Ohne gesprochenen Inhalt gab es nach dem
  ersten Bild wenig Grund zu bleiben; der Sprecher zieht durch eine Geschichte.
- **Eine Geschichte statt eines Katalogs.** Ein Produkt, ein Problem, eine Lösung, ein Deal.
  Das Teleshopping-Muster (Problem in Schwarzweiß → Produkt in Farbe → „Aber das ist noch nicht
  alles!“ → Preis → Bestellen) kennt jeder, und das Zitat ist selbst unterhaltsam:
  Pfannkuchen-Gag, vier Kaffeetassen, traurige Posaune.
- **Ein echter, belegbarer Nutzen.** Magnesium mit dem zugelassenen Claim zu Müdigkeit, dazu
  die konkrete Menge (120 mg pro Stick), statt bloßer Rabatt-Ansage.
- **Der Deal als Höhepunkt, nicht als Einstieg.** 23,75 € → 19,00 € mit Clubpreis, dann:
  20 % auf alle Produkte. Der Affiliate-Link ist genau diese Registrierung.

## Ablauf

| Zeit | Sprecher | Bild | Ton |
|---|---|---|---|
| 0,0–2,1 s | „Meine Damen und Herren – aufgepasst!“ | Röhren-TV geht an, Strahlenkranz, Chrom-Schrift, „AUFGEPASST!“ im gelben Störer | Bläser-Hit, Groove, Einschläge, Glitzer |
| 2,1–10,2 s | „Kennen Sie das? Drei Uhr nachmittags – und Sie sind platt wie ein Pfannkuchen? Der vierte Kaffee – und immer noch nix?“ | Schwarzweiß mit Korn: Uhr springt auf 15:00, „PLATT“ wird zum Pfannkuchen gequetscht, vier Tassen, „NIX?“ sackt ab | Senderrauschen, Bandstopp, Uhr tickt, trauriges Posaunen-Wah-wah |
| 10,2–13,1 s | „Darf ich vorstellen: Oceanmin von Coral Club!“ | Bühne mit Scheinwerfern, dann Farbe: Packung knallt herein, Bestseller-Plakette, Glanzlicht | Trommelwirbel, Becken + Fanfare |
| 13,1–16,9 s | „Einfach einen Stick in Wasser auflösen und über den Tag verteilt trinken!“ | Echtes Shopfoto: Pulver rieselt ins Wasserglas, Checkliste | Riss, Plopp ins Wasser |
| 16,9–19,9 s | „Mit satten hundertzwanzig Milligramm Magnesium pro Stick!“ | Zähler 0 → 120 mg, Kachel „Mg“, „PRO STICK“, 32 % NRV | Ticks, Stempel |
| 19,9–23,3 s | „Und Magnesium trägt zur Verringerung von Müdigkeit und Ermüdung bei!“ | Claim im Wortlaut, Wort für Wort hell, Pflichthinweise | nur Groove |
| 23,3–25,8 s | „Aber das ist noch nicht alles!“ | Speed-Lines, drei Zeilen knallen ein, „ALLES!“ in Gold | Plattenkratzer, Musik stoppt, Riser, großer Einschlag |
| 25,8–30,8 s | „Mit dem Clubpreis zahlen Sie nicht 23,75 € – sondern nur 19 €!“ | Gelber Strahlenkranz, Normalpreis wird mit dem Packungsstreifen durchgestrichen, „NUR 19,00 €“ im roten Stern | Strich, Gong, Kasse |
| 30,8–34,2 s | „Zwanzig Prozent weniger – und das auf alle Coral-Club-Produkte!“ | −20 % zählt hoch, drei Packungen aus dem Sortiment | Ticks, Klacks |
| 34,2–40,4 s | „Also: Link in der Bio antippen, registrieren und sparen! Greifen Sie zu!“ | Bestell-Banner „LINK IN BIO ↑“, drei Schritte haken sich ab, Schluss-Fanfare; ab 39,9 s Standbild und Stille | Pops, Schluss-Fanfare |

„Werbung“ steht das ganze Video über oben links (im Stil eines Senderlogos), Affiliate- und
Preishinweis im Abschluss.

## Vor dem Posten

1. **Preise auf de.coral.club prüfen** (Oceanmin: Normalpreis/„Dein Preis“ und Clubpreis) und
   in `src/config.ts` **und** `src/sprechertext.json` anpassen, `preisStand` setzen. Ändert sich
   ein gesprochener Preis, muss die Stimme neu erzeugt werden (siehe unten).
2. Link in der Bio auf den eigenen Empfehlungslink setzen.
3. Beschreibungstext auf TikTok/Instagram mit „Werbung“/„Anzeige“ und dem Hinweis auf den
   Affiliate-Link; bei TikTok zusätzlich den Schalter für Markeninhalte setzen.

Keine weiteren Gesundheitsaussagen ergänzen (auch nicht in der Caption): nur der zugelassene
Claim im Wortlaut ist erlaubt. Begründung in `CLAUDE.md`.

## Befehle

```bash
npm install
npx remotion browser ensure   # einmalig
npm run render   # -> out/coralclub-teleshop.mp4 (+ Ton als WAV), gemastert auf -14 LUFS
npm run check    # Abnahme-Check (Format, Länge, Pegel, Lautheit, Sprache über Musik, Stille, Sync)
npm run stills -- --safe      # Kontrollbilder mit Sicherheitszone
FRAMES="$(python3 scripts/kontrollframes.py)" npm run stills && python3 scripts/contact_sheet.py
npm run musik    # Musikbett neu (nach neuer Sprecherspur)
npm run sfx      # Toneffekte neu
npm run typecheck
```

## Stimme neu erzeugen

Die Stimme entsteht lokal mit **Qwen3-TTS** (Apache-2.0, kommerziell nutzbar, kein
API-Schlüssel, läuft auf CPU). Einmalig einrichten (ca. 10 GB Modelle):

```bash
uv venv ~/tts/.venv && source ~/tts/.venv/bin/activate
uv pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
uv pip install qwen-tts faster-whisper librosa pyloudnorm praat-parselmouth num2words "huggingface-hub<1.0"
python -c "from huggingface_hub import snapshot_download as d; [d(m, local_dir='$HOME/tts/models/'+m.split('/')[1]) for m in ['Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign','Qwen/Qwen3-TTS-12Hz-1.7B-Base','Qwen/Qwen3-TTS-Tokenizer-12Hz']]"
```

Dann (aus `coralclub-teleshop/`, `ffmpeg` muss installiert sein):

```bash
python scripts/generate_voice.py --models ~/tts/models          # alle Zeilen, je 3 Takes Klon + 3 Design (~60 min)
python scripts/generate_voice.py --models ~/tts/models --nur cta  # nur eine Zeile neu
python scripts/generate_voice.py --models ~/tts/models --nur-zusammensetzen  # nur neu bewerten/zusammensetzen
npm run musik && npm run render && npm run check
```

Die Pipeline wählt pro Zeile den besten Take nach Messwerten (Text korrekt, gleicher Sprecher,
natürlich, lebendig, zügig); Einzelwerte stehen im Log und in `out/takes/bewertung.json`.
Einen bestimmten Take erzwingen: `"take": "cta__klon1.wav"` in der Zeile von
`src/sprechertext.json`. Sprechtempo: `sprecher.tempo` (Standard 1,1), pro Zeile `tempo`.

## Anpassen

- **Bildtexte, Preise, Bilder:** `src/config.ts`
- **Gesprochener Text, Regie, Pausen, Tempo:** `src/sprechertext.json`
- **Produktfotos:** URL in `scripts/prepare_products.py`, dann `python3 scripts/prepare_products.py`
  (braucht numpy, scipy, Pillow). Nur Produktfotos, keine Personenbilder.

Schrift: Archivo (SIL OFL, `public/fonts/`), beim Rendern wird nichts aus dem Netz geladen.
