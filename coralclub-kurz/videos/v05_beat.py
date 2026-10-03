"""05 Beat – kinetische Typo, ein Wort pro Schlag, Loop. Hook: Die 6-Sekunden-Routine."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine import *

BLUE, YEL, BLK, WHT, CORAL = (22, 62, 170), (255, 214, 0), (14, 14, 14), (255, 255, 255), (255, 107, 90)
BEATS = [  # (Text, Klein, Hintergrund, Schrift, Dauer, Bild)
    ('DIE ROUTINE', 'in 6 Sekunden', BLK, WHT, 22, None),
    ('1 STICK.', '', YEL, BLK, 15, 'stick-pulver.png'),
    ('750 ML.', 'Wasser', BLUE, WHT, 15, None),
    ('SCHÜTTELN.', '', CORAL, BLK, 15, None),
    ('FERTIG.', '', WHT, BLK, 15, None),
    ('OCEANMIN', 'von Coral Club', BLUE, WHT, 22, 'oceanmin.png'),
    ('120 MG', 'Magnesium pro Stick', YEL, BLK, 18, None),
    (FAKTEN['club'].replace(',00', ''), 'mit Clubpreis', BLK, YEL, 18, None),
    ('LINK IN BIO', '↓', BLUE, WHT, 40, None),
]
STARTS = [sum(b[4] for b in BEATS[:k]) for k in range(len(BEATS))]
TOTAL = sum(b[4] for b in BEATS)

def frame(i):
    k = max(j for j, s in enumerate(STARTS) if s <= i); f = i - STARTS[k]
    text, small, bg, fg, dur, img = BEATS[k]
    cv = canvas(bg)
    shake = (math.sin(f * 3.1) * 14 * max(0, 1 - f / 5)) if text == 'SCHÜTTELN.' or f < 4 else 0
    s = fit(text, 'black', 880, 300)
    y = 760 if img else 900
    if img:
        product(cv, img, 600, W / 2, 1300, f / 6, f, rot=-10 if 'stick' in img else 0, op=.35)
    put(cv, text_img(text, 'black', s, fg), W / 2 + shake, y, 1.25 - 0.25 * ease_out(f / 4))
    if small:
        sz = 140 if small == '↓' else 70
        put(cv, text_img(small, 'bold', sz, fg), W / 2, y + s * 0.62 + 40 + (math.sin(f / 4) * 14 if small == '↓' else 0), 1, ease_out((f - 2) / 3))
    if k >= 6: pflicht(cv, 1, mix(fg, bg, .35), y=1610, size=22)
    return cv

CUES = [('einschlag.wav', s, .8) for s in STARTS] + [('wasser.wav', STARTS[2]), ('zapp.wav', STARTS[3], .6), ('kaching.wav', STARTS[7]), ('ding.wav', STARTS[8])]

if __name__ == '__main__': run('05-beat', frame, TOTAL, CUES)
