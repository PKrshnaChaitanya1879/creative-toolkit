import json, pretty_midi as pm, random
random.seed(14)
TL = json.load(open('timeline.json'))
tp = {t['n']: t for t in TL['tapes']}
BPM = 66; B = 60 / BPM; BAR = 4 * B
mid = pm.PrettyMIDI(initial_tempo=BPM)
pno = pm.Instrument(program=0, name='piano')
N = pm.note_name_to_number
def note(p, t, d, v):
    if t < 0: return
    pno.notes.append(pm.Note(velocity=int(max(1, min(127, v + random.randint(-4, 4)))), pitch=N(p) if isinstance(p, str) else p, start=t, end=t + d))
def pedal(t0, t1):
    pno.control_changes += [pm.ControlChange(64, 100, t0 + .02), pm.ControlChange(64, 0, t1 - .03)]
# progressions (root, chord tones) — A minor / C major world
PROG = {
 'home':  [('A2', ['A3','C4','E4']), ('F2', ['F3','A3','C4']), ('C3', ['C4','E4','G4']), ('G2', ['G3','B3','D4'])],
 'love':  [('F2', ['F3','A3','C4']), ('C3', ['C4','E4','G4']), ('G2', ['G3','B3','D4']), ('A2', ['A3','C4','E4'])],
 'ache':  [('D2', ['D3','F3','A3']), ('A2', ['A3','C4','E4']), ('E2', ['E3','G3','B3']), ('F2', ['F3','A3','C4'])],
}
# melody phrases (beats, pitch) per 4 bars — the 'Side B' theme
THEME = [[(0,'E5',1.5),(1.5,'D5',.5),(2,'C5',1),(3,'D5',1)], [(0,'E5',2),(2,'G5',1),(3,'E5',1)],
         [(0,'D5',1.5),(1.5,'C5',.5),(2,'B4',1),(3,'C5',1)], [(0,'A4',3),(3,'E5',1)]]
THEME_L = [[(0,'C5',1.5),(1.5,'A4',.5),(2,'C5',1),(3,'E5',1)], [(0,'G5',2),(2,'E5',1),(3,'D5',1)],
           [(0,'D5',1.5),(1.5,'E5',.5),(2,'G5',1),(3,'B4',1)], [(0,'C5',3),(3,'E5',1)]]
def section(t0, t1, prog, vel, style, mel=None, mvel=0, octave_bass=False, sparse=False):
    t = t0; k = 0
    while t + BAR <= t1 + .01:
        root, ch = PROG[prog][k % 4]
        pedal(t, t + BAR)
        if style == 'pad':
            note(root, t, BAR * .98, vel); [note(c, t + .03 * i, BAR * .95, vel - 8) for i, c in enumerate(ch)]
        elif style == 'arp':
            seq = [root, ch[0], ch[1], ch[2], ch[1], ch[0], ch[2], ch[1]]
            for i, p in enumerate(seq):
                if sparse and i % 2: continue
                note(p, t + i * B / 2, B * 1.5, vel - (6 if i else 0))
            if octave_bass: note(N(root) - 12, t, BAR * .9, vel - 4)
        if mel:
            for (b, p, d) in mel[k % 4]: note(p, t + b * B, d * B * .95, mvel)
        t += BAR; k += 1
    return t
T = lambda n, key='t0': tp[n][key]
# intro: lone motif notes over pads
t = section(0.8, T(1) - 1, 'home', 34, 'pad', mel=[[(0,'E5',2)],[(0,'D5',2)],[(0,'C5',3)],[(0,'B4',3)]], mvel=40)
t = section(t, T(5), 'home', 40, 'arp', sparse=True)                         # tapes 1–4: soft, sparse
t = section(t, T(7), 'love', 46, 'arp', mel=THEME, mvel=56)                    # 5–6: theme arrives
t = section(t, T(8), 'ache', 34, 'pad', mel=[[(0,'A4',4)],[(0,'C5',4)],[(0,'B4',4)],[(0,'A4',4)]], mvel=36)  # 7: ache
t = section(t, T(9), 'love', 50, 'arp', mel=THEME_L, mvel=58)                  # 8
# 9: build toward the horn, then cut when the tape runs out
horn = [a['t'] for a in TL['amb'] if a['kind'] == 'horn'][0]
k = 0
while t + BAR <= TL['end_tape'] + .01:
    root, ch = PROG['love' if k % 8 < 4 else 'home'][k % 4]
    v = 48 + int(32 * min(1, (t - T(9)) / max(1, horn - T(9))))
    pedal(t, t + BAR)
    for i, p in enumerate([root, ch[0], ch[1], ch[2], ch[1], ch[2], ch[0], ch[2]]): note(p, t + i * B / 2, B * 1.4, v - (6 if i else 0))
    note(N(root) - 12, t, BAR * .9, v)
    for (b, p, d) in (THEME if k % 8 < 4 else THEME_L)[k % 4]: note(N(p) + (12 if t > horn - 6 else 0), t + b * B, d * B * .95, v + 6)
    t += BAR; k += 1
# end title: one soft open chord (no tonic resolution)
e0 = TL['end_title'][0] + .5
pedal(e0, e0 + 6); [note(p, e0 + .05 * i, 5.5, 40) for i, p in enumerate(['F2', 'C4', 'E4', 'G4', 'B4'])]
# credits: full theme, ending suspended on Fmaj7 — open ending
c0, c1 = TL['credits']
t = section(c0, c1 - BAR, 'home', 46, 'arp', mel=THEME, mvel=54)
pedal(t, t + BAR * 1.3); [note(p, t + .06 * i, BAR * 1.25, 42) for i, p in enumerate(['F2', 'C3', 'A3', 'E4', 'C5', 'E5'])]
mid.instruments.append(pno)
mid.write('score.mid'); print('notes', len(pno.notes), 'end', round(max(n.end for n in pno.notes), 1))
