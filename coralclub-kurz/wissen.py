"""Serie "Magnesium-Wissen": Folien-Engine. Ein Video = Liste von Folien (dict mit 'typ').
Typen: titel, balken, zahl, liste, ende. Dauer je Folie in Frames ('d')."""
from engine import *

BG, INK, ACC, HL, SOFT = (247, 244, 238), (18, 22, 28), (0, 128, 118), (255, 222, 89), (120, 116, 110)

def tag(cv, nr):
    put_left(cv, text_img(f'MAGNESIUM-WISSEN  {nr}/5', 'black', 40, (255, 255, 255), ACC, 18, 12), 80, 250)

def rows(cv, lines, f, top, size=150, hl=None, color=INK, font='black', gap=14, maxw=920, stagger=4):
    y = top
    for k, r in enumerate(lines):
        s = min(size, fit(r, font, maxw, size))
        im = text_img(r, font, s, color, HL if k == hl else None, 12 if k == hl else 0)
        t = (f - k * stagger) / 7
        put(cv, im, W / 2, y + im.height / 2 + (1 - ease_out(t)) * 40, 0.92 + 0.08 * back(t), ease_out(t * 1.6))
        y += im.height + gap
    return y

def quelle(cv, text, a):
    for k, r in enumerate(wrap('Quelle: ' + text, 'med', 26, 900)):
        put(cv, text_img(r, 'med', 26, SOFT), W / 2, 1480 + k * 34, 1, a)

def folie(cv, s, f):
    t = s['typ']
    if t == 'titel':
        y = rows(cv, s['zeilen'], f, s.get('top', 520), s.get('size', 160), s.get('hl'))
        if s.get('unter'): rows(cv, s['unter'], f - 10, y + 40, 64, font='bold', color=SOFT)
    elif t == 'balken':
        y = rows(cv, s['titel'], f, 400, 96)
        mx = max(v for _, v, _ in s['werte'])
        for k, (lab, v, txt) in enumerate(s['werte']):
            yy = y + 60 + k * 190; g = ease_out((f - 10 - k * 8) / 14)
            if g <= 0: continue
            hi = k == s.get('hl')
            put_left(cv, text_img(lab, 'bold', 54, INK), 80, yy, ease_out(g * 2))
            d = ImageDraw.Draw(cv); wbar = int(540 * v / mx * g)
            d.rounded_rectangle([80, yy + 45, 80 + max(wbar, 24), yy + 115], 14, fill=(HL if hi else ACC))
            put_left(cv, text_img(txt, 'black', 60, INK), 80 + max(wbar, 24) + 20, yy + 80, ease_out((g - .6) * 3))
    elif t == 'zahl':
        n = s['zahl']; g = ease_out(f / 18)
        txt = s.get('fmt', '{}').format(int(round(n * g)) if isinstance(n, int) else n)
        put(cv, text_img(txt, 'black', s.get('size', 300), ACC), W / 2, 700, back(f / 8), ease_out(f / 4))
        rows(cv, s['zeilen'], f - 8, 900, 84, s.get('hl'), font='black')
    elif t == 'liste':
        y = rows(cv, s['titel'], f, 360, 96)
        y += 30
        for k, item in enumerate(s['punkte']):
            a = ease_out((f - 10 - k * s.get('step', 12)) / 6)
            if a <= 0: break
            ls = wrap(item, 'bold', s.get('size', 52), 860)
            d = ImageDraw.Draw(cv); d.ellipse([80, y + 10, 104, y + 34], fill=ACC)
            for r in ls:
                put_left(cv, text_img(r, 'bold', s.get('size', 52), INK), 130, y + 22, a); y += s.get('size', 52) + 14
            y += 26
    elif t == 'ende':
        rows(cv, s['zeilen'], f, 560, 130, s.get('hl'))
        pt = 'Folgen für Teil ' + s['naechste'] if s.get('naechste') else 'Folgen für mehr'
        put(cv, text_img(pt, 'black', fit(pt, 'black', 860, 80), (255, 255, 255), INK, 30, 40),
            W / 2, 1000, back((f - 12) / 8), ease_out((f - 12) / 4))
        if s.get('produkt'):
            put(cv, text_img(s['produkt'], 'bold', 46, INK), W / 2, 1140, 1, ease_out((f - 22) / 6))
            put(cv, text_img(CTA_ZEILE, 'bold', 46, ACC), W / 2, 1205, 1, ease_out((f - 26) / 6))
            product(cv, 'oceanmin.png', 240, W / 2, 1400, (f - 26) / 10, f, op=.2)

def make(name, nr, folien, quellen, claim=False):
    starts, t = [], 0
    for s in folien: starts.append(t); t += s['d']
    total = t

    def frame(i):
        cv = canvas(BG); d = ImageDraw.Draw(cv)
        d.rectangle([0, 0, int(W * i / (total - 1)), 10], fill=ACC)
        tag(cv, nr)
        k = max(j for j, s in enumerate(starts) if s <= i); f = i - starts[k]
        folie(cv, folien[k], f)
        q = folien[k].get('quelle')
        if q is not None: quelle(cv, quellen[q], ease_out(f / 10))
        if folien[k]['typ'] == 'ende' and folien[k].get('produkt'): pflicht(cv, ease_out((f - 26) / 8), SOFT, y=1580, size=21, claim=claim)
        return cv

    cues = []
    for s0, s in zip(starts, folien):
        cues.append(('wisch.wav' if s0 else 'einschlag.wav', s0, .6))
        if s['typ'] == 'balken': cues += [('pop.wav', s0 + 10 + k * 8, .6) for k in range(len(s['werte']))]
        if s['typ'] == 'liste': cues += [('tick.wav', s0 + 10 + k * s.get('step', 12), .5) for k in range(len(s['punkte']))]
        if s['typ'] == 'zahl': cues.append(('ding.wav', s0 + 18, .6))
    run(name, frame, total, cues)
