"""Produkt 2 – O!Mega-3 TG, Wissen mit Sprecher. Stil: Tiefsee (Navy/Türkis, gezeichnete Fische, Daten-Balken).
Claim im exakten Wortlaut VO (EU) 432/2012 inkl. Bedingung (250 mg EPA+DHA/Tag)."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from stimme import *

STARTS, TOTAL, WS = lade('omega3_schnell', {'Omega-3-TG': 'Omega-3 TG', '1080mg': '1080 mg', '720mg': '720 mg'})
TOP, BOT, WHT, TURK, ORA, STAR = (6, 40, 80), (2, 14, 34), (240, 248, 255), (60, 220, 210), (255, 130, 50), (255, 204, 0)
HINWEIS = ('Werbung · Affiliate-Link · Nahrungsergänzungsmittel. Kein Ersatz für eine ausgewogene, abwechslungsreiche Ernährung '
           'und eine gesunde Lebensweise. Verzehrempfehlung: 3 Kapseln täglich, nicht überschreiten. Die positive Wirkung stellt sich '
           'bei einer täglichen Aufnahme von 250 mg EPA und DHA ein. Clubpreis für registrierte Mitglieder. Preise: de.coral.club, Stand 02.10.2026')

@lru_cache(maxsize=1)
def tief():
    g = Image.new('RGBA', (1, H))
    for y in range(H): g.putpixel((0, y), mix(TOP, BOT, y / H) + (255,))
    return g.resize((W, H))

def blasen(cv, i):
    d = ImageDraw.Draw(cv)
    for k in range(14):
        x = (k * 173) % W; y = H - ((i * (3 + k % 3) + k * 211) % (H + 200)); r = 6 + k % 4 * 4
        d.ellipse([x - r, y - r, x + r, y + r], outline=(150, 220, 255, 90), width=3)

def tag(cv): put_left(cv, text_img('WISSEN · OMEGA-3', 'black', 36, BOT, TURK, 16, 22), 80, 250)

def frame(i):
    k, f = welche(STARTS, i)
    if k == 0:
        cv = cover('cc_omega3.jpg', i / 190, (1.0, 1.12), (.74, .4))
        put(cv, stroke_text('EPA', 'black', 230, sw=14), W / 2 - 200, 560, back(i / 6), ease_out(i / 3), rot=6)
        put(cv, stroke_text('DHA', 'black', 230, STAR, sw=14), W / 2 + 200, 760, back((i - 6) / 6), ease_out((i - 6) / 3), rot=-6)
        if f > 120:
            put(cv, text_img('= Fisch', 'black', 140, WHT, ORA, 30, 30), W / 2, 1120, back((f - 120) / 7), ease_out((f - 120) / 4))
            x = -400 + (f - 120) * 22; put(cv, fisch((255, 150, 120)), x, 1300)
        credit(cv, 'Foto: Coral Club')
    else:
        cv = tief().copy(); blasen(cv, i)
    if k == 1:
        put(cv, text_img('Omega-3-', 'black', 150, WHT), W / 2, 460, back(f / 7), ease_out(f / 4))
        put(cv, text_img('Fettsäuren', 'black', 150, TURK), W / 2, 610, back((f - 4) / 7), ease_out((f - 4) / 4))
        # "Körper bildet nur wenig selbst": fast leerer Tropfen
        d = ImageDraw.Draw(cv); cx, cy = W / 2, 980
        for inset, col in [(0, WHT), (10, BOT)]:
            d.ellipse([cx - 120 + inset, cy - 60 + inset, cx + 120 - inset, cy + 180 - inset], fill=col)
            d.polygon([(cx - 104 + inset, cy + 10), (cx, cy - 200 + inset * 2), (cx + 104 - inset, cy + 10)], fill=col)
        lvl = 30 * ease_out((f - 40) / 20); d.chord([cx - 110, cy - 50, cx + 110, cy + 170], 30, 150, fill=STAR) if lvl > 1 else None
        put(cv, text_img('Körper bildet nur sehr wenig selbst', 'bold', 56, WHT), W / 2, 1290, 1, ease_out((f - 40) / 6))
    elif k == 2:
        put(cv, text_img('Gute Quellen', 'black', 120, WHT), W / 2, 420, 1, ease_out(f / 5))
        for j, (name, col, st) in enumerate([('Lachs', (250, 140, 110), False), ('Hering', (170, 190, 210), False), ('Makrele', (90, 150, 170), True)]):
            t = (f - 10 - j * 25) / 8; y = 640 + j * 230
            put(cv, fisch(col, 300, st), 380 + (1 - ease_out(t)) * -500 + math.sin(i / 8 + j) * 12, y, 1, ease_out(t * 2))
            put_left(cv, text_img(name, 'black', 90, WHT), 600, y, ease_out(t * 2))
        put(cv, text_img('fettreiche Meeresfische', 'bold', 54, TURK), W / 2, 1340, 1, ease_out((f - 70) / 6))
    elif k == 3:
        d = ImageDraw.Draw(cv)
        for j in range(12):
            a = math.radians(-90 + j * 30 + i * .4); x, y = W / 2 + math.cos(a) * 170, 560 + math.sin(a) * 170
            r = 18; d.polygon([(x + math.cos(math.radians(-90 + m * 36)) * (r if m % 2 == 0 else r * .42), y + math.sin(math.radians(-90 + m * 36)) * (r if m % 2 == 0 else r * .42)) for m in range(10)], fill=STAR)
        # Herz
        hz = Image.new('RGBA', (200, 190)); hd = ImageDraw.Draw(hz)
        hd.ellipse([0, 0, 110, 110], fill=(235, 60, 80)); hd.ellipse([90, 0, 200, 110], fill=(235, 60, 80)); hd.polygon([(8, 80), (192, 80), (100, 185)], fill=(235, 60, 80))
        put(cv, hz, W / 2, 560, (1 + .08 * math.sin(i / 3)) * back(f / 8), ease_out(f / 4))
        put(cv, text_img('Offiziell zugelassen (EU):', 'bold', 54, STAR), W / 2, 860, 1, ease_out((f - 10) / 5))
        for j, r in enumerate(['„EPA und DHA tragen zu einer', 'normalen Herzfunktion bei.“']):
            put(cv, text_img(r, 'black', 76, WHT), W / 2, 980 + j * 96, 1, ease_out((f - 20 - j * 6) / 6))
        put(cv, text_img('ab 250 mg EPA + DHA pro Tag', 'black', 66, BOT, TURK, 22, 30), W / 2, 1260, back((f - 160) / 7), ease_out((f - 160) / 4))
    elif k == 4:
        put(cv, text_img('O!Mega-3 TG', 'black', 120, WHT), W / 2, 400, back(f / 7), ease_out(f / 4))
        put(cv, text_img('pro Tagesportion (3 Kapseln)', 'bold', 52, TURK), W / 2, 500, 1, ease_out((f - 6) / 5))
        for j, (lab, v, col) in enumerate([('EPA', 1080, ORA), ('DHA', 720, STAR)]):
            g = ease_out((f - 60 - j * 40) / 20); y = 640 + j * 190
            put_left(cv, text_img(lab, 'black', 90, WHT), 90, y, ease_out((f - 60 - j * 40) / 5))
            ImageDraw.Draw(cv).rounded_rectangle([300, y - 40, 300 + max(20, int(560 * v / 1080 * g)), y + 40], 20, fill=col)
            if g > .5: put_left(cv, text_img(f'{int(v * g)} mg', 'black', 64, WHT), 320, y + 80, 1)
        put(cv, asset_img('cc_omega3_pack.jpg'), W / 2, 1180, 1, ease_out((f - 120) / 8))
    elif k == 5:
        put(cv, text_img('90 Kapseln · 30 Tage', 'bold', 60, TURK), W / 2, 420, 1, ease_out(f / 5))
        put(cv, text_img('30,00 €', 'black', 240, WHT), W / 2, 620, back((f - 4) / 7), ease_out((f - 4) / 4))
        old = text_img('statt 37,50 €', 'bold', 64, (150, 170, 190)); put(cv, old, W / 2, 790, 1, ease_out((f - 14) / 5))
        if f > 24:
            sx = F('bold', 64).getlength('statt '); x0 = W / 2 - old.width / 2 + sx
            ImageDraw.Draw(cv).line([x0, 792, x0 + (old.width - sx) * ease_out((f - 24) / 8), 792], fill=ORA, width=7)
        put(cv, text_img('= 1 € pro Tag', 'black', 80, BOT, STAR, 24, 30), W / 2, 930, back((f - 34) / 7), ease_out((f - 34) / 4))
        put(cv, text_img(CTA_ZEILE.upper() + '  ↓', 'black', 90, BOT, TURK, 30, 30), W / 2, 1130, back((f - 60) / 7), ease_out((f - 60) / 4))
        hinweis(cv, HINWEIS, ease_out((f - 10) / 8), y=1600, color=(200, 215, 230), bg=BOT)
    untertitel(cv, WS, i)
    tag(cv); return cv

@lru_cache(maxsize=None)
def asset_img(name):
    im = Image.open(os.path.join(A, name)).convert('RGBA'); w = 560; h = int(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS); m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], 40, fill=255)
    im.putalpha(m); return im

CUES = [('einschlag.wav', 0, .5), ('pop.wav', 6, .4), ('wasser.wav', STARTS[0] + 120, .4), ('wisch.wav', STARTS[1], .3),
        ('wisch.wav', STARTS[2], .3)] + [('pop.wav', STARTS[2] + 10 + j * 25, .35) for j in range(3)] + \
       [('glitzer.wav', STARTS[3], .3), ('stempel.wav', STARTS[3] + 160, .35), ('wisch.wav', STARTS[4], .3), ('zoom.wav', STARTS[4] + 60, .3),
        ('wisch.wav', STARTS[5], .3), ('kaching.wav', STARTS[5] + 6, .35),
        (os.path.join(A, 'stimme', 'omega3_schnell.mp3'), int(VORLAUF * FPS), 1.6)]

if __name__ == '__main__': run('p2-omega3', frame, TOTAL, CUES)
