"""04 Quiz – Gameshow, zielt auf Kommentare. Hook: Wie viel Magnesium steckt in 1 Stick?"""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine import *

TOTAL = 330
TOP, BOT, WHT, YEL, GRN, RED = (40, 14, 100), (120, 40, 210), (255, 255, 255), (255, 214, 0), (40, 200, 110), (230, 60, 80)
ANS = [('A', '12 mg'), ('B', '120 mg'), ('C', '1.200 mg')]
RIGHT, REVEAL = 1, 150

@lru_cache(maxsize=1)
def bg():
    g = Image.new('RGBA', (1, H))
    for y in range(H): g.putpixel((0, y), mix(TOP, BOT, y / H) + (255,))
    return g.resize((W, H))

@lru_cache(maxsize=None)
def card(letter, text, state):
    fill = {'n': WHT, 'ok': GRN, 'no': (90, 70, 130)}[state]; fg = (30, 20, 60) if state == 'n' else WHT
    im = Image.new('RGBA', (860, 150)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, 859, 149], 75, fill=fill + (255,))
    d.ellipse([18, 18, 132, 132], fill=(YEL if state != 'no' else (120, 100, 160)) + (255,))
    d.text((75, 75), letter, font=F('black', 76), fill=(30, 20, 60), anchor='mm')
    d.text((180, 75), text, font=F('black', 84), fill=fg, anchor='lm')
    if state == 'ok': d.line([(770, 78), (796, 104), (836, 52)], fill=WHT + (255,), width=16, joint='curve')
    return im

def frame(i):
    cv = bg().copy()
    put(cv, text_img('QUIZ', 'black', 90, (30, 20, 60), YEL, 26, 16), W / 2, 330, back(i / 8, 2.4), ease_out(i / 4))
    put(cv, text_img('Wie viel Magnesium', 'black', 120, WHT), W / 2, 500, back((i - 5) / 8), ease_out((i - 5) / 4))
    put(cv, text_img('steckt in 1 Stick?', 'black', 120, WHT), W / 2, 630, back((i - 9) / 8), ease_out((i - 9) / 4))
    for k, (l, t) in enumerate(ANS):
        st = 'n' if i < REVEAL else ('ok' if k == RIGHT else 'no')
        sc = back((i - 22 - k * 6) / 8) * (1 + (0.06 * back((i - REVEAL) / 8) if st == 'ok' else 0))
        put(cv, card(l, t, st), W / 2, 830 + k * 185, sc, ease_out((i - 22 - k * 6) / 5) * (0.5 if st == 'no' else 1))
    if 40 <= i < REVEAL:  # Countdown-Balken
        k = (i - 40) / (REVEAL - 40); d = ImageDraw.Draw(cv)
        d.rounded_rectangle([110, 1400, 970, 1430], 15, fill=(255, 255, 255, 60))
        d.rounded_rectangle([110, 1400, 110 + max(30, 860 * (1 - k)), 1430], 15, fill=YEL if k < .7 else RED)
        n = 3 - int(k * 3)
        put(cv, text_img(str(n), 'black', 110, WHT), W / 2, 1520, 1 + 0.2 * (1 - ((i - 40) % 37) / 37))
        put(cv, text_img('Antwort in die Kommentare!', 'bold', 52, YEL), W / 2, 1630)
    if i >= REVEAL + 20:
        f = i - REVEAL - 20
        put(cv, text_img(f"= {FAKTEN['nrv']} % der Referenzmenge", 'bold', 56, (30, 20, 60), YEL, 22, 12), W / 2, 1420, back(f / 8), ease_out(f / 4))
        put(cv, text_img(f"Oceanmin · {FAKTEN['club']} mit Clubpreis", 'bold', 56, WHT), W / 2, 1520, 1, ease_out((f - 10) / 6))
    if i >= REVEAL + 60:
        f = i - REVEAL - 60
        put(cv, text_img(CTA_ZEILE.upper() + '  ↓', 'black', 100, (30, 20, 60), WHT, 34, 20), W / 2, 1650, back(f / 8), ease_out(f / 4))
        pflicht(cv, ease_out(f / 8), (200, 190, 230), y=1770, size=20)
    return cv

CUES = [('einschlag.wav', 0), ('pop.wav', 5), ('pop.wav', 9), ('pop.wav', 22), ('pop.wav', 28), ('pop.wav', 34),
        ('tick.wav', 40), ('tick.wav', 77), ('tick.wav', 114), ('ding.wav', REVEAL), ('glitzer.wav', REVEAL, .5),
        ('wisch.wav', REVEAL + 20), ('kaching.wav', REVEAL + 30), ('zoom.wav', REVEAL + 60)]

if __name__ == '__main__': run('04-quiz', frame, TOTAL, CUES)
