#!/usr/bin/env python3
"""Prüft, dass jeder arabische Teil in src/config.ts wörtlich (Codepunkt für Codepunkt)
im Quelltext quelle/al-baqara-152-154.txt vorkommt (Uthmani, api.alquran.cloud).
Aufruf: npm run check"""
import pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
src = " \n".join(root.joinpath("quelle/al-baqara-152-154.txt").read_text().splitlines())
cfg = root.joinpath("src/config.ts").read_text()
bad = 0
for block in re.findall(r"ar: \[([^\]]*)\]", cfg):
    phrase = " ".join(re.findall(r"'([^']*)'", block))
    ok = phrase in src
    bad += not ok
    print("ok    " if ok else "FEHLER", phrase)
sys.exit(1 if bad else 0)
