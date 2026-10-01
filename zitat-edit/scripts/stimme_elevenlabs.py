#!/usr/bin/env python3
"""Deutsche Stimme über ElevenLabs -> stimme/roh.wav

Braucht den API-Schlüssel als Umgebungsvariable ELEVENLABS_API_KEY
(in der Cloud-Umgebung unter Einstellungen eintragen, nie in Dateien oder
in den Chat schreiben). Die Stimme steht in config.ts unter
stimme.elevenlabs.stimmeId, oder für einen Versuch als --stimme <id>.

  --liste   eigene Stimmen anzeigen (Name, ID, Merkmale)
  --suche   tiefe deutsche Männerstimmen aus der ElevenLabs-Bibliothek anzeigen.
            Eine gefundene Stimme muss vor der Nutzung im ElevenLabs-Konto
            unter "My Voices" hinzugefügt werden.

Der ganze Text wird in einem Stück gesprochen (natürlichere Betonung).
Pausen, Klang und Hall setzt danach scripts/stimme_bearbeiten.py.
Beides zusammen: npm run stimme:elevenlabs
"""
import argparse
import base64
import io
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

import soundfile as sf

from zitat_config import ROH_WAV, ROOT, check_tafeln, full_text, load_config

API = "https://api.elevenlabs.io"


def call(path, body=None, params=None):
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("ELEVENLABS_API_KEY fehlt. In den Umgebungs-Einstellungen eintragen, dann neue Sitzung starten.")
    url = API + path + ("?" + urllib.parse.urlencode(params) if params else "")
    req = urllib.request.Request(url, method="POST" if body is not None else "GET",
                                 headers={"xi-api-key": key, "Content-Type": "application/json"},
                                 data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs-Fehler {e.code}: {e.read().decode(errors='replace')[:500]}")


def liste():
    for v in call("/v1/voices")["voices"]:
        labels = ", ".join(f"{k}: {val}" for k, val in (v.get("labels") or {}).items())
        print(f"{v['voice_id']}  {v['name']}  ({labels})")


def suche():
    res = call("/v1/shared-voices", params={"language": "de", "gender": "male", "page_size": 30, "search": "deep"})
    for v in res.get("voices", []):
        desc = (v.get("description") or "").replace("\n", " ")[:90]
        print(f"{v['voice_id']}  {v['name']}  [{v.get('age', '')}, {v.get('use_case', '')}]  {desc}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--liste", action="store_true")
    ap.add_argument("--suche", action="store_true")
    ap.add_argument("--stimme", help="Stimmen-ID statt der aus config.ts")
    args = ap.parse_args()
    if args.liste:
        return liste()
    if args.suche:
        return suche()

    cfg = load_config()
    check_tafeln(cfg)
    el = cfg["stimme"]["elevenlabs"]
    voice_id = args.stimme or el["stimmeId"]
    if not voice_id:
        sys.exit("Keine Stimme gewählt: stimme.elevenlabs.stimmeId in config.ts setzen (IDs: --liste / --suche).")

    text = full_text(cfg)
    res = call(f"/v1/text-to-speech/{voice_id}/with-timestamps",
               params={"output_format": "mp3_44100_128"},
               body={
                   "text": text,
                   "model_id": el["modell"],
                   # Ruhig und gleichmäßig, wenig Übertreibung
                   "voice_settings": {"stability": 0.55, "similarity_boost": 0.8, "style": 0.1, "use_speaker_boost": True},
               })
    y, sr = sf.read(io.BytesIO(base64.b64decode(res["audio_base64"])), dtype="float32")
    y = y.mean(axis=1) if y.ndim > 1 else y
    ROH_WAV.parent.mkdir(parents=True, exist_ok=True)
    sf.write(ROH_WAV, y, sr)
    print(f"Text: {text}")
    print(f"Gespeichert: {ROH_WAV.relative_to(ROOT)} ({len(y) / sr:.1f} s, Stimme {voice_id})")


if __name__ == "__main__":
    main()
