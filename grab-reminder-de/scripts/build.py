"""Ersetzt die englischen Einblendungen des Quellvideos durch deutsche im selben Stil.

Schritte: 1) pro Satz die Textmaske des Originals sammeln (der Film ist schwarzweiß,
die Textkontur ist blau -> eindeutig trennbar), 2) Text per Inpainting entfernen,
3) deutschen Text (Impact, gestaucht, weiß/navy-Kontur/navy-Glow) einsetzen, mit der
Helligkeit des Originaltexts pro Frame (Fades, Abdunkelungen), 4) Pipe an ffmpeg.
"""
import json, subprocess, sys
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont

SRC, OUT, FONT = sys.argv[1], sys.argv[2], sys.argv[3]
cfg = json.load(open(sys.argv[4]))
ONLY = [int(x) for x in sys.argv[5].split(',')] if len(sys.argv) > 5 else None  # Debug: nur diese Frames als PNG

W, H = 1080, 1920
STYLE = cfg['style']
SEGS = cfg['segments']  # [{start,end,text}]
Y0, Y1 = 840, 1110      # Textband

cap = cv2.VideoCapture(SRC)
N = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

def seg_of(i):
    for k, s in enumerate(SEGS):
        if s['start'] <= i < s['end']:
            return k
    return len(SEGS) - 1

# ---- Pass 1: Masken pro Satz ----
union = [np.zeros((Y1 - Y0, W), np.uint8) for _ in SEGS]
for i in range(N):
    ok, f = cap.read()
    if not ok: break
    roi = f[Y0:Y1].astype(np.int16)
    blue = ((roi[:, :, 0] - roi[:, :, 2]) > 10).astype(np.uint8)
    union[seg_of(i)] |= blue

masks, interiors = [], []
for u in union:
    u = cv2.morphologyEx(u, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    u = cv2.morphologyEx(u, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    ff = u.copy() * 255
    pad = np.zeros((ff.shape[0] + 2, ff.shape[1] + 2), np.uint8)
    cv2.floodFill(ff, pad, (0, 0), 128)
    holes = (ff == 0).astype(np.uint8)
    full = u | holes
    interiors.append(cv2.erode(holes, np.ones((5, 5), np.uint8)))
    masks.append(cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))))

# ---- deutsche Textebenen ----
SS = 3  # Supersampling für die Kerben
font = ImageFont.truetype(FONT, STYLE['size'] * SS)

def distress(g, seed):
    """Gewollt kaputte Kanten wie im Original: kleine Kerben/Ausbrüche, die in die
    Glyphen beißen (die Kontur folgt ihnen), dazu vereinzelte Zacken nach außen."""
    rng = np.random.default_rng(seed)
    m = (g > 127).astype(np.uint8)
    edge = m - cv2.erode(m, np.ones((3, 3), np.uint8))
    ys, xs = np.nonzero(edge)
    n = int(len(xs) * STYLE['notch_density'])
    idx = rng.choice(len(xs), size=n, replace=False)
    out = m.copy()
    gx = cv2.Sobel(m.astype(np.float32), cv2.CV_32F, 1, 0, ksize=5)
    gy = cv2.Sobel(m.astype(np.float32), cv2.CV_32F, 0, 1, ksize=5)
    for i in idx:
        y, x = ys[i], xs[i]
        vertical_edge = abs(gx[y, x]) >= abs(gy[y, x])
        depth = rng.uniform(1.0, 3.2) * SS          # wie tief die Kerbe ins Glyph reicht
        thick = rng.uniform(0.5, 1.4) * SS          # Höhe/Breite der Kerbe
        if vertical_edge: ax = (int(depth), int(thick))
        else: ax = (int(thick), int(depth))
        ang = rng.uniform(-15, 15)
        val = 0 if rng.random() < 0.75 else 1       # meist Biss, manchmal Zacke
        cv2.ellipse(out, (int(x), int(y)), ax, ang, 0, 360, val, -1)
    # feines Ausfransen
    nz = cv2.GaussianBlur(rng.standard_normal(m.shape).astype(np.float32), (0, 0), 1.0 * SS)
    soft = cv2.GaussianBlur(out.astype(np.float32), (0, 0), 0.8 * SS)
    out = ((soft + nz * STYLE['rough']) > 0.5).astype(np.float32)
    return out

def text_layer(text, seed):
    big = Image.new('L', (3000 * SS, 400 * SS), 0)
    d = ImageDraw.Draw(big)
    # Laufweite: Zeichen einzeln setzen, Abstand in Ziel-Pixeln (vor dem Stauchen umgerechnet)
    track = STYLE['tracking'] * SS / STYLE['squeeze']
    cx = 50 * SS
    for ch in text:
        d.text((cx, 50 * SS), ch, font=font, fill=255)
        cx += font.getlength(ch) + track
    bb = big.getbbox()
    hb = font.getbbox('H')
    cap_top = 50 * SS + hb[1]          # Oberkante der Versalien
    bb = (bb[0] - 10 * SS, min(bb[1], cap_top) - 10 * SS, bb[2] + 10 * SS, bb[3] + 10 * SS)
    g = np.array(big.crop(bb))
    pad_top = cap_top - bb[1]
    sx = STYLE['squeeze']
    w = g.shape[1] * sx / SS
    scale = min(1.0, (STYLE['max_width'] + 20) / w)
    nw, nh = int(round(w * scale)), int(round(g.shape[0] / SS * scale))
    g = cv2.resize(g, (nw * SS, nh * SS), interpolation=cv2.INTER_AREA)
    g = distress(g, seed)
    g = cv2.resize(g, (nw, nh), interpolation=cv2.INTER_AREA)
    # an der Versalhöhe ausrichten (nicht an der Box, sonst zieht „ den Text hoch)
    cap_h = (hb[3] - hb[1]) / SS * scale
    x = int(W / 2 - nw / 2)
    y = int(round(STYLE['cap_center_y'] - Y0 - cap_h / 2 - pad_top / SS * scale))
    L = np.zeros((Y1 - Y0, W), np.float32)
    L[y:y + nh, x:x + nw] = g
    fill = L
    sw = STYLE['stroke']
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * sw + 1, 2 * sw + 1))
    stroke = cv2.GaussianBlur(cv2.dilate(fill, k), (0, 0), 0.7)
    glow = cv2.GaussianBlur(stroke, (0, 0), STYLE['glow_sigma']) * STYLE['glow_alpha']
    return fill, np.clip(stroke, 0, 1), np.clip(glow, 0, 1), scale

layers = [text_layer(s['text'], 11 + n) for n, s in enumerate(SEGS)]
for s, l in zip(SEGS, layers):
    print(f"{s['text']}: scale {l[3]:.2f}", file=sys.stderr)

NAVY = np.array(STYLE['navy'][::-1], np.float32)   # BGR
FILL = np.array(STYLE['fill'][::-1], np.float32)

# ---- Pass 2 ----
cap = cv2.VideoCapture(SRC)
ff = None
if ONLY is None:
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}',
                           '-r', '60', '-i', '-', '-i', SRC, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264',
                           '-preset', 'slow', '-crf', '14', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                           '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT],
                          stdin=subprocess.PIPE)
rng = np.random.default_rng(7)
prev_fac = 1.0
for i in range(N):
    ok, f = cap.read()
    if not ok: break
    if ONLY is not None and i not in ONLY: continue
    k = seg_of(i)
    roi = f[Y0:Y1].copy()
    # Helligkeit des Originaltexts in diesem Frame
    inner = roi.min(axis=2)[interiors[k] > 0]
    fac = float(np.percentile(inner, 85)) / STYLE['fill'][0] if inner.size else prev_fac
    fac = min(1.0, fac); prev_fac = fac
    clean = cv2.inpaint(roi, masks[k], 7, cv2.INPAINT_TELEA).astype(np.float32)
    # Filmkorn in die retuschierte Fläche
    m = cv2.GaussianBlur(masks[k].astype(np.float32), (0, 0), 2)[..., None]
    grain = cv2.GaussianBlur(rng.standard_normal(roi.shape[:2]).astype(np.float32), (0, 0), 0.8)[..., None] * 5 * (clean.mean() / 128)
    clean = clean + grain * m
    fill, stroke, glow, _ = layers[k]
    out = clean
    out = out * (1 - glow[..., None]) + NAVY * fac * glow[..., None]
    out = out * (1 - stroke[..., None]) + NAVY * fac * stroke[..., None]
    fa = fill[..., None] * STYLE['fill_alpha']   # Füllung leicht durchscheinend wie im Original
    out = out * (1 - fa) + FILL * fac * fa
    f[Y0:Y1] = np.clip(out, 0, 255).astype(np.uint8)
    if ff: ff.stdin.write(f.tobytes())
    else: cv2.imwrite(f'{OUT}_{i:04d}.png', f)
if ff:
    ff.stdin.close(); ff.wait()
