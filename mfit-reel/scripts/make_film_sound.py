#!/usr/bin/env python3
"""Musik und Soundeffekte für den Film (MfitFilm), 120 BPM, synthetisch erzeugt.

Liest denselben Zeitplan wie das Bild (src/story/film/film.json, in Beats) – jeder Effekt
sitzt auf seinem Ereignis. Instrumente, Effekte und Mastering kommen aus make_soundtrack.py.

Ablauf der Musik:
  intro  (Problem)  traurig, leise: Fläche in a-Moll, fallende Klaviertöne, tickende Uhr
  groove (Handy)    Dur, verspielt: Kick, Clap, Hi-Hats, Bass, gezupfte Akkorde
  nacht  (Face-ID)  gedämpft, baut sich auf; Riser bis zur Tür
  voll   (ab Tür)   voller Groove mit Melodie
  pause  (Preis)    Schlagzeug raus, Spannung – dann der Preis-Schlag
  finale (Logo)     Schlussakkord, Glitzern, Ausklang; die letzten 0,3 s sind still

Aufruf: python3 scripts/make_film_sound.py  → public/audio/mfit-film.wav (+ Stems in out/stems-film/)
"""
import json
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_soundtrack as ms  # noqa: E402  (Instrumente, Effekte, Mastering)

ROOT = Path(__file__).resolve().parent.parent
FILM = json.loads((ROOT / 'src' / 'story' / 'film' / 'film.json').read_text(encoding='utf-8'))
SR = ms.SR
BEAT = 60.0 / FILM['bpm']
TOTAL = FILM['totalBeats'] * BEAT
# Die Busse und der Hall in make_soundtrack.py rechnen mit ms.N: auf die Filmlänge umstellen
ms.N = int(round(TOTAL * SR))
ms.TOTAL = TOTAL
N = ms.N
FPS = FILM['fps']
TARGET_LUFS = -13.0
CEILING_DBTP = -2.2

midi = ms.midi_hz
rng = np.random.default_rng(11)


def s(beat: float) -> float:
    return beat * BEAT


def frames_beat(frames: float) -> float:
    return frames / (FPS * BEAT)


def teil(beat: float) -> str:
    name = FILM['musik'][0]['teil']
    for p in FILM['musik']:
        if beat >= p['ab']:
            name = p['teil']
    return name


# Akkorde: Grundton (Bass) und Töne für Fläche und Zupfer
AKK = {
    'C': {'root': 36, 'tones': [60, 64, 67]},
    'G': {'root': 43, 'tones': [59, 62, 67]},
    'Am': {'root': 45, 'tones': [57, 60, 64]},
    'F': {'root': 41, 'tones': [57, 60, 65]},
    'E': {'root': 40, 'tones': [56, 59, 64]},
    'Dm': {'root': 38, 'tones': [57, 62, 65]},
}
FOLGE = ['C', 'G', 'Am', 'F']
# Drop an der Tür (erster voller Taktanfang), Pause vor dem Preis und Preis-Schlag
DROP = 28
PAUSE = next(p['ab'] for p in FILM['musik'] if p['teil'] == 'pause')
SLAM = FILM['preis']['slam']


def akkord_bei(beat: float) -> str:
    """Intro a-Moll/F; danach C–G–Am–F, neu angesetzt am Drop und am Preis-Schlag."""
    if beat < 8:
        return ['Am', 'F'][int(beat // 4) % 2]
    if beat < DROP:
        return FOLGE[int((beat - 8) // 4) % 4]
    if beat < PAUSE:
        return FOLGE[int((beat - DROP) // 4) % 4]
    if beat < SLAM:
        return 'F'
    return FOLGE[int((beat - SLAM) // 4) % 4]


# ---------------------------------------------------------------- Musik

def build_music(drums: ms.Bus, bass: ms.Bus, music: ms.Bus) -> list[float]:
    kicks = []
    total = FILM['totalBeats']

    # Intro: Fläche + fallende, weiche Klaviertöne (a-Moll)
    for bar, name in enumerate(['Am', 'F']):
        music.add(ms.pad_chord(AKK[name]['tones'], s(4), 900, 0.9), s(bar * 4))
    for beat, m in [(0.5, 76), (1.5, 74), (2.5, 72), (3.5, 71), (4.5, 69), (5.5, 72), (6.0, 71)]:
        music.add(ms.bell(midi(m), 1.6, 0.34, ratio=1.0, index=0.9, tau=0.55), s(beat), pan=0.15)
    bass.add(ms.bass808(midi(45), s(3.8), 0.3), s(0))
    bass.add(ms.bass808(midi(41), s(3.2), 0.3), s(4))

    beat = 8.0
    while beat < total - 0.01:
        part = teil(beat)
        if part in ('intro',):
            beat += 0.5
            continue
        name = akkord_bei(beat)
        a = AKK[name]
        in_bar = beat % 4
        voll = part == 'voll'
        nacht = part == 'nacht'
        pause = part == 'pause'
        finale = part == 'finale'
        # Fläche am Taktanfang
        if in_bar == 0 and not finale:
            cut = (700, 2200) if nacht else (1600 if pause else 2600)
            music.add(ms.pad_chord(a['tones'], s(4), cut, 0.7 if not voll else 0.55), s(beat))
        # Schlagzeug
        if not pause and not finale:
            if beat == int(beat):
                if not nacht or in_bar in (0, 2):
                    drums.add(ms.kick(0.75 if voll else 0.6), s(beat))
                    kicks.append(s(beat))
                if int(in_bar) in (1, 3) and not nacht:
                    drums.add(ms.clap(0.5 if voll else 0.42), s(beat), pan=0.05)
            hv = 0.32 if voll else (0.2 if nacht else 0.26)
            drums.add(ms.hat(False, hv), s(beat), pan=0.25)
            drums.add(ms.hat(False, hv * 0.5), s(beat + 0.25), pan=-0.2)
            if voll and in_bar == 1.5:
                drums.add(ms.hat(True, 0.18), s(beat), pan=0.3)
        # Bass: Grundton auf der Zählzeit, Oktave auf der Achtel dazwischen
        if not pause and not finale:
            if beat == int(beat):
                bass.add(ms.bass808(midi(a['root']), s(0.45), 0.5 if voll else 0.4), s(beat))
            elif voll:
                bass.add(ms.bass808(midi(a['root'] + 12), s(0.2), 0.28), s(beat))
        # Zupfer: Akkordtöne als Achtel-Arpeggio
        if not finale:
            tones = [t + 12 for t in a['tones']] + [a['tones'][0] + 24]
            idx = int(((beat - 8) * 2) % 4)
            order = [0, 1, 2, 3, 2, 1, 0, 2]
            m = tones[order[int(((beat - 8) * 2) % 8)] % len(tones)] if idx >= 0 else tones[0]
            vel = 0.24 if voll else (0.13 if nacht else (0.1 if pause else 0.22))
            music.add(ms.bell(midi(m), 0.45, vel, ratio=1.0, index=1.6 if not nacht else 0.7, tau=0.12), s(beat), pan=0.3 * (1 if idx % 2 else -1))
        beat += 0.5

    # Melodie im vollen Teil (Rundgang und Studios)
    motiv_a = [(0, 76), (1, 79), (1.5, 81), (2, 79), (3, 76), (4, 74), (5, 72), (5.5, 74), (6, 76)]
    motiv_b = [(0, 72), (1, 76), (1.5, 77), (2, 76), (3, 72), (4, 74), (5, 72), (6, 69)]
    for start, motiv in [(36, motiv_b), (44, motiv_a), (52, motiv_b)]:
        for off, m in motiv:
            if start + off >= PAUSE:
                continue
            music.add(ms.bell(midi(m), 0.9, 0.3, ratio=2.0, index=1.6, tau=0.25), s(start + off), pan=-0.1)

    # Pause vor dem Preis: Riser und Rückwärts-Becken auf den Schlag
    music.add(ms.riser(s(3.8)), s(SLAM), align_end=True, gain=0.7)
    # Schluss: Akkord und Glocken-Arpeggio
    fin = FILM['logo']['start']
    music.add(ms.pad_chord([48, 55, 60, 64, 67], s(4.2), (1200, 4200), 0.9), s(fin))
    for k, m in enumerate([72, 76, 79, 84]):
        music.add(ms.bell(midi(m), 2.4, 0.4, ratio=2.0, index=1.2, tau=0.9), s(fin + k * 0.25), pan=(k - 1.5) * 0.2)
    bass.add(ms.bass808(midi(36), s(3.4), 0.55), s(fin))
    drums.add(ms.kick(0.8), s(fin))
    kicks.append(s(fin))
    return kicks


# ---------------------------------------------------------------- Effekte

def build_fx(fx: ms.Bus):
    P, H, T, TO, ST, PR, C, L = (FILM[k] for k in ('problem', 'handy', 'tuer', 'tour', 'studios', 'preis', 'cta', 'logo'))

    # Uhr tickt (tick – tack), bis der Rollladen aufschlägt
    for k, b in enumerate(np.arange(0, P['halt'], 1.0)):
        fx.add(ms.clack(0.9 if k % 2 == 0 else 0.65), s(b), pan=-0.3)
    # Rollladen: Rasseln wird schneller, dann Aufschlag
    t, gap = s(P['rollladen']), 0.075
    while t < s(P['halt']) - 0.02:
        fx.add(ms.clack(0.45 + 0.25 * rng.random()), t, pan=0.35)
        fx.add(ms.click(0.8), t + 0.01, pan=0.35)
        t += gap
        gap = max(0.028, gap * 0.93)
    fx.add(ms.thud(1.1), s(P['halt']), pan=0.3)
    fx.add(ms.impact(0.32), s(P['halt']), pan=0.2)

    # Schiebeübergang ins Handy, Handy landet
    fx.add(ms.whoosh(0.55, up=True), s(P['raus']))
    fx.add(ms.thud(0.45), s(H['start']) + 0.08)
    # Tipps mit Tönen in der Tonart (C-Dur aufwärts)
    tipps = [H['studioAuf'], H['studioWahl'], H['tag'], H['zeit'], H['tippen'][0] - frames_beat(7)]
    for k, b in enumerate(tipps):
        fx.add(ms.click(1.2), s(b))
        fx.add(ms.tick_ui(midi([84, 88, 91, 93, 96][k]), 0.45), s(b))
    fx.add(ms.whoosh(0.22, up=True) * 0.6, s(H['studioAuf']) + 0.03)
    fx.add(ms.whoosh(0.2) * 0.5, s(H['studioWahl']) + 0.04)
    for b in H['tippen']:
        fx.add(ms.clack(1.1), s(b), pan=0.1)
        fx.add(ms.click(1.6), s(b), pan=0.1)
    fx.add(ms.click(1.4), s(H['knopf']))
    fx.add(ms.pop(520, 0.9), s(H['knopf']))
    # Bestätigung: Dur-Arpeggio, Konfetti glitzert
    for k, m in enumerate([84, 88, 91, 96]):
        fx.add(ms.bell(midi(m), 0.9, 0.55, ratio=2.0, index=1.4, tau=0.3), s(H['erfolg']) + k * 0.06)
    fx.add(ms.shimmer(1.0, 1.2), s(H['erfolg']) + 0.12)
    for k in range(6):
        fx.add(ms.pop(900 + 120 * k, 0.4), s(H['erfolg']) + 0.14 + 0.05 * k, pan=(k - 2.5) * 0.2)
    fx.add(ms.whoosh(0.45, up=True), s(H['raus']))

    # Face-ID: Scan, Entsperren, Tür gleitet auf
    fx.add(ms.scan_sound(s(T['erfolg']) - s(T['scan'])) * 2.4, s(T['scan']))
    fx.add(ms.unlock_chime(1.0), s(T['erfolg']))
    fx.add(ms.whoosh(0.8) * 0.7, s(T['tuerAuf']))
    fx.add(ms.impact(0.6), s(T['tuerAuf']))
    fx.add(ms.thud(0.4), s(T['weiter']))
    # Kamerafahrt in die Tür
    fx.add(ms.whoosh(0.75, up=True), s(T['raus']))
    fx.add(ms.reverse_swell(0.8), s(TO['start']), align_end=True, gain=0.8)

    # Rundgang: jede Karte springt mit Pop und Ping auf, dazu ein passendes Geräusch
    for k, b in enumerate(TO['karten']):
        fx.add(ms.pop(650, 0.9), s(b))
        fx.add(ms.ting(midi([88, 91, 93, 96][k]), 0.35), s(b) + 0.02, pan=0.2)
    fx.add(ms.bubbles(1.0), s(TO['karten'][1]) + 0.3, pan=0.3)
    fx.add(ms.tick_ui(midi(91), 0.4), s(TO['karten'][2]) + frames_beat(10) * BEAT)
    fx.add(ms.clink(), s(TO['karten'][3]) + frames_beat(16) * BEAT, pan=0.1)
    fx.add(ms.whoosh(0.4), s(TO['raus']))

    # Studios: Pins fallen ein (aufsteigend), dann leuchten alle
    for k, b in enumerate(ST['pins']):
        fx.add(ms.pop(560 + 90 * k, 1.0), s(b), pan=(k - 2.5) * 0.25)
        fx.add(ms.thud(0.25), s(b) + 0.02)
    fx.add(ms.shimmer(0.9, 1.3), s(ST['pins'][-1]) + 0.4)
    fx.add(ms.whoosh(0.45), s(ST['raus']))

    # Preis
    fx.add(ms.whoosh(0.3, up=True) * 0.6, s(PR['vor']))
    fx.add(ms.reverse_swell(1.0), s(PR['slam']), align_end=True)
    fx.add(ms.impact(1.0), s(PR['slam']))
    fx.add(ms.shimmer(0.8, 1.0), s(PR['slam']) + 0.35)
    fx.add(ms.slash(), s(PR['statt']) + 0.1)
    for b in PR['details']:
        fx.add(ms.tick_ui(midi(88), 0.4), s(b))
    fx.add(ms.pop(700, 0.6), s(PR['partner']))
    fx.add(ms.whoosh(0.35), s(PR['raus']))

    # Einladung
    fx.add(ms.pop(480, 0.8), s(C['karte']))
    fx.add(ms.whoosh(0.3, up=True) * 0.5, s(C['karte']))
    for k, b in enumerate(C['punkte']):
        fx.add(ms.tick_ui(midi([84, 88, 91][k]), 0.55), s(b))
    fx.add(ms.pop(620, 0.9), s(C['knopf']))
    fx.add(ms.click(1.4), s(C['tipp']))
    for k, m in enumerate([84, 88, 91, 96]):
        fx.add(ms.bell(midi(m), 0.9, 0.5, ratio=2.0, index=1.4, tau=0.3), s(C['tipp']) + k * 0.06)
    fx.add(ms.shimmer(1.0, 1.2), s(C['tipp']) + 0.08)
    fx.add(ms.whoosh(0.5, up=True), s(C['tipp']) + frames_beat(10) * BEAT)

    # Logo
    fx.add(ms.impact(0.5), s(L['start']))
    fx.add(ms.shimmer(1.3, 1.4), s(L['finale']) - 0.1)


def main():
    drums, bass, music, fx = ms.Bus('drums'), ms.Bus('bass'), ms.Bus('musik'), ms.Bus('fx')
    kicks = build_music(drums, bass, music)
    build_fx(fx)

    ir = ms.reverb_ir()
    sc = ms.sidechain(kicks, depth=0.35)
    music.x *= sc
    wet_music = ms.convolve(music.x, ir) * 0.24
    wet_fx = ms.convolve(fx.x, ir) * 0.16

    musik = drums.x * 0.8 + bass.x * 0.42 + music.x * 1.0 + wet_music
    effekte = fx.x * 1.8 + wet_fx
    # Ducking: die Musik tritt kurz zurück, wenn ein Effekt kommt (bis −4 dB)
    from scipy.ndimage import maximum_filter1d
    hull = maximum_filter1d(np.abs(fx.x).max(axis=0), size=int(0.01 * SR))
    a = np.exp(-1.0 / (0.15 * SR))
    env = np.empty_like(hull)
    g = 0.0
    for i, v in enumerate(hull):
        g = v if v > g else a * g + (1 - a) * v
        env[i] = g
    duck = 1 - 0.37 * np.clip(env / 0.12, 0, 1)
    mix = musik * 0.85 * duck + effekte

    ramp = np.ones(N)
    f0, f1 = N - int(0.9 * SR), N - int(0.3 * SR)
    ramp[f0:f1] = np.cos(np.linspace(0, np.pi / 2, f1 - f0)) ** 2
    ramp[f1:] = 0
    mix *= ramp
    mix = np.vstack([ms.filt(mix[0], 'highpass', 40), ms.filt(mix[1], 'highpass', 40)])

    meter = pyln.Meter(SR)
    ceiling = 10 ** (CEILING_DBTP / 20) * 0.97
    for _ in range(3):
        loud = meter.integrated_loudness(mix.T)
        mix *= 10 ** ((TARGET_LUFS - loud) / 20)
        mix = ms.limiter(mix, ceiling)
    tp = ms.true_peak(mix)
    if tp > 10 ** (CEILING_DBTP / 20):
        mix *= 10 ** (CEILING_DBTP / 20) / tp
    loud = meter.integrated_loudness(mix.T)
    tp_db = 20 * np.log10(ms.true_peak(mix))
    ms.write_wav(ROOT / 'public' / 'audio' / 'mfit-film.wav', mix)
    stems = ROOT / 'out' / 'stems-film'
    norm = 0.9 / max(np.max(np.abs(musik)), np.max(np.abs(effekte)))
    ms.write_wav(stems / 'musik.wav', musik * norm)
    ms.write_wav(stems / 'effekte.wav', effekte * norm)
    print(f'Film-Ton: {TOTAL:.2f} s, {loud:.1f} LUFS, True Peak {tp_db:.2f} dBTP')


if __name__ == '__main__':
    main()
