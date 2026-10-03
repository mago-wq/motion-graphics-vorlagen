"""07 Luxus – ruhig, Serif, Gold. Hook: Ein Stick. Ein Glas. Das ist alles."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine import *

TOTAL = 300
BG, GOLD, WHT, DIM = (8, 8, 10), (214, 184, 124), (240, 236, 228), (120, 116, 108)

def spaced(text, font, size, color, track):
    f = F(font, size); w = int(sum(f.getlength(c) for c in text) + track * (len(text) - 1)) + 4
    im = Image.new('RGBA', (w, int(size * 1.4))); d = ImageDraw.Draw(im); x = 0
    for c in text: d.text((x, 0), c, font=f, fill=color); x += f.getlength(c) + track
    return im

@lru_cache(maxsize=1)
def glow():
    g = Image.new('RGBA', (900, 900)); ImageDraw.Draw(g).ellipse([150, 150, 750, 750], fill=(60, 90, 160, 120))
    return g.filter(ImageFilter.GaussianBlur(120))

def fade(f, a, b, ramp=10): return ease_io((f - a) / ramp) * (1 - ease_io((f - b) / ramp))

def frame(i):
    cv = canvas(BG); grain(cv, i, 6)
    put(cv, spaced('Ein Stick.', 'serif', 110, WHT, 2), W / 2, 760 - 20 * ease_out(i / 20), 1, fade(i, 0, 96))
    put(cv, spaced('Ein Glas.', 'serif', 110, WHT, 2), W / 2, 920 - 20 * ease_out((i - 22) / 20), 1, fade(i, 22, 96))
    put(cv, spaced('Das ist alles.', 'serif', 110, GOLD, 2), W / 2, 1080 - 20 * ease_out((i - 44) / 20), 1, fade(i, 44, 96))
    if i >= 100:
        f = i - 100
        put(cv, glow(), W / 2, 900, 0.9 + 0.1 * math.sin(f / 20), ease_io(f / 30))
        put(cv, asset('oceanmin.png', 640), W / 2, 920 - 30 * ease_out(f / 40), 1, ease_io(f / 20))
        # Lichtkante, die einmal über die Packung läuft
        if 20 < f < 60:
            x = -400 + (f - 20) / 40 * 1300
            sh = Image.new('RGBA', (W, H)); ImageDraw.Draw(sh).polygon([(x, 560), (x + 60, 560), (x + 160, 1280), (x + 100, 1280)], fill=(255, 255, 255, 50))
            pack = asset('oceanmin.png', 640); m = Image.new('L', (W, H)); m.paste(pack.getchannel('A'), (int(W / 2 - pack.width / 2), int(920 - 30 * ease_out(f / 40) - pack.height / 2)))
            sh.putalpha(Image.composite(sh.getchannel('A'), Image.new('L', (W, H)), m)); cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
        put(cv, spaced('OCEANMIN', 'serif', 72, WHT, 24), W / 2, 380, 1, ease_io((f - 10) / 20))
        put(cv, spaced('CORAL CLUB', 'serif', 34, GOLD, 14), W / 2, 460, 1, ease_io((f - 16) / 20))
        put(cv, spaced(f"{FAKTEN['mg']} mg Magnesium · {FAKTEN['nrv']} % NRV", 'serif', 44, DIM, 2), W / 2, 1330, 1, ease_io((f - 40) / 20))
    if i >= 190:
        f = i - 190
        put(cv, spaced(f"Clubpreis {FAKTEN['club']}", 'serif', 64, WHT, 3), W / 2, 1440, 1, ease_io(f / 20))
        line = Image.new('RGBA', (int(500 * ease_out((f - 20) / 20)) + 1, 2), GOLD + (255,))
        put(cv, line, W / 2, 1520)
        put(cv, spaced(CTA_ZEILE.upper(), 'serif', 44, GOLD, 12), W / 2, 1580, 1, ease_io((f - 30) / 20))
        pflicht(cv, ease_io((f - 30) / 20), (90, 88, 84), y=1690, size=20)
    return cv

CUES = [('glitzer.wav', 100, .5), ('ding.wav', 120, .35), ('ding.wav', 220, .3)]

if __name__ == '__main__': run('07-luxus', frame, TOTAL, CUES)
