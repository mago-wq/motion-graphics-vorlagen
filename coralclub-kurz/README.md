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
