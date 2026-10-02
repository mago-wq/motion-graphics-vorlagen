# nokhchi-edit

Schnelles History-Edit (9:16, 4K) über die Geschichte der Tschetschenen – von Dzurdzuketien
über Simsir, Sheikh Mansur, Baysangur von Benoy und Zelimkhan bis 1944 und Dzhokhar Dudayev.
Ton: das Nasheed „Джохар Дудаев“ **nur als Stimme** (Beat per KI entfernt); Bass und Schläge
werden aus der Stimme selbst geformt, dazu nur natürliche Geräusche.

> Stand: in Arbeit – Tonspur steht, Bildschnitt folgt.

## Ablauf

```bash
npm install
bash scripts/fetch_nasheed.sh     # Nasheed holen, Stimme trennen, Takt messen (nicht im Repo)
python3 scripts/fetch_commons.py  # historische Bilder von Wikimedia Commons + credits/commons.json
npm run audio                     # Tonspur bauen -> public/audio/mix.wav, src/timeline.json
```

Bildnachweise (CC BY / CC BY-SA verlangen Namensnennung) stehen in `credits/commons.json`
und gehören in die Videobeschreibung.
