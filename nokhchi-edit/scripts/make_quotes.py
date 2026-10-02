#!/usr/bin/env python3
"""Spricht die belegten Zitate ein (russisches Original) – für die Tonfassung „mit Zitaten“.

Läuft in einer eigenen Umgebung, weil Chatterbox eigene Torch-Versionen mitbringt:
  python3 -m venv ~/.venv-tts && ~/.venv-tts/bin/pip install torch torchaudio \\
      --index-url https://download.pytorch.org/whl/cpu && ~/.venv-tts/bin/pip install chatterbox-tts
  ~/.venv-tts/bin/python scripts/make_quotes.py

Stimme: Chatterbox Multilingual (Resemble AI, MIT-Lizenz). Klangfarbe von einer synthetischen
Referenz (Piper „ru_RU-dmitri“, Datensatz CC0) – es wird keine reale Person nachgeahmt.
Pro Zitat mehrere Takes; scripts/pick_quotes.py wählt den verständlichsten (Whisper).
Ausgabe: assets-src/quotes/<name>_<sprache>_take<k>.wav
"""
import subprocess
import sys
from pathlib import Path

import torch
import torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets-src" / "quotes"

# Wortlaut belegt (Quellen in CLAUDE.md / CREDITS.md); deutsch = eigene, wortgetreue Übersetzung
QUOTES = {
    "ru": {
        "pushkin": "Славный Бей-Булат, гроза Кавказа.",
        "baysangur": "Вот с ними поговорите вы о вашем деле. Они вас услышат скорее, нежели я.",
        "solzh": "Но была одна нация, которая совсем не поддалась психологии покорности. "
                 "Не одиночки, не бунтари, а вся нация целиком. Это — чечены.",
        "grachev": "Грозный можно взять одним парашютно-десантным полком за два часа.",
    },
    "de": {
        "pushkin": "Der ruhmreiche Bei-Bulat. Der Schrecken des Kaukasus.",
        "baysangur": "Redet mit ihnen über eure Sache. Sie hören euch eher als ich.",
        "solzh": "Aber es gab eine Nation, die der Psychologie der Unterwerfung überhaupt nicht erlag. "
                 "Nicht Einzelne, nicht Aufrührer – sondern die ganze Nation. Das waren die Tschetschenen.",
        "grachev": "Grosny nehmen wir mit einem Fallschirmjäger-Regiment in zwei Stunden.",
    },
}
# Synthetische Referenzstimmen (Piper, Datensätze CC0) – keine reale Person wird nachgeahmt
REF = {
    "ru": ("ru_RU-dmitri-medium", "В горах ветер приносит запах снега. Старые башни стоят над ущельем, "
                                  "и река шумит внизу, как много веков назад."),
    "de": ("de_DE-thorsten-high", "In den Bergen bringt der Wind den Geruch von Schnee. Alte Türme stehen "
                                  "über der Schlucht, und unten rauscht der Fluss wie vor vielen Jahrhunderten."),
}
TAKES = 3


def reference(lang: str) -> Path:
    ref = OUT / f"_referenz_{lang}.wav"
    if not ref.exists():
        voice, text = REF[lang]
        # Piper liegt im System-Python (nicht in der TTS-Umgebung)
        subprocess.run(f'echo "{text}" | /usr/local/bin/python3 -m piper -m {Path.home() / ".piper" / (voice + ".onnx")} '
                       f'--length-scale 1.12 -f {ref}', shell=True, check=True, capture_output=True)
    return ref


def main(langs, names):
    OUT.mkdir(parents=True, exist_ok=True)
    model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
    for lang in langs:
        ref = reference(lang)
        for name, text in QUOTES[lang].items():
            if names and name not in names:
                continue
            for k in range(TAKES):
                dest = OUT / f"{name}_{lang}_take{k}.wav"
                if dest.exists():
                    continue
                torch.manual_seed(100 + k)
                wav = model.generate(text, language_id=lang, audio_prompt_path=str(ref),
                                     exaggeration=0.55, cfg_weight=0.35, temperature=0.75)
                ta.save(str(dest), wav, model.sr)
                print(f"{dest.name}: {wav.shape[-1] / model.sr:.2f} s", flush=True)


if __name__ == "__main__":
    # Aufruf: make_quotes.py [ru|de …] [zitatname …]
    args = sys.argv[1:]
    langs = [a for a in args if a in QUOTES] or list(QUOTES)
    main(langs, {a for a in args if a not in QUOTES})
