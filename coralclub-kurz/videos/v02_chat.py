"""02 Chat – POV, nativer Messenger-Look. Hook: POV: Sie fragt, was in deiner Flasche ist."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine import *

TOTAL = 330
BG, GRAY, BLUE, INK = (255, 255, 255), (233, 233, 235), (10, 132, 255), (20, 20, 20)
MSG = [  # (Frame, Seite, Text)
    (30, 'l', 'was ist das für ein Pulver in deiner Flasche?'),
    (62, 'r', 'Oceanmin von Coral Club'),
    (82, 'r', '1 Stick in 750 ml Wasser'),
    (112, 'l', 'und was ist da drin?'),
    (138, 'r', '120 mg Magnesium pro Stick'),
    (168, 'l', 'was kostet das?'),
    (194, 'r', f"{FAKTEN['club']} mit Clubpreis statt {FAKTEN['normal']}"),
    (226, 'l', 'link??'),
    (248, 'r', 'Link in Bio'),
]

@lru_cache(maxsize=None)
def bubble(text, side):
    rows = wrap(text, 'med', 50, 620); f = F('med', 50)
    w = int(max(f.getlength(r) for r in rows)) + 72; h = len(rows) * 64 + 44
    im = Image.new('RGBA', (w, h)); d = ImageDraw.Draw(im)
    bg, fg = (BLUE, (255, 255, 255)) if side == 'r' else (GRAY, INK)
    d.rounded_rectangle([0, 0, w - 1, h - 1], 42, fill=bg + (255,))
    for k, r in enumerate(rows): d.text((36, 22 + k * 64), r, font=f, fill=fg)
    return im

def typing(cv, x, y, f):
    im = Image.new('RGBA', (170, 92)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, 169, 91], 42, fill=GRAY + (255,))
    for k in range(3):
        b = (math.sin(f / 3 - k) + 1) / 2
        d.ellipse([38 + k * 36 - 9, 46 - 9 - b * 6, 38 + k * 36 + 9, 46 + 9 - b * 6], fill=(140, 140, 146, 255))
    cv.alpha_composite(im, (x, int(y)))

def frame(i):
    cv = canvas(BG)
    # Nachrichten, älteste rutschen nach oben weg
    shown = [m for m in MSG if i >= m[0]]
    heights = [bubble(t, s).height + 22 for (_, s, t) in shown]
    nxt = next((m for m in MSG if m[0] > i), None)
    pending = nxt and nxt[1] == 'l' and nxt[0] - i < 16
    total_h = sum(heights) + (114 if pending else 0) + (340 * ease_out((i - 248) / 8) if i >= 248 else 0)
    y = min(380, 1450 - total_h)
    for (fr, side, text), hh in zip(shown, heights):
        b = bubble(text, side); t = (i - fr) / 7
        x = 60 if side == 'l' else W - 60 - b.width
        put(cv, b, x + b.width / 2, y + b.height / 2 + (1 - ease_out(t)) * 40, 0.9 + 0.1 * back(t), ease_out(t * 2))
        y += hh
    if pending: typing(cv, 60, y, i)
    if i >= 248:  # Produkt als "Bild"-Nachricht
        t = (i - 254) / 8
        put(cv, asset('oceanmin.png', 300), W - 60 - 105, y + 170, back(t), ease_out(t * 2))
    # Kopfzeile wie ein Messenger (über den Nachrichten)
    d = ImageDraw.Draw(cv)
    d.rectangle([0, 0, W, 300], fill=(247, 247, 247)); d.line([0, 300, W, 300], fill=(220, 220, 222), width=2)
    d.ellipse([W / 2 - 50, 120, W / 2 + 50, 220], fill=(200, 200, 205))
    put(cv, text_img('L', 'bold', 54, (255, 255, 255)), W / 2, 170)
    put(cv, text_img('Lena', 'med', 36, INK), W / 2, 260)
    # Hook als Overlay
    hk = text_img('POV: Sie fragt, was in', 'black', 92, (255, 255, 255), INK, 26, 14)
    hk2 = text_img('deiner Flasche ist', 'black', 92, (255, 255, 255), INK, 26, 14)
    a = 1 - ease_out((i - 70) / 10)
    put(cv, hk, W / 2, 900, back(i / 8), a * ease_out(i / 4)); put(cv, hk2, W / 2, 1020, back((i - 4) / 8), a * ease_out((i - 4) / 4))
    if i >= 194: pflicht(cv, ease_out((i - 194) / 8), (140, 140, 140), y=1740, size=20)
    return cv

CUES = [('einschlag.wav', 0, .5)] + [('pop.wav', fr, .9) if s == 'r' else ('klack.wav', fr, .5) for fr, s, _ in MSG] + [('ding.wav', 254)]

if __name__ == '__main__': run('02-chat', frame, TOTAL, CUES)
