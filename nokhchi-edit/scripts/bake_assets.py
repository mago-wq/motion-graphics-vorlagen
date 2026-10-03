#!/usr/bin/env python3
"""Rechnet teure Browser-Effekte vorab in Dateien ein – das Rendern wird dadurch mehrfach schneller.

- public/img/blur/<name>.jpg : stark weichgezeichnete Kleinfassung (statt CSS blur() auf 4K-Flächen)
- public/img/cut/<name>.png  : Freisteller aus assets-src/cut-raw/ mit eingerechnetem weichem
  Schlagschatten (statt CSS drop-shadow)
"""
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
HIST = ROOT / "public" / "img" / "hist"
BLUR = ROOT / "public" / "img" / "blur"
CUT = ROOT / "public" / "img" / "cut"
RAW = ROOT / "assets-src" / "cut-raw"


def main():
    BLUR.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    for p in sorted(HIST.glob("*")):
        if p.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        im = Image.open(p).convert("RGB")
        im.thumbnail((360, 360))
        im = im.filter(ImageFilter.GaussianBlur(6))
        im.save(BLUR / f"{p.stem}.jpg", quality=88)
    CUT.mkdir(parents=True, exist_ok=True)
    for raw in sorted(RAW.glob("*.png")):
        p = CUT / raw.name
        im = Image.open(raw).convert("RGBA")
        w, h = im.size
        a = im.getchannel("A")
        # Schatten: Alpha weichgezeichnet, leicht nach unten versetzt, 70 % Deckkraft
        sh = a.filter(ImageFilter.GaussianBlur(max(4, w // 90))).point(lambda v: int(v * 0.7))
        shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        dy = max(4, h // 80)
        shadow.paste(Image.new("RGBA", (w, h), (0, 0, 0, 255)), (0, dy), sh)
        out = Image.alpha_composite(shadow, im)
        out.save(p, optimize=True)
        print(f"{p.name}: Schatten eingerechnet")


if __name__ == "__main__":
    main()
