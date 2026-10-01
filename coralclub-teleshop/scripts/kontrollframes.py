#!/usr/bin/env python3
"""Gibt sinnvolle Kontroll-Frames aus: pro Szene ein Bild kurz nach dem
Auftritt und eins am Ende (alles sichtbar). Liest dieselben JSON-Dateien wie
timing.ts. Aufruf: FRAMES="$(python3 scripts/kontrollframes.py)" npm run stills"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
vo = {l["id"]: l for l in json.loads((ROOT / "src" / "sprecher.json").read_text())["zeilen"]}
ev = json.loads((ROOT / "src" / "musik-ereignisse.json").read_text())
f = lambda s: round(s * 30)
starts = [0, f(ev["bandstopp"]), f(vo["reveal"]["start"]), f(vo["demo"]["start"]), f(vo["magnesium"]["start"]),
          f(vo["claim"]["start"]), f(ev["stopp"]), f(vo["preis"]["start"]), f(vo["alle"]["start"]), f(vo["cta"]["start"]), f(ev["dauer"])]
frames = set()
for a, b in zip(starts, starts[1:]):
    frames.update({a + 6, (a + b) // 2, b - 2})
frames.update({f(vo["kaffee"]["ende"]) + 20, f(ev["fanfare"]) + 8, f(ev["stillAb"])})
print(" ".join(str(x) for x in sorted(frames) if x < f(ev["dauer"])))
