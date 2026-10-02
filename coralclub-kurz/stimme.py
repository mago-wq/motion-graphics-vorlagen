"""Sprecher-Videos: Satzgrenzen aus den Pausen der Sprachdatei, Szenen folgen den Sätzen."""
import re, subprocess
from bild import *

def dauer(path):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                                capture_output=True, text=True).stdout)

def saetze(path, n, db=-35, mind=0.18):
    """Teilt die Sprachdatei an den n-1 längsten Pausen. Ergebnis: [(start_s, ende_s)] je Abschnitt."""
    err = subprocess.run(['ffmpeg', '-i', path, '-af', f'silencedetect=noise={db}dB:d={mind}', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', err)]
    en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', err)]
    total = dauer(path)
    pausen = [(e - s, (s + e) / 2) for s, e in zip(st, en) if s > 0.3 and e < total - 0.3]
    grenzen = sorted(m for _, m in sorted(pausen, reverse=True)[:n - 1])
    pkt = [0.0] + grenzen + [total]
    return [(pkt[k], pkt[k + 1]) for k in range(n)]

def szenen(path, n, vorlauf=0.25, nachlauf=1.2):
    """Frames je Szene; Stimme startet nach `vorlauf` s, nach dem Ende bleibt `nachlauf` s."""
    seg = saetze(path, n)
    starts = [0] + [int(round((s + vorlauf) * FPS)) for s, _ in seg[1:]]
    total = int(round((seg[-1][1] + vorlauf + nachlauf) * FPS))
    return starts, total

def welche(starts, i):
    k = max(j for j, s in enumerate(starts) if s <= i); return k, i - starts[k]

_MODEL = None
def woerter(path):
    """Wort-Zeitstempel per faster-whisper (lokal). Liste [(start, ende, wort)]."""
    global _MODEL
    from faster_whisper import WhisperModel
    if _MODEL is None: _MODEL = WhisperModel('small', device='cpu', compute_type='int8')
    segs, _ = _MODEL.transcribe(path, language='de', word_timestamps=True)
    return [(w.start, w.end, w.word.strip()) for s in segs for w in s.words]

def absaetze(path, skript):
    """Startzeit jedes Absatzes (durch Leerzeile getrennt) im Skript: Wortanteil -> nächste Lücke zwischen Wörtern."""
    abs_ = [a for a in skript.split('\n\n') if a.strip()]
    ws = woerter(path); n_skript = sum(len(a.split()) for a in abs_); ratio = len(ws) / n_skript
    starts, cum = [0.0], 0
    for a in abs_[:-1]:
        cum += len(a.split()); k = int(round(cum * ratio))
        # in der Nähe die größte Lücke zwischen zwei Wörtern suchen
        nxt = abs_[len(starts)]; key = re.sub(r'[^a-zäöüß0-9]', '', nxt.split()[0].lower())[:4]
        hits = [j for j in range(max(1, k - 6), min(len(ws), k + 7)) if re.sub(r'[^a-zäöüß0-9]', '', ws[j][2].lower()).startswith(key)]
        if hits: best = min(hits, key=lambda j: abs(j - k))
        else: best = max(range(max(1, k - 3), min(len(ws), k + 4)), key=lambda j: ws[j][0] - ws[j - 1][1])
        starts.append(ws[best][0])
    return starts, ws

import json
VORLAUF = 0.25  # Sekunden Stille vor der Stimme (Hook-Geräusch knallt bei 0)

def lade(name, fix=None):
    """Zeitdaten aus a/stimme/<name>.json; fix korrigiert Whisper-Schreibweisen."""
    d = json.load(open(os.path.join(A, 'stimme', name + '.json')))
    fix = fix or {}
    ws = []
    for s, e, w in d['woerter']:
        if ws and w[:1] in '-,':  # "Omega -3 -Fettsäuren", "1 ,5" zusammenziehen
            ps, _, pw = ws.pop(); ws.append((ps, e + VORLAUF, pw + w.lstrip(' ')))
        else: ws.append((s + VORLAUF, e + VORLAUF, w))
    ws = [(s, e, fix.get(w, w)) for s, e, w in ws]
    starts = [int(round((s + VORLAUF) * FPS)) if k else 0 for k, s in enumerate(d['starts'])]
    total = int(round((d['dauer'] + VORLAUF + 1.3) * FPS))
    return starts, total, ws

def chunks(ws, maxc=16):
    out, cur = [], []
    for w in ws:
        if cur and (sum(len(x[2]) + 1 for x in cur) + len(w[2]) > maxc or cur[-1][2][-1] in '.?!,:'):
            out.append(cur); cur = []
        cur.append(w)
    return out + [cur] if cur else out

def untertitel(cv, ws, i, y=1450, size=78, fg=(255, 255, 255), hl=(255, 214, 0), sw=9):
    t = i / FPS
    for ch in chunks(ws):
        if ch[0][0] - .05 <= t <= ch[-1][1] + .25:
            parts = [stroke_text(w, 'black', size, hl if s <= t <= e + .08 else fg, (0, 0, 0), sw) for s, e, w in ch]
            gap = 22; wtot = sum(p.width for p in parts) + gap * (len(parts) - 1)
            sc = min(1, 960 / wtot); x = W / 2 - wtot * sc / 2
            pop = 1 + .06 * (1 - clamp((t - ch[0][0]) / .12))
            for p in parts:
                put(cv, p, x + p.width * sc / 2, y, sc * pop); x += (p.width + gap) * sc
            return

def hinweis(cv, text, a=1.0, y=1600, color=(255, 255, 255), bg=(0, 0, 0)):
    for j, r in enumerate(wrap(text, 'med', 22, 920)):
        put(cv, text_img(r, 'med', 22, color, bg, 5), W / 2, y + j * 32, 1, a)

def fisch(col, w=360, streifen=False):
    im = Image.new('RGBA', (w + 20, int(w * .55))); d = ImageDraw.Draw(im); h = im.height
    d.polygon([(w * .72, h / 2), (w + 10, h * .1), (w + 10, h * .9)], fill=col)
    d.ellipse([0, h * .12, w * .82, h * .88], fill=col)
    if streifen:
        for k in range(5): d.arc([w * .1 + k * 40, h * .1, w * .3 + k * 40, h * .5], 200, 340, fill=(30, 60, 80), width=6)
    d.ellipse([w * .14, h * .36, w * .2, h * .46], fill=(20, 20, 20))
    d.arc([w * .25, h * .25, w * .38, h * .75], 300, 60, fill=(255, 255, 255, 120), width=5)
    return im
