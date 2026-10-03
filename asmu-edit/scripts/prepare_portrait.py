#!/usr/bin/env python3
"""Ibn-Battuta-Büste für den Einstieg: hochrechnen und freistellen.

  public/bilder/ibn_battuta.jpg  (Commons-Vorschau 500 px, eigentlich PNG; fetch_assets.py)
  -> public/bilder/ibn_battuta_frei.png  (4× hochgerechnet, Hintergrund transparent)

Hochrechnen: Real-ESRGAN x4 über onnxruntime (~/.esrgan/real_esrgan_x4.onnx, wie in
nokhchi-edit/scripts/upscale.py). Freistellen: rembg mit BiRefNet (lädt das Modell beim ersten Lauf).
Die Augen deckt nicht dieses Skript ab, sondern der Balken in src/components/Portraet.tsx
(Lage in AUGEN in src/config.ts, relativ zum Bild) – so bleibt er bei jeder Bewegung darüber.
"""
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public/bilder/ibn_battuta.jpg"
OUT = ROOT / "public/bilder/ibn_battuta_frei.png"
MODEL = Path.home() / ".esrgan" / "real_esrgan_x4.onnx"
TILE, PAD = 256, 16


def upscale(im: Image.Image) -> Image.Image:
	sess = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])
	a = np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0
	h, w, _ = a.shape
	out = np.zeros((h * 4, w * 4, 3), np.float32)
	for y in range(0, h, TILE):
		for x in range(0, w, TILE):
			y0, x0 = max(0, y - PAD), max(0, x - PAD)
			y1, x1 = min(h, y + TILE + PAD), min(w, x + TILE + PAD)
			res = sess.run(None, {"input": a[y0:y1, x0:x1].transpose(2, 0, 1)[None]})[0][0].transpose(1, 2, 0)
			oy, ox = (y - y0) * 4, (x - x0) * 4
			th, tw = min(TILE, h - y) * 4, min(TILE, w - x) * 4
			out[y * 4:y * 4 + th, x * 4:x * 4 + tw] = res[oy:oy + th, ox:ox + tw]
	return Image.fromarray((out.clip(0, 1) * 255 + 0.5).astype(np.uint8))


def main() -> None:
	if not MODEL.exists():
		raise SystemExit(f"Modell fehlt: {MODEL} (https://huggingface.co/SceneWorks/real-esrgan-onnx)")
	src = Image.open(SRC).convert("RGB")
	big = upscale(src)
	mask = remove(src, session=new_session("birefnet-general"), only_mask=True, post_process_mask=True)
	# Maske auf die große Fassung, Kante minimal einziehen und weich machen (kein weißer Saum)
	mask = mask.resize(big.size, Image.LANCZOS).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(2))
	big.putalpha(mask)
	big.save(OUT, optimize=True)
	cover = np.asarray(mask, dtype=np.float32).mean() / 255
	print(f"{OUT.relative_to(ROOT)}: {big.size[0]}×{big.size[1]}, Büste deckt {cover:.0%} ab")


if __name__ == "__main__":
	main()
