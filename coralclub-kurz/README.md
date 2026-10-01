# coralclub-kurz

Schnelles 12,5-s-Reel (1080×1920, 30 fps) für die Masse-Strategie: viele kurze Videos am
Tag statt eines aufwendigen. Kein Remotion, keine Sprecher-Kette: Pillow-Frames plus ffmpeg,
Rendern dauert ca. 15 s.

```bash
pip install pillow
python3 make.py                      # -> out/coralclub-kurz.mp4
STILLS=40,160,310 python3 make.py    # nur Kontrollbilder
```

Neue Variante: Texte im `CFG`-Block oben in `make.py` ändern (Hook zuerst, der entscheidet
über die Aufrufe), dann neu rendern. Ablauf: Hook → Produkt → Anwendung → 120 mg → Claim →
Clubpreis → CTA.

**Recht:** Der Claim ist der exakte Wortlaut aus VO (EU) 432/2012, nicht umformulieren und
keine eigenen Wirkversprechen in Hooks („macht wach“, „gegen Müdigkeit“). Pflichthinweis
und „Werbung“ stehen im Kleingedruckten; beim Posten zusätzlich den Markeninhalt-Schalter
setzen. Preise vor dem Posten auf de.coral.club prüfen (`Stand` in `CFG['pflicht']`).

Assets (Produktbilder, Geräusche, Archivo/OFL) stammen aus `coralclub-teleshop`.

## Serie: 10 Stile (`videos/`)

Gemeinsame Bausteine und Fakten in `engine.py` (Preise, Pflichttext, `SPONSOR`-Nummer –
einmal dort ändern, gilt für alle). Jedes Video: `python3 videos/v01_kassenbon.py` usw.,
Vorschau mit `STILLS=10,100,200 python3 videos/...` (-> `out/<name>_sheet.png`).

| Nr. | Stil | Hook |
|---|---|---|
| 01 | Kassenbon, Preisanker | 1,27 € am Tag. Wofür? |
| 02 | Messenger-POV | POV: Sie fragt, was in deiner Flasche ist |
| 03 | Warnung/Absperrband | STOPP. Kauf Oceanmin nicht zum Normalpreis. |
| 04 | Quiz-Gameshow | Wie viel Magnesium steckt in 1 Stick? |
| 05 | Kinetische Typo, 6-s-Loop | Meine Routine in 6 Sekunden |
| 06 | Notizen-App, Lifestyle | Meine Morgenroutine, die ich wirklich durchziehe |
| 07 | Luxus/Editorial | Ein Stick. Ein Glas. Das ist alles. |
| 08 | Terminal | Der Coral-Club-Spar-Hack |
| 09 | Splitscreen-Vergleich | Gleiches Produkt. 114 € Unterschied. |
| 10 | Unboxing, Pastell | Was steckt in dieser Packung? |
