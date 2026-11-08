#!/usr/bin/env python3
"""Holt die Bilder (und zwei Videos) von Wikimedia Commons und schreibt credits/commons.json.

Alle Dateien sind gemeinfrei (PD/CC0) oder CC BY / CC BY-SA – Urheber und Lizenz stehen in der
JSON und gehören bei Veröffentlichung in die Videobeschreibung (npm run credits → CREDITS.md).

Bilder, die schon im nokhchi-edit liegen, werden von dort kopiert (gleiche Nachweise), statt sie
erneut zu laden. Commons drosselt geteilte IPs (429): Standard-Vorschaubreiten verwenden,
API-Endpunkte rotieren, Lauf ist fortsetzbar.

Menschen nur als anonymer tschetschenischer Typ in Tracht (Wunsch des Auftraggebers): keine bekannten
Personen. Baysangur, Zelimkhan, Scheich Mansur, der Jermakow-Krieger mit Kapuze und die Kennan-Gruppe
kamen im Kanal schon zu oft vor und sind deshalb hier ausdrücklich nicht dabei.
"""
import json
import re
import shutil
import time
import urllib.parse
import urllib.request
from pathlib import Path

UA = "ShishanEdit/1.0 (https://github.com/mago-wq/motion-graphics-vorlagen)"
APIS = ["https://commons.wikimedia.org/w/api.php", "https://ru.wikipedia.org/w/api.php",
        "https://en.wikipedia.org/w/api.php", "https://de.wikipedia.org/w/api.php"]
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets-src" / "img"
NOKHCHI = ROOT.parent / "nokhchi-edit"

# Schlüssel -> (Commons-Dateiname, Vorschaubreite)
FILES = {
    # Wölfe
    "wolf_howl_rock": ("Wolf howling on glacial erratic2.jpg", 1920),
    "wolf_howl_zoo": ("Howling wolf 1.jpg", 3840),
    "wolf_face": ("Portrait of a common european wolf.jpg", 3840),
    "wolf_portrait_v": ("Canis lupus lupus portrait 01.jpg", 1440),
    "wolf_loup": ("Loup portrait.jpg", 1412),
    # Waffen und Tracht
    "kinjal_met_a": ("Dagger with Sheath MET 36.25.927ab 001july2014.jpg", 1920),
    "kinjal_met_b": ("Dagger with Sheath MET 26.35.9ab 001june2014.jpg", 1920),
    "weapons_platz": ("Caucasian weapons (E. Platz).jpg", 1490),
    "papakha_painting": ("Russian school - A Caucasian in a papakha with a saddle beside him.jpg", 1920),
    # Türme und Berge in Tschetschenien
    "tower_itumkale": ("Itum-Kale tower.jpg", 1920),
    "tower_shatoy_stairs": ("Шуьйта бlов.jpg", 1920),
    "lake_nokhchkeloy": ("Нохч-Келара Iам.jpg", 1920),
    "orga": ("Орга. Нихал уллехь.jpg", 1920),
    # Die Heere des Zaren (Einstieg vor „NEIN.“) – erkennbar, nicht zu dunkel
    "army_vedeno_column": ("Движение царского отряда через горы к аулу Ведено в феврале 1859.jpg", 1280),  # Horschelt
    "army_gunib_storm": ("Теодор Горшельт. Штурм укреплений Гуниба. 1867.jpg", 1280),                     # Horschelt
    "army_mountain_battle": ("Battle in the mountains (1890).jpg", 1280),                                 # Roubaud
    "army_dargo_forest": ("Даргинский поход. Подвиг 3-го бат.Апшеронского полка. рис.Рубо Ф.А. 1895г ГИМ e1.jpg", 1920),  # Roubaud
    # Tschetschenen in Tracht – anonym, als „Tschetschene/Tschetschenen“ beschriftet, bisher nie verwendet
    "warrior_mail": ("Krieger in Kettenpanzer.jpg", 1920),             # Stich: Krieger im Kettenhemd
    "mikeshin_chechen": ("Микешин Чеченец 1876.JPG", 960),             # M. Mikeschin 1876: Profil, Papacha
    "chechen_rifle": ("Circassian Warrior.jpg", 500),                  # Lithografie „Tchetchenze“ mit Gewehr
    "chechen_litho": ("Народы Кавказа Чеченец.JPG", 1280),             # Lithografie Ende 19. Jh. (rechte Figur)
    "zumsoy_1906": ("Зумсой. 1906 год.jpg", 818),                      # Männer aus Zumsoi, Foto 1906
    "chechens_seidlitz": ("Чеченцы XIX.jpg", 516),                     # Foto N. K. Seidlitz, vor 1900
    "chechen_rider_1910": ("Chechen Horseman.jpg", 500),               # Reiter, Foto 1910
}
# Kleine Originale (≤ 1200 px) zuerst im Original versuchen, sonst größte Standardbreite darunter
SMALL_ORIGINAL = {"zumsoy_1906", "chechens_seidlitz"}
# Aus dem nokhchi-edit übernehmen (Nachweise stehen dort in credits/commons.json)
# (nur Gemälde und Landschaften – keine Personen, siehe oben)
REUSE = [
    "war_dargo_roubaud", "war_roubaud_scene", "war_faesi_1836", "war_valerik_lermontov", "towers_ushkaloy", "tower_khambetar", "mountains_kezenoyam",
]
REUSE_CUT: list[str] = []
# Videos (transkodierte 1080p-Fassung von upload.wikimedia.org)
# („Wolfsgeheul Wolfcenter Dörverden.webm“ geprüft und verworfen: Wölfe nur hinter einem Zaun)
VIDEOS = {
    "wolves_vicart": "Vicart - loups.webm",
}
STD_WIDTHS = [3840, 1920, 1280, 960, 500, 330, 250, 120]


def api(params, tries=16):
    for i in range(tries):
        url = APIS[i % len(APIS)] + "?" + urllib.parse.urlencode(dict(params, format="json"))
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=40) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(1.5 + 2 * (i // len(APIS)))
    raise RuntimeError("API antwortet dauerhaft mit 429")


def download(url, dest, tries=12):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=180) as r:
                dest.write_bytes(r.read())
                return
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503):
                raise
            time.sleep(12 + 12 * i)
    raise RuntimeError(f"Download fehlgeschlagen: {url}")


def clean(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


def info(name, width=None):
    params = {"action": "query", "titles": "File:" + name, "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime"}
    if width:
        params["iiurlwidth"] = width
    page = next(iter(api(params)["query"]["pages"].values()))
    if "imageinfo" not in page:
        raise RuntimeError(f"nicht gefunden: {name}")
    return page["imageinfo"][0]


def credit(key, name, ii, file):
    m = ii.get("extmetadata", {})
    g = lambda k: clean(m.get(k, {}).get("value", ""))
    return dict(key=key, file=file, title=name, artist=g("Artist") or g("Credit") or "unbekannt",
                license=g("LicenseShortName"), license_url=m.get("LicenseUrl", {}).get("value", ""),
                source=ii.get("descriptionurl", ""))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "cut").mkdir(exist_ok=True)
    out_json = ROOT / "credits" / "commons.json"
    credits = json.loads(out_json.read_text()) if out_json.exists() else {}

    old = json.loads((NOKHCHI / "credits" / "commons.json").read_text())
    for key in REUSE:
        src = next(iter((NOKHCHI / "public" / "img" / "hist").glob(key + ".*")))
        dest = OUT / src.name
        if not dest.exists():
            shutil.copy(src, dest)
        c = dict(old[key])
        c["file"] = f"img/{src.name}"
        credits[key] = c
    for key in REUSE_CUT:
        src = NOKHCHI / "public" / "img" / "cut" / f"{key}.png"
        if not (OUT / "cut" / src.name).exists():
            shutil.copy(src, OUT / "cut" / src.name)

    missing = []
    for key, (name, width) in FILES.items():
        have = next(OUT.glob(key + ".*"), None)
        if key in credits and have:
            continue
        try:
            ii = info(name)
            if have:  # Datei liegt schon da (z. B. von Hand geholt) – nur Nachweis ergänzen
                credits[key] = credit(key, name, ii, f"img/{have.name}")
                print(f"{key:22s} (vorhanden)  {credits[key]['license']}")
                out_json.write_text(json.dumps(credits, ensure_ascii=False, indent=1))
                continue
            # Nur Standard-Vorschaubreiten unterhalb der Originalbreite (Originale werden gedrosselt)
            ok = [w for w in STD_WIDTHS if w <= width and w < ii.get("width", 0)]
            urls = []
            if key in SMALL_ORIGINAL:
                urls.append(ii["url"])
            if ok:
                urls.append(info(name, ok[0])["thumburl"])
            elif not urls:
                urls.append(ii["url"])
            dest = None
            for url in urls:
                ext = Path(urllib.parse.urlparse(url).path).suffix.lower().replace(".jpeg", ".jpg") or ".jpg"
                dest = OUT / f"{key}{ext}"
                try:
                    download(url, dest, tries=4 if url != urls[-1] else 12)
                    break
                except RuntimeError:
                    if url == urls[-1]:
                        raise
            credits[key] = credit(key, name, ii, f"img/{dest.name}")
            print(f"{key:22s} {ii.get('width')}×{ii.get('height')}  {credits[key]['license']}")
        except RuntimeError as e:
            missing.append(key)
            print(f"{key:22s} FEHLT ({e})")
        out_json.parent.mkdir(exist_ok=True)
        out_json.write_text(json.dumps(credits, ensure_ascii=False, indent=1))
        time.sleep(1.0)

    vdir = ROOT / "assets-src" / "video"
    vdir.mkdir(parents=True, exist_ok=True)
    for key, name in VIDEOS.items():
        dest = vdir / f"{key}.webm"
        if key in credits and dest.exists():
            continue
        try:
            ii = info(name)
            u = ii["url"]  # …/commons/a/ab/<Name>.webm → transkodierte Fassung daneben
            parts = urllib.parse.urlparse(u).path.split("/")
            fname = parts[-1]
            tu = f"https://upload.wikimedia.org/wikipedia/commons/transcoded/{parts[-3]}/{parts[-2]}/{fname}/{fname}.1080p.vp9.webm"
            try:
                download(tu, dest)
            except Exception:
                download(u, dest)
            credits[key] = credit(key, name, ii, f"video/{dest.name}")
            print(f"{key:22s} Video  {credits[key]['license']}")
        except RuntimeError as e:
            missing.append(key)
            print(f"{key:22s} FEHLT ({e})")
        out_json.write_text(json.dumps(credits, ensure_ascii=False, indent=1))

    if missing:
        print("Fehlend (später erneut starten):", ", ".join(missing))


if __name__ == "__main__":
    main()
