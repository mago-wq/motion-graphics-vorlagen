# grab-reminder-de

Deutsche Fassung des TikTok-Clips „one squeeze from the grave…“ (POV aus dem Grab,
24 s, 1080×1920, 60 fps). Bild und Ton (arabischer Vortrag) bleiben unverändert, nur die
zehn englischen Einblendungen werden durch deutsche **im selben Schriftstil** ersetzt.

Anders als die Remotion-Vorlagen ist das hier eine Retusche eines bestehenden Videos:

1. Englischen Text entfernen: Der Film ist schwarzweiß, die Textkontur blau – daraus
   entsteht pro Satz eine exakte Maske, die per Inpainting (Telea) plus Filmkorn
   geschlossen wird.
2. Deutschen Text setzen: Impact, horizontal auf 53 % gestaucht, weiße leicht
   durchscheinende Füllung, ~4 px Navy-Kontur, weicher Navy-Glow und die gewollt
   „kaputten“ Kanten (kleine Kerben/Ausbrüche, die Kontur läuft hinein).
3. Helligkeit pro Frame vom Originaltext übernehmen (Fade-in/-out, dunkle Zwischenphasen).

Texte, Timing (Frame-Bereiche) und Stilwerte stehen in `config.json`. Zu lange Sätze
werden automatisch auf die Breite des Originals skaliert.

## Bauen

```bash
pip install yt-dlp[default,curl-cffi] opencv-python-headless numpy pillow
python3 -m yt_dlp --impersonate chrome -o src.mp4 "https://www.tiktok.com/@afgznq/video/7691043726449315094"
# Impact.TTF (Microsoft Core Fonts, impact32.exe von sourceforge.net/projects/corefonts, mit cabextract entpacken)
python3 scripts/build.py src.mp4 out/grab-reminder-de.mp4 Impact.TTF config.json
# Debug: nur einzelne Frames als PNG
python3 scripts/build.py src.mp4 dbg/t Impact.TTF config.json 100,780
```

Quellvideo, Schrift und `out/` sind nicht eingecheckt.
