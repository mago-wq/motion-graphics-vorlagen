"""Produkt 4 – Promarine Collagen Peptides, mit Sprecherin. Stil: Beauty-Pastell (Flieder, Glanzblasen, Frucht-Icons).
Einzige Gesundheitsaussage: Vitamin-C-Claim im exakten Wortlaut (125 % NRV). Keine Aussagen zu Falten/Anti-Aging."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from stimme import *

STARTS, TOTAL, WS = lade('collagen', {'Pomerine': 'Promarine', 'Collagenpeptides': 'Collagen Peptides', 'Collagen': 'Kollagen',
                                      'Collagenbildung': 'Kollagenbildung', 'Zehntausend': '10.000'})
LILA, MAG, DEEP, WHT, ORA, LEM, GRN = (236, 226, 250), (215, 50, 140), (70, 40, 110), (255, 255, 255), (255, 160, 60), (250, 220, 70), (120, 190, 90)
HINWEIS = ('Werbung · Affiliate-Link · Nahrungsergänzungsmittel. Kein Ersatz für eine ausgewogene, abwechslungsreiche Ernährung und eine '
           'gesunde Lebensweise. Verzehrempfehlung: 1 Phiole (50 ml) täglich, nicht überschreiten. Enthält Süßungsmittel. Kann bei übermäßigem '
           'Verzehr abführend wirken. Clubpreis für registrierte Mitglieder. Preise: de.coral.club, Stand 02.10.2026')

def tag(cv): put_left(cv, text_img('CORAL CLUB · KOLLAGEN', 'black', 36, WHT, DEEP, 16, 22), 80, 250)

def blasen(cv, i):
    lay = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(lay)
    for k in range(9):
        r = 40 + (k * 37) % 90; x = (k * 251) % W; y = (k * 397 + i * (1 + k % 3)) % (H + 300) - 150
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 70)); d.ellipse([x - r * .5, y - r * .6, x - r * .1, y - r * .25], fill=(255, 255, 255, 150))
    cv.alpha_composite(lay)

def frucht(kind):
    im = Image.new('RGBA', (180, 180)); d = ImageDraw.Draw(im)
    if kind == 'orange':
        d.ellipse([10, 10, 170, 170], fill=ORA); d.ellipse([28, 28, 152, 152], fill=(255, 200, 120))
        for a in range(0, 360, 45): d.line([90, 90, 90 + 60 * math.cos(math.radians(a)), 90 + 60 * math.sin(math.radians(a))], fill=ORA, width=5)
    elif kind == 'zitrone':
        d.ellipse([15, 35, 165, 145], fill=LEM); d.ellipse([150, 75, 175, 105], fill=LEM); d.ellipse([5, 75, 30, 105], fill=LEM)
    else:
        d.ellipse([15, 30, 165, 170], fill=(220, 60, 70)); d.line([90, 35, 100, 5], fill=(110, 70, 40), width=8); d.ellipse([100, 5, 150, 35], fill=GRN)
    return im

@lru_cache(maxsize=None)
def foto(name, w=520):
    im = Image.open(os.path.join(A, name)).convert('RGBA'); h = int(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS); m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], 36, fill=255)
    im.putalpha(m); return im

def frame(i):
    k, f = welche(STARTS, i)
    if k == 0:
        cv = cover('cc_collagen.jpg', i / 130, (1.5, 1.75), (.5, .45))
        n = int(10000 * ease_out(i / 40))
        put(cv, stroke_text(f'{n:,} mg'.replace(',', '.'), 'black', 190, DEEP, WHT, 14), W / 2, 560, back(i / 6), ease_out(i / 3))
        put(cv, stroke_text('Kollagen', 'black', 150, MAG, WHT, 12), W / 2, 740, back((i - 6) / 6), ease_out((i - 6) / 3))
        put(cv, text_img('in 1 Fläschchen', 'black', 90, WHT, DEEP, 26, 30), W / 2, 1140, back((i - 50) / 7), ease_out((i - 50) / 4))
        credit(cv, 'Foto: Coral Club')
    else:
        cv = canvas(LILA); blasen(cv, i)
    if k == 1:
        put(cv, text_img('Promarine', 'black', 130, DEEP), W / 2, 420, back(f / 7), ease_out(f / 4))
        put(cv, text_img('Collagen Peptides', 'black', 100, MAG), W / 2, 540, back((f - 4) / 7), ease_out((f - 4) / 4))
        for j, (txt, at) in enumerate([('10 g pro Tagesportion', 60), ('hydrolysiert', 120), ('aus Fischhaut', 170)]):
            put(cv, text_img(txt, 'black', 76, DEEP, WHT, 24, 40), W / 2, 680 + j * 115, back((f - at) / 7), ease_out((f - at) / 4))
        put(cv, foto('cc_collagen.jpg'), W / 2, 1170, 1, ease_out((f - 20) / 8))
    elif k == 2:
        put(cv, text_img('Dazu', 'black', 100, DEEP), W / 2, 400, 1, ease_out(f / 5))
        for j, (txt, col) in enumerate([('Vitamin C', ORA), ('Vitamin B6', MAG), ('Biotin', (160, 130, 230))]):
            t = (f - 6 - j * 14) / 7
            put(cv, text_img(txt, 'black', 84, WHT, col, 24, 50), W / 2, 540 + j * 130, back(t, 2), ease_out(t * 2))
        for j, kind in enumerate(['orange', 'zitrone', 'apfel']):
            t = (f - 110 - j * 12) / 7
            put(cv, frucht(kind), 250 + j * 290, 1050 + math.sin(i / 7 + j) * 10, back(t, 2.2), ease_out(t * 2))
        put(cv, text_img('Aroma: Orange, Zitrone, Apfel', 'bold', 52, DEEP), W / 2, 1230, 1, ease_out((f - 120) / 6))
    elif k == 3:
        put(cv, text_img('Offiziell zugelassen (EU)', 'black', 76, DEEP), W / 2, 420, 1, ease_out(f / 5))
        card = Image.new('RGBA', (940, 420)); cd = ImageDraw.Draw(card); cd.rounded_rectangle([0, 0, 939, 419], 40, fill=WHT)
        for j, r in enumerate(['„Vitamin C trägt zu einer normalen', 'Kollagenbildung für eine normale', 'Funktion der Haut bei.“']):
            card.alpha_composite(text_img(r, 'bold', 54, DEEP), (40, 60 + j * 100))
        put(cv, card, W / 2, 760 + (1 - ease_out((f - 6) / 8)) * 80, 1, ease_out((f - 6) / 5))
        put(cv, text_img('100 mg Vitamin C = 125 % NRV pro Phiole', 'bold', 48, DEEP), W / 2, 1050, 1, ease_out((f - 40) / 6))
    elif k == 4:
        put(cv, text_img('10 Fläschchen', 'black', 90, DEEP), W / 2, 420, 1, ease_out(f / 5))
        put(cv, text_img('55,00 €', 'black', 230, MAG), W / 2, 610, back((f - 4) / 7), ease_out((f - 4) / 4))
        put(cv, text_img('statt 68,75 € · Clubpreis', 'bold', 54, DEEP), W / 2, 760, 1, ease_out((f - 14) / 5))
        put(cv, text_img('= 5,50 € pro Tag', 'black', 76, WHT, DEEP, 24, 30), W / 2, 890, back((f - 40) / 7), ease_out((f - 40) / 4))
        put(cv, text_img(CTA_ZEILE.upper() + '  ↓', 'black', 90, WHT, MAG, 30, 30), W / 2, 1100, back((f - 70) / 7), ease_out((f - 70) / 4))
        hinweis(cv, HINWEIS, ease_out((f - 10) / 8), y=1600, color=DEEP, bg=LILA)
    untertitel(cv, WS, i, fg=WHT, hl=(255, 120, 190))
    tag(cv); return cv

CUES = [('glitzer.wav', 0, .45), ('einschlag.wav', 0, .45), ('kaching.wav', 40, .3), ('pop.wav', 50, .4), ('wisch.wav', STARTS[1], .3)] + \
       [('pop.wav', STARTS[1] + at, .35) for at in (60, 120, 170)] + [('wisch.wav', STARTS[2], .3)] + \
       [('pop.wav', STARTS[2] + 6 + j * 14, .35) for j in range(3)] + [('pop.wav', STARTS[2] + 110 + j * 12, .35) for j in range(3)] + \
       [('glitzer.wav', STARTS[3], .3), ('ding.wav', STARTS[3] + 10, .3), ('wisch.wav', STARTS[4], .3), ('kaching.wav', STARTS[4] + 6, .35),
        (os.path.join(A, 'stimme', 'collagen.mp3'), int(VORLAUF * FPS), 1.6)]

if __name__ == '__main__': run('p4-collagen', frame, TOTAL, CUES)
