"""01 Kassenbon – Preisanker. Hook: 1,27 € am Tag. Wofür?"""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine import *

TOTAL = 330
BG, PAPER, INK, RED, BLUE = (28, 28, 32), (250, 249, 244), (25, 25, 25), (205, 35, 35), (22, 62, 170)
ROWS = [  # (Frame, links, rechts, Stil)
    (48, 'OCEANMIN · CORAL CLUB', '', 'head'),
    (60, '15 Sticks à 750 ml', '', ''),
    (72, '120 mg Magnesium/Stick', '', ''),
    (90, 'Normalpreis', FAKTEN['normal'], ''),
    (106, 'Clubpreis -20 %', '-4,75 €', 'red'),
    (122, '-' * 26, '', ''),
    (134, 'SUMME', FAKTEN['club'], 'big'),
    (160, '= pro Tag', FAKTEN['proTag'], 'big'),
]

def frame(i):
    cv = canvas(BG); grain(cv, i, 8)
    # Hook oben
    k = ease_out(i / 8)
    put(cv, text_img(FAKTEN['proTag'] + ' am Tag.', 'black', 150, (255, 255, 255)), W / 2, 300, 0.8 + 0.2 * back(i / 8), k)
    put(cv, text_img('Wofür?', 'black', 150, (255, 214, 0)), W / 2, 450, 0.8 + 0.2 * back((i - 10) / 8), ease_out((i - 10) / 6))
    # Bon schiebt sich mit jeder Zeile hoch
    shown = [r for r in ROWS if i >= r[0]]
    paper_h = 220 + sum(96 if r[3] == 'big' else 66 for r in shown)
    if i >= 40:
        top = 560
        bon = Image.new('RGBA', (820, paper_h + 40), (0, 0, 0, 0)); d = ImageDraw.Draw(bon)
        d.rectangle([0, 0, 819, paper_h], fill=PAPER + (255,))
        for x in range(0, 820, 40):  # Abrisskante
            d.polygon([(x, paper_h), (x + 20, paper_h + 24), (x + 40, paper_h)], fill=PAPER + (255,))
        d.text((410, 70), 'KASSENBON', font=F('mono', 44), fill=INK, anchor='mm')
        y = 150
        for (fr, l, r, st) in shown:
            col = RED if st == 'red' else INK
            sz = 52 if st == 'big' else 36
            d.text((50, y), l, font=F('mono', sz), fill=col)
            if r: d.text((770, y), r, font=F('mono', sz), fill=col, anchor='ra')
            y += 96 if st == 'big' else 66
        put(cv, bon, W / 2, top + bon.height / 2 + (1 - ease_out((i - 40) / 10)) * 900)
    # Stempel
    if i >= 190:
        t = (i - 190) / 8
        st = text_img(' JETZT SPAREN ', 'black', 110, RED, None, 18)
        frame_im = Image.new('RGBA', (st.width + 20, st.height + 20)); d = ImageDraw.Draw(frame_im)
        d.rounded_rectangle([4, 4, frame_im.width - 5, frame_im.height - 5], 18, outline=RED + (255,), width=10)
        frame_im.alpha_composite(st, (10, 10))
        put(cv, frame_im, W / 2 + 90, 660, 2.0 - 1.2 * ease_out(t), ease_out(t * 3) * .92, rot=-10)
    if i >= 225:
        put(cv, text_img(CTA_ZEILE.upper() + '  ↓', 'black', 110, (255, 255, 255), BLUE, 36, 20), W / 2, 1460, back((i - 225) / 8), ease_out((i - 225) / 4))
    if i >= 150: pflicht(cv, ease_out((i - 150) / 8), (150, 150, 150), y=1570, size=22)
    return cv

CUES = [('einschlag.wav', 0), ('einschlag.wav', 10), ('wisch.wav', 40)] + \
       [('tick.wav', r[0], .5) for r in ROWS] + [('kaching.wav', 160), ('stempel.wav', 192), ('ding.wav', 226)]

if __name__ == '__main__': run('01-kassenbon', frame, TOTAL, CUES)
