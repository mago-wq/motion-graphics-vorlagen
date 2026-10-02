#!/usr/bin/env python3
"""Stellt Personen frei (BiRefNet über rembg, lokal) – für die „aus dem Bild heraus“-Effekte.

Ergebnis: public/img/cut/<name>.png in derselben Größe wie das Original, mit Alphakanal.
Dadurch liegt die Freistellung pixelgenau über dem Bild, wenn beide gleich platziert werden.
Modell: ~/.u2net/birefnet-general.onnx (rembg lädt es beim ersten Lauf selbst).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
HIST = ROOT / "public" / "img" / "hist"
CUT = ROOT / "public" / "img" / "cut"

# Bilder mit klar erkennbarer Person
PORTRAITS = ["baysangur", "mansur_1787", "zelimkhan", "chechen_yermakov", "dudayev_1991", "shida"]


def main(names):
    CUT.mkdir(parents=True, exist_ok=True)
    session = new_session("birefnet-general")
    for name in names:
        src = next(HIST.glob(f"{name}.*"), None)
        if src is None:
            print(f"{name}: Bild fehlt, übersprungen")
            continue
        im = Image.open(src).convert("RGB")
        mask = remove(im, session=session, only_mask=True, post_process_mask=True)
        # Kante minimal einziehen und weich machen, damit kein Saum vom Hintergrund bleibt
        mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
        out = im.copy()
        out.putalpha(mask)
        dest = CUT / f"{name}.png"
        out.save(dest, optimize=True)
        cover = np.asarray(mask, dtype=np.float32).mean() / 255
        print(f"{name}: {im.size[0]}x{im.size[1]}, Person deckt {cover:.0%} ab -> {dest.relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:] or PORTRAITS)
