#!/usr/bin/env python3
"""Schreibt src/assets.json: welche Bilder (historisch / freigestellt) vorliegen, mit Seitenverhältnis.
Remotion kann zur Laufzeit keine Ordner auflisten – fehlende Bilder werden so sauber übersprungen."""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
out = {}
for kind in ("hist", "cut", "blur"):
    d = PUB / "img" / kind
    out[kind] = {}
    for p in sorted(d.glob("*")):
        if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
            w, h = Image.open(p).size
            out[kind][p.stem] = {"path": f"img/{kind}/{p.name}", "aspect": round(w / h, 4)}
(ROOT / "src" / "assets.json").write_text(json.dumps(out, indent=1))
print({k: len(v) for k, v in out.items()})
