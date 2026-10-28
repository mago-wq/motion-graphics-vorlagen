#!/usr/bin/env python3
"""Rendert das Lösungs-Reel (9:16): Clip-Ausschnitte, Look je Teil, Glitch, Lichtblitz,
Text und Originalton. Alle Inhalte und Stilwerte kommen aus config.json.

Aufruf:
  python3 scripts/build.py --entwurf            # 540×960, schnell, für Feedback
  python3 scripts/build.py                      # 1080×1920, Endfassung
  python3 scripts/build.py --bilder 1,8.5,12    # nur Standbilder (PNG) nach out/bilder/
"""
import argparse
import json
import math
import os
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

LUMA = np.array([0.299, 0.587, 0.114], np.float32)


def szenen_dauern(cfg):
    sz = cfg["szenen"]
    ende = [s["start"] for s in sz[1:]] + [cfg["dauer"]]
    return [e - s["start"] for s, e in zip(sz, ende)]


def probe(pfad):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries",
                          "stream=width,height", "-of", "csv=p=0", pfad],
                         capture_output=True, text=True, check=True).stdout
    w, h = out.strip().split(",")[:2]
    return int(w), int(h)


class Szene:
    """Liefert die Bilder einer Szene in Grundgröße (W·zm × H·zm), Zoom passiert pro Bild."""

    def __init__(self, nr, s, dauer, n, cfg, W, H):
        self.s, self.W, self.H = s, W, H
        self.zm = max(s.get("zoom", [1, 1]))
        self.Wb, self.Hb = round(W * self.zm / 2) * 2, round(H * self.zm / 2) * 2
        pfad = f"clips/{nr:02d}-{s['clip']}.mp4"
        sw, sh = probe(pfad)
        tempo = s.get("tempo", 1.0)
        vf = []
        if s.get("rueckwaerts"):
            vf.append(f"trim=duration={dauer * tempo:.3f},reverse")
        vf.append(f"setpts=PTS/{tempo}")
        vf.append(f"fps={cfg['fps']}")
        if s.get("einpassen"):
            # Clips mit schwarzem Grund: ganze Breite × skala, Rest schwarz auffüllen
            breite = round(self.Wb * s.get("skala", 1.0) / 2) * 2
            hoehe = round(sh * breite / sw / 2) * 2
            pw, ph = max(breite, self.Wb), max(hoehe, self.Hb)
            ox, oy = (pw - breite) // 2, (ph - hoehe) // 2
            x = min(max(ox + s.get("fokus_x", 0.5) * breite - self.Wb / 2, 0), pw - self.Wb)
            y = min(max(oy + s.get("fokus_y", 0.5) * hoehe - self.Hb / 2, 0), ph - self.Hb)
            vf.append(f"scale={breite}:{hoehe}:flags=lanczos")
            vf.append(f"pad={pw}:{ph}:{ox}:{oy}:black")
            vf.append(f"crop={self.Wb}:{self.Hb}:{int(x)}:{int(y)}")
        else:
            breite = max(self.Wb, round(sw * self.Hb / sh))
            x = min(max(s.get("fokus_x", 0.5) * breite - self.Wb / 2, 0), breite - self.Wb)
            vf.append(f"scale={breite}:{self.Hb}:flags=lanczos")
            vf.append(f"crop={self.Wb}:{self.Hb}:{int(x)}:0")
        self.proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", pfad, "-vf", ",".join(vf),
                                      "-frames:v", str(n), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                     stdout=subprocess.PIPE)
        self.letztes = None

    def bild(self, u):
        """u = Fortschritt in der Szene 0..1."""
        n = self.Wb * self.Hb * 3
        roh = self.proc.stdout.read(n)
        if len(roh) == n:
            self.letztes = np.frombuffer(roh, np.uint8).reshape(self.Hb, self.Wb, 3)
        img = self.letztes
        z0, z1 = self.s.get("zoom", [1, 1])
        z = z0 + (z1 - z0) * (0.5 - 0.5 * math.cos(math.pi * u))
        cw, ch = self.Wb / z, self.Hb / z
        x0, y0 = (self.Wb - cw) / 2, (self.Hb - ch) / 2
        return np.asarray(Image.fromarray(img).resize(
            (self.W, self.H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch)))

    def schliessen(self):
        self.proc.stdout.read()
        self.proc.stdout.close()
        self.proc.wait()


def graden(img, L, vignette, korn):
    f = img.astype(np.float32)
    lum = f @ LUMA
    f = lum[..., None] + (f - lum[..., None]) * L["saettigung"]
    f *= np.array(L["toenung"], np.float32)
    f = (f - 128.0) * L["kontrast"] + 128.0
    f *= L["helligkeit"]
    f = L["anhebung"] + f * (1 - L["anhebung"] / 255.0)
    if L.get("leuchten"):
        klein = Image.fromarray(np.clip(f, 0, 255).astype(np.uint8)).reduce(8)
        hell = np.clip((np.asarray(klein, np.float32) - 150.0) * 1.6, 0, 255).astype(np.uint8)
        hof = Image.fromarray(hell).filter(ImageFilter.GaussianBlur(6))
        hof = np.asarray(hof.resize((f.shape[1], f.shape[0]), Image.BILINEAR), np.float32)
        f += hof * L["leuchten"]
    f *= vignette[..., None]
    f += korn[..., None] * L["korn"]
    return f


def glitch(f, s, rng):
    """Analoger Bildfehler: Farbversatz, verschobene Bänder, Zeilen, Aussetzer. s = 0..1."""
    if s <= 0.01:
        return f
    H, W = f.shape[:2]
    out = f.copy()
    dx = int(round(s * W * 0.014 * (0.4 + rng.random())))
    if dx:
        out[..., 0] = np.roll(f[..., 0], dx, axis=1)
        out[..., 2] = np.roll(f[..., 2], -dx, axis=1)
    for _ in range(rng.poisson(s * 9)):
        y = int(rng.integers(0, H))
        h = int(rng.integers(max(2, H // 200), max(3, H // 14)))
        off = int(rng.normal(0, s * W * 0.07))
        band = out[y:y + h]
        band[:] = np.roll(band, off, axis=1)
        band[..., 0] = np.roll(band[..., 0], int(off * 0.3), axis=1)
        band *= 1.0 + rng.normal(0, 0.12 * s)
    out[::3] *= 1.0 - 0.22 * s
    for _ in range(rng.poisson(s * 3)):
        y = int(rng.integers(0, H))
        h = int(rng.integers(1, max(2, H // 300)))
        out[y:y + h] = rng.uniform(60, 230, size=(min(h, H - y), W, 1))
    return out


def text_ebene(zeilen, sch, W):
    """RGBA-Ebene (float) mit zentrierten Zeilen, Kontur und weichem Schatten."""
    k = W / 1080.0
    H = round(W * 16 / 9)
    font = ImageFont.truetype(sch["datei"], round(sch["groesse"] * k))
    kontur = max(1, round(sch["kontur"] * k))
    zh = sch["groesse"] * k * sch["zeilenabstand"]
    unten = sch["unterkante_y"] * k
    ebene = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    schatten = Image.new("L", (W, H), 0)
    d, ds = ImageDraw.Draw(ebene), ImageDraw.Draw(schatten)
    for i, z in enumerate(zeilen):
        y = unten - (len(zeilen) - i) * zh
        d.text((W / 2, y), z, font=font, anchor="ma", fill=(255, 255, 255, 255),
               stroke_width=kontur, stroke_fill=(0, 0, 0, 255))
        ds.text((W / 2, y), z, font=font, anchor="ma", fill=255, stroke_width=kontur * 2)
    schatten = schatten.filter(ImageFilter.GaussianBlur(sch["schatten_blur"] * k))
    a_sch = np.asarray(schatten, np.float32) / 255.0 * sch["schatten_alpha"]
    rgba = np.asarray(ebene, np.float32)
    a = rgba[..., 3:4] / 255.0
    return rgba[..., :3], a, a_sch[..., None]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--entwurf", action="store_true")
    ap.add_argument("--bilder", default="")
    ap.add_argument("--config", default="config.json")
    ap.add_argument("--aus", default="")
    arg = ap.parse_args()

    cfg = json.load(open(arg.config, encoding="utf-8"))
    W, H = (540, 960) if arg.entwurf else (1080, 1920)
    fps, look = cfg["fps"], cfg["look"]
    n_ges = round(cfg["dauer"] * fps)
    standbilder = sorted(round(float(t) * fps) for t in arg.bilder.split(",") if t)

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r2 = ((xx - W / 2) / (W / 2)) ** 2 * 0.6 + ((yy - H / 2) / (H / 2)) ** 2
    vignette = np.clip(1 - look["vignette"] * r2 * 0.55, 0, 1)
    kr = np.random.default_rng(7)
    korn_vorrat = [kr.normal(0, 1, (H, W)).astype(np.float32) for _ in range(6)]

    texte = [(round(t["von"] * fps), round(t["bis"] * fps), text_ebene(t["zeilen"], cfg["schrift"], W))
             for t in cfg["texte"]]
    schnitte = [s["start"] for s in cfg["szenen"][1:] if s["teil"] == "unruhe"]
    blitz = look["lichtblitz"]

    os.makedirs("out/bilder", exist_ok=True)
    enc = None
    if not standbilder:
        ziel = arg.aus or ("out/loesung-reel-entwurf.mp4" if arg.entwurf else "out/loesung-reel.mp4")
        qual = ["-preset", "veryfast", "-crf", "30"] if arg.entwurf else ["-preset", "slow", "-crf", "18"]
        enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                                "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-i", cfg["ton"],
                                "-map", "0:v", "-map", "1:a", "-c:v", "libx264", *qual,
                                "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
                                "-t", str(cfg["dauer"]), "-movflags", "+faststart", ziel],
                               stdin=subprocess.PIPE)

    dauern = szenen_dauern(cfg)
    for nr, (s, d) in enumerate(zip(cfg["szenen"], dauern), 1):
        f0, f1 = round(s["start"] * fps), round((s["start"] + d) * fps)
        if standbilder and not any(f0 <= b < f1 for b in standbilder):
            continue
        sz = Szene(nr, s, d, f1 - f0, cfg, W, H)
        L = {**look[s["teil"]], **s.get("look", {})}
        for fi in range(f0, f1):
            u = (fi - f0) / max(1, f1 - f0 - 1)
            img = sz.bild(u)
            if standbilder and fi not in standbilder:
                continue
            t = fi / fps
            rng = np.random.default_rng(1000 + fi)
            f = graden(img, L, vignette, korn_vorrat[fi % len(korn_vorrat)])
            if s.get("flackern") and rng.random() < 0.35:
                f *= 1 - s["flackern"] * rng.random()
            if s["teil"] == "unruhe":
                g = s.get("glitch", 0) * (0.55 + 0.45 * rng.random())
                for tc in schnitte:
                    g = max(g, look["glitch_schnitt"] * max(0.0, 1 - abs(t - tc) / look["glitch_schnitt_dauer"]))
                f = glitch(f, g, rng)
            if blitz["zeit"] <= t < blitz["zeit"] + blitz["dauer"]:
                a = blitz["staerke"] * (1 - (t - blitz["zeit"]) / blitz["dauer"]) ** 2
                f = f * (1 - a) + np.array([255, 246, 228], np.float32) * a
            for v, b, (rgb, a, a_sch) in texte:
                if v <= fi < b:
                    f = f * (1 - a_sch)
                    f = f * (1 - a) + rgb * a
            out = np.clip(f, 0, 255).astype(np.uint8)
            if enc:
                enc.stdin.write(out.tobytes())
            else:
                Image.fromarray(out).save(f"out/bilder/t{t:05.2f}.png")
        sz.schliessen()
        print(f"Szene {nr} fertig ({s['inhalt']})", flush=True)

    if enc:
        enc.stdin.close()
        enc.wait()
        print("fertig:", ziel)


if __name__ == "__main__":
    main()
