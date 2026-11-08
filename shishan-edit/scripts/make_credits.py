#!/usr/bin/env python3
"""Schreibt CREDITS.md (Bild-, Video- und Tonnachweise) – Text für die Videobeschreibung.
CC BY / CC BY-SA verlangen Namensnennung mit Lizenz; gemeinfreie Werke werden der Vollständigkeit halber genannt.
Genannt wird nur, was im Schnitt (src/plan.ts) tatsächlich vorkommt."""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
credits = json.loads((ROOT / "credits" / "commons.json").read_text())
code = (ROOT / "src" / "plan.ts").read_text()
used = {k: c for k, c in credits.items() if re.search(rf"'{re.escape(k)}'", code)}
clips = sorted(set(re.findall(r"\[(\w+)\]=\d+", (ROOT / "scripts" / "fetch_clips.sh").read_text())))
clips_used = [k for k in clips if re.search(rf"'{k}'", code)]


def clean(author: str | None) -> str:
    """Commons-Metadaten säubern: „Creator:“-Präfixe, doppelt verkettete „Unknown author“-Vorlagen."""
    a = re.sub(r"\s+", " ", author or "").strip()
    if a.startswith("http"):  # nur ein Link auf die Benutzerseite (z. B. „Участник:Noxchiy“)
        m = re.search(r"(?:Участник|User):([^&/]+)", unquote(a))
        a = m.group(1) if m else a
    if "Metropolitan Museum of Art" in a:
        return "Metropolitan Museum of Art (Open Access)"
    a = re.sub(r"(?<=\S)Creator:", " / ", a).replace("Creator:", "").strip().rstrip(".")
    if not a or re.fullmatch(r"(Неизвестен|Unknown (author|artist))+", a):
        return "unbekannt"
    return re.sub(r"(Unknown (author|artist))+$", "", a).strip() or "unbekannt"


def author(c):
    return clean(c.get("artist") or c.get("author"))


def url(c):
    return c.get("source") or c.get("commons") or ""


lines = ["# Nachweise", "", "## Bilder und Videos (Wikimedia Commons)", ""]
for key, c in sorted(used.items(), key=lambda kv: (kv[1]["license"], kv[0])):
    lines.append(f"- {key}: {author(c)} – {c['license']} – {url(c)}")
lines += ["", "## Stock-Clips (Mixkit-Lizenz, frei ohne Namensnennung)", "",
          "- " + ", ".join(clips_used) + " (Clip-Nummern in scripts/fetch_clips.sh)",
          "", "## Ton", "",
          "- Nasheed „ملحمة الشيشان“ (Tarek Jaber, SoundCloud), nur Stimme, beschleunigt 1,18×, bearbeitet;",
          "  Bass und Schläge aus der Stimme geformt. Fremdes Material – nicht im Repo.",
          "- Wolfsgeheul: „Wolf howls.ogg“ (U.S. National Park Service, gemeinfrei), Wikimedia Commons.",
          "- Galoppierende Pferde: „Six Horses Galloping By.ogg“ (Freesound Community, CC0), Wikimedia Commons.",
          "- Wind, Donner, Stein, Stahl, Marschschritte: aus dem nokhchi-edit (ElevenLabs Sound Effects bzw. lokal erzeugt).",
          "", "## Kurzfassung für die Videobeschreibung", ""]
by = sorted({author(c) + f" ({c['license']})" for c in used.values() if c["license"].startswith("CC BY")})
lines.append("Bilder/Videos: Wikimedia Commons – gemeinfrei bzw. " + "; ".join(by) + ". Clips: Mixkit. Vollständige Liste: CREDITS.md")
(ROOT / "CREDITS.md").write_text("\n".join(lines) + "\n")
print(f"{len(used)} Nachweise (Commons), {len(clips_used)} Mixkit-Clips -> CREDITS.md")
