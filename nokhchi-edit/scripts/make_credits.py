#!/usr/bin/env python3
"""Schreibt CREDITS.md (Bildnachweise, Ton) – Text für die Videobeschreibung.
CC BY / CC BY-SA verlangen Namensnennung mit Lizenz; gemeinfreie Werke werden der Vollständigkeit halber genannt."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
credits = json.loads((ROOT / "credits" / "commons.json").read_text())
# nur Bilder, die im Schnitt tatsächlich vorkommen (geladen, aber verworfen = nicht nennen)
code = "".join(f.read_text() for f in (ROOT / "src").rglob("*.tsx"))
credits = {k: c for k, c in credits.items() if re.search(rf"\b{re.escape(k)}\b", code)}


def clean(author: str | None) -> str:
    """Commons-Metadaten säubern: „Creator:“-Präfixe, doppelt verkettete „Unknown author“-Vorlagen."""
    a = re.sub(r"\s+", " ", author or "").strip()
    a = re.sub(r"(?<=\S)Creator:", " / ", a).replace("Creator:", "").strip().rstrip(".")
    if not a or re.fullmatch(r"(Неизвестен|Unknown (author|artist))+", a):
        return "unbekannt"
    return re.sub(r"(Unknown (author|artist))+$", "", a).strip() or "unbekannt"


lines = ["# Nachweise", "", "## Bilder (Wikimedia Commons)", ""]
for key, c in sorted(credits.items(), key=lambda kv: kv[1]["license"]):
    lines.append(f"- {key}: {clean(c['author'])} – {c['license']} – {c['commons']}")
lines += ["", "## Ton", "",
          "- Nasheed „Джохар Дудаев“ (SoundCloud-Fassung 2:18), Beat per KI entfernt, Stimme bearbeitet.",
          "- Geräusche: ElevenLabs Sound Effects bzw. lokal erzeugt (Wind, Luftzüge, Herzschlag, Feuer).",
          "", "## Kurzfassung für die Videobeschreibung", ""]
by = sorted({clean(c["author"]) + f" ({c['license']})"
             for c in credits.values() if c["license"].startswith("CC BY")})
lines.append("Bilder: Wikimedia Commons – gemeinfrei bzw. " + "; ".join(by) + ". Vollständige Liste: CREDITS.md")
(ROOT / "CREDITS.md").write_text("\n".join(lines) + "\n")
print(f"{len(credits)} Bildnachweise -> CREDITS.md")
