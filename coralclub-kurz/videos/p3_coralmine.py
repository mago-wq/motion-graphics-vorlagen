"""Produkt 3 – Coral-Mine, How-to mit Sprecher. Stil: Sonnig (Sand/Koralle, gezeichnete Flasche, Timer, Element-Blasen).
Mineralienabgabe als Herstellerangabe gekennzeichnet; keine Wirkversprechen."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from stimme import *

STARTS, TOTAL, WS = lade('coralmine', {'Beute': 'Beutel', 'Mine': 'Mine'})
SAND, CORAL, DEEP, WHT, AQUA, YEL = (255, 241, 222), (255, 112, 92), (30, 50, 80), (255, 255, 255), (80, 190, 230), (255, 205, 60)
HINWEIS = ('Werbung · Affiliate-Link · Nahrungsergänzungsmittel. Kein Ersatz für eine ausgewogene, abwechslungsreiche Ernährung und eine '
           'gesunde Lebensweise. Verzehrempfehlung: 1 ungeöffnetes Sachet in 1,5 l Wasser, über den Tag verteilt trinken; nicht überschreiten. '
           'Clubpreis für registrierte Mitglieder. Preise: de.coral.club, Stand 02.10.2026')

def tag(cv): put_left(cv, text_img('CORAL CLUB · CORAL-MINE', 'black', 36, WHT, DEEP, 16, 22), 80, 250)

def flasche(cv, cx, top, fill, f, beutel_y=None):
    lay = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(lay)
    w, h = 340, 760; x0, x1, y1 = cx - w / 2, cx + w / 2, top + h
    d.rounded_rectangle([cx - 60, top - 120, cx + 60, top + 20], 20, fill=(70, 120, 200))
    wy = y1 - (h - 80) * fill
    pts = [(x0 + 12, y1 - 12)] + [(x, wy + math.sin(x / 30 + f / 4) * 8) for x in range(int(x0 + 12), int(x1 - 11), 6)] + [(x1 - 12, y1 - 12)]
    d.polygon(pts, fill=(150, 215, 245, 200))
    if beutel_y is not None:
        d.rounded_rectangle([cx - 70, beutel_y - 90, cx + 70, beutel_y + 90], 12, fill=WHT, outline=(200, 200, 200), width=3)
        d.rectangle([cx - 70, beutel_y - 30, cx + 70, beutel_y + 10], fill=AQUA)
    d.rounded_rectangle([x0, top, x1, y1], 60, outline=DEEP, width=10)
    cv.alpha_composite(lay)

def timer(cv, cx, cy, frac, txt):
    d = ImageDraw.Draw(cv); r = 130
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(230, 220, 205), width=26)
    d.arc([cx - r, cy - r, cx + r, cy + r], -90, -90 + 360 * frac, fill=CORAL, width=26)
    put(cv, text_img(txt, 'black', 76, DEEP), cx, cy)

@lru_cache(maxsize=None)
def element(sym, name, col):
    im = Image.new('RGBA', (230, 230)); d = ImageDraw.Draw(im)
    d.ellipse([0, 0, 229, 229], fill=col); im.alpha_composite(text_img(sym, 'black', 100, WHT), (115 - text_img(sym, 'black', 100, WHT).width // 2, 50))
    t = text_img(name, 'bold', 32, WHT); im.alpha_composite(t, (115 - t.width // 2, 160)); return im

def frame(i):
    k, f = welche(STARTS, i)
    if k == 0:
        cv = cover('cc_coralmine.jpg', i / 160, (1.3, 1.5), (.45, .4))
        sh = math.sin(i * 2.5) * 12 * max(0, 1 - (i - 30) / 10) if i >= 30 else 0
        put(cv, stroke_text('UNGEÖFFNET', 'black', 150, YEL, sw=12), W / 2 + sh, 560, back(i / 6), ease_out(i / 3), rot=-4)
        put(cv, stroke_text('ins Wasser?!', 'black', 130, sw=12), W / 2, 720, back((i - 6) / 6), ease_out((i - 6) / 3), rot=-4)
        credit(cv, 'Foto: Coral Club')
    elif k == 1:
        cv = cover('foto_koralle.jpg', f / 250, (1.2, 1.4), (.6, .55)); shade(cv, .1, .5)
        put(cv, text_img('Gemahlene', 'black', 110, DEEP, WHT, 26, 30), W / 2, 450, back(f / 7), ease_out(f / 4))
        put(cv, text_img('fossile Koralle', 'black', 110, WHT, CORAL, 26, 30), W / 2, 600, back((f - 8) / 7), ease_out((f - 8) / 4))
        # Kartennadel Okinawa
        t = (f - 90) / 8
        if t > 0:
            pin = Image.new('RGBA', (120, 170)); pd = ImageDraw.Draw(pin)
            pd.ellipse([10, 0, 110, 100], fill=CORAL); pd.polygon([(20, 70), (100, 70), (60, 165)], fill=CORAL); pd.ellipse([40, 30, 80, 70], fill=WHT)
            put(cv, pin, W / 2 - 230, 900 - (1 - ease_out(t)) * 200, 1, ease_out(t * 2))
            put_left(cv, text_img('Okinawa, Japan', 'black', 84, WHT, DEEP, 22, 26), W / 2 - 150, 900, ease_out(t * 2))
        credit(cv, 'Bild: KI-generiert (Illustration)')
    elif k == 2:
        cv = canvas(SAND)
        drop = ease_io((f - 6) / 22); by = 380 + 780 * drop
        flasche(cv, 360, 520, .9, f, beutel_y=by)
        put(cv, text_img('1 Beutel', 'black', 80, DEEP), 800, 520, 1, ease_out(f / 5))
        put(cv, text_img('1,5 Liter', 'black', 80, AQUA), 800, 640, 1, ease_out((f - 20) / 5))
        frac = clamp((f - 70) / 90)
        timer(cv, 800, 950, frac, '5 Min.' if frac < 1 else 'Fertig!')
    elif k == 3:
        cv = canvas(SAND)
        flasche(cv, W / 2, 620, .9, i)
        for j, (sym, name, col) in enumerate([('Ca', 'Calcium', CORAL), ('Mg', 'Magnesium', AQUA), ('+', 'weitere', YEL)]):
            t = (f - 8 - j * 22) / 10
            put(cv, element(sym, name, col), [300, 540, 780][j], 1180 - 380 * ease_out(t) + math.sin(i / 6 + j) * 10, back(t), ease_out(t * 2))
        put(cv, text_img('laut Hersteller', 'black', 70, DEEP), W / 2, 420, 1, ease_out(f / 5))
    elif k == 4:
        cv = canvas(CORAL)
        put(cv, text_img('30 Beutel', 'black', 90, WHT), W / 2, 420, 1, ease_out(f / 5))
        put(cv, text_img('21,00 €', 'black', 230, WHT), W / 2, 610, back((f - 4) / 7), ease_out((f - 4) / 4))
        put(cv, text_img('statt 26,25 € · Clubpreis', 'bold', 54, (255, 225, 215)), W / 2, 760, 1, ease_out((f - 14) / 5))
        put(cv, text_img('= 0,70 € pro Flasche', 'black', 84, DEEP, YEL, 24, 30), W / 2, 900, back((f - 60) / 7), ease_out((f - 60) / 4))
        put(cv, text_img(CTA_ZEILE.upper() + '  ↓', 'black', 90, CORAL, WHT, 30, 30), W / 2, 1110, back((f - 150) / 7), ease_out((f - 150) / 4))
        hinweis(cv, HINWEIS, ease_out((f - 10) / 8), y=1600, color=WHT, bg=CORAL)
    untertitel(cv, WS, i)
    tag(cv); return cv

CUES = [('wasser.wav', 0, .5), ('einschlag.wav', 0, .5), ('zapp.wav', 30, .35), ('wisch.wav', STARTS[1], .3), ('pop.wav', STARTS[1] + 90, .4),
        ('wisch.wav', STARTS[2], .3), ('wasser.wav', STARTS[2] + 26, .6), ('tick.wav', STARTS[2] + 70, .3), ('ding.wav', STARTS[2] + 160, .4),
        ('wisch.wav', STARTS[3], .3)] + [('pop.wav', STARTS[3] + 8 + j * 22, .4) for j in range(3)] + \
       [('wisch.wav', STARTS[4], .3), ('kaching.wav', STARTS[4] + 6, .35),
        (os.path.join(A, 'stimme', 'coralmine.mp3'), int(VORLAUF * FPS), 1.6)]

if __name__ == '__main__': run('p3-coralmine', frame, TOTAL, CUES)
