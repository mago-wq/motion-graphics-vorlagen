#!/usr/bin/env python3
"""Bereitet Logo und Filmkorn für 1080p und 4K vor (einmalig, Ergebnis ist eingecheckt).

Logo: Das beste verfügbare Original auf mfit-smart.de (/logos/mfit-logo.png, 1920×1080,
Logo darin ~550×650 px) ist für die 4K-Endcard (~1040 px hoch) zu klein. Deshalb:
  - Farbe vormultipliziert mit Lanczos auf 2× hochskaliert (weiche 3D-Schattierung bleibt),
  - die Transparenzmaske bikubisch hochskaliert und ihre Kanten nachgeschärft,
so bleiben die Kanten auch in 4K scharf, ohne das Logo neu zu zeichnen.
Eingabe: public/brand/mfit-logo.png, public/brand/mfit-zeichen.png (freigestellt, 1×)
Ausgabe: public/brand/mfit-logo@2x.png, public/brand/mfit-zeichen@2x.png

Filmkorn: 8 Kacheln 256 px (für 1080p) und 8 Kacheln 512 px (für 4K, gleiche Körnung
im Verhältnis zum Bild, aber nativ fein statt hochskaliert).
Ausgabe: public/grain/korn-N.png, public/grain/korn-hd-N.png

Aufruf: python3 scripts/prepare_assets.py   (braucht numpy, Pillow, scipy)
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / 'public' / 'brand'
GRAIN = ROOT / 'public' / 'grain'


def upscale_logo(src: Path, dst: Path, factor: int = 2) -> None:
    im = Image.open(src).convert('RGBA')
    a = np.asarray(im).astype(np.float32) / 255.0
    w, h = im.size
    size = (w * factor, h * factor)

    def resize(channel: np.ndarray, method) -> np.ndarray:
        img = Image.fromarray(channel.astype(np.float32), 'F')
        return np.asarray(img.resize(size, method), dtype=np.float32)

    alpha = np.clip(resize(a[..., 3], Image.BICUBIC), 0, 1)
    # Farbe vormultipliziert skalieren, sonst entstehen dunkle Säume an den Kanten
    premul = [np.clip(resize(a[..., c] * a[..., 3], Image.LANCZOS), 0, 1) for c in range(3)]
    rgb = np.dstack([p / np.maximum(alpha, 1e-4) for p in premul])
    # Maskenkante nachschärfen: der Übergang schrumpft auf etwa 1,5 px
    lo, hi = 0.28, 0.72
    t = np.clip((alpha - lo) / (hi - lo), 0, 1)
    sharp = t * t * (3 - 2 * t)
    # Innen bleibt die ursprüngliche Deckkraft (dunkle Stellen im Gold sind halbtransparent)
    sharp = np.where(alpha > hi, np.maximum(sharp, alpha), sharp)
    out = np.dstack([np.clip(rgb, 0, 1), sharp])
    Image.fromarray((out * 255 + 0.5).astype(np.uint8), 'RGBA').save(dst, optimize=True)
    print(f'{dst.relative_to(ROOT)}  {size[0]}×{size[1]}')


# Stärke des Korns (Standardabweichung um Mittelgrau 128); zusammen mit der Deckkraft
# 0,1 in Background.tsx ergibt das ein feines, kaum sichtbares Filmkorn.
GRAIN_STD = 19


def grain_tiles() -> None:
    rng = np.random.default_rng(7)
    for i in range(8):
        # 1080p: 256 px, leicht weichgezeichnet (nahtlos kachelbar)
        g = gaussian_filter(rng.normal(0, 1, (256, 256)), 0.6, mode='wrap')
        g = 128 + g / g.std() * GRAIN_STD
        Image.fromarray(np.clip(g, 0, 255).astype(np.uint8), 'L').save(GRAIN / f'korn-{i}.png', optimize=True)
        # 4K: 512 px mit doppeltem Weichzeichner = gleiche Körnung relativ zum Bild
        g = gaussian_filter(rng.normal(0, 1, (512, 512)), 1.2, mode='wrap')
        g = 128 + g / g.std() * GRAIN_STD
        Image.fromarray(np.clip(g, 0, 255).astype(np.uint8), 'L').save(GRAIN / f'korn-hd-{i}.png', optimize=True)
    print('public/grain/korn-*.png, korn-hd-*.png')


if __name__ == '__main__':
    upscale_logo(BRAND / 'mfit-logo.png', BRAND / 'mfit-logo@2x.png')
    upscale_logo(BRAND / 'mfit-zeichen.png', BRAND / 'mfit-zeichen@2x.png')
    grain_tiles()
