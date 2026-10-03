"""Produkt 1 – Coralbrite Zahnpasta, mit Sprecherin. Stil: Clean Beauty (Mint, Weiß, echtes Produktfoto).
Kosmetikum: nur Fakten von der Produktseite, keine Heilversprechen."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from stimme import *

STARTS, TOTAL, WS = lade('coralbrite', {'Sahnpasta': 'Zahnpasta', 'Erbsengroße': 'erbsengroße'})
MINT, DEEP, WHT, CORAL, GRY = (214, 240, 232), (18, 70, 70), (255, 255, 255), (255, 120, 100), (110, 130, 130)
HINWEIS = 'Werbung · Affiliate-Link · Clubpreis für registrierte Mitglieder · Preise: de.coral.club, Stand 02.10.2026'

def tag(cv): put_left(cv, text_img('CORAL CLUB · CORALBRITE', 'black', 36, WHT, DEEP, 16, 22), 80, 250)

def zahn(cv, cx, cy, f):
    lay = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(lay)
    root = [(cx - 170, cy - 20), (cx - 140, cy + 360), (cx - 70, cy + 380), (cx - 20, cy + 120), (cx + 20, cy + 120), (cx + 70, cy + 380), (cx + 140, cy + 360), (cx + 170, cy - 20)]
    d.polygon(root, fill=(245, 240, 228), outline=DEEP, width=8)
    d.rounded_rectangle([cx - 220, cy - 280, cx + 220, cy + 40], 140, fill=(255, 255, 255), outline=DEEP, width=8)
    g = ease_out(f / 12)  # Schmelz als farbige Kappe
    cap = Image.new('L', (W, H)); ImageDraw.Draw(cap).rounded_rectangle([cx - 212, cy - 272, cx + 212, cy + 32], 132, fill=255)
    ImageDraw.Draw(cap).rounded_rectangle([cx - 160, cy - 210, cx + 160, cy + 60], 100, fill=0)
    col = Image.new('RGBA', (W, H), (90, 200, 220, int(230 * g))); lay.paste(col, (0, 0), cap)
    cv.alpha_composite(lay)
    if f > 10:
        d = ImageDraw.Draw(cv); d.line([cx + 200, cy - 200, cx + 300, cy - 300], fill=DEEP, width=6)
        put_left(cv, text_img('Schmelz', 'black', 56, DEEP), cx + 230, cy - 330, ease_out((f - 10) / 5))

def frame(i):
    k, f = welche(STARTS, i)
    if k == 0:
        if i < 70:
            cv = cover('foto_koralle.jpg', i / 70, (1.1, 1.3), (.5, .6)); shade(cv, .15, .5)
            put(cv, stroke_text('Zahnpasta', 'black', 160, sw=12), W / 2, 560, back(i / 6), ease_out(i / 3))
            put(cv, stroke_text('aus Korallen?', 'black', 140, (255, 214, 0), sw=12), W / 2, 720, back((i - 5) / 6), ease_out((i - 5) / 3))
            credit(cv, 'Bild: KI-generiert (Illustration)')
        else:
            cv = cover('cc_coralbrite.jpg', (i - 70) / 80, (1.6, 1.8), (.5, .5))
            put(cv, text_img('Gibt’s wirklich.', 'black', 120, WHT, DEEP, 30, 30), W / 2, 520, back((i - 70) / 6), ease_out((i - 70) / 3))
            credit(cv, 'Foto: Coral Club')
    elif k == 1:
        cv = cover('cc_coralbrite.jpg', f / 260, (1.4, 1.2), (.5, .5))
        for j, (txt, at) in enumerate([('Hydroxylapatit', 30), ('aus fossilen Korallen', 120), ('Insel Yonaguni, Japan', 200)]):
            put(cv, text_img(txt, 'black', 84, DEEP if j != 1 else WHT, WHT if j != 1 else CORAL, 26, 30), W / 2, 420 + j * 150, back((f - at) / 7), ease_out((f - at) / 4))
        credit(cv, 'Foto: Coral Club')
    elif k == 2:
        cv = canvas(MINT)
        zahn(cv, W / 2, 820, f)
        put(cv, text_img('Zahnschmelz', 'black', 96, DEEP), W / 2, 400, 1, ease_out(f / 5))
        put(cv, text_img('Hauptbestandteil:', 'bold', 60, GRY), W / 2, 1240, 1, ease_out((f - 20) / 5))
        put(cv, text_img('Hydroxylapatit', 'black', 100, (40, 160, 180)), W / 2, 1330, back((f - 26) / 7), ease_out((f - 26) / 4))
    elif k == 3:
        cv = canvas(MINT); d = ImageDraw.Draw(cv)
        # Japan-Flagge als Kreis + Zahnbürste mit Erbse
        put(cv, text_img('Made in Japan', 'black', 100, DEEP), W / 2, 380, back(f / 7), ease_out(f / 4))
        d.rectangle([W / 2 - 200, 480, W / 2 + 200, 740], fill=WHT, outline=(200, 200, 200), width=4); d.ellipse([W / 2 - 80, 530, W / 2 + 80, 690], fill=(200, 30, 50))
        bx = 180 + (1 - ease_out((f - 20) / 10)) * -600
        d.rounded_rectangle([bx, 960, bx + 560, 1000], 20, fill=(90, 200, 220)); d.rounded_rectangle([bx + 560, 930, bx + 760, 990], 14, fill=(220, 240, 245))
        for x in range(int(bx + 575), int(bx + 750), 22): d.line([x, 930, x, 880], fill=(160, 210, 230), width=10)
        if f > 40:
            pr = 34 * back((f - 40) / 8, 2.4); d.ellipse([bx + 660 - pr, 860 - pr, bx + 660 + pr, 860 + pr], fill=(120, 200, 140))
        put(cv, text_img('erbsengroße Menge', 'black', 84, DEEP, MINT, 24, 30), W / 2, 1150, back((f - 46) / 7), ease_out((f - 46) / 4))
    else:
        cv = cover('cc_coralbrite.jpg', f / 150, (1.25, 1.35), (.5, .45)); shade(cv, .0, .35)
        put(cv, text_img('Clubpreis', 'black', 90, DEEP), W / 2, 380, 1, ease_out(f / 5))
        put(cv, text_img('20,00 €', 'black', 220, CORAL), W / 2, 560, back((f - 4) / 7), ease_out((f - 4) / 4))
        old = text_img('statt 25,00 €', 'bold', 66, GRY); put(cv, old, W / 2, 720, 1, ease_out((f - 20) / 6))
        if f > 30:
            sx = F('bold', 66).getlength('statt '); x0 = W / 2 - old.width / 2 + sx
            ImageDraw.Draw(cv).line([x0, 722, x0 + (old.width - sx) * ease_out((f - 30) / 8), 722], fill=CORAL, width=7)
        put(cv, text_img(CTA_ZEILE.upper() + '  ↓', 'black', 90, WHT, DEEP, 30, 30), W / 2, 1150, back((f - 70) / 7), ease_out((f - 70) / 4))
        for j, r in enumerate(wrap(HINWEIS, 'med', 24, 900)):
            put(cv, text_img(r, 'med', 24, DEEP, WHT, 4), W / 2, 1600 + j * 34, 1, ease_out((f - 70) / 8))
        credit(cv, 'Foto: Coral Club')
    untertitel(cv, WS, i)
    tag(cv); return cv

CUES = [('einschlag.wav', 0, .5), ('glitzer.wav', 0, .35), ('wisch.wav', 70, .4), ('pop.wav', STARTS[1] + 30, .4),
        ('pop.wav', STARTS[1] + 120, .4), ('pop.wav', STARTS[1] + 200, .4), ('wisch.wav', STARTS[2], .35), ('ding.wav', STARTS[2] + 26, .35),
        ('wisch.wav', STARTS[3], .35), ('pop.wav', STARTS[3] + 40, .45), ('kaching.wav', STARTS[4] + 6, .4),
        (os.path.join(A, 'stimme', 'coralbrite.mp3'), int(VORLAUF * FPS), 1.6)]

if __name__ == '__main__': run('p1-coralbrite', frame, TOTAL, CUES)
