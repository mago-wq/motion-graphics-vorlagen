"""Wissen 5/5 – Was Magnesium laut EU kann. Stil: Riff + Amtlich (Sternenkreis, Stempel).
Aussagen im exakten Wortlaut VO (EU) 432/2012."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bild import *

TOTAL = 520
EU, STAR, WHT, GRN, RED, INK = (0, 51, 153), (255, 204, 0), (255, 255, 255), (30, 170, 90), (215, 40, 40), (20, 20, 30)
CLAIMS = ['Magnesium trägt zur Verringerung von Müdigkeit und Ermüdung bei.',
          'Magnesium trägt zu einer normalen Muskelfunktion bei.',
          'Magnesium trägt zu einer normalen Funktion des Nervensystems bei.',
          'Magnesium trägt zu einem normalen Energiestoffwechsel bei.',
          'Magnesium trägt zum Elektrolytgleichgewicht bei.',
          'Magnesium trägt zur Erhaltung normaler Knochen bei.']

def tag(cv): put_left(cv, text_img('MAGNESIUM-WISSEN 5/5', 'black', 38, EU, STAR, 16, 10), 80, 250)

def star(d, cx, cy, r, col):
    pts = [(cx + math.cos(math.radians(-90 + k * 36)) * (r if k % 2 == 0 else r * .42), cy + math.sin(math.radians(-90 + k * 36)) * (r if k % 2 == 0 else r * .42)) for k in range(10)]
    d.polygon(pts, fill=col)

def stars(cv, cx, cy, R, f, n=12):
    d = ImageDraw.Draw(cv)
    for k in range(min(n, max(0, int(f / 2)))):
        a = math.radians(-90 + k * 30 + f * .5); star(d, cx + math.cos(a) * R, cy + math.sin(a) * R, 26, STAR)

@lru_cache(maxsize=None)
def card(text, ok):
    rows = wrap(text, 'bold', 46, 560); h = max(150, len(rows) * 58 + 50)
    im = Image.new('RGBA', (920, h)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, 919, h - 1], 26, fill=WHT)
    for j, r in enumerate(rows): d.text((36, 25 + j * 58), r, font=F('bold', 46), fill=INK)
    return im

@lru_cache(maxsize=None)
def stamp(ok):
    t = text_img(' ZUGELASSEN ' if ok else ' VERBOTEN ', 'black', 34, GRN if ok else RED, None, 10)
    im = Image.new('RGBA', (t.width + 16, t.height + 16)); ImageDraw.Draw(im).rounded_rectangle([3, 3, im.width - 4, im.height - 4], 10, outline=GRN if ok else RED, width=6)
    im.alpha_composite(t, (8, 8)); return im.rotate(-12, expand=True, resample=Image.BICUBIC)

def cards(cv, items, f, ok, top=560):
    y = top
    for k, txt in enumerate(items):
        c = card(txt, ok); t = (f - 8 - k * 20) / 7
        put(cv, c, W / 2, y + c.height / 2 + (1 - ease_out(t)) * 80, 1, ease_out(t * 2))
        st = (f - 18 - k * 20) / 5
        if st > 0: put(cv, stamp(ok), 880, y + c.height / 2, 1.8 - .8 * ease_out(st), ease_out(st * 2))
        y += c.height + 34

def frame(i):
    if i < 75:
        cv = cover('foto_koralle.jpg', i / 75, (1.05, 1.3), (.5, .5)); shade(cv, .15, .55)
        put(cv, stroke_text('Was Magnesium', 'black', 130, sw=10), W / 2, 520, back(i / 6), ease_out(i / 3))
        put(cv, stroke_text('wirklich kann', 'black', 130, sw=10), W / 2, 670, back((i - 4) / 6), ease_out((i - 4) / 3))
        put(cv, text_img('laut EU', 'black', 120, EU, STAR, 30, 20), W / 2, 1150, back((i - 26) / 7), ease_out((i - 26) / 4))
        credit(cv, 'Bild: KI-generiert (Illustration)'); tag(cv); return cv
    cv = canvas(EU)
    if i < 150:
        f = i - 75; stars(cv, W / 2, 900, 300, f)
        put(cv, text_img('Die EU hat geprüft,', 'black', 90, WHT), W / 2, 420, 1, ease_out(f / 5))
        put(cv, text_img('was man sagen darf.', 'black', 90, STAR), W / 2, 530, 1, ease_out((f - 5) / 5))
        put(cv, text_img('Offizielle Liste', 'bold', 60, WHT), W / 2, 900, back((f - 24) / 7), ease_out((f - 24) / 4))
        put(cv, text_img('VO (EU) Nr. 432/2012', 'bold', 40, STAR), W / 2, 970, 1, ease_out((f - 30) / 5))
    elif i < 260:
        f = i - 150; put(cv, text_img('Zugelassen (1/2)', 'black', 90, WHT), W / 2, 420, 1, ease_out(f / 5)); cards(cv, CLAIMS[:3], f, True)
    elif i < 370:
        f = i - 260; put(cv, text_img('Zugelassen (2/2)', 'black', 90, WHT), W / 2, 420, 1, ease_out(f / 5)); cards(cv, CLAIMS[3:], f, True)
    elif i < 440:
        f = i - 370; put(cv, text_img('In Werbung nicht erlaubt:', 'black', 84, WHT), W / 2, 420, 1, ease_out(f / 5))
        cards(cv, ['„heilt …“', '„wirkt gegen …“', '„beugt Krankheit … vor“'], f * 1.6, False)
        put(cv, text_img('VO (EU) Nr. 1169/2011, Art. 7 Abs. 3', 'bold', 34, STAR), W / 2, 1300, 1, ease_out((f - 30) / 5))
    else:
        f = i - 440
        cv = cover('foto_koralle.jpg', f / 80, (1.3, 1.45), (.3, .6)); shade(cv, .35, .75)
        put(cv, stroke_text('Mehr versprochen?', 'black', 110, sw=10), W / 2, 460, back(f / 6), ease_out(f / 3))
        put(cv, stroke_text('Skeptisch bleiben.', 'black', 110, STAR, sw=10), W / 2, 590, back((f - 5) / 6), ease_out((f - 5) / 3))
        product(cv, 'oceanmin.png', 360, W / 2, 920, (f - 10) / 10, f, op=.6)
        put(cv, stroke_text('Oceanmin: 120 mg Magnesium pro Stick', 'bold', 46, sw=5), W / 2, 1170, 1, ease_out((f - 16) / 5))
        put(cv, text_img(CTA_ZEILE.upper() + ' · Folgen für mehr', 'black', 64, EU, STAR, 22, 16), W / 2, 1280, back((f - 20) / 7), ease_out((f - 20) / 4))
        pflicht(cv, ease_out((f - 20) / 8), (230, 235, 245), y=1400, size=21)
        credit(cv, 'Bild: KI-generiert (Illustration)')
    tag(cv); return cv

CUES = [('glitzer.wav', 0), ('einschlag.wav', 0, .7), ('pop.wav', 4), ('stempel.wav', 26, .7), ('wisch.wav', 75), ('ding.wav', 99),
        ('wisch.wav', 150)] + [('stempel.wav', 150 + 18 + k * 20, .6) for k in range(3)] + [('wisch.wav', 260)] + \
       [('stempel.wav', 260 + 18 + k * 20, .6) for k in range(3)] + [('wisch.wav', 370)] + \
       [('zapp.wav', 370 + int((18 + k * 20) / 1.6), .5) for k in range(3)] + [('glitzer.wav', 440, .5), ('ding.wav', 460)]

if __name__ == '__main__': run('w5-claims', frame, TOTAL, CUES)
