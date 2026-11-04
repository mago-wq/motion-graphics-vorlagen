# stil-showreel

15-Sekunden-Showreel (9:16, 1080×1920, 30 fps): **40 Animationsstile, alle aus Code**, mit Geräuschen aus der
earshot-Soundbank, ohne Musik. Gebaut mit Remotion; die Stile sind WebGL-Shader, Canvas-2D-Zeichnungen und
DOM/SVG. Die Stil-Liste stammt aus zwei TikToks („20 crazy/insane Claude animation styles“, @millee.md).

Oben läuft ein Zähler „07/40 · Stilname“ mit 40 Strichen Fortschritt. Schnitt alle 0,4 s (150 BPM), mehrere Stile
gehen ineinander über:

| Sekunde | Einstellungen (Stil-Nr.) |
|---|---|
| 0,0–1,6 | Fallblatt (1) „40 STILE / 15 SEK.“ → Kinetische Typo (2) „NUR CODE.“ → Neon (3) „Los!“ |
| 1,6–3,4 | eine Synthwave-Szene, viermal gerendert: Retro-VHS (4) → Pixel-Art (5) → ASCII (6) → Matrix-Regen (7) |
| 3,4–4,8 | Drahtgitter 3D (8) → Blaupause (9), dann Isometrie + Voxel-Insel (10, 11) |
| 4,8–6,6 | Raymarching: Knete 3D (12) → dieselbe Szene als Cel-Shading (13) → Gyroid-Tunnel (14) → Flüssig-Morph, der holografisch wird (15, 16) |
| 6,6–8,8 | Verlaufsnetz + Glaskarte (17, 18), Polarlicht (19), Tinte/Fluid (20, 21), Kaleidoskop → Buntglas (22, 23), Lichtstrahlen (24) |
| 8,8–11,0 | Sternensprung → Endloszoom (25, 26), Lichtbänder (27), Magnetpunkte → Partikel (28, 29), Höhenlinien → Strömungsfeld (30, 31) |
| 11,0–13,4 | Origami (32), Sumi-e (33), Kreidetafel (34), Halbton + Comic (35, 36), Bauhaus (37), Kartenflip (39) → Art déco (38) |
| 13,4–15,0 | Kartenflip → Neo-Brutalismus-Endkarte (40) „40 STILE. 15 SEKUNDEN. 100 % CODE“, letzte 0,5 s still |

## Bedienung

```bash
npm install
npx remotion browser ensure
bash <Youtube-Repo>/werkzeuge/ton/earshot_einrichten.sh   # earshot (Soundbank), einmal je Cloud-Sitzung
npm run entwurf      # out/stil-showreel-entwurf.mp4, 540×960, ~1,5 min
npm run render       # out/stil-showreel.mp4, 1080×1920
npm run render:4k    # out/stil-showreel-4k.mp4
npm run stills -- 10 58 186 430   # Standbilder einzelner Frames nach out/stills/
npm run studio       # Vorschau im Browser (mit Ton, sobald public/ton/mix.wav existiert)
```

Anpassen: Texte, Stilnamen und Farben in `src/config.ts`, Schnitte, Stil-Nummern und Ton-Einsätze in
`src/timing.ts`, Geräusche je Rolle in `audio/kit.json`.

## Ton

`scripts/render.sh` macht alles in einem Lauf: `scripts/cues.mjs` schreibt die Einsätze aus `src/timing.ts` nach
`audio/cues.json`, `earshot kit render` erzeugt die Geräusche (92 Takes aus 46 Rollen), `scripts/mix.py` legt sie
auf die Frames (Treffer mit dem Beginn, Whooshes und Riser mit dem Höhepunkt), bringt den Mix auf -14 LUFS und
begrenzt die wahre Spitze, dann kodiert ffmpeg AAC direkt ins MP4.

Geprüft mit earshot (Entwurf, 4.11.2026): 85 % der 87 Einsätze haben einen Toneinsatz innerhalb eines Frames
(Zufall: 40 %), Median-Versatz 4 ms; -14,6 LUFS, wahre Spitze -1,8 dBTP nach AAC.

## Nachweise

- Schriften (alle SIL Open Font License): Archivo Black, Space Grotesk, Space Mono, Bangers, Press Start 2P,
  Poiret One, Limelight, Caveat (Google Fonts), JetBrains Mono. Lizenztexte in `public/fonts/lizenzen/`.
- Geräusche: earshot v0.4.0 (MIT), in Code erzeugt bzw. aus CC0-Aufnahmen als Code nachgebaut.
- Keine Bilder, Videos oder Musik von Dritten.
