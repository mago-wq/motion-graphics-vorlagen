"""09 Versus – Splitscreen, Jahresrechnung offen gezeigt. Hook: Gleiches Produkt. 114 € Unterschied."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine import *

TOTAL = 320
RED, BLUE, WHT, YEL, BLK = (200, 45, 50), (22, 62, 170), (255, 255, 255), (255, 214, 0), (14, 14, 14)
PACKS = 24  # 24 Packungen à 15 Sticks = 360 Tage, 1 Stick täglich
NORMAL, CLUB = 23.75 * PACKS, 19.0 * PACKS
eur = lambda v: f'{v:,.2f} €'.replace(',', 'X').replace('.', ',').replace('X', '.')

def frame(i):
    cv = canvas(BLK); d = ImageDraw.Draw(cv)
    split = H / 2 + (1 - ease_out(i / 10)) * H / 2
    d.rectangle([0, 0, W, split], fill=RED); d.rectangle([0, split, W, H], fill=BLUE)
    # Hook in der Mitte
    if i < 70:
        a = 1 - ease_out((i - 60) / 8)
        put(cv, text_img('GLEICHES PRODUKT.', 'black', 104, WHT, BLK, 24, 10), W / 2, H / 2 - 80, back((i - 4) / 8), a * ease_out((i - 4) / 4))
        put(cv, text_img(f'{int(NORMAL - CLUB)} € UNTERSCHIED.', 'black', 104, BLK, YEL, 24, 10), W / 2, H / 2 + 70, back((i - 12) / 8), a * ease_out((i - 12) / 4))
        return cv
    f = i - 70
    c = ease_io(f / 60)
    for top, label, val, unit in [(True, 'Normalpreis', NORMAL, 23.75), (False, 'Mit Clubpreis', CLUB, 19.0)]:
        cy = 470 if top else 1300
        put(cv, text_img(label.upper(), 'black', 90, WHT), W / 2, cy - 200, 1, ease_out(f / 6))
        put(cv, text_img(f"{eur(unit)} × {PACKS} Packungen", 'bold', 52, WHT), W / 2, cy - 100, 1, ease_out((f - 4) / 6))
        put(cv, text_img(eur(val * c), 'black', 210, WHT), W / 2, cy + 50, 1, ease_out(f / 4))
        put(cv, text_img('pro Jahr', 'bold', 52, WHT), W / 2, cy + 190, 1, ease_out((f - 8) / 6))
    if f >= 66:
        g = f - 66
        put(cv, text_img(f'Du sparst {eur(NORMAL - CLUB)}', 'black', 96, BLK, YEL, 30, 16), W / 2, H / 2, back(g / 8, 2.2), ease_out(g / 4), rot=3)
    if f >= 120:
        g = f - 120
        put(cv, text_img(CTA_ZEILE.upper() + '  ↓', 'black', 96, BLUE, WHT, 30, 18), W / 2, 1600, back(g / 8), ease_out(g / 4))
        put(cv, text_img('1 Stick täglich · 24 Packungen à 15 Sticks = 360 Tage', 'med', 26, WHT), W / 2, 1700, 1, ease_out(g / 8))
    if f >= 66: pflicht(cv, 1, (190, 200, 235), y=1745, size=20)
    return cv

CUES = [('wisch.wav', 0), ('einschlag.wav', 4), ('einschlag.wav', 12), ('wisch.wav', 70), ('zoom.wav', 72, .5),
        ('kaching.wav', 136), ('stempel.wav', 137, .6), ('ding.wav', 190)]

if __name__ == '__main__': run('09-versus', frame, TOTAL, CUES)
