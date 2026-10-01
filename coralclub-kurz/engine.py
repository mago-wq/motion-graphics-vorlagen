"""Gemeinsame Bausteine für die Kurz-Reels: Text, Bilder, Easing, Ton, Rendern.
Jedes Video in videos/ definiert TOTAL, CUES und frame(i) -> PIL.Image und ruft run()."""
import math, os, subprocess, sys
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(ROOT, 'a')
W, H, FPS = 1080, 1920, 30

# Gemeinsame Fakten – Quelle de.coral.club, vor dem Posten prüfen
FAKTEN = {
    'produkt': 'Oceanmin', 'marke': 'Coral Club', 'mg': 120, 'nrv': 32, 'ml': 750, 'sticks': 15,
    'normal': '23,75 €', 'club': '19,00 €', 'proTag': '1,27 €', 'rabatt': 20,
}
# Empfehlungsnummer für die Anmeldung. None = nur "Link in Bio".
SPONSOR = None
CTA_ZEILE = 'Link in Bio' if SPONSOR is None else f'Link in Bio · Nr. {SPONSOR}'
PFLICHT = ('Werbung · Affiliate-Link · Nahrungsergänzungsmittel. Kein Ersatz für eine ausgewogene, '
           'abwechslungsreiche Ernährung und eine gesunde Lebensweise. 1 Stick täglich, nicht '
           'überschreiten. Clubpreis für registrierte Mitglieder. Preise: de.coral.club, Stand 01.10.2026')
# Exakter Wortlaut VO (EU) 432/2012 – nicht umformulieren
CLAIM = 'Magnesium trägt zur Verringerung von Müdigkeit und Ermüdung bei.'

FONTS = {
    'black': 'Archivo-Black-Cond.ttf', 'bold': 'Archivo-Bold.ttf', 'med': 'Archivo-Medium.ttf',
    'mono': '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',
    'monor': '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
    'serif': '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
    'serifb': '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
}

@lru_cache(maxsize=None)
def F(font, size): return ImageFont.truetype(os.path.join(A, FONTS.get(font, font)), size)

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease_out(t): t = clamp(t); return 1 - (1 - t) ** 3
def ease_io(t): t = clamp(t); return 3 * t * t - 2 * t * t * t
def back(t, s=1.4):
    t = clamp(t); t -= 1; return t * t * ((s + 1) * t + s) + 1
def mix(c1, c2, t): return tuple(int(a + (b - a) * clamp(t)) for a, b in zip(c1, c2))

@lru_cache(maxsize=None)
def text_img(text, font, size, color, bg=None, pad=0, radius=0):
    f = F(font, size); l, t, r, b = f.getbbox(text)
    w, h = r - l + 2 * pad, b - t + 2 * pad
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if bg: d.rounded_rectangle([0, 0, w - 1, h - 1], radius, fill=tuple(bg) + (255,))
    d.text((pad - l, pad - t), text, font=f, fill=tuple(color) + (255,))
    return im

def fit(text, font, maxw, start):
    s = start
    while F(font, s).getlength(text) > maxw and s > 16: s -= 2
    return s

def wrap(text, font, size, maxw):
    f = F(font, size); rows, cur = [], ''
    for w in text.split():
        if cur and f.getlength(cur + ' ' + w) > maxw: rows.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
    return rows + [cur]

def put(cv, im, cx, cy, scale=1.0, alpha=1.0, rot=0):
    if alpha <= 0.002 or scale <= 0.01: return
    if rot: im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
    if abs(scale - 1) > 1e-3:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
    if alpha < 1:
        im = im.copy(); im.putalpha(im.getchannel('A').point(lambda v: int(v * alpha)))
    cv.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))

def put_left(cv, im, x, cy, alpha=1.0):
    put(cv, im, x + im.width / 2, cy, 1, alpha)

@lru_cache(maxsize=None)
def asset(name, h):
    im = Image.open(os.path.join(A, name)).convert('RGBA')
    return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)

@lru_cache(maxsize=None)
def shadow(name, h, op=.28):
    im = asset(name, h); sh = Image.new('RGBA', (im.width + 120, im.height + 120), (0, 0, 0, 0))
    blk = Image.new('RGBA', im.size, (10, 15, 40, 0)); blk.putalpha(im.getchannel('A').point(lambda v: int(v * op)))
    sh.alpha_composite(blk, (60, 90)); return sh.filter(ImageFilter.GaussianBlur(30))

def product(cv, name, h, cx, cy, t, f, rot=0, op=.28):
    k = back(t); fl = math.sin(f / 14) * 8
    put(cv, shadow(name, h, op), cx, cy + 40, k, ease_out(t * 2), rot)
    put(cv, asset(name, h), cx, cy + fl + (1 - ease_out(t)) * 200, k, ease_out(t * 2), rot)

def pflicht(cv, alpha=1.0, color=(110, 108, 104), y=1560, size=24, claim=False):
    text = (CLAIM + ' ' + PFLICHT) if claim else PFLICHT
    for r in wrap(text, 'med', size, 900):
        put(cv, text_img(r, 'med', size, color), W / 2, y, 1, alpha); y += size + 8

def canvas(color): return Image.new('RGBA', (W, H), tuple(color) + (255,))

def grain(cv, f, amount=10):
    n = _noise(f % 4).copy(); n.putalpha(amount); cv.alpha_composite(n)

@lru_cache(maxsize=4)
def _noise(k):
    return Image.effect_noise((W, H), 64).convert('RGBA')

def audio(cues, total, path):
    inp, flt = [], []
    for k, (n, fr, *v) in enumerate(cues):
        inp += ['-i', os.path.join(A, n)]; ms = int(fr * 1000 / FPS); vol = v[0] if v else 0.7
        flt.append(f'[{k}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={vol},adelay={ms}|{ms}[s{k}]')
    mixs = ''.join(f'[s{k}]' for k in range(len(cues)))
    flt.append(f'{mixs}amix=inputs={len(cues)}:normalize=0,apad,atrim=0:{total / FPS},alimiter=limit=0.9[a]')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', *inp, '-filter_complex', ';'.join(flt), '-map', '[a]', path], check=True)

def run(name, frame, total, cues):
    out = os.path.join(ROOT, 'out', name + '.mp4'); os.makedirs(os.path.dirname(out), exist_ok=True)
    if os.environ.get('STILLS'):
        ims = [frame(int(x)).convert('RGB').resize((270, 480)) for x in os.environ['STILLS'].split(',')]
        s = Image.new('RGB', (280 * len(ims), 480), 'white')
        for k, im in enumerate(ims): s.paste(im, (k * 280, 0))
        s.save(os.path.join(ROOT, 'out', name + '_sheet.png')); return
    wav = out + '.wav'; audio(cues, total, wav)
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                          '-r', str(FPS), '-i', '-', '-i', wav, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                          '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
                          '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out], stdin=subprocess.PIPE)
    for i in range(total): p.stdin.write(frame(i).convert('RGB').tobytes())
    p.stdin.close(); p.wait(); os.remove(wav); print('ok', out)
