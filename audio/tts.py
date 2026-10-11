"""Neural voice lines with Piper + automatic Whisper check.
Usage: python3 tts.py lines.json outdir      lines.json = [{"id": "l01", "voice": "her"|"him", "text": "..."}]
Voices download once to ~/.piper (en_US-lessac-high = her, en_US-ryan-high = him).
Writes outdir/<id>.wav and outdir/lines.json with durations + what Whisper heard (fix lines where 'heard' differs)."""
import sys, json, os, subprocess, urllib.request, numpy as np, soundfile as sf
V = {'her': 'en_US-lessac-high', 'him': 'en_US-ryan-high'}; VD = os.path.expanduser('~/.piper'); os.makedirs(VD, exist_ok=True)
def model(name):
    p = os.path.join(VD, name + '.onnx')
    if not os.path.exists(p):
        lang, spk, q = name.split('-'); base = f'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/{lang}/{spk}/{q}/{name}'
        for ext in ('.onnx', '.onnx.json'): urllib.request.urlretrieve(base + ext, os.path.join(VD, name + ext))
    return p
lines = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
from faster_whisper import WhisperModel
wm = WhisperModel('base.en', compute_type='int8')
for L in lines:
    w = os.path.join(out, L['id'] + '.wav')
    subprocess.run(['piper', '-m', model(V.get(L.get('voice', 'her'), L.get('voice'))), '-f', w, '--sentence_silence', '0.25'], input=L['text'].encode(), check=True, capture_output=True)
    a, sr = sf.read(w, dtype='float32'); L['dur'] = round(len(a) / sr, 3)
    import librosa; a16 = librosa.resample(a, orig_sr=sr, target_sr=16000)   # pass numpy, not a path (av version bug)
    L['heard'] = ' '.join(s.text.strip() for s in wm.transcribe(a16, language='en')[0]); print(L['id'], L['dur'], '|', L['heard'])
json.dump(lines, open(os.path.join(out, 'lines.json'), 'w'), indent=1)
