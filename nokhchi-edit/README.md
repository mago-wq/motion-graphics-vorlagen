# nokhchi-edit

Schnelles History-Edit (9:16, **4K 2160×3840**, ~58 s) über die Geschichte der Tschetschenen:
Dzurdzuketien → Simsir 1395 → Sheikh Mansur → Taimi Bibolt → Kaukasuskrieg → Baysangur von
Benoy → Abreken / Zelimkhan → 1944 → 1957 → Dzhokhar Dudayev → НОХЧИ → МАРШО.

Ton: das Nasheed „Джохар Дудаев“ **nur als Stimme** (Beat per KI entfernt), 1,18× wie der
TikTok-Sound. Bass und Schläge werden aus der Stimme selbst geformt; dazu nur natürliche
Geräusche. Regeln und Hintergründe: `CLAUDE.md`.

## Ablauf

```bash
npm install
npx remotion browser ensure
bash scripts/fetch_nasheed.sh   # Nasheed holen, Stimme trennen, Takt messen (nicht im Repo)
npm run images                  # Commons-Bilder → hochrechnen → freistellen → src/assets.json
npm run audio                   # Tonspur → public/audio/mix.wav + src/timeline.json
npm run stills                  # Kontrollbilder (halbe Auflösung) + Kontaktbogen
npm run render                  # out/nokhchi-edit-4k.mp4
npm run check                   # Format, Frames, Ton-Synchronität
npm run credits                 # CREDITS.md – Bildnachweise für die Videobeschreibung
```

## Nachweise

Alle Bilder stammen von Wikimedia Commons (gemeinfrei, CC BY oder CC BY-SA). CC-Lizenzen
verlangen Namensnennung: Text aus `CREDITS.md` in die Beschreibung des Videos übernehmen.
Das Nasheed ist urheberrechtlich geschützt und liegt nicht im Repo.
