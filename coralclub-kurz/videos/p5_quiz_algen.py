"""Produkt 5 – Quiz Spirulina vs. Chlorella, ohne Stimme. Stil: Versus (zwei Produktfotos, Frageband, Countdown).
Nur Fakten: Spirulina = Cyanobakterium, Chlorella = einzellige Grünalge, Packungsreichweite laut Verzehrempfehlung."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bild import *

INK, WHT, GRN, RED, YEL = (16, 22, 20), (255, 255, 255), (40, 200, 110), (230, 60, 60), (255, 214, 0)
FRAGEN = [  # (Frage-Zeilen, richtig 0=Spirulina 1=Chlorella, Auflösung)
    (['Welche ist gar keine Alge,', 'sondern ein Bakterium?'], 0, 'Spirulina: ein Cyanobakterium'),
    (['Welche ist eine', 'einzellige Grünalge?'], 1, 'Chlorella: einzellige Grünalge'),
    (['Welche Packung', 'reicht länger?'], 0, 'Spirulina: 200 Tabl. ÷ 4 = 50 Tage · Chlorella: 180 ÷ 6 = 30 Tage'),
]
INTRO, Q, END = 50, 150, 150
TOTAL = INTRO + Q * len(FRAGEN) + END
HINWEIS = ('Werbung · Affiliate-Link · Nahrungsergänzungsmittel. Kein Ersatz für eine ausgewogene, abwechslungsreiche Ernährung und eine gesunde '
           'Lebensweise. Verzehrempfehlung: Spirulina 2 × 2 Tabletten, Chlorella 3 × 2 Tabletten täglich; nicht überschreiten. '
           'Clubpreis für registrierte Mitglieder. Preise: de.coral.club, Stand 02.10.2026')

@lru_cache(maxsize=None)
def _halb_base(name):
    im = Image.open(os.path.join(A, name)).convert('RGB'); s = max(W * 1.15 / im.width, (H / 2) * 1.15 / im.height)
    return im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)

def halb(name, t, fx=.5):
    b = _halb_base(name); z = 1 + .08 * ease_io(t); cw, ch = W / z * (b.width / (W * 1.15)) * 1.0, H / 2 / z * (b.height / (H / 2 * 1.15))
    cw, ch = min(b.width, W / z * 1.0 * (b.height / (H / 2 * 1.15)) if False else b.width / 1.15 / z), b.height / 1.15 / z
    x0 = clamp(b.width * fx - cw / 2, 0, b.width - cw); y0 = (b.height - ch) / 2
    return b.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H // 2), Image.BILINEAR).convert('RGBA')

def label(text, col): return text_img(text, 'black', 70, WHT, col, 22, 18)

def frame(i):
    cv = canvas(INK)
    top, bot = halb('cc_spirulina.jpg', i / TOTAL, .55), halb('cc_chlorella.jpg', i / TOTAL, .6)
    q = (i - INTRO) // Q if i >= INTRO else -1; f = (i - INTRO) % Q if q >= 0 else i
    if 0 <= q < len(FRAGEN) and f >= 100:
        ok = FRAGEN[q][1]
        dim = Image.new('RGBA', (W, H // 2), (0, 0, 0, 150))
        (bot if ok == 0 else top).alpha_composite(dim)
    cv.alpha_composite(top, (0, 0)); cv.alpha_composite(bot, (0, H // 2))
    put(cv, label('A · SPIRULINA', (30, 120, 90)), W / 2, 330); put(cv, label('B · CHLORELLA', (60, 150, 60)), W / 2, H // 2 + 200)
    d = ImageDraw.Draw(cv)
    if i < INTRO:
        d.rectangle([0, H / 2 - 150, W, H / 2 + 150], fill=INK)
        put(cv, text_img('Spirulina oder Chlorella?', 'black', 92, WHT), W / 2, H / 2 - 50, back(i / 6), ease_out(i / 3))
        put(cv, text_img('3 Fragen · zähl mit!', 'black', 70, YEL), W / 2, H / 2 + 60, back((i - 8) / 6), ease_out((i - 8) / 3))
    elif q < len(FRAGEN):
        zeilen, ok, auf = FRAGEN[q]
        d.rectangle([0, H / 2 - 150, W, H / 2 + 150], fill=INK)
        put(cv, text_img(f'FRAGE {q + 1}/3', 'black', 44, INK, YEL, 12, 8), W / 2, H / 2 - 150, 1, 1)
        for j, z in enumerate(zeilen):
            put(cv, text_img(z, 'black', fit(z, 'black', 960, 84), WHT), W / 2, H / 2 - 40 + j * 96, back((f - j * 4) / 6), ease_out((f - j * 4) / 3))
        if f < 100:
            k = clamp((f - 10) / 90); d.rectangle([0, H / 2 + 140, int(W * (1 - k)), H / 2 + 150], fill=YEL if k < .7 else RED)
            n = 3 - int(k * 3)
            if f > 10: put(cv, text_img(str(min(3, n)), 'black', 130, INK, YEL, 30, 80), W - 140, H / 2 - 260, 1 + .15 * (1 - ((f - 10) % 30) / 30))
        else:
            g = f - 100; y0 = 0 if ok == 0 else H // 2
            d.rectangle([12, 12, W - 12, H // 2 - 160] if ok == 0 else [12, H // 2 + 160, W - 12, H - 12], outline=GRN, width=20)
            chk = Image.new('RGBA', (200, 200)); cd = ImageDraw.Draw(chk); cd.ellipse([0, 0, 199, 199], fill=GRN)
            cd.line([(50, 104), (88, 142), (152, 66)], fill=WHT, width=22, joint='curve')
            put(cv, chk, W - 170, y0 + H // 4, back(g / 6, 2.4), ease_out(g / 3))
            for j, r in enumerate(wrap(auf, 'bold', 44, 940)):
                put(cv, text_img(r, 'bold', 44, INK, YEL, 10, 8), W / 2, (620 if ok == 0 else H // 2 + 320) + j * 64, 1, ease_out(g / 4))
    else:
        g = i - INTRO - Q * len(FRAGEN)
        d.rectangle([0, 0, W, H], fill=INK)
        put(cv, text_img('Wie viele hattest du?', 'black', 96, WHT), W / 2, 420, back(g / 6), ease_out(g / 3))
        put(cv, text_img('Schreib’s in die Kommentare!', 'black', 66, YEL), W / 2, 530, 1, ease_out((g - 6) / 4))
        for j, (name, preis, inhalt, img) in enumerate([('Spirulina', '25,00 €', '200 Tabletten', 'cc_spirulina.jpg'), ('Chlorella', '23,50 €', '180 Tabletten', 'cc_chlorella.jpg')]):
            x = 290 + j * 500; t = (g - 14 - j * 8) / 7
            ph = halb(img, 0, .55 if j == 0 else .6).resize((420, 210)); m = Image.new('L', ph.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, 419, 209], 30, fill=255); ph.putalpha(m)
            put(cv, ph, x, 780, back(t), ease_out(t * 2))
            put(cv, text_img(name, 'black', 64, WHT), x, 940, 1, ease_out(t * 2)); put(cv, text_img(preis, 'black', 90, GRN), x, 1040, 1, ease_out(t * 2))
            put(cv, text_img(inhalt + ' · Clubpreis', 'bold', 36, (180, 190, 185)), x, 1120, 1, ease_out(t * 2))
        put(cv, text_img(CTA_ZEILE.upper() + '  ↓', 'black', 90, INK, YEL, 30, 30), W / 2, 1300, back((g - 40) / 7), ease_out((g - 40) / 4))
        for j, r in enumerate(wrap(HINWEIS, 'med', 22, 920)): put(cv, text_img(r, 'med', 22, (170, 180, 175)), W / 2, 1560 + j * 32, 1, ease_out((g - 20) / 8))
    put(cv, text_img('Fotos: Coral Club', 'med', 20, WHT), W / 2, 1880, 1, .7)
    return cv

CUES = [('einschlag.wav', 0), ('pop.wav', 8)]
for q in range(len(FRAGEN)):
    s = INTRO + q * Q
    CUES += [('wisch.wav', s, .6), ('tick.wav', s + 10, .5), ('tick.wav', s + 40, .5), ('tick.wav', s + 70, .5), ('ding.wav', s + 100), ('glitzer.wav', s + 100, .4)]
CUES += [('wisch.wav', TOTAL - END), ('pop.wav', TOTAL - END + 14, .5), ('pop.wav', TOTAL - END + 22, .5), ('kaching.wav', TOTAL - END + 40, .6)]

if __name__ == '__main__': run('p5-quiz-algen', frame, TOTAL, CUES)
