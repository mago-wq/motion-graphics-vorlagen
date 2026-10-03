"""08 Terminal – Spar-Hack, getippt. Hook: Der Coral-Club-Spar-Hack."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine import *

TOTAL = 320
BG, GRN, DIM, WHT, YEL = (6, 10, 8), (70, 255, 130), (60, 120, 80), (230, 255, 235), (255, 214, 0)
LINES = [  # (Frame, Text, Farbe, getippt?)
    (30, '$ spar-hack --produkt oceanmin', WHT, True),
    (62, 'normalpreis ..... ' + FAKTEN['normal'], GRN, False),
    (72, 'clubpreis ....... ' + FAKTEN['club'], GRN, False),
    (82, 'ersparnis ....... 20 %', YEL, False),
    (92, 'gilt für ........ alle Produkte', GRN, False),
    (102, 'magnesium ....... 120 mg/Stick', GRN, False),
    (130, '$ anleitung', WHT, True),
    (150, '[1] Link in Bio antippen', GRN, False),
    (160, '[2] Registrieren', GRN, False),
    (170, '[3] Clubpreis nutzen', GRN, False),
]
FS = 46

def frame(i):
    cv = canvas(BG); d = ImageDraw.Draw(cv)
    # Hook
    put(cv, text_img('DER CORAL-CLUB', 'black', 130, WHT), W / 2, 300, back(i / 8), ease_out(i / 4))
    put(cv, text_img('SPAR-HACK', 'black', 200, GRN), W / 2 + (math.sin(i * 7) * 8 if i % 23 < 2 else 0), 470, back((i - 6) / 8), ease_out((i - 6) / 4))
    # Terminalfenster
    d.rounded_rectangle([60, 640, 1020, 1440], 24, fill=(14, 22, 18), outline=(40, 70, 50), width=3)
    for k, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]): d.ellipse([100 + k * 50, 670, 130 + k * 50, 700], fill=c)
    y = 740; cur = None
    for fr, t, col, typed in LINES:
        if i < fr: break
        s = t[:int((i - fr) * 1.6) + 1] if typed else t
        d.text((100, y), s, font=F('mono', FS), fill=col); cur = (100 + F('mono', FS).getlength(s), y)
        y += 64 if not t.startswith('$') else 74
    if cur and (i // 8) % 2 == 0: d.rectangle([cur[0] + 6, cur[1] + 4, cur[0] + 32, cur[1] + 52], fill=GRN)
    # Scanlines
    if i % 2 == 0:
        sl = Image.new('RGBA', (W, H)); sd = ImageDraw.Draw(sl)
        for yy in range(0, H, 6): sd.line([0, yy, W, yy], fill=(0, 0, 0, 40))
        cv.alpha_composite(sl)
    if i >= 200:
        f = i - 200
        put(cv, text_img('> ' + CTA_ZEILE.upper() + ' <', 'black', 110, BG, GRN, 30, 8), W / 2, 1560, back(f / 8), ease_out(f / 4))
    if i >= 62: pflicht(cv, 1, DIM, y=1690, size=21)
    return cv

CUES = [('zapp.wav', 0), ('einschlag.wav', 6)] + [('klack.wav', fr + k * 2, .25) for fr, t, _, ty in LINES if ty for k in range(len(t) // 3)] + \
       [('tick.wav', fr, .4) for fr, _, _, ty in LINES if not ty] + [('kaching.wav', 82), ('ding.wav', 200)]

if __name__ == '__main__': run('08-terminal', frame, TOTAL, CUES)
