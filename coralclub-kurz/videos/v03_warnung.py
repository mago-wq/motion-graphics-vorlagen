"""03 Warnung – Verlustangst. Hook: STOPP. Kauf Oceanmin nicht zum Normalpreis."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine import *

TOTAL = 300
BLK, YEL, RED, GRN, WHT = (12, 12, 12), (255, 214, 0), (230, 40, 40), (40, 200, 90), (255, 255, 255)

@lru_cache(maxsize=None)
def tape(text, w=1700):
    im = Image.new('RGBA', (w, 130), YEL + (255,)); d = ImageDraw.Draw(im)
    for x in range(-130, w, 120): d.polygon([(x, 0), (x + 50, 0), (x + 180, 130), (x + 130, 130)], fill=BLK + (255,))
    t = text_img(text, 'black', 84, BLK, YEL, 20)
    for x in range(60, w, t.width + 160): im.alpha_composite(t, (x, (130 - t.height) // 2))
    return im

def band(cv, y, rot, i, start, speed, text):
    if i < start: return
    off = ((i - start) * speed) % 360 - 180
    k = ease_out((i - start) / 8)
    put(cv, tape(text), W / 2 + off + (1 - k) * 1600 * (1 if speed > 0 else -1), y, 1, 1, rot)

def mark(cv, cx, cy, t, ok):
    if t <= 0: return
    im = Image.new('RGBA', (200, 200)); d = ImageDraw.Draw(im)
    d.ellipse([0, 0, 199, 199], fill=(GRN if ok else RED) + (255,))
    if ok: d.line([(52, 104), (88, 140), (150, 66)], fill=WHT + (255,), width=22, joint='curve')
    else: d.line([(60, 60), (140, 140)], fill=WHT, width=24); d.line([(140, 60), (60, 140)], fill=WHT, width=24)
    put(cv, im, cx, cy, back(t, 2.4), ease_out(t * 2))

def frame(i):
    cv = canvas(BLK); grain(cv, i, 10)
    shake = math.sin(i * 2.3) * 10 * max(0, 1 - i / 10)
    if i < 120:
        band(cv, 330, 6, i, 0, 6, 'ACHTUNG')
        band(cv, 1450, -5, i, 3, -6, 'ACHTUNG')
        put(cv, text_img('STOPP.', 'black', 300, RED), W / 2 + shake, 640, 1.6 - 0.6 * ease_out(i / 6), ease_out(i / 3))
        put(cv, text_img('KAUF OCEANMIN', 'black', 120, WHT), W / 2, 880, back((i - 12) / 8), ease_out((i - 12) / 4))
        put(cv, text_img('NICHT ZUM', 'black', 120, WHT), W / 2, 1010, back((i - 18) / 8), ease_out((i - 18) / 4))
        put(cv, text_img('NORMALPREIS.', 'black', 120, YEL), W / 2, 1140, back((i - 24) / 8), ease_out((i - 24) / 4))
    elif i < 205:
        f = i - 120
        put(cv, text_img('Normalpreis', 'bold', 80, (170, 170, 170)), W / 2, 420, 1, ease_out(f / 5))
        put(cv, text_img(FAKTEN['normal'], 'black', 220, WHT), W / 2 - 110, 600, back(f / 8), ease_out(f / 4))
        mark(cv, W / 2 + 370, 600, (f - 10) / 8, False)
        put(cv, text_img('Als Mitglied', 'bold', 80, YEL), W / 2, 860, 1, ease_out((f - 26) / 5))
        put(cv, text_img(FAKTEN['club'], 'black', 220, WHT), W / 2 - 110, 1040, back((f - 30) / 8), ease_out((f - 30) / 4))
        mark(cv, W / 2 + 370, 1040, (f - 40) / 8, True)
        put(cv, text_img('−20 % auf alle Coral-Club-Produkte', 'bold', 54, BLK, YEL, 22, 10), W / 2, 1290, back((f - 52) / 8), ease_out((f - 52) / 4))
    else:
        f = i - 205
        put(cv, text_img('So geht’s:', 'black', 130, YEL), W / 2, 420, back(f / 8), ease_out(f / 4))
        for k, s in enumerate(['1  Link in Bio antippen', '2  Registrieren', '3  Clubpreis nutzen']):
            put(cv, text_img(s, 'bold', 76, WHT), W / 2, 620 + k * 130, 1, ease_out((f - 8 - k * 7) / 6))
        product(cv, 'oceanmin.png', 420, W / 2, 1180, (f - 20) / 10, f, op=.6)
        band(cv, 1500, -3, i, 210, 5, CTA_ZEILE.upper())
    if i >= 120: pflicht(cv, 1, (130, 130, 130), y=1650, size=22)
    return cv

CUES = [('zapp.wav', 0), ('einschlag.wav', 0, .9), ('pop.wav', 12), ('pop.wav', 18), ('einschlag.wav', 24),
        ('wisch.wav', 120), ('riss.wav' if False else 'klack.wav', 130), ('ding.wav', 160), ('kaching.wav', 172),
        ('wisch.wav', 205), ('tick.wav', 213), ('tick.wav', 220), ('tick.wav', 227), ('zoom.wav', 225)]

if __name__ == '__main__': run('03-warnung', frame, TOTAL, CUES)
