"""10 Unboxing – verspielt, Pastell, 15 Sticks fächern auf. Hook: Was steckt in dieser Packung?"""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine import *

TOTAL = 320
BG, CORAL, INK, WHT, BLUE = (206, 236, 240), (255, 112, 92), (16, 40, 70), (255, 255, 255), (30, 110, 220)
FAN0 = 60  # Start Auffächern, ein Stick alle 4 Frames

@lru_cache(maxsize=1)
def stick():
    im = Image.new('RGBA', (90, 440)); d = ImageDraw.Draw(im)
    for y in range(440): d.line([0, y, 89, y], fill=mix((60, 170, 240), (20, 60, 160), y / 440) + (255,))
    m = Image.new('L', im.size); ImageDraw.Draw(m).rounded_rectangle([0, 0, 89, 439], 18, fill=255); im.putalpha(m)
    t = text_img('coralclub', 'bold', 40, WHT).rotate(90, expand=True); im.alpha_composite(t, (45 - t.width // 2, 220 - t.height // 2))
    return im

def frame(i):
    cv = canvas(BG); d = ImageDraw.Draw(cv)
    # Hook
    a = 1 - ease_out((i - 120) / 8)
    put(cv, text_img('Was steckt in', 'black', 140, INK), W / 2, 300, back(i / 8), a * ease_out(i / 4))
    put(cv, text_img('dieser Packung?', 'black', 140, CORAL), W / 2, 440, back((i - 6) / 8), a * ease_out((i - 6) / 4))
    cx, cy = W / 2, 1080
    n = clamp((i - FAN0) / 4, 0, 15)
    for k in range(int(math.ceil(n))):
        t = clamp(n - k)
        ang = (-70 + k * 10) * ease_out(t)
        r = 400 * ease_out(t)
        x = cx + math.sin(math.radians(ang)) * r; y = cy + 70 - math.cos(math.radians(ang)) * r
        put(cv, stick(), x, y, 0.8, 1, -ang)
    # Packung vorne
    put(cv, shadow('oceanmin.png', 520), cx, cy + 210, back(i / 10), ease_out(i / 5))
    put(cv, asset('oceanmin.png', 520), cx + (math.sin(i * 2) * 10 if FAN0 - 10 < i < FAN0 else 0), cy + 170, back(i / 10), ease_out(i / 5))
    if i >= FAN0:
        cnt = int(n)
        put(cv, text_img(f'{cnt} Sticks', 'black', 110, WHT, CORAL, 30, 60), W / 2, 1620, back(((i - FAN0) % 4) / 3 if cnt < 15 else 1), ease_out((i - FAN0) / 4) * (1 - ease_out((i - 222) / 6)))
    facts = [(130, f"je {FAKTEN['mg']} mg Magnesium"), (150, f"je 1 Stick auf {FAKTEN['ml']} ml Wasser"), (170, f"= 15 Tage für {FAKTEN['club']}")]
    for k, (fr, t) in enumerate(facts):
        if i >= fr: put(cv, text_img(t, 'black', 76, INK if k < 2 else WHT, WHT if k < 2 else INK, 26, 40), W / 2, 330 + k * 130, back((i - fr) / 8), ease_out((i - fr) / 4))
    if i >= 230:
        f = i - 230
        put(cv, text_img('↓ ' + CTA_ZEILE.upper() + ' ↓', 'black', 110, WHT, BLUE, 36, 60), W / 2, 1560, back(f / 8) * (1 + .03 * math.sin(f / 4)), ease_out(f / 4))
    if i >= 170: pflicht(cv, 1, (80, 110, 130), y=1720, size=20)
    return cv

CUES = [('einschlag.wav', 0), ('pop.wav', 6), ('klack.wav', FAN0 - 10), ('wisch.wav', FAN0)] + [('pop.wav', FAN0 + k * 4, .5) for k in range(15)] + \
       [('ding.wav', FAN0 + 60), ('tick.wav', 130), ('tick.wav', 150), ('kaching.wav', 170), ('zoom.wav', 230, .5)]

if __name__ == '__main__': run('10-unboxing', frame, TOTAL, CUES)
