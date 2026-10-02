"""Wissen 2/5 – 2-Liter-Regel. Stil: Aqua (Splash-Foto, animiertes Glas mit Wellen, Icons)."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bild import *

TOTAL = 480
TOP, BOT, WHT, DEEP, SUN, RED = (120, 220, 235), (10, 120, 170), (255, 255, 255), (8, 60, 110), (255, 200, 40), (235, 70, 70)

@lru_cache(maxsize=1)
def grad():
    g = Image.new('RGBA', (1, H))
    for y in range(H): g.putpixel((0, y), mix(TOP, BOT, y / H) + (255,))
    return g.resize((W, H))

def tag(cv): put_left(cv, text_img('MAGNESIUM-WISSEN 2/5', 'black', 38, DEEP, WHT, 16, 24), 80, 250)

def glass(cv, cx, top, w, h, level, f, marks=True):
    """Glas mit Welle; level 0..1 der Höhe."""
    lay = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(lay)
    x0, x1, y1 = cx - w / 2, cx + w / 2, top + h
    wy = y1 - h * level
    pts = [(x0, y1)] + [(x, wy + math.sin(x / 40 + f / 5) * 10 * (level > 0)) for x in range(int(x0), int(x1) + 1, 8)] + [(x1, y1)]
    if level > 0: d.polygon(pts, fill=(255, 255, 255, 170))
    for k in range(6):  # Bläschen
        bx = x0 + 40 + (k * 97) % (w - 80); by = y1 - ((f * 6 + k * 70) % max(1, int(h * level))) if level > .05 else -99
        if by > wy: d.ellipse([bx - 8, by - 8, bx + 8, by + 8], outline=(255, 255, 255, 230), width=3)
    d.rounded_rectangle([x0, top, x1, y1], 30, outline=WHT, width=10)
    cv.alpha_composite(lay)
    if marks:
        for k, lab in enumerate(['0,5 l', '1,0 l', '1,5 l', '2,0 l']):
            yy = y1 - h * (k + 1) / 4; ImageDraw.Draw(cv).line([x1 + 10, yy, x1 + 50, yy], fill=WHT, width=5)
            put_left(cv, text_img(lab, 'black', 48, WHT), x1 + 66, yy)

def icon(kind, col):
    im = Image.new('RGBA', (160, 160)); d = ImageDraw.Draw(im)
    if kind == 'sonne':
        d.ellipse([45, 45, 115, 115], fill=SUN)
        for a in range(0, 360, 45):
            r = math.radians(a); d.line([80 + math.cos(r) * 52, 80 + math.sin(r) * 52, 80 + math.cos(r) * 72, 80 + math.sin(r) * 72], fill=SUN, width=10)
    elif kind == 'blitz':
        d.polygon([(95, 10), (40, 90), (78, 90), (60, 150), (122, 62), (84, 62)], fill=SUN)
    else:
        d.rounded_rectangle([65, 15, 95, 110], 15, outline=WHT, width=8); d.ellipse([50, 95, 110, 150], fill=RED); d.rectangle([74, 55, 86, 110], fill=RED)
    return im

def frame(i):
    if i < 70:
        cv = cover('foto_wasser.jpg', i / 70, (1.05, 1.3), (.47, .5)); shade(cv, .05, .45)
        put(cv, stroke_text('2 Liter Wasser', 'black', 140, sw=12), W / 2, 520, back(i / 6), ease_out(i / 3))
        put(cv, stroke_text('am Tag?', 'black', 140, sw=12), W / 2, 680, back((i - 4) / 6), ease_out((i - 4) / 3))
        put(cv, text_img('Sagt die DGE so nicht.', 'black', 84, WHT, DEEP, 28, 40), W / 2, 1150, back((i - 30) / 7), ease_out((i - 30) / 4))
        tag(cv); return cv
    cv = grad().copy()
    if i < 200:
        f = i - 70
        lvl = .75 * ease_io((f - 10) / 60)
        glass(cv, 430, 560, 460, 900, lvl, f)
        put(cv, text_img('Die DGE empfiehlt', 'black', 80, WHT), W / 2, 390, 1, ease_out(f / 5))
        if f > 70:
            put(cv, text_img('rund 1,5 Liter', 'black', 110, DEEP, WHT, 26, 40), 430, 1560, back((f - 70) / 7), ease_out((f - 70) / 4))
            # 2,0 l durchgestrichen
            yy = 560 + 900 * 0; k = ease_out((f - 80) / 8)
            ImageDraw.Draw(cv).line([700, yy - 10, 700 + 200 * k, yy + 30 * k], fill=RED, width=12)
        put(cv, text_img('über Getränke pro Tag', 'bold', 52, WHT), W / 2, 1680, 1, ease_out((f - 76) / 6))
        put(cv, text_img('Quelle: DGE, 10 Regeln für eine gesunde Ernährung', 'med', 26, WHT), W / 2, 1780, 1, ease_out((f - 76) / 6))
    elif i < 330:
        f = i - 200
        put(cv, text_img('Mehr brauchst du bei', 'black', 96, WHT), W / 2, 420, 1, ease_out(f / 5))
        for k, (ic, lab) in enumerate([('sonne', 'Hitze'), ('blitz', 'Sport'), ('fieber', 'Fieber')]):
            t = (f - 10 - k * 14) / 7; y = 680 + k * 280
            card = Image.new('RGBA', (840, 230)); ImageDraw.Draw(card).rounded_rectangle([0, 0, 839, 229], 40, fill=(255, 255, 255, 60))
            card.alpha_composite(icon(ic, WHT), (40, 35)); card.alpha_composite(text_img(lab, 'black', 110, WHT), (240, 60))
            put(cv, card, W / 2 + (1 - ease_out(t)) * 300, y, 1, ease_out(t * 2))
        put(cv, text_img('Einen Teil liefert zusätzlich das Essen.', 'bold', 50, DEEP), W / 2, 1550, 1, ease_out((f - 60) / 6))
    elif i < 400:
        f = i - 330
        put(cv, text_img('Einfacher Trick:', 'black', 100, WHT), W / 2, 400, 1, ease_out(f / 5))
        for k in range(2):
            glass(cv, 330 + k * 420, 600, 260, 640, ease_io((f - 8 - k * 10) / 25), f, marks=False)
            put(cv, text_img('750 ml', 'black', 70, WHT), 330 + k * 420, 1310, 1, ease_out((f - 20 - k * 10) / 5))
        put(cv, text_img('= 1,5 Liter', 'black', 120, DEEP, WHT, 26, 40), W / 2, 1480, back((f - 44) / 7), ease_out((f - 44) / 4))
    else:
        f = i - 400
        put(cv, text_img('In eine davon:', 'black', 90, WHT), W / 2, 450, 1, ease_out(f / 5))
        put(cv, text_img('1 Stick Oceanmin', 'black', 110, DEEP, WHT, 26, 40), W / 2, 590, back((f - 4) / 7), ease_out((f - 4) / 4))
        product(cv, 'stick-pulver.png', 560, W / 2, 1000, (f - 6) / 10, f, rot=-8, op=.3)
        put(cv, text_img('Teil 3: Was heißt NRV? · Folgen', 'black', 64, WHT), W / 2, 1370, 1, ease_out((f - 16) / 6))
        put(cv, text_img(CTA_ZEILE.upper(), 'black', 76, DEEP, WHT, 22, 30), W / 2, 1470, back((f - 20) / 7), ease_out((f - 20) / 4))
        pflicht(cv, ease_out((f - 20) / 8), (225, 245, 250), y=1580, size=21)
    tag(cv); return cv

CUES = [('wasser.wav', 0), ('einschlag.wav', 0, .6), ('pop.wav', 4), ('stempel.wav', 30, .6), ('wisch.wav', 70),
        ('wasser.wav', 80), ('wasser.wav', 110, .5), ('ding.wav', 140), ('zapp.wav', 150, .4), ('wisch.wav', 200)] + \
       [('pop.wav', 210 + k * 14) for k in range(3)] + [('wisch.wav', 330), ('wasser.wav', 338, .6), ('wasser.wav', 348, .5),
        ('kaching.wav', 374), ('wisch.wav', 400), ('ding.wav', 420)]

if __name__ == '__main__': run('w2-wasser', frame, TOTAL, CUES)
