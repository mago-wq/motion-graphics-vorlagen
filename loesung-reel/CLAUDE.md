# CLAUDE.md – loesung-reel

Kein Remotion-Projekt: Python (numpy, Pillow) plus ffmpeg, Bilder werden in `scripts/build.py`
erzeugt und per Pipe kodiert. 9:16, 30 fps, 27,1 s, mit Originalton. Bedienung in `README.md`.

- **Inhalte, Zeiten und Stilwerte nur in `config.json`** (`szenen`, `texte`, `schrift`, `look`).
  `build.py` enthält keine Texte. Pro Szene kann `look` die Werte des Teils überschreiben.
- **Schnittzeiten stammen aus dem Original**, nicht geraten. Der Textwechsel bei 9,9 s liegt kurz
  nach dem Einsatz des Gesangs (9,4 s), wie im Original.
- **Keine Menschen im Bild**, auch nicht klein im Hintergrund. Mixkit 34189 (Koran) zeigt immer
  wieder eine Hand, 34251 (Moschee innen) Menschen: nicht nehmen.
- **Ton nie einchecken:** `src.mp4` ist das Referenz-TikTok (gitignored). Das fertige Video enthält
  den fremden Ton und gehört nicht in dieses öffentliche Repo; Auslieferung im Chat.
- Clips mit schwarzem Grund (`einpassen`, z. B. die Pfingstrose) werden nicht auf 9:16 beschnitten,
  sondern mit `skala` vergrößert und schwarz aufgefüllt.
- Glitch nur in Teil 1 (`teil: "unruhe"`), Text bleibt immer sauber lesbar.
- Arbeitsweise: erst `--entwurf` schicken, Feedback einarbeiten, dann einmal voll rendern.
