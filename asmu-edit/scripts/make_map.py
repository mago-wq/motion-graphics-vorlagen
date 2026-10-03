#!/usr/bin/env python3
"""Karte für die Ibn-Battuta-Szene: Landflächen + Reiseroute als SVG-Pfade -> src/karte.json.

Quelle: Natural Earth 1:50m Land (gemeinfrei), wird von scripts/fetch_assets.sh nach
assets-src/karte/ne_50m_land.geojson geladen. Benötigt: shapely.

Projektion: plattkartenartig, x mit cos(25°) gestaucht, damit Nordafrika bis China
nicht zu breit wirkt. 1 Grad Breite = S Kartenpixel.
"""
import json
import math
from pathlib import Path

from shapely.geometry import box, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src/karte/ne_50m_land.geojson"
OUT = ROOT / "src/karte.json"

S = 20.0  # Kartenpixel je Grad
LON0, LON1, LAT0, LAT1 = -24.0, 128.0, -14.0, 56.0  # Ausschnitt
COS = math.cos(math.radians(25))
SIMPLIFY = 0.06  # Grad

# Ibn Battutas Reisen 1325–1354, vereinfacht in der Reihenfolge seiner Stationen
# (Rihla; Wikipedia „Ibn Battuta“). label = wird auf der Karte beschriftet.
ROUTE = [
	("Tanger", 35.77, -5.80, True),
	("Tunis", 36.81, 10.18, False),
	("Alexandria", 31.20, 29.92, False),
	("Kairo", 30.04, 31.24, False),
	("Damaskus", 33.51, 36.29, False),
	("Medina", 24.47, 39.61, False),
	("Mekka", 21.42, 39.83, True),
	("Bagdad", 33.31, 44.37, False),
	("Täbris", 38.08, 46.29, False),
	("Mekka", 21.42, 39.83, False),
	("Aden", 12.79, 45.02, False),
	("Mogadischu", 2.05, 45.32, False),
	("Kilwa", -8.96, 39.51, False),
	("Oman", 22.57, 59.53, False),
	("Konstantinopel", 41.01, 28.98, True),
	("Astrachan", 46.35, 48.04, False),
	("Buchara", 39.77, 64.42, False),
	("Samarkand", 39.65, 66.96, False),
	("Delhi", 28.61, 77.21, True),
	("Calicut", 11.26, 75.78, False),
	("Malediven", 4.17, 73.51, False),
	("Sri Lanka", 7.29, 80.64, False),
	("Chittagong", 22.36, 91.78, False),
	("Sumatra", 5.10, 97.15, False),
	("Quanzhou", 24.87, 118.68, True),
	("Fès", 34.03, -5.00, False),
	("Granada", 37.18, -3.60, False),
	("Timbuktu", 16.77, -3.01, True),
	("Fès", 34.03, -5.00, False),
]


def proj(lon: float, lat: float) -> tuple[float, float]:
	return ((lon - LON0) * COS * S, (LAT1 - lat) * S)


def ring_path(coords) -> str:
	pts = [proj(x, y) for x, y in coords]
	return "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z"


def main() -> None:
	data = json.loads(SRC.read_text())
	clip = box(LON0 - 2, LAT0 - 2, LON1 + 2, LAT1 + 2)
	geoms = [shape(f["geometry"]).intersection(clip) for f in data["features"]]
	land = unary_union([g for g in geoms if not g.is_empty]).simplify(SIMPLIFY, preserve_topology=True)
	polys = list(land.geoms) if land.geom_type == "MultiPolygon" else [land]
	paths = []
	for p in polys:
		if p.area < 0.15:  # kleine Inseln weglassen (Grad²)
			continue
		d = ring_path(p.exterior.coords)
		for hole in p.interiors:
			d += ring_path(hole.coords)
		paths.append(d)
	w, h = proj(LON1, LAT0)
	route = [{"name": n, "x": round(proj(lon, lat)[0], 1), "y": round(proj(lon, lat)[1], 1), "label": lab}
		for n, lat, lon, lab in ROUTE]
	proj_info = {"s": S, "lon0": LON0, "lat1": LAT1, "cos": round(COS, 6)}
	OUT.write_text(json.dumps({"width": round(w), "height": round(h), "proj": proj_info, "land": paths, "route": route},
		ensure_ascii=False, separators=(",", ":")))
	print(f"{OUT.relative_to(ROOT)}: {len(paths)} Flächen, {OUT.stat().st_size // 1024} KB, {round(w)}×{round(h)}")


if __name__ == "__main__":
	main()
