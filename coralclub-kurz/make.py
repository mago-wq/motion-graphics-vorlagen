"""Coral Club Kurz-Reel: 12,5 s, 1080x1920, 30 fps. Pillow-Frames + ffmpeg.
Inhalte nur in CFG. Rendern: python3 make.py -> out/coralclub-kurz.mp4"""
import math, os, subprocess, sys
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont, ImageFilter

A = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'a')
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/coralclub-kurz.mp4'
W, H, FPS = 1080, 1920, 30

CFG = {
    'hook': ['Das kommt', 'ab jetzt jeden', 'Tag in mein', 'Wasser'],
    'produkt': 'Oceanmin', 'marke': 'von Coral Club',
    'schritt': ['1 Stick', 'in 750 ml Wasser'],
    'mg': 120, 'mgZeile': 'Magnesium pro Stick', 'nrv': '32 % NRV',
    # Exakter Wortlaut VO (EU) 432/2012 – nicht umformulieren
    'claim': ['Magnesium trägt', 'zur Verringerung', 'von Müdigkeit und', 'Ermüdung bei.'],
    'preis': '19,00 €', 'normal': '23,75 €', 'preisZeile': 'mit Clubpreis', 'rabatt': '−20 %',
    'cta': 'Link in Bio', 'ctaZeile': 'Registrieren & 20 % sparen',
    'pflicht': 'Werbung · Affiliate-Link · Nahrungsergänzungsmittel. Kein Ersatz für eine ausgewogene, '
               'abwechslungsreiche Ernährung und eine gesunde Lebensweise. 1 Stick täglich, nicht '
               'überschreiten. Preise: de.coral.club, Stand 01.10.2026',
}
BG, INK, BLUE, YEL, MUTED = (244, 241, 234), (17, 17, 20), (22, 62, 170), (255, 214, 0), (110, 108, 104)

# Szenen: (Start, Ende) in Frames
SC = {'hook': (0, 45), 'prod': (45, 105), 'stick': (105, 165), 'mg': (165, 210),
      'claim': (210, 255), 'preis': (255, 315), 'cta': (315, 375)}
TOTAL = 375

F = lambda n, s: ImageFont.truetype(os.path.join(A, n), s)

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease_out(t): t = clamp(t); return 1 - (1 - t) ** 3
def back(t, s=1.4):  # leichtes Überschwingen, ~6 %
    t = clamp(t); t -= 1; return t * t * ((s + 1) * t + s) + 1

@lru_cache(maxsize=None)
def text_img(text, font, size, color, hl=None, pad=0):
    f = F(font, size)
    l, t, r, b = f.getbbox(text)
    w, h = r - l + 2 * pad, b - t + 2 * pad
    im = Image.new('RGBA', (w, h), hl + (255,) if hl else (0, 0, 0, 0))
    ImageDraw.Draw(im).text((pad - l, pad - t), text, font=f, fill=color + (255,))
    return im

def fit(text, font, maxw, start):
    s = start
    while F(font, s).getlength(text) > maxw and s > 20: s -= 4
    return s

def put(cv, im, cx, cy, scale=1.0, alpha=1.0):
    if alpha <= 0 or scale <= 0.01: return
    if abs(scale - 1) > 1e-3:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
    if alpha < 1:
        im = im.copy(); im.putalpha(im.getchannel('A').point(lambda v: int(v * alpha)))
    cv.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))

def lines(cv, rows, f, top, font='Archivo-Black-Cond.ttf', size=170, color=INK, gap=12, stagger=4, hl_row=None):
    y = top
    for i, row in enumerate(rows):
        s = min(size, fit(row.upper(), font, 940, size))
        im = text_img(row.upper(), font, s, color, YEL if i == hl_row else None, 14 if i == hl_row else 0)
        t = (f - i * stagger) / 7
        put(cv, im, W / 2, y + im.height / 2 + (1 - ease_out(t)) * 60, 0.85 + 0.15 * back(t), ease_out(t * 1.5))
        y += im.height + gap
    return y

@lru_cache(maxsize=None)
def asset(name, h):
    im = Image.open(os.path.join(A, name)).convert('RGBA')
    return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)

@lru_cache(maxsize=None)
def shadow(name, h):
    im = asset(name, h); sh = Image.new('RGBA', (im.width + 120, im.height + 120), (0, 0, 0, 0))
    a = im.getchannel('A').point(lambda v: int(v * .28))
    blk = Image.new('RGBA', im.size, (20, 30, 60, 0)); blk.putalpha(a)
    sh.alpha_composite(blk, (60, 90)); return sh.filter(ImageFilter.GaussianBlur(30))

def product(cv, name, h, cx, cy, t, float_f):
    k = back(t); fl = math.sin(float_f / 14) * 8
    put(cv, shadow(name, h), cx, cy + 40, k, ease_out(t * 2))
    put(cv, asset(name, h), cx, cy + fl + (1 - ease_out(t)) * 200, k, ease_out(t * 2))

def pflicht(cv, alpha):
    f = F('Archivo-Medium.ttf', 24); words = CFG['pflicht'].split(); rows, cur = [], ''
    for w in words:
        if f.getlength(cur + ' ' + w) > 880: rows.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
    rows.append(cur); y = 1560
    for r in rows:
        put(cv, text_img(r, 'Archivo-Medium.ttf', 24, MUTED), W / 2, y, 1, alpha); y += 32

def arrow(cv, f, cy):
    d = ImageDraw.Draw(cv); bob = abs(math.sin(f / 5)) * 18; a = int(255 * ease_out((f - 20) / 6))
    if a <= 0: return
    ov = Image.new('RGBA', (W, H)); od = ImageDraw.Draw(ov)
    od.polygon([(W/2-70, cy+bob), (W/2+70, cy+bob), (W/2, cy+bob+90)], fill=BLUE + (a,))
    od.rectangle([W/2-24, cy+bob-80, W/2+24, cy+bob+2], fill=BLUE + (a,))
    cv.alpha_composite(ov)

def frame(i):
    cv = Image.new('RGBA', (W, H), BG + (255,))
    # Fortschrittsbalken oben: hält Leute bis zum Ende
    ImageDraw.Draw(cv).rectangle([0, 0, int(W * i / (TOTAL - 10)), 10], fill=BLUE)
    def local(k): a, b = SC[k]; return (i - a) if a <= i < b else None

    if (f := local('hook')) is not None:
        y = lines(cv, CFG['hook'], f, 380, size=190, stagger=5, hl_row=3)
        arrow(cv, f, y + 140)
    if (f := local('prod')) is not None:
        product(cv, 'oceanmin.png', 900, W / 2, 1020, f / 14, f)
        put(cv, text_img(CFG['produkt'].upper(), 'Archivo-Black-Cond.ttf', 150, BLUE), W/2, 360, back((f-6)/8), ease_out((f-6)/5))
        put(cv, text_img(CFG['marke'], 'Archivo-Bold.ttf', 56, INK), W/2, 470, 1, ease_out((f-12)/6))
    if (f := local('stick')) is not None:
        lines(cv, [CFG['schritt'][0]], f, 300, size=200, hl_row=0)
        lines(cv, [CFG['schritt'][1]], f - 8, 540, font='Archivo-Bold.ttf', size=80)
        product(cv, 'stick-pulver.png', 820, W / 2, 1150, (f - 4) / 14, f)
    if (f := local('mg')) is not None:
        n = int(round(CFG['mg'] * ease_out(f / 18)))
        put(cv, text_img(f'{n} mg', 'Archivo-Black-Cond.ttf', 330, BLUE), W/2, 760, back(f/8), ease_out(f/4))
        put(cv, text_img(CFG['mgZeile'].upper(), 'Archivo-Black-Cond.ttf', 96, INK), W/2, 1010, 1, ease_out((f-8)/6))
        put(cv, text_img(CFG['nrv'], 'Archivo-Bold.ttf', 60, INK, YEL, 16), W/2, 1140, back((f-14)/8), ease_out((f-14)/5))
    if (f := local('claim')) is not None:
        lines(cv, CFG['claim'], f, 520, size=130, stagger=3, hl_row=2)
    if (f := local('preis')) is not None:
        put(cv, text_img(CFG['preisZeile'].upper(), 'Archivo-Black-Cond.ttf', 110, INK), W/2, 440, 1, ease_out(f/5))
        put(cv, text_img(CFG['preis'], 'Archivo-Black-Cond.ttf', 300, BLUE), W/2, 720, back((f-4)/8), ease_out((f-4)/4))
        old = text_img('statt ' + CFG['normal'], 'Archivo-Bold.ttf', 72, MUTED)
        put(cv, old, W/2, 960, 1, ease_out((f-12)/6))
        if f > 18:  # Streichlinie zieht durch
            k = ease_out((f - 18) / 8); sx = F('Archivo-Bold.ttf', 72).getlength('statt '); x0 = W/2 - old.width/2 + sx
            ImageDraw.Draw(cv).line([x0, 962, x0 + (old.width - sx) * k, 962], fill=(210, 40, 40), width=8)
        st = text_img(CFG['rabatt'], 'Archivo-Black-Cond.ttf', 120, INK, YEL, 26).rotate(-8, expand=True, resample=Image.BICUBIC)
        put(cv, st, 820, 1170, back((f-24)/8, 2.2), ease_out((f-24)/4))
        product(cv, 'oceanmin.png', 380, 300, 1240, (f - 8) / 12, f)
    if (f := local('cta')) is not None:
        lines(cv, ['Jetzt sichern'], f, 420, size=170)
        btn = text_img(('↓  ' + CFG['cta'] + '  ↓').upper(), 'Archivo-Black-Cond.ttf', 120, (255, 255, 255), BLUE, 44)
        pulse = 1 + 0.035 * math.sin(f / 4) if 12 < f < TOTAL - SC['cta'][0] - 10 else 1
        put(cv, btn, W/2, 860, back((f-5)/8) * pulse, ease_out((f-5)/4))
        put(cv, text_img(CFG['ctaZeile'], 'Archivo-Bold.ttf', 64, INK), W/2, 1060, 1, ease_out((f-14)/6))
        product(cv, 'oceanmin.png', 300, W/2, 1300, (f - 10) / 12, f)
    if i >= SC['claim'][0]: pflicht(cv, ease_out((i - SC['claim'][0]) / 8))
    return cv.convert('RGB')

def audio(path):
    cues = [('einschlag.wav', 0), ('pop.wav', 5), ('pop.wav', 10), ('pop.wav', 15), ('einschlag.wav', 20),
            ('zoom.wav', 45), ('wisch.wav', 105), ('wasser.wav', 110), ('ding.wav', 165),
            ('wisch.wav', 210), ('kaching.wav', 259), ('einschlag.wav', 279), ('wisch.wav', 315), ('ding.wav', 320)]
    inp, flt = [], []
    for k, (n, fr) in enumerate(cues):
        inp += ['-i', os.path.join(A, n)]; ms = int(fr * 1000 / FPS)
        flt.append(f'[{k}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.7,adelay={ms}|{ms}[s{k}]')
    mix = ''.join(f'[s{k}]' for k in range(len(cues)))
    flt.append(f'{mix}amix=inputs={len(cues)}:normalize=0,apad,atrim=0:{TOTAL/FPS},alimiter=limit=0.9[a]')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', *inp, '-filter_complex', ';'.join(flt), '-map', '[a]', path], check=True)

if __name__ == '__main__':
    os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)
    if os.environ.get('STILLS'):
        for fr in map(int, os.environ['STILLS'].split(',')): frame(fr).save(f'out/still_{fr:03d}.png')
        sys.exit()
    wav = OUT + '.wav'; audio(wav)
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                          '-r', str(FPS), '-i', '-', '-i', wav, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                          '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
                          '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', OUT], stdin=subprocess.PIPE)
    for i in range(TOTAL): p.stdin.write(frame(i).tobytes())
    p.stdin.close(); p.wait(); os.remove(wav); print('ok', OUT)
