"""Wissen 4/5 – Viel hilft viel? Stil: Dramatisch (Feuerfoto, Tacho, Warnschilder)."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bild import *

TOTAL = 470
COAL, WHT, ORA, RED, GRN, GRY = (18, 16, 16), (250, 245, 240), (255, 140, 30), (230, 50, 40), (60, 200, 110), (150, 140, 135)
MAXMG = 400

def tag(cv): put_left(cv, text_img('MAGNESIUM-WISSEN 4/5', 'black', 38, COAL, ORA, 16, 4), 80, 250)

def tacho(cv, cx, cy, r, val, f):
    d = ImageDraw.Draw(cv); a0, a1 = 180, 360
    ang = lambda v: a0 + (a1 - a0) * v / MAXMG
    d.arc([cx - r, cy - r, cx + r, cy + r], a0, ang(250), fill=GRN, width=50)
    d.arc([cx - r, cy - r, cx + r, cy + r], ang(250), a1, fill=RED, width=50)
    for v in range(0, MAXMG + 1, 50):
        a = math.radians(ang(v)); d.line([cx + math.cos(a) * (r - 70), cy + math.sin(a) * (r - 70), cx + math.cos(a) * (r - 40), cy + math.sin(a) * (r - 40)], fill=WHT, width=6)
        if v % 100 == 0: put(cv, text_img(str(v), 'bold', 40, GRY), cx + math.cos(a) * (r - 120), cy + math.sin(a) * (r - 120))
    a = math.radians(ang(val)); d.line([cx, cy, cx + math.cos(a) * (r - 30), cy + math.sin(a) * (r - 30)], fill=WHT, width=16)
    d.ellipse([cx - 30, cy - 30, cx + 30, cy + 30], fill=WHT)

def warn(col=ORA):
    im = Image.new('RGBA', (130, 120)); d = ImageDraw.Draw(im)
    d.polygon([(65, 5), (125, 112), (5, 112)], fill=col); d.rectangle([58, 38, 72, 80], fill=COAL); d.ellipse([57, 88, 73, 104], fill=COAL)
    return im

def frame(i):
    if i < 80:
        cv = cover('foto_mg_brennt.jpg', i / 80, (1.0, 1.2), (.52, .5)); shade(cv, .1, .5)
        put(cv, stroke_text('Das ist Magnesium.', 'black', 110, sw=10), W / 2, 480, back(i / 6), ease_out(i / 3))
        put(cv, stroke_text('Pur. Brennend.', 'black', 110, ORA, sw=10), W / 2, 610, back((i - 6) / 6), ease_out((i - 6) / 3))
        put(cv, text_img('Viel hilft viel?', 'black', 120, WHT, RED, 30, 16), W / 2, 1250, back((i - 34) / 7), ease_out((i - 34) / 4), rot=4)
        credit(cv, 'Foto: Capt. John Yossarian, Wikimedia Commons, CC BY-SA 3.0'); tag(cv); return cv
    cv = canvas(COAL); grain(cv, i, 8)
    if i < 230:
        f = i - 80
        if f < 70: val = 400 * ease_io(f / 30) if f < 30 else 400 - 150 * ease_io((f - 30) / 20)
        else: val = 250 - 130 * ease_io((f - 90) / 25) if f > 90 else 250
        tacho(cv, W / 2, 1050, 400, val + math.sin(f * 1.7) * 3 * (f < 60), f)
        put(cv, text_img('Magnesium aus Präparaten pro Tag', 'black', 64, WHT), W / 2, 420, 1, ease_out(f / 5))
        if f > 50:
            put(cv, text_img('BfR empfiehlt max. 250 mg', 'black', 76, COAL, ORA, 22, 10), W / 2, 1200, back((f - 50) / 7), ease_out((f - 50) / 4))
        if f > 110:
            put(cv, text_img('1 Stick Oceanmin = 120 mg', 'black', 66, COAL, GRN, 20, 10), W / 2, 1330, back((f - 110) / 7), ease_out((f - 110) / 4))
        put(cv, text_img('Quelle: BfR, Höchstmengenvorschläge für NEM (2021)', 'med', 26, GRY), W / 2, 1480, 1, ease_out((f - 50) / 6))
    elif i < 380:
        f = i - 230
        put(cv, text_img('Warum die Grenze?', 'black', 110, WHT), W / 2, 420, 1, ease_out(f / 5))
        for k, txt in enumerate(['Zu viel auf einmal kann abführend wirken', 'BfR: auf mind. 2 Portionen verteilen', 'Magnesium aus normalem Essen zählt nicht mit']):
            t = (f - 10 - k * 18) / 7; y = 680 + k * 250
            card = Image.new('RGBA', (900, 210)); ImageDraw.Draw(card).rounded_rectangle([0, 0, 899, 209], 30, fill=(40, 36, 34, 255))
            card.alpha_composite(warn(ORA if k < 2 else GRN), (30, 45))
            for j, r in enumerate(wrap(txt, 'bold', 52, 680)): card.alpha_composite(text_img(r, 'bold', 52, WHT), (190, 50 + j * 64))
            put(cv, card, W / 2 + (1 - ease_out(t)) * 400, y, 1, ease_out(t * 2))
        put(cv, text_img('Bei Erkrankungen oder Medikamenten:', 'bold', 46, ORA), W / 2, 1460, 1, ease_out((f - 80) / 6))
        put(cv, text_img('vorher ärztlich beraten lassen.', 'bold', 46, ORA), W / 2, 1520, 1, ease_out((f - 80) / 6))
    else:
        f = i - 380
        put(cv, text_img('Lieber wissen,', 'black', 120, WHT), W / 2, 440, 1, ease_out(f / 4))
        put(cv, text_img('was man nimmt.', 'black', 120, ORA), W / 2, 570, back((f - 4) / 6), ease_out((f - 4) / 3))
        product(cv, 'oceanmin.png', 380, W / 2, 900, (f - 8) / 10, f, op=.7)
        put(cv, text_img('Teil 5: Was Magnesium laut EU kann · Folgen', 'black', fit('Teil 5: Was Magnesium laut EU kann · Folgen', 'black', 900, 54), WHT), W / 2, 1170, 1, ease_out((f - 16) / 5))
        put(cv, text_img(CTA_ZEILE.upper(), 'black', 76, COAL, ORA, 22, 10), W / 2, 1290, back((f - 20) / 7), ease_out((f - 20) / 4))
        pflicht(cv, ease_out((f - 20) / 8), GRY, y=1420, size=21)
    tag(cv); return cv

CUES = [('zapp.wav', 0), ('einschlag.wav', 0, .8), ('pop.wav', 6), ('stempel.wav', 34), ('wisch.wav', 80), ('zoom.wav', 80, .7),
        ('einschlag.wav', 130), ('stempel.wav', 132, .5), ('ding.wav', 190), ('wisch.wav', 230)] + \
       [('pop.wav', 240 + k * 18) for k in range(3)] + [('wisch.wav', 380), ('ding.wav', 400)]

if __name__ == '__main__': run('w4-hoechstmenge', frame, TOTAL, CUES)
