"""Gemeinsame Hilfen für die Stimm-Skripte: config.ts lesen, Wörter vergleichen.

src/config.ts ist die einzige Quelle für Text und Einstellungen. Python liest
sie über Node ein (Node >= 22.18 entfernt TypeScript-Typen selbst).
"""
import json
import re
import subprocess
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STIMME_DIR = ROOT / "stimme"
ROH_WAV = STIMME_DIR / "roh.wav"
ROH_WOERTER = STIMME_DIR / "roh-woerter.json"
FERTIG_WAV = ROOT / "public" / "stimme" / "stimme.wav"
FERTIG_WOERTER = ROOT / "src" / "stimme" / "woerter.json"


def load_config():
    script = (
        "const {config} = await import(process.argv[1]);"
        "process.stdout.write(JSON.stringify(config));"
    )
    out = subprocess.run(
        ["node", "--input-type=module", "-e", script, str(ROOT / "src" / "config.ts")],
        check=True, capture_output=True, text=True,
    ).stdout
    return json.loads(out)


def norm(word):
    """Vergleichsform eines Wortes: klein, ohne Satzzeichen, ß -> ss."""
    w = unicodedata.normalize("NFC", word).lower().replace("ß", "ss")
    return re.sub(r"[^\wäöü]", "", w)


def spoken_words(cfg):
    """Gesprochene Wörter in Reihenfolge, jeweils mit Abschnitts-Nummer."""
    words = []
    for i, abschnitt in enumerate(cfg["abschnitte"]):
        for w in abschnitt["text"].split():
            if norm(w):
                words.append({"wort": w, "abschnitt": i})
    return words


TOKEN = re.compile(r"\{([^|}]+)\|([^}]+)\}|(\S+)")


def tafel_words(cfg):
    """Eingeblendete Wörter aller Tafeln in Reihenfolge."""
    words = []
    for tafel in cfg["tafeln"]:
        for m in TOKEN.finditer(tafel):
            words.append(m.group(1) or m.group(3))
    return words


def check_tafeln(cfg):
    """Tafeln und gesprochener Text müssen dieselben Wörter haben, sonst passt der Sync nicht."""
    gesprochen = [norm(w["wort"]) for w in spoken_words(cfg)]
    gezeigt = [norm(w) for w in tafel_words(cfg)]
    if gesprochen != gezeigt:
        raise SystemExit(
            "Tafeln passen nicht zum gesprochenen Text.\n"
            f"  gesprochen: {' '.join(gesprochen)}\n"
            f"  Tafeln:     {' '.join(gezeigt)}"
        )


def full_text(cfg):
    return " ".join(a["text"] for a in cfg["abschnitte"])
