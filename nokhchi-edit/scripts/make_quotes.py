#!/usr/bin/env python3
"""Spricht die belegten Zitate ein (russisches Original) – für die Tonfassung „mit Zitaten“.

Läuft in einer eigenen Umgebung, weil Chatterbox eigene Torch-Versionen mitbringt:
  python3 -m venv ~/.venv-tts && ~/.venv-tts/bin/pip install torch torchaudio \\
      --index-url https://download.pytorch.org/whl/cpu && ~/.venv-tts/bin/pip install chatterbox-tts
  ~/.venv-tts/bin/python scripts/make_quotes.py

Stimme: Chatterbox Multilingual (Resemble AI, MIT-Lizenz). Klangfarbe von einer synthetischen
Referenz (Piper „ru_RU-dmitri“, Datensatz CC0) – es wird keine reale Person nachgeahmt.
Pro Zitat mehrere Takes; scripts/pick_quotes.py wählt den verständlichsten (Whisper).
Ausgabe: assets-src/quotes/<name>_take<k>.wav
"""
import subprocess
import sys
from pathlib import Path

import torch
import torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets-src" / "quotes"
PIPER = Path.home() / ".piper" / "ru_RU-dmitri-medium.onnx"

# Wortlaut belegt (Quellen in CLAUDE.md / CREDITS.md)
QUOTES = {
    "pushkin": "Славный Бей-Булат, гроза Кавказа.",
    "baysangur": "Вот с ними поговорите вы о вашем деле. Они вас услышат скорее, нежели я.",
    "solzh": "Но была одна нация, которая совсем не поддалась психологии покорности. "
             "Не одиночки, не бунтари, а вся нация целиком. Это — чечены.",
    "grachev": "Грозный можно взять одним парашютно-десантным полком за два часа.",
}
TAKES = 5


def reference() -> Path:
    ref = OUT / "_referenz.wav"
    if not ref.exists():
        text = ("В горах ветер приносит запах снега. Старые башни стоят над ущельем, "
                "и река шумит внизу, как много веков назад.")
        # Piper liegt im System-Python (nicht in der TTS-Umgebung)
        subprocess.run(f'echo "{text}" | /usr/local/bin/python3 -m piper -m {PIPER} --length-scale 1.12 -f {ref}',
                       shell=True, check=True, capture_output=True)
    return ref


def main(names):
    OUT.mkdir(parents=True, exist_ok=True)
    ref = reference()
    model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
    for name, text in QUOTES.items():
        if names and name not in names:
            continue
        for k in range(TAKES):
            dest = OUT / f"{name}_take{k}.wav"
            if dest.exists():
                continue
            torch.manual_seed(100 + k)
            wav = model.generate(text, language_id="ru", audio_prompt_path=str(ref),
                                 exaggeration=0.55, cfg_weight=0.35, temperature=0.75)
            ta.save(str(dest), wav, model.sr)
            print(f"{dest.name}: {wav.shape[-1] / model.sr:.2f} s", flush=True)


if __name__ == "__main__":
    main(set(sys.argv[1:]))
