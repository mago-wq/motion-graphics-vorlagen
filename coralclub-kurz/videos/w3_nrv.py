"""Wissen 3/5 – Was heißt NRV? Stil: Blaupause (Raster, Lupe, Ringdiagramm, Figuren)."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bild import *

TOTAL = 420
NAVY, LINE, WHT, CYAN, ORA = (12, 32, 72), (35, 70, 130), (240, 246, 255), (90, 210, 255), (255, 150, 60)

@lru_cache(maxsize=1)
def grid():
    g = canvas(NAVY); d = ImageDraw.Draw(g)
    for x in range(0, W, 60): d.line([x, 0, x, H], fill=LINE, width=1)
    for y in range(0, H, 60): d.line([0, y, W, y], fill=LINE, width=1)
    return g

def tag(cv): put_left(cv, text_img('MAGNESIUM-WISSEN 3/5', 'mono', 34, NAVY, CYAN, 14, 6), 80, 250)

def lupe(cv, cx, cy, r, inner):
    m = Image.new('L', (W, H)); ImageDraw.Draw(m).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    cv.paste(inner, (0, 0), m); d = ImageDraw.Draw(cv)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=ORA, width=18)
    a = math.radians(45); d.line([cx + math.cos(a) * r, cy + math.sin(a) * r, cx + math.cos(a) * (r + 190), cy + math.sin(a) * (r + 190)], fill=ORA, width=44)

def person(col, h=260):
    im = Image.new('RGBA', (160, h)); d = ImageDraw.Draw(im)
    d.ellipse([45, 0, 115, 70], fill=col); d.rounded_rectangle([25, 85, 135, h], 50, fill=col)
    return im

def donut(cv, cx, cy, r, pct, f):
    d = ImageDraw.Draw(cv)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=LINE, width=60)
    d.arc([cx - r, cy - r, cx + r, cy + r], -90, -90 + 360 * pct, fill=CYAN, width=60)
    put(cv, text_img(f'{int(round(pct * 100))} %', 'black', 150, WHT), cx, cy)

def frame(i):
    cv = grid().copy()
    if i < 80:
        put(cv, stroke_text('„32 % NRV“', 'black', 140, WHT, NAVY, 10), W / 2, 430, back(i / 6), ease_out(i / 3))
        put(cv, stroke_text('Was heißt das?', 'black', 110, CYAN, NAVY, 10), W / 2, 570, back((i - 5) / 6), ease_out((i - 5) / 3))
        pack = asset('oceanmin.png', 900); sc = 1.5 - .5 * ease_out(i / 8)
        put(cv, shadow('oceanmin.png', 900, .6), W / 2, 1180, sc, 1); put(cv, pack, W / 2, 1140, sc, 1)
        if i >= 20:  # Lupe fährt übers Etikett, innen 2x vergrößert
            t = ease_io((i - 20) / 40); lx, ly = 360 + 260 * t, 1360 - 120 * t
            inner = cv.resize((W * 2, H * 2), Image.BILINEAR).crop((int(lx * 2 - lx), int(ly * 2 - ly), int(lx * 2 - lx) + W, int(ly * 2 - ly) + H))
            lupe(cv, lx, ly, 170, inner)
        tag(cv); return cv
    if i < 190:
        f = i - 80
        put(cv, text_img('NRV =', 'black', 120, CYAN), W / 2, 380, back(f / 6), ease_out(f / 3))
        put(cv, text_img('Nährstoffbezugswert', 'black', 110, WHT), W / 2, 500, back((f - 4) / 6), ease_out((f - 4) / 3))
        put(cv, text_img('EU-Vergleichswert, damit Packungen vergleichbar sind', 'bold', 40, (170, 200, 240)), W / 2, 600, 1, ease_out((f - 10) / 6))
        donut(cv, W / 2, 1020, 280, .32 * ease_io((f - 20) / 40), f)
        put(cv, text_img('120 mg von 375 mg', 'black', 90, WHT), W / 2, 1420, 1, ease_out((f - 30) / 6))
        put(cv, text_img('375 mg = 100 % NRV bei Magnesium', 'bold', 48, ORA), W / 2, 1520, 1, ease_out((f - 40) / 6))
        put(cv, text_img('Quelle: VO (EU) Nr. 1169/2011, Anhang XIII', 'mono', 24, (150, 180, 220)), W / 2, 1620, 1, ease_out((f - 40) / 6))
        tag(cv); return cv
    if i < 320:
        f = i - 190
        put(cv, text_img('Aber: kein', 'black', 110, WHT), W / 2, 380, 1, ease_out(f / 4))
        put(cv, text_img('persönlicher Bedarf', 'black', 110, ORA), W / 2, 500, back((f - 4) / 6), ease_out((f - 4) / 3))
        for k, (lab, mg, col) in enumerate([('Frauen', '300 mg', CYAN), ('Männer', '350 mg', ORA)]):
            t = (f - 14 - k * 10) / 7; x = 330 + k * 420
            put(cv, person(col, 260 + 30 * k), x, 900, back(t, 2), ease_out(t * 2))
            put(cv, text_img(lab, 'bold', 56, WHT), x, 1100, 1, ease_out(t))
            put(cv, text_img(mg, 'black', 96, col), x, 1200, 1, ease_out(t))
        put(cv, text_img('pro Tag (DGE-Schätzwerte, ab 25 J.)', 'bold', 44, (170, 200, 240)), W / 2, 1330, 1, ease_out((f - 34) / 6))
        put(cv, text_img('Den Großteil liefert normales Essen.', 'black', 60, NAVY, WHT, 20, 16), W / 2, 1480, back((f - 50) / 7), ease_out((f - 50) / 4))
        tag(cv); return cv
    f = i - 320
    put(cv, text_img('Jetzt kannst du', 'black', 110, WHT), W / 2, 420, 1, ease_out(f / 4))
    put(cv, text_img('Packungen lesen.', 'black', 110, CYAN), W / 2, 540, back((f - 4) / 6), ease_out((f - 4) / 3))
    product(cv, 'oceanmin.png', 420, W / 2, 900, (f - 8) / 10, f, op=.6)
    put(cv, text_img('Oceanmin: 120 mg = 32 % NRV pro Stick', 'bold', 46, WHT), W / 2, 1200, 1, ease_out((f - 16) / 5))
    put(cv, text_img('Teil 4: Viel hilft viel? · Folgen', 'black', 60, ORA), W / 2, 1290, 1, ease_out((f - 20) / 5))
    put(cv, text_img(CTA_ZEILE.upper(), 'black', 76, NAVY, CYAN, 22, 10), W / 2, 1400, back((f - 22) / 7), ease_out((f - 22) / 4))
    pflicht(cv, ease_out((f - 22) / 8), (150, 180, 220), y=1520, size=21)
    tag(cv); return cv

CUES = [('einschlag.wav', 0), ('zoom.wav', 0, .6), ('pop.wav', 5), ('wisch.wav', 20, .6), ('ding.wav', 58), ('wisch.wav', 80),
        ('tick.wav', 100), ('zoom.wav', 100, .4), ('kaching.wav', 140), ('wisch.wav', 190), ('pop.wav', 204), ('pop.wav', 214),
        ('stempel.wav', 240, .6), ('wisch.wav', 320), ('ding.wav', 340)]

if __name__ == '__main__': run('w3-nrv', frame, TOTAL, CUES)
