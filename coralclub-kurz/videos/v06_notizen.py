"""06 Notizen-App – Lifestyle/UGC-Look. Hook: Meine Morgenroutine, die ich wirklich durchziehe."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine import *

TOTAL = 320
PAPER, INK, GRAY, ACC = (255, 255, 255), (20, 20, 22), (150, 150, 155), (227, 170, 0)
ITEMS = [('Fenster auf, 5 Min. Tageslicht', 40), ('Handy erst nach dem Frühstück', 62),
         ('750 ml Wasser + 1 Stick Oceanmin', 84), ('10 Min. spazieren', 106), ('Erst dann: Kaffee', 128)]
TICK0, TICKD = 150, 16

def check(d, x, y, on):
    if on:
        d.ellipse([x, y, x + 64, y + 64], fill=ACC)
        d.line([(x + 16, y + 34), (x + 28, y + 46), (x + 50, y + 20)], fill=PAPER, width=8, joint='curve')
    else: d.ellipse([x, y, x + 64, y + 64], outline=(200, 200, 205), width=5)

def frame(i):
    cv = canvas(PAPER); d = ImageDraw.Draw(cv)
    d.text((70, 200), '‹ Notizen', font=F('med', 46), fill=ACC)
    d.text((70, 300), 'Heute, 06:42', font=F('med', 34), fill=GRAY)
    d.text((70, 350), 'Morgenroutine', font=F('bold', 84), fill=INK)
    y = 520
    for k, (t, fr) in enumerate(ITEMS):
        if i < fr: break
        typed = t[:int((i - fr) * 2.2)]
        done = i >= TICK0 + k * TICKD
        check(d, 70, y - 4, done)
        hl = 'Oceanmin' in t
        col = GRAY if done and not hl else INK
        d.text((160, y), typed, font=F('bold' if hl else 'med', 48), fill=col)
        if done and not hl and typed == t:
            w = F('med', 48).getlength(t); d.line([160, y + 30, 160 + w, y + 30], fill=GRAY, width=3)
        if hl and done:
            w = F('bold', 48).getlength(t)
            d.rectangle([156, y + 54, 164 + w, y + 64], fill=ACC)
        y += 120
    if i >= 230:
        f = i - 230
        put_left(cv, text_img('Oceanmin von Coral Club:', 'bold', 46, INK), 70, 1140, ease_out(f / 5))
        put_left(cv, text_img(f"{FAKTEN['mg']} mg Magnesium pro Stick", 'med', 46, INK), 70, 1210, ease_out((f - 4) / 5))
        put_left(cv, text_img(f"{FAKTEN['club']} mit Clubpreis → {CTA_ZEILE}".replace('→', '·'), 'med', 46, INK), 70, 1280, ease_out((f - 8) / 5))
        product(cv, 'oceanmin.png', 300, 900, 1190, (f - 10) / 10, f, rot=-6, op=.2)
    # Hook-Overlay im TikTok-Textstil
    a = 1 - ease_out((i - 120) / 10)
    for k, row in enumerate(['Meine Morgenroutine,', 'die ich wirklich durchziehe']):
        put(cv, text_img(row, 'black', 84, (255, 255, 255), INK, 24, 14), W / 2, 1150 + k * 120, back((i - k * 4) / 8), a * ease_out((i - k * 4) / 4))
    if i >= 230: pflicht(cv, ease_out((i - 230) / 8), GRAY, y=1590, size=22)
    if i >= 270:
        put(cv, text_img('↓ ' + CTA_ZEILE.upper() + ' ↓', 'black', 90, (255, 255, 255), INK, 30, 18), W / 2, 1450, back((i - 270) / 8), ease_out((i - 270) / 4))
    return cv

CUES = [('pop.wav', 0, .6)] + [('klack.wav', fr, .35) for _, fr in ITEMS] + \
       [('tick.wav', TICK0 + k * TICKD, .7) for k in range(len(ITEMS))] + [('ding.wav', TICK0 + 2 * TICKD, .6), ('wisch.wav', 230), ('pop.wav', 270)]

if __name__ == '__main__': run('06-notizen', frame, TOTAL, CUES)
