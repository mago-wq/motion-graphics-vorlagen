#!/usr/bin/env python3
"""Lädt die Produktfotos von de.coral.club und stellt sie frei (braucht numpy, scipy, Pillow).

Die Fotos stehen dort auf hellgrauem Grund (#F6F6F6). Freigestellt wird alles,
was hell, fast farblos und mit dem Bildrand verbunden ist. Die Packungen selbst
sind farbig oder haben dunkle Kanten, dadurch bleibt die Fläche innen erhalten.
Weiche Schatten im Grund werden zu halbtransparentem Schwarz, damit sie auf
jedem farbigen Hintergrund funktionieren.

Ausgabe: public/produkte/<name>.png (RGBA, auf den Inhalt zugeschnitten)
Aufruf:  python3 scripts/prepare_products.py
"""
import io
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "produkte"
BASE = "https://de.coral.club"

# Name -> Foto aus der Galerie der Produktseite (Stand 29.09.2026)
PRODUCTS = {
    "coral-mine": "/upload/iblock/883/3ohvaeqwdhtsapflpe12pufr0zlzzbs6.webp",
    "oceanmin": "/upload/iblock/d23/99jdscjub38la00a8lb9sr8o3wwwdwal.webp",
    "collagen": "/upload/iblock/009/qmsetqdnvhf74ve3zxmvwpmop1kstx1a.webp",
}


def cut(image, lum_min=222, sat_max=0.07, pad=20):
    im = np.asarray(image.convert("RGB")).astype(float)
    bg = np.median(np.concatenate([im[:5].reshape(-1, 3), im[-5:].reshape(-1, 3)]), axis=0).mean()
    hi, lo = im.max(2), im.min(2)
    sat = (hi - lo) / np.maximum(hi, 1)
    lum = im.mean(2)
    labels, _ = ndimage.label((sat < sat_max) & (lum > lum_min))
    border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    ground = np.isin(labels, list(border))
    shadow = np.clip((bg - lum) / bg * 2.2, 0, 1) * 0.55
    alpha = np.where(ground, shadow, 1.0)
    rgb = np.where(ground[..., None], 0, im)
    a = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    out = Image.fromarray(rgb.astype(np.uint8))
    out.putalpha(a)
    x0, y0, x1, y1 = Image.fromarray(((alpha > 0.04) * 255).astype(np.uint8)).getbbox()
    return out.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.shape[1], x1 + pad), min(im.shape[0], y1 + pad)))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, path in PRODUCTS.items():
        with urllib.request.urlopen(BASE + path, timeout=60) as r:
            image = Image.open(io.BytesIO(r.read()))
        result = cut(image)
        result.save(OUT / f"{name}.png", optimize=True)
        print(f"{name:12s} {result.size[0]}x{result.size[1]}  <- {BASE}{path}")


if __name__ == "__main__":
    main()
