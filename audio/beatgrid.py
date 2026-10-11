"""Beat grid for cutting video to music.
Usage: python3 beatgrid.py song.mp3 [--start 90.4] [--dur 48] > grid.json
Tracks beats with librosa, then fits a straight line (steady tempo) so cuts never drift.
Output: {"bpm", "period", "offset", "beats": [seconds relative to --start]}"""
import sys, json, numpy as np, librosa
a = sys.argv[1:]; f = a[0]; st = float(a[a.index('--start') + 1]) if '--start' in a else 0.0; dur = float(a[a.index('--dur') + 1]) if '--dur' in a else None
y, sr = librosa.load(f, sr=22050, offset=st, duration=(dur + 5) if dur else None)
tempo, fr = librosa.beat.beat_track(y=y, sr=sr); bt = librosa.frames_to_time(fr, sr=sr)
k = np.arange(len(bt)); p, o = np.polyfit(k, bt, 1)
beats = [round(o + p * i, 4) for i in range(int(((dur or bt[-1]) - o) / p) + 1)]
print(json.dumps({'bpm': round(60 / p, 2), 'period': round(p, 5), 'offset': round(o, 4), 'start': st, 'beats': beats}))
