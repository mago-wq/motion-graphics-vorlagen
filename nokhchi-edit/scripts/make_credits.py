#!/usr/bin/env python3
"""Schreibt CREDITS.md (Bildnachweise, Ton) – Text für die Videobeschreibung.
CC BY / CC BY-SA verlangen Namensnennung mit Lizenz; gemeinfreie Werke werden der Vollständigkeit halber genannt."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
credits = json.loads((ROOT / "credits" / "commons.json").read_text())
lines = ["# Nachweise", "", "## Bilder (Wikimedia Commons)", ""]
for key, c in sorted(credits.items(), key=lambda kv: kv[1]["license"]):
    author = re.sub(r"\s+", " ", c["author"] or "unbekannt").strip()
    lines.append(f"- {key}: {author} – {c['license']} – {c['commons']}")
lines += ["", "## Ton", "",
          "- Nasheed „Джохар Дудаев“ (SoundCloud-Fassung 2:18), Beat per KI entfernt, Stimme bearbeitet.",
          "- Geräusche: ElevenLabs Sound Effects bzw. lokal erzeugt (Wind, Luftzüge, Herzschlag, Feuer).",
          "", "## Kurzfassung für die Videobeschreibung", ""]
by = sorted({re.sub(r"\s+", " ", c["author"]).strip() + f" ({c['license']})"
             for c in credits.values() if c["license"].startswith("CC BY")})
lines.append("Bilder: Wikimedia Commons – gemeinfrei bzw. " + "; ".join(by) + ". Vollständige Liste: CREDITS.md")
(ROOT / "CREDITS.md").write_text("\n".join(lines) + "\n")
print(f"{len(credits)} Bildnachweise -> CREDITS.md")
