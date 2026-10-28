#!/usr/bin/env python3
"""Lädt die Mixkit-Clips (720p) nach clips/roh/ und schneidet pro Szene den benutzten
Ausschnitt nach clips/<nr>-<id>.mp4. Nur die Ausschnitte sind eingecheckt.

Aufruf: python3 scripts/clips.py [config.json]
Nach jeder Änderung an "clip", "ab", "tempo" oder einer Szenenzeit neu ausführen.
"""
import json
import os
import subprocess
import sys
import urllib.request

RAND = 0.5  # Sekunden Puffer hinter dem Ausschnitt


def szenen_dauern(cfg):
    sz = cfg["szenen"]
    ende = [s["start"] for s in sz[1:]] + [cfg["dauer"]]
    return [e - s["start"] for s, e in zip(sz, ende)]


def main():
    pfad = sys.argv[1] if len(sys.argv) > 1 else "config.json"
    cfg = json.load(open(pfad, encoding="utf-8"))
    os.makedirs("clips/roh", exist_ok=True)
    for nr, (s, d) in enumerate(zip(cfg["szenen"], szenen_dauern(cfg)), 1):
        cid = s["clip"]
        roh = f"clips/roh/{cid}.mp4"
        if not os.path.exists(roh):
            url = f"https://assets.mixkit.co/videos/{cid}/{cid}-720.mp4"
            print("lade", url)
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req) as r, open(roh, "wb") as f:
                f.write(r.read())
        laenge = d * s.get("tempo", 1.0) + RAND
        ziel = f"clips/{nr:02d}-{cid}.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(s["ab"]), "-t", f"{laenge:.3f}",
                        "-i", roh, "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium",
                        "-pix_fmt", "yuv420p", ziel], check=True)
        print(ziel, f"{laenge:.2f} s")


if __name__ == "__main__":
    main()
