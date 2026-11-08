#!/usr/bin/env python3
"""Rechnet die Bild-Looks vorab (im Browser wären sie pro Frame zu teuer oder gar nicht machbar)
und schreibt src/assets.json (Pfade, Seitenverhältnisse).

Eingang:  assets-src/img/*.jpg|png, assets-src/img/cut/*.png, assets-src/clips/*.mp4, assets-src/video/*.webm
Ausgang:  public/img/<key>.jpg        Grundbild (längste Seite ≤ 2400 px)
          public/img/red/<key>.jpg    Schwarz-Weiß hart, nur Rottöne bleiben rot (Look der Referenz 1)
          public/img/half/<key>.png   Rasterpunkte (Blitzbilder wie in Referenz 1, Frame 396/397)
          public/img/cut/<key>.png    Freisteller (Person/Wolf/Dolch) für „Text hinter dem Motiv“
          public/clips/<key>.mp4      Clips als H.264 mit kurzem Keyframe-Abstand (schnelles Springen)
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
PUB = ROOT / "public"
MAX_SIDE = 2400
HALF_KEYS = ["mansur_1787", "towers_ushkaloy", "chechens_kennan"]
# Freisteller per BiRefNet (rembg) – die vier Porträts kommen fertig aus dem nokhchi-edit.
# Je Bild ein eigener Prozess, sonst läuft der Speicher voll (BiRefNet ~14 GB bei mehreren Bildern).
CUT_KEYS = ["papakha_painting"]


def red_look(im: Image.Image) -> Image.Image:
    a = np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    lo, hi = np.percentile(lum, 3), np.percentile(lum, 97)
    l = np.clip((lum - lo) / max(hi - lo, 1e-3), 0, 1)
    l = l * l * (3 - 2 * l)                      # S-Kurve: Schwarz satt, Weiß ausgebrannt
    l = np.clip((l - 0.08) / 0.84, 0, 1)
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1e-3)
    redness = np.clip((r - np.maximum(g, b)) / np.maximum(r, 1e-3), 0, 1)
    m = np.clip((redness - 0.28) / 0.25, 0, 1) * np.clip((sat - 0.3) / 0.25, 0, 1) * np.clip((mx - 0.18) / 0.2, 0, 1)
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5)), dtype=np.float32) / 255
    out = np.stack([l, l, l], axis=2)
    redc = np.stack([np.clip(0.35 + 0.9 * l, 0, 1), 0.06 + 0.1 * l, 0.08 + 0.1 * l], axis=2)
    out = out * (1 - m[..., None]) + redc * m[..., None]
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8))


def halftone(im: Image.Image, pitch=11) -> Image.Image:
    """Weiße Rasterpunkte auf Schwarz, Punktgröße nach Helligkeit."""
    g = im.convert("L")
    w, h = g.size
    small = np.asarray(g.resize((max(1, w // pitch), max(1, h // pitch)), Image.BILINEAR), dtype=np.float32) / 255
    small = np.clip((small - 0.1) / 0.8, 0, 1)
    yy, xx = np.mgrid[0:pitch, 0:pitch]
    d = np.sqrt((xx - pitch / 2 + 0.5) ** 2 + (yy - pitch / 2 + 0.5) ** 2)
    out = np.zeros((small.shape[0] * pitch, small.shape[1] * pitch), np.float32)
    for y in range(small.shape[0]):
        for x in range(small.shape[1]):
            rad = np.sqrt(small[y, x]) * pitch * 0.55
            out[y * pitch:(y + 1) * pitch, x * pitch:(x + 1) * pitch] = np.clip(rad - d + 0.5, 0, 1)
    return Image.fromarray((out * 255).astype(np.uint8)).convert("RGB")


def cutouts(keys):
    from rembg import new_session, remove
    session = None
    for key in keys:
        src = next((p for p in (PUB / "img").glob(f"{key}.jpg")), None)
        dest = PUB / "img" / "cut" / f"{key}.png"
        if src is None or dest.exists():
            continue
        session = session or new_session("birefnet-general")
        im = Image.open(src).convert("RGB")
        mask = remove(im, session=session, only_mask=True, post_process_mask=True)
        mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.0))
        out = im.copy()
        out.putalpha(mask)
        out.save(dest, optimize=True)
        print(f"Freisteller {key}: Deckung {np.asarray(mask).mean() / 255:.0%}")


def clip(src: Path, dest: Path):
    if dest.exists():
        return
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-an", "-vf", "fps=30,format=yuv420p",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-g", "10", "-movflags", "+faststart",
                    str(dest)], check=True)


def probe(p: Path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height:format=duration", "-of", "json", str(p)], capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    s = d["streams"][0]
    return s["width"], s["height"], float(d["format"]["duration"])


def main():
    for sub in ("", "red", "half", "cut"):
        (PUB / "img" / sub).mkdir(parents=True, exist_ok=True)
    (PUB / "clips").mkdir(parents=True, exist_ok=True)
    assets = {"img": {}, "clip": {}}
    for p in sorted((SRC / "img").glob("*")):
        if p.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        key = p.stem
        base = PUB / "img" / f"{key}.jpg"
        if not base.exists():
            im = Image.open(p).convert("RGB")
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            im.save(base, quality=92)
        im = Image.open(base)
        red = PUB / "img" / "red" / f"{key}.jpg"
        if not red.exists():
            red_look(im).save(red, quality=92)
        if key in HALF_KEYS:
            half = PUB / "img" / "half" / f"{key}.png"
            if not half.exists():
                h = im.copy()
                h.thumbnail((1400, 1400))
                halftone(h).save(half, optimize=True)
        assets["img"][key] = {"aspect": round(im.width / im.height, 4)}
    # Porträt-Freisteller aus dem nokhchi-edit (gleich groß wie das Grundbild dort)
    for p in sorted((SRC / "img" / "cut").glob("*.png")):
        dest = PUB / "img" / "cut" / p.name
        if not dest.exists():
            im = Image.open(p)
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            im.save(dest, optimize=True)
    if "--ohne-freisteller" not in sys.argv:
        for key in CUT_KEYS:  # eigener Prozess je Bild (Speicher)
            subprocess.run([sys.executable, __file__, "--nur-freisteller", key], check=True)
    for key in assets["img"]:
        c = PUB / "img" / "cut" / f"{key}.png"
        assets["img"][key]["cut"] = c.exists()
        assets["img"][key]["half"] = (PUB / "img" / "half" / f"{key}.png").exists()
    for p in sorted(list((SRC / "clips").glob("*.mp4")) + list((SRC / "video").glob("*.webm"))):
        dest = PUB / "clips" / f"{p.stem}.mp4"
        clip(p, dest)
        w, h, dur = probe(dest)
        assets["clip"][p.stem] = {"aspect": round(w / h, 4), "duration": round(dur, 3)}
    (ROOT / "src" / "assets.json").write_text(json.dumps(assets, indent=1))
    print(f"{len(assets['img'])} Bilder, {len(assets['clip'])} Clips → src/assets.json")


if __name__ == "__main__":
    if "--nur-freisteller" in sys.argv:
        cutouts([sys.argv[-1]])
    else:
        main()
