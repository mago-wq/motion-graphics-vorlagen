"""Bild-Bausteine: Fotos formatfüllend mit Ken-Burns-Fahrt, Text mit Kontur (TikTok-Untertitelstil)."""
from engine import *

@lru_cache(maxsize=None)
def _base(name, h=2300):
    im = Image.open(os.path.join(A, name)).convert('RGB')
    s = max(h / im.height, (W * 1.25) / im.width)
    return im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)

def cover(name, t, zoom=(1.0, 1.15), focus=(.5, .5), pan=(0, 0)):
    """Hochkant-Ausschnitt aus einem Foto. t 0..1 = Fortschritt der Fahrt, focus = Bildmitte (0..1)."""
    b = _base(name); z = zoom[0] + (zoom[1] - zoom[0]) * ease_io(t)
    cw, ch = W * (b.height / H) / z, b.height / z
    cx = b.width * focus[0] + pan[0] * ease_io(t) * b.width; cy = b.height * focus[1] + pan[1] * ease_io(t) * b.height
    x0 = clamp(cx - cw / 2, 0, b.width - cw); y0 = clamp(cy - ch / 2, 0, b.height - ch)
    return b.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H), Image.BILINEAR).convert('RGBA')

@lru_cache(maxsize=None)
def stroke_text(text, font, size, fill=(255, 255, 255), stroke=(0, 0, 0), sw=10):
    f = F(font, size); l, t, r, b = f.getbbox(text, stroke_width=sw)
    im = Image.new('RGBA', (r - l, b - t)); ImageDraw.Draw(im).text((-l, -t), text, font=f, fill=fill, stroke_width=sw, stroke_fill=stroke)
    return im

def shade(cv, top=0.0, bottom=0.55):
    g = Image.new('L', (1, 256))
    for y in range(256): g.putpixel((0, y), int(255 * (top + (bottom - top) * y / 255)))
    m = g.resize((W, H)); blk = Image.new('RGBA', (W, H), (0, 0, 0, 255)); blk.putalpha(m); cv.alpha_composite(blk)

def credit(cv, text, a=1.0):
    put(cv, text_img(text, 'med', 22, (255, 255, 255), (0, 0, 0), 8, 6), W / 2, 1830, 1, a * .85)
