#!/usr/bin/env python3
"""Stellt Baysangur aus der Zeichnung frei, ohne den Papierrand.

Die vorhandene Freistellung (nokhchi-edit, BiRefNet) enthält noch das Papier um die Figur.
Hier wird die Figur über die Tinte gefunden: Striche erkennen → großzügig schließen und füllen
→ mit der alten Maske schneiden → weiche Kante. Die Signatur unten rechts wird ausgespart.
Ausgabe: public/img/baysangur_fig.png
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
im = Image.open(ROOT / "public/img/baysangur_cut.png").convert("RGBA")
a = np.asarray(im).astype(np.float32) / 255
rgb, alpha = a[..., :3], a[..., 3]
lum = rgb @ np.array([0.299, 0.587, 0.114])
paper = np.median(lum[alpha > 0.5])
ink = (lum < paper - 0.10) & (alpha > 0.5)
h, w = ink.shape
ink[int(h * 0.80):, int(w * 0.55):] = False  # Signatur
mask = ndi.binary_closing(ink, structure=np.ones((3, 3)), iterations=22)
mask = ndi.binary_fill_holes(mask)
mask = ndi.binary_opening(mask, structure=np.ones((3, 3)), iterations=6)
# größte zusammenhängende Fläche = Figur
lab, n = ndi.label(mask)
sizes = ndi.sum(mask, lab, range(1, n + 1))
mask = lab == (1 + int(np.argmax(sizes)))
# Papierfetzen am Rand (z. B. über dem Kopf) wegnehmen, danach wieder auf alte Größe
mask = ndi.binary_dilation(ndi.binary_erosion(mask, iterations=14), iterations=12)
soft = ndi.gaussian_filter(mask.astype(np.float32), 3) * alpha
out = np.dstack([rgb, soft])
Image.fromarray((out * 255).astype(np.uint8)).save(ROOT / "public/img/baysangur_fig.png")
print("Papier", round(float(paper), 3), "Figur-Anteil", round(float(mask.mean()), 3))
