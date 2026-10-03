"""Wissen 1/5 – Bananen-Mythos. Stil: Foto-Pop (echte Fotos, TikTok-Untertitel, gezeichnete Bananen)."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bild import *

TOTAL = 450
YEL, GRN, RED, INK, WHT = (255, 214, 0), (60, 140, 60), (230, 40, 40), (20, 20, 20), (255, 255, 255)

@lru_cache(maxsize=1)
def banana():
    im = Image.new('RGBA', (240, 240)); d = ImageDraw.Draw(im)
    d.arc([20, -40, 220, 200], 25, 155, fill=(255, 205, 40), width=56)
    d.arc([20, -40, 220, 200], 25, 155, fill=(240, 180, 20), width=14)
    d.ellipse([196, 104, 222, 130], fill=(90, 60, 20)); d.ellipse([18, 104, 44, 130], fill=(90, 60, 20))
    return im.rotate(-15, resample=Image.BICUBIC)

def tag(cv): put_left(cv, text_img('MAGNESIUM-WISSEN 1/5', 'black', 38, INK, YEL, 16, 10), 80, 250)

def frame(i):
    if i < 60:  # Hook: Foto + Behauptung + Stempel
        cv = cover('foto_banane.jpg', i / 60, (1.15, 1.35), (.12, .55)); shade(cv, .1, .5)
        put(cv, stroke_text('Banane =', 'black', 150), W / 2, 560, back(i / 6), ease_out(i / 3))
        put(cv, stroke_text('viel Magnesium?', 'black', 130), W / 2, 720, back((i - 4) / 6), ease_out((i - 4) / 3))
        if i >= 26:
            put(cv, text_img(' FALSCH ', 'black', 200, WHT, RED, 20, 16), W / 2, 1150, 2 - ease_out((i - 26) / 6), ease_out((i - 26) / 2), rot=-8)
        tag(cv); return cv
    if i < 165:  # echtes Foto Kürbiskerne
        f = i - 60
        cv = cover('foto_kuerbis.jpg', f / 105, (1.0, 1.2)); shade(cv, .15, .7)
        put(cv, stroke_text('Kürbiskerne', 'black', 140), W / 2, 520, back(f / 6), ease_out(f / 3))
        put(cv, stroke_text('über 400 mg', 'black', 190, YEL), W / 2, 720, back((f - 8) / 6), ease_out((f - 8) / 3))
        put(cv, stroke_text('pro 100 g', 'bold', 70), W / 2, 870, 1, ease_out((f - 14) / 5))
        put(cv, text_img('Banane: nur ca. 30 mg', 'black', 76, INK, WHT, 26, 40), W / 2, 1150, back((f - 34) / 7), ease_out((f - 34) / 4))
        put(cv, stroke_text('Werte gerundet, je nach Quelle schwankend (u. a. USDA FoodData Central)', 'med', 24, sw=4), W / 2, 1560, 1, ease_out((f - 10) / 8))
        credit(cv, 'Foto: Daniel Schwen, Wikimedia Commons, CC BY 3.0')
        tag(cv); return cv
    if i < 300:  # 10 Bananen zählen
        f = i - 165; cv = canvas((24, 58, 44))
        put(cv, text_img('Für 300 mg am Tag*', 'black', 96, WHT), W / 2, 420, 1, ease_out(f / 5))
        put(cv, text_img('bräuchtest du', 'black', 96, WHT), W / 2, 530, 1, ease_out((f - 3) / 5))
        n = min(10, max(0, (f - 10) // 6 + 1))
        for k in range(n):
            t = (f - 10 - k * 6) / 6; x = 230 + (k % 5) * 155; y = 800 + (k // 5) * 230
            put(cv, banana(), x, y, 0.75 * back(t, 2.2), ease_out(t * 2))
        put(cv, text_img(f'{n} Bananen', 'black', 170, YEL), W / 2, 1300, 1 + .08 * (1 - clamp((f - 10) % 6 / 6)) if n < 10 else 1, ease_out((f - 10) / 3))
        put(cv, text_img('* DGE-Schätzwert Frauen ab 25 J.: 300 mg/Tag (Männer: 350 mg)', 'med', 26, (190, 210, 195)), W / 2, 1560, 1, ease_out((f - 20) / 8))
        tag(cv); return cv
    if i < 360:
        f = i - 300
        cv = cover('foto_kuerbis.jpg', f / 60, (1.3, 1.5), (.6, .5)); shade(cv, .2, .6)
        put(cv, stroke_text('Oder einfach', 'black', 120), W / 2, 640, back(f / 6), ease_out(f / 3))
        put(cv, stroke_text('ca. 75 g', 'black', 230, YEL), W / 2, 830, back((f - 6) / 6), ease_out((f - 6) / 3))
        put(cv, stroke_text('Kürbiskerne', 'black', 120), W / 2, 1020, back((f - 10) / 6), ease_out((f - 10) / 3))
        credit(cv, 'Foto: Daniel Schwen, Wikimedia Commons, CC BY 3.0'); tag(cv); return cv
    f = i - 360; cv = canvas(GRN)
    put(cv, text_img('Teil 2: Die 2-Liter-Regel', 'black', 90, WHT), W / 2, 520, back(f / 7), ease_out(f / 4))
    put(cv, text_img('Folgen, um es nicht zu verpassen', 'bold', 54, YEL), W / 2, 630, 1, ease_out((f - 6) / 5))
    put(cv, text_img('Oceanmin: 120 mg Magnesium pro Stick', 'bold', 48, WHT), W / 2, 900, 1, ease_out((f - 14) / 5))
    put(cv, text_img(CTA_ZEILE.upper(), 'black', 80, INK, YEL, 26, 30), W / 2, 1010, back((f - 18) / 7), ease_out((f - 18) / 4))
    product(cv, 'oceanmin.png', 260, W / 2, 1270, (f - 20) / 10, f, op=.35)
    pflicht(cv, ease_out((f - 20) / 8), (220, 240, 220), y=1520, size=21)
    tag(cv); return cv

CUES = [('einschlag.wav', 0), ('wisch.wav', 0, .5), ('pop.wav', 4), ('stempel.wav', 26), ('zapp.wav', 26, .5),
        ('wisch.wav', 60), ('einschlag.wav', 68, .6), ('ding.wav', 94), ('wisch.wav', 165)] + \
       [('pop.wav', 175 + k * 6, .8) for k in range(10)] + [('kaching.wav', 230), ('wisch.wav', 300), ('einschlag.wav', 306, .6),
        ('wisch.wav', 360), ('ding.wav', 378)]

if __name__ == '__main__': run('w1-banane', frame, TOTAL, CUES)
