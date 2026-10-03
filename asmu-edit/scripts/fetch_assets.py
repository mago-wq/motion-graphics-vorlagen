#!/usr/bin/env python3
"""Lädt alles Fremdmaterial, das nicht im Repo liegt (Liste: scripts/assets.json).

  python3 scripts/fetch_assets.py            Clips in 1080p (für Entwurf und 1080er Endfassung)
  python3 scripts/fetch_assets.py --4k       Clips in 2160p, wo Mixkit sie anbietet (sonst 1080p)

Nasheed: yt-dlp (SoundCloud). Clips/Geräusche: Mixkit. Bilder: Wikimedia Commons
(Nachweise -> CREDITS.md). Vorhandene Dateien werden übersprungen, Lauf ist fortsetzbar.
"""
import json
import subprocess
import sys
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
A = json.loads((ROOT / "scripts/assets.json").read_text())
UA = "asmu-edit/1.0 (motion graphics template)"


def curl(url: str, out: Path, tries: int = 5) -> bool:
	out.parent.mkdir(parents=True, exist_ok=True)
	for i in range(tries):
		r = subprocess.run(["curl", "-sSL", "-A", UA, "-o", str(out), "-w", "%{http_code}", url],
			capture_output=True, text=True)
		if r.stdout.strip() == "200" and out.stat().st_size > 1000:
			return True
		time.sleep(4 * (i + 1))
	out.unlink(missing_ok=True)
	return False


def nasheed() -> None:
	n = A["nasheed"]
	out = ROOT / n["datei"]
	if list(out.parent.glob(out.stem + ".*")):
		return
	out.parent.mkdir(parents=True, exist_ok=True)
	subprocess.run(["yt-dlp", "-q", "--no-progress", "-f", "bestaudio", "-o", str(out.with_suffix(".%(ext)s")),
		n["quelle"]], check=True)
	print("Nasheed:", out.relative_to(ROOT))


def clips(q4k: bool) -> None:
	for cid, what in A["clips"].items():
		if cid.startswith("_"):
			continue
		out = ROOT / f"public/clips/{cid}.mp4"
		if out.exists():
			continue
		ok = q4k and curl(f"https://assets.mixkit.co/videos/{cid}/{cid}-2160.mp4", out, tries=1)
		ok = ok or curl(f"https://assets.mixkit.co/videos/{cid}/{cid}-1080.mp4", out)
		print(f"Clip {cid} ({what}):", "ok" if ok else "FEHLT")


def sfx() -> None:
	for name, sid in A["sfx"].items():
		if name.startswith("_"):
			continue
		out = ROOT / f"public/sfx/{name}.mp3"
		if out.exists():
			continue
		ok = curl(f"https://assets.mixkit.co/active_storage/sfx/{sid}/{sid}-preview.mp3", out)
		print(f"Geräusch {name} ({sid}):", "ok" if ok else "FEHLT")


def commons_api(params: dict) -> dict:
	url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**params, "format": "json"})
	for i in range(6):
		r = subprocess.run(["curl", "-sS", "-A", UA, url], capture_output=True, text=True)
		try:
			return json.loads(r.stdout)
		except json.JSONDecodeError:  # 429 von Wikimedia: warten, dann erneut
			time.sleep(5 * (i + 1))
	raise RuntimeError("Commons-API antwortet nicht")


def bilder() -> None:
	credits = []
	for key, b in A["bilder"].items():
		d = commons_api({"action": "query", "titles": "File:" + b["datei"], "prop": "imageinfo",
			"iiprop": "url|size|extmetadata", "iiurlwidth": b["breite"],
			"iiextmetadatafilter": "LicenseShortName|Artist"})
		ii = list(d["query"]["pages"].values())[0]["imageinfo"][0]
		md = ii["extmetadata"]
		artist = subprocess.run(["python3", "-c", "import html,re,sys; print(re.sub('<[^>]+>','',html.unescape(sys.argv[1])).strip())",
			md.get("Artist", {}).get("value", "unbekannt")], capture_output=True, text=True).stdout.strip()
		if "Unknown author" in artist:  # Commons-Vorlage doppelt den Text
			artist = "unbekannt"
		lic = md.get("LicenseShortName", {}).get("value", "?")
		credits.append((b["inhalt"], artist, lic, ii["descriptionurl"]))
		out = ROOT / f"public/bilder/{key}.jpg"
		if not out.exists():
			# Standardbreiten gehen auch bei Drosselung, krumme Breiten werden abgewiesen
			url = ii["thumburl"] if ii["width"] > b["breite"] else ii["url"]
			print(f"Bild {key}:", "ok" if curl(url, out) else "FEHLT")
			time.sleep(2)
	(ROOT / "CREDITS.md").write_text(
		"# Nachweise\n\nFür die Videobeschreibung (CC BY-SA verlangt Namensnennung).\n\n## Bilder (Wikimedia Commons)\n\n"
		+ "\n".join(f"- {inhalt}: {artist} – {lic} – {url}" for inhalt, artist, lic, url in credits)
		+ "\n\n## Videoclips\n\nMixkit (mixkit.co), Stock Video Free License: "
		+ ", ".join(k for k in A["clips"] if not k.startswith("_"))
		+ ".\n\n## Ton\n\n- Nasheed: " + A["nasheed"]["titel"] + " – " + A["nasheed"]["interpret"] + " – "
		+ A["nasheed"]["quelle"] + "\n- Geräusche: Mixkit (mixkit.co), Sound Effects Free License\n\n## Karte\n\n"
		+ "Natural Earth (naturalearthdata.com), gemeinfrei.\n\n## Kurzfassung für die Beschreibung\n\n"
		+ "Nasheed: Muhammad al Muqit – „أسمو (I Rise)“. Bilder: "
		+ "; ".join(f"{artist} ({lic})" for _, artist, lic, _ in credits)
		+ "; Mixkit. Karte: Natural Earth.\n")


def karte() -> None:
	out = ROOT / A["karte"]["datei"]
	if not out.exists():
		print("Karte:", "ok" if curl(A["karte"]["quelle"], out) else "FEHLT")


if __name__ == "__main__":
	nasheed()
	clips("--4k" in sys.argv)
	sfx()
	bilder()
	karte()
