# Herkunft und Lizenzen

Alles, was im Video landet oder es erzeugt, mit Quelle und Lizenz. Jede Quelle hier
erlaubt kommerzielle Nutzung. Neue Bausteine bitte hier eintragen.

## Im Video

| Was | Datei | Quelle | Lizenz |
|---|---|---|---|
| Schrift Montserrat (600, 900) | `public/fonts/` | The Montserrat Project Authors, über Fontsource | SIL Open Font License 1.1 (`public/fonts/OFL-Montserrat.txt`) |
| Hintergrund (Platzhalter): einzelner Baum unter Sturmwolken | `public/bilder/hintergrund.jpg` | Rafel Jesús, [WordPress Photo Directory](https://wordpress.org/photos/photo/600622a634/), auf 9:16 zugeschnitten | CC0 1.0 |
| Regen | `public/sfx/regen.flac` | Mixkit 1253 „Light rain loop“ | Mixkit Sound Effects Free License |
| Wind | `public/sfx/wind.flac` | Mixkit 1237 „Wind in the forest“ | Mixkit Sound Effects Free License |
| Vögel | `public/sfx/voegel.flac` | Mixkit 2467 „Morning birds singing“ | Mixkit Sound Effects Free License |
| Donnergrollen | `public/sfx/donner.flac` | Mixkit 1296 „Thunder deep rumble“ | Mixkit Sound Effects Free License |
| Flügelschlag | `public/sfx/fluegel.flac` | Mixkit 2697 „Fly wings movement“ | Mixkit Sound Effects Free License |
| Whoosh zum Blitz | `public/sfx/whoosh_blitz.flac` | Mixkit 2919 „Movie trailer whoosh hit“ | Mixkit Sound Effects Free License |
| Einschlag beim Blitz | `public/sfx/boom_blitz.flac` | Mixkit 1286 „Cinematic impact thunder“ | Mixkit Sound Effects Free License |
| Swoosh (Umriss-Wörter) | `public/sfx/swoosh.flac` | Mixkit 1468 „Cinematic transition wind swoosh“ | Mixkit Sound Effects Free License |
| Swoosh tief (Neon-Wörter) | `public/sfx/swoosh_tief.flac` | Mixkit 1471 „Cinematic wind swoosh“ | Mixkit Sound Effects Free License |
| Neon-Knistern, Glitch | `public/sfx/neon.flac`, `glitch.flac` | per Code erzeugt (`scripts/toene_vorbereiten.py`) | eigen |
| Tauben, Lichtlecks, Blitz, Lichtstrahlen, Regen, Filmkorn | `src/components/` | per Code gezeichnet | eigen |
| Stimme | `public/stimme/stimme.wav` | erzeugt mit Chatterbox Multilingual, Klangvorlage Thorsten-Voice (siehe unten) | Ergebnis eigener Erzeugung; enthält ein unhörbares Wasserzeichen (Perth), das sie als KI-Stimme kennzeichnet |
| Text | `src/config.ts` | Hadith Qudsi, überliefert bei at-Tirmidhi (Nr. 3540), auch an-Nawawi, 40 Hadithe, Nr. 42 | Übersetzung eigen |

Die Mixkit Sound Effects Free License erlaubt die Nutzung in privaten und
kommerziellen Projekten ohne Namensnennung, aber nicht die Weitergabe der Dateien
selbst. Deshalb liegen die Mixkit-Geräusche nicht im Repo: `npm run toene` lädt sie
von `assets.mixkit.co` und bereitet sie vor.

## Werkzeuge, die die Stimme erzeugen und prüfen

| Was | Wofür | Lizenz |
|---|---|---|
| [Thorsten-Voice](https://huggingface.co/datasets/Thorsten-Voice/TV-44kHz-Full) (Thorsten Müller), zwei neutrale Sätze als `stimme/referenz.flac` | Klangvorlage der kostenlosen Stimme | CC0 1.0, vom Sprecher für Sprachsynthese freigegeben |
| [Chatterbox Multilingual](https://huggingface.co/ResembleAI/chatterbox) (Resemble AI) | kostenlose Sprachsynthese | MIT |
| [wav2vec2-large-xlsr-53-german](https://huggingface.co/jonatasgrosman/wav2vec2-large-xlsr-53-german) mit torchaudio `forced_align` | Wort-Grenzen messen | Apache-2.0 (torchaudio: BSD) |
| Whisper large-v3-turbo über faster-whisper | Versuche prüfen, Verständlichkeit prüfen | MIT |
| Pedalboard (Spotify) | Tempo, Tonhöhe, EQ, Hall | GPL-3.0 (nur Werkzeug, das Ergebnis ist davon nicht betroffen) |
| ElevenLabs (optional) | Stimme aus der eigenen ElevenLabs-Bibliothek | nach eigenem ElevenLabs-Abo; Nutzungsrechte dort prüfen |
