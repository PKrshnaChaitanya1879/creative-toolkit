import json
L = json.load(open('vo/lines.json'))
CLIPS = {  # name: (film, in, out, is_colour)
    'couple':   ('passenger_train', 343.2, 347.4, 0), 'lounge': ('passenger_train', 335.3, 339.2, 0),
    'curve':    ('passenger_train', 377.0, 383.9, 0), 'tunnel': ('passenger_train', 384.0, 396.1, 0),
    'roundwin': ('passenger_train', 214.6, 225.1, 0), 'hatman': ('passenger_train', 236.6, 243.8, 0),
    'platcpl':  ('passenger_train', 60.5, 70.0, 0),   'blur':   ('passenger_train', 506.7, 508.2, 0),
    'shadows':  ('passenger_train', 634.1, 643.0, 0), 'yard':   ('passenger_train', 183.7, 192.6, 0),
    'dining':   ('passenger_train', 445.6, 458.1, 0), 'nighttr': ('Passenge1955', 480.7, 485.8, 0),
    'sleeper':  ('Passenge1955', 512.1, 522.6, 0),    'platcar': ('Passenge1955', 584.4, 601.3, 0),
    'ahead':    ('Passenge1955', 343.8, 347.4, 0),    'clock':  ('FromDawn1937', 99.0, 101.9, 0),
    'comb':     ('FromDawn1937', 120.6, 126.5, 0),    'embrace': ('FromDawn1937', 129.9, 135.1, 0),
    'porch':    ('FromDawn1937', 140.5, 142.4, 0),    'street': ('FromDawn1937', 182.8, 185.9, 0),
    'binocs':   ('IndustryOnPa', 246.8, 250.0, 0),    'water':  ('IndustryOnPa', 256.0, 271.4, 0),
    'ship':     ('IndustryOnPa', 303.9, 315.0, 0),    'helm':   ('IndustryOnPa', 341.3, 343.8, 0),
    'listen':   ('Revoluti1958', 491.5, 499.5, 1),    'reels':  ('Revoluti1958', 600.0, 606.5, 1),
    'counter':  ('Revoluti1958', 611.0, 627.0, 1),    'sofa':   ('Revoluti1958', 688.0, 700.5, 1),
    'living':   ('LivingSt1958', 278.0, 288.3, 1),
}
GAP, CLICK = 1.45, 1.2
AMB = {'morning': 5.0, 'sea': 5.5, 'horn': 4.0}
# per tape: footage list, warmth (0 cold B&W -> 1 warm), interlude after (secs, clips)
PLAN = {
    1: (['lounge', 'couple', 'curve', 'tunnel', 'reels', 'counter'], 0.05, (4.5, ['hatman'])),
    2: (['yard', 'hatman', 'comb', 'roundwin'], 0.12, (3.5, ['clock'])),
    3: (['clock', 'porch', 'street', 'comb'], 0.28, (3.0, ['nighttr'])),
    4: (['water', 'ship', 'ahead', 'binocs'], 0.36, (4.5, ['sleeper'])),
    5: (['sleeper', 'listen', 'embrace', 'living'], 0.72, (5.5, ['sofa'])),
    6: (['ship', 'helm', 'binocs', 'ahead'], 0.55, (4.0, ['shadows'])),
    7: (['tunnel', 'sleeper', 'shadows'], 0.25, (4.0, ['nighttr'])),
    8: (['platcar', 'platcpl', 'roundwin'], 0.5, (4.0, ['clock'])),
    9: (['platcar', 'shadows', 'nighttr', 'curve', 'blur', 'yard', 'blur', 'tunnel'], 0.85, (0.0, [])),
}
T = 0.0; segs = []; vo = []; amb = []; caps = []; tapes = []
def add_seg(clip, dur, warm, kind='clip'):
    global T
    segs.append({'t0': round(T, 3), 'dur': round(dur, 3), 'clip': clip, 'warm': warm}); T += dur
# ---- intro
add_seg('black', 3.5, 0); add_seg('nighttr', 6.5, 0); add_seg('curve', 6.5, 0); add_seg('roundwin', 7.5, 0); add_seg('tunnel', 8.0, 0)
TITLE = (T, T + 7.5); add_seg('black', 7.5, 0)
for n in range(1, 10):
    lines = [x for x in L if x['tape'] == n]
    t0 = T; t = T + CLICK; who = None
    for x in lines:
        if 'amb' in x:
            amb.append({'t': round(t, 3), 'kind': x['amb'], 'dur': AMB[x['amb']]}); t += AMB[x['amb']]; continue
        who = x['who']
        vo.append({'t': round(t, 3), 'file': x['file'], 'dur': x['dur'], 'tape': n})
        caps.append({'t0': round(t, 3), 't1': round(t + x['dur'], 3), 'text': x['text'], 'who': x['who']})
        t += x['dur'] + GAP
    t1 = t - GAP + CLICK
    tapes.append({'n': n, 'who': who, 't0': round(t0, 3), 't1': round(t1, 3)})
    clips, warm, (idur, iclips) = PLAN[n]
    # distribute tape duration over clips, weighted by available length (capped slow-down 1.6x)
    total = t1 - t0
    avail = [CLIPS[c][2] - CLIPS[c][1] for c in clips]
    w = [min(a * 1.6, max(2.2, a)) for a in avail]; s = sum(w)
    durs = [total * x / s for x in w]
    for c, d in zip(clips, durs): add_seg(c, d, warm)
    for c in iclips: add_seg(c, idur * 1.5 / len(iclips), warm)
END_TAPE = T
# ---- after tape 9: trains crossed -> black, title, credits, coda
add_seg('black', 2.5, 0); END_TITLE = (T, T + 6.0); add_seg('black', 6.0, 0)
CRED = (T, T + 20.0); add_seg('black', 20.0, 0)
CODA = T; coda = [x for x in L if x['tape'] == 10][0]
vo.append({'t': round(T + 2.2, 3), 'file': coda['file'], 'dur': coda['dur'], 'tape': 10})
caps.append({'t0': round(T + 2.2, 3), 't1': round(T + 2.2 + coda['dur'] * .78, 3), 'text': coda['text'][:-6] + '—', 'who': 'him'})
add_seg('reels', 2.2 + coda['dur'] * .78, 0.9)
CUT = T; add_seg('black', 2.5, 0)
out = {'segs': segs, 'vo': vo, 'amb': amb, 'caps': caps, 'tapes': tapes, 'title': TITLE, 'end_title': END_TITLE, 'credits': CRED,
       'coda': CODA, 'cut': CUT, 'end_tape': END_TAPE, 'total': round(T, 3), 'clips': CLIPS}
json.dump(out, open('timeline.json', 'w'), indent=1)
print('total', round(T, 1), 's  =', f'{int(T//60)}:{int(T%60):02d}')
for tp in tapes: print('tape', tp['n'], tp['who'], round(tp['t0'], 1), '→', round(tp['t1'], 1))
print('coda', round(CODA, 1), 'cut', round(CUT, 1))
