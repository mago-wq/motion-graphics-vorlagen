#!/usr/bin/env python3
"""Lädt die historischen Bilder von Wikimedia Commons und schreibt credits/commons.json.

Alle Dateien sind gemeinfrei (PD/CC0) oder CC BY / CC BY-SA – Urheber und Lizenz
stehen in der JSON und müssen bei Veröffentlichung im Beschreibungstext genannt werden.
"""
import json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

UA = "NokhchiEdit/1.0 (https://github.com/mago-wq/motion-graphics-vorlagen)"
# Mehrere API-Endpunkte: Commons drosselt geteilte IPs stark; jedes Wiki kann die
# Commons-Dateien ebenfalls abfragen (gemeinsames Medien-Repository).
APIS = ["https://commons.wikimedia.org/w/api.php", "https://ru.wikipedia.org/w/api.php", "https://en.wikipedia.org/w/api.php", "https://de.wikipedia.org/w/api.php"]
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "img" / "hist"

# Schlüssel -> Commons-Dateiname
FILES = {
    "baysangur": "Бенойн БойсгӀар.jpg",
    "baysangur_medal": "Медаль Байсангура Беноевского (Баршкиева).jpg",
    "baysangur_order1861": "Кавказская летопись (3).jpg",
    "baysangur_churt": "Чурт Байсангура Беноевского.jpg",
    "mansur_1787": "Porträt des „Scheich Mansur“.png",
    "bibolt_pushkin": "1829 г. Рисунок А. С. Пушкина с профилем Бейбулата Теймазова (Таймин Биболат).jpg",
    "zelimkhan": "Zelimxan.jpg",
    "chechen_yermakov": "Chechen, 19th century.jpg",
    "chechens_kennan": "Chechense. Match. a wedding match. George Kennan. 1870-1886.jpg",
    "chechen_deniker": "Races of man, figure 110 Chechen of Daghestan (IA deniofmanoutlinraces00rich).jpg",
    "shida": "Шида Эльмурзаев.jpg",
    "murids_1902": "Чеченцы мюриды.jpg",
    "dudayev_1991": "Джохар Дудаев (1991).png",
    "dudayev_signature": "Signature of Dzhokhar Dudayev.png",
    "war_roubaud_scene": "Roubaud. Scene from Caucasian war.jpg",
    "war_dargo_roubaud": "Fight in the Caucasus.jpg",
    "war_valerik_lermontov": "Paintings by Mikhail Lermontov, 1840, Valerik.jpg",
    "war_faesi_1836": "Battle between Russian Troops under General Faesi and Chechens (1836).jpg",
    "war_vedeno_horschelt": "Осада Ведено (1859).jpg",
    "sharoi_1800": "Sharoi1800.jpg",
    "towers_ushkaloy": "Ushkaloyskie Towers.jpg",
    "towers_chechnya": "Башни в Чечне.jpg",
    "tower_komalkhi": "Комалхар бIов.jpg",
    "tower_khambetar": "Хамбетаран гIала.jpg",
    "lake_kezenoyam": "Kezenoyam 1.jpg",
    "mountains_kezenoyam": "Чечня 4.jpg",
    "valley_chinakha": "Бугlара, Чlинха. Нохчийчоь.jpg",
    # Simsir 1395: Miniaturen aus dem Zafarnama – der Chronik, die Khour II (Gayur-khan) erwähnt
    "zafar_tokhtamysh": "Folio 230. The army petitions Timur to fight Tuqtamish Khan (British Library, I.O. Islamic 137).jpg",
    "zafar_kaf_mountains": "Timur together with his horse and three army leaders being lowered by ropes down a mountainside in the Kaf mountains (1397). Zafarnama. India, 1600. Source- Or. 1052, f.182v (cropped).jpg",
    "zafar_battle": "Timur's forces led by his son ‘Umar Shaykh defeating the army of Qamar al-Din; a folio from the royal Mughal Zafarnama, by Jagjivan Kalan, Mughal India, circa 1595-1600.jpg",
    "zafar_before_battle": "\"Timur before Battle\", Folio from a Dispersed Copy of the Zafarnama (Book of Victories) of Sharaf al-din 'Ali Yazdi MET DP164663.jpg",
    # Dzurdzuketien: Bronzefunde der Koban-Kultur
    "koban_axes": "Axes Caucasus 2 mill BC GIM.jpg",
    "koban_axe_klinyar": "Bronze axe from Klin-Yar grave 362.jpg",
}

# upload.wikimedia.org liefert nur Standard-Vorschaugrößen ohne Drosselung aus;
# Originale und krumme Breiten werden mit 429/400 abgewiesen.
STD_WIDTHS = [3840, 1920, 1280, 960, 500, 330, 250, 120]
# Dateien, deren Original kleiner als 250 px ist bzw. die nur als Original kommen
SMALL = {"bibolt_pushkin"}


def api(params, tries=12):
    for i in range(tries):
        url = APIS[i % len(APIS)] + "?" + urllib.parse.urlencode(dict(params, format="json"))
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=40) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(1 + 2 * (i // len(APIS)))
    raise RuntimeError("API antwortet dauerhaft mit 429")


def download(url, dest, tries=14):
    # upload.wikimedia.org drosselt hart (429) – geduldig mit wachsender Pause wiederholen
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=120) as r:
                dest.write_bytes(r.read())
                return
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(15 + 15 * i)
    raise RuntimeError(f"Download fehlgeschlagen: {url}")


def clean(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    out_json = ROOT / "credits" / "commons.json"
    credits = json.loads(out_json.read_text()) if out_json.exists() else {}
    missing = []
    order = sorted(FILES.items(), key=lambda kv: kv[0] in SMALL)
    for key, name in order:
        if key in credits and (ROOT / "public" / credits[key]["file"]).exists():
            continue
        try:
            credits[key] = fetch_one(key, name)
        except RuntimeError as e:
            missing.append(key)
            print(f"{key:24s} FEHLT ({e})")
            continue
        (ROOT / "credits").mkdir(exist_ok=True)
        out_json.write_text(json.dumps(credits, ensure_ascii=False, indent=1))
    if missing:
        print("Fehlend (später erneut starten):", ", ".join(missing))


def fetch_one(key, name):
    """Holt Metadaten und Bild einer Datei; gibt den Eintrag für credits/commons.json zurück."""
    d = api({"action": "query", "titles": "File:" + name, "prop": "imageinfo",
             "iiprop": "url|size|extmetadata"})
    page = next(iter(d["query"]["pages"].values()))
    ii = page["imageinfo"][0]
    meta = ii.get("extmetadata", {})
    get = lambda k: clean(meta.get(k, {}).get("value", ""))
    width = next((w for w in STD_WIDTHS if w <= ii["width"]), None)
    if width:
        d2 = api({"action": "query", "titles": "File:" + name, "prop": "imageinfo",
                  "iiprop": "url", "iiurlwidth": width})
        src = next(iter(d2["query"]["pages"].values()))["imageinfo"][0]["thumburl"]
    else:
        src = ii["url"]
    ext = Path(urllib.parse.urlparse(src).path).suffix.lower() or ".jpg"
    dest = OUT / f"{key}{ext}"
    if not dest.exists():
        download(src, dest)
        time.sleep(6)
    entry = {
        "file": f"img/hist/{dest.name}",
        "commons": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(name.replace(" ", "_")),
        "author": get("Artist"), "license": get("LicenseShortName"),
        "date": get("DateTimeOriginal"), "width": ii["width"], "height": ii["height"],
    }
    print(f"{key:24s} {ii['width']}x{ii['height']:<5} {entry['license']}")
    return entry


if __name__ == "__main__":
    sys.exit(main())
