"""Produkt 6 – Ranking „Was kostet 1 Tag?“, ohne Stimme. Stil: Bestenliste (Schwarz/Gold, Produktfotos, Plätze von 6 nach 1).
Kosten/Tag = Clubpreis ÷ Tage laut Verzehrempfehlung. Nur Packshots, keine Personen."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bild import *

BG, GOLD, WHT, GRY, GRN = (14, 14, 18), (240, 196, 90), (250, 248, 240), (150, 150, 160), (90, 210, 130)
# (Name, Kosten/Tag, Rechnung, Bild)
LISTE = [('Spirulina', 0.50, '25,00 € ÷ 50 Tage (4 Tabl./Tag)', 'cc_spirulina.jpg'),
         ('Coral-Mine', 0.70, '21,00 € ÷ 30 Tage (1 Beutel/Tag)', 'cc_coralmine.jpg'),
         ('Chlorella', 23.50 / 30, '23,50 € ÷ 30 Tage (6 Tabl./Tag)', 'cc_chlorella.jpg'),
         ('O!Mega-3 TG', 1.00, '30,00 € ÷ 30 Tage (3 Kaps./Tag)', 'cc_omega3_pack.jpg'),
         ('Oceanmin', 19 / 15, '19,00 € ÷ 15 Tage (1 Stick/Tag)', None),
         ('Collagen Peptides', 5.50, '55,00 € ÷ 10 Tage (1 Phiole/Tag)', 'cc_collagen.jpg')]
INTRO, STEP, END = 60, 42, 150
TOTAL = INTRO + STEP * len(LISTE) + 30 + END
HINWEIS = ('Werbung · Affiliate-Link · Nahrungsergänzungsmittel. Kein Ersatz für eine ausgewogene, abwechslungsreiche Ernährung und eine gesunde '
           'Lebensweise. Empfohlene Verzehrmenge laut Packung nicht überschreiten. Kosten pro Tag = Clubpreis ÷ Tage laut Verzehrempfehlung. '
           'Clubpreis für registrierte Mitglieder. Preise: de.coral.club, Stand 02.10.2026')
eur = lambda v: f'{v:.2f} €'.replace('.', ',')

@lru_cache(maxsize=None)
def thumb(name, s=150):
    if name is None:
        im = Image.new('RGBA', (s, s), (235, 240, 250, 255)); p = asset('oceanmin.png', int(s * .9)); im.alpha_composite(p, ((s - p.width) // 2, (s - p.height) // 2))
    else:
        src = Image.open(os.path.join(A, name)).convert('RGB'); m = min(src.size)
        im = src.crop(((src.width - m) // 2, (src.height - m) // 2, (src.width + m) // 2, (src.height + m) // 2)).resize((s, s), Image.LANCZOS).convert('RGBA')
    mk = Image.new('L', (s, s), 0); ImageDraw.Draw(mk).rounded_rectangle([0, 0, s - 1, s - 1], 26, fill=255); im.putalpha(mk); return im

def mosaik(i):
    cv = canvas(BG); names = [x[3] for x in LISTE]
    for k, n in enumerate(names):
        x, y = (k % 2) * W // 2, (k // 2) * H // 3
        t = thumb(n, 560).resize((W // 2 - 8, H // 3 - 8)); put(cv, t, x + W // 4, y + H // 6, 1 + .03 * math.sin(i / 10 + k), ease_out((i - k * 3) / 6))
    shade(cv, .45, .45); return cv

def frame(i):
    if i < INTRO:
        cv = mosaik(i)
        put(cv, stroke_text('Was kostet', 'black', 150, sw=12), W / 2, 760, back(i / 6), ease_out(i / 3))
        put(cv, stroke_text('1 Tag?', 'black', 210, GOLD, sw=14), W / 2, 950, back((i - 6) / 6), ease_out((i - 6) / 3))
        put(cv, text_img('Coral-Club-Ranking', 'black', 70, BG, GOLD, 22, 20), W / 2, 1140, back((i - 14) / 6), ease_out((i - 14) / 4))
        put(cv, text_img('Fotos: Coral Club', 'med', 20, WHT), W / 2, 1880, 1, .7)
        return cv
    cv = canvas(BG); d = ImageDraw.Draw(cv)
    put(cv, text_img('KOSTEN PRO TAG', 'black', 72, GOLD), W / 2, 290, 1, 1)
    f = i - INTRO; shown = min(len(LISTE), f // STEP + 1)
    for r in range(len(LISTE) - 1, len(LISTE) - 1 - shown, -1):  # Platz 6 zuerst
        name, v, rech, img = LISTE[r]; t = (f - (len(LISTE) - 1 - r) * STEP) / 8; y = 400 + r * 175
        x = (1 - ease_out(t)) * 900
        row = Image.new('RGBA', (980, 170)); rd = ImageDraw.Draw(row)
        rd.rounded_rectangle([0, 0, 979, 169], 30, fill=(32, 32, 40, 255) if r else (60, 50, 20, 255))
        row.alpha_composite(text_img(f'{r + 1}', 'black', 90, GOLD if r == 0 else GRY), (24, 30))
        row.alpha_composite(thumb(img, 140), (110, 15))
        row.alpha_composite(text_img(name, 'black', 56, WHT), (275, 28)); row.alpha_composite(text_img(rech, 'med', 28, GRY), (275, 108))
        pr = text_img(eur(v), 'black', 70, GRN if r == 0 else WHT); row.alpha_composite(pr, (950 - pr.width, 45))
        put(cv, row, W / 2 + x, y + 80, 1, ease_out(t * 2))
    if f > STEP * len(LISTE) + 30:
        g = f - STEP * len(LISTE) - 30
        put(cv, text_img('Günstigster Einstieg: Spirulina', 'black', 64, BG, GOLD, 22, 20), W / 2, 1510, back(g / 7), ease_out(g / 4))
        put(cv, text_img(CTA_ZEILE.upper() + '  ↓', 'black', 80, BG, GRN, 26, 26), W / 2, 1625, back((g - 20) / 7), ease_out((g - 20) / 4))
        for j, rr in enumerate(wrap(HINWEIS, 'med', 20, 920)): put(cv, text_img(rr, 'med', 20, GRY), W / 2, 1720 + j * 26, 1, ease_out((g - 10) / 8))
    put(cv, text_img('Fotos: Coral Club', 'med', 20, GRY), W / 2, 350, 1, .7)
    return cv

CUES = [('einschlag.wav', 0), ('pop.wav', 6), ('stempel.wav', 14, .6), ('wisch.wav', INTRO)] + \
       [('wisch.wav', INTRO + k * STEP, .5) for k in range(len(LISTE))] + [('ding.wav', INTRO + (len(LISTE) - 1) * STEP + 4), ('glitzer.wav', INTRO + (len(LISTE) - 1) * STEP + 4, .5),
        ('kaching.wav', INTRO + STEP * len(LISTE) + 30)]

if __name__ == '__main__': run('p6-ranking', frame, TOTAL, CUES)
