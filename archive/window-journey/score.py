"""Original score for the Ghibli-style train-window reel: warm piano + strings, F major, 87.6 bpm (bar = 2.74 s).
Bars: 0-4 intro (room) | 5-6 lights off (pad, sparse) | 7-8 build (push-in, train starts) |
9-18 journey, 2 bars per world (NYC, forest, farm, snow, coast) | 19-21 sleep, resolve on Fmaj7, ring out."""
import pretty_midi as pm, subprocess, sys
BAR = 2.74; BEAT = BAR / 4
N = lambda s: pm.note_name_to_number(s)
mid = pm.PrettyMIDI(initial_tempo=60 / BEAT)
def inst(prog, name): i = pm.Instrument(program=prog, name=name); mid.instruments.append(i); return i
piano, strings, pad, flute, accord, celesta, pizz, bass, harp = (inst(0, 'piano'), inst(48, 'strings'), inst(89, 'pad'), inst(73, 'flute'),
    inst(21, 'accordion'), inst(8, 'celesta'), inst(45, 'pizz'), inst(32, 'bass'), inst(46, 'harp'))
def add(i, pitch, bar, beat, dur, vel):
    s = bar * BAR + beat * BEAT; i.notes.append(pm.Note(velocity=int(vel), pitch=N(pitch) if isinstance(pitch, str) else pitch, start=s, end=s + dur * BEAT))
CH = {  # chord tones (low -> high)
 'Fmaj7': ['F2', 'C3', 'A3', 'E4', 'A4', 'C5'], 'Am7': ['A2', 'E3', 'G3', 'C4', 'E4', 'G4'], 'Bbmaj7': ['Bb1', 'F2', 'D3', 'A3', 'D4', 'F4'],
 'C': ['C2', 'G2', 'E3', 'G3', 'C4', 'E4'], 'Dm7': ['D2', 'A2', 'F3', 'C4', 'F4', 'A4'], 'Gm7': ['G1', 'D2', 'Bb2', 'F3', 'Bb3', 'D4'],
 'C7sus': ['C2', 'G2', 'F3', 'Bb3', 'C4', 'F4'], 'C7': ['C2', 'G2', 'E3', 'Bb3', 'C4', 'E4'], 'Bb/F': ['F1', 'F2', 'D3', 'Bb3', 'D4', 'F4'], 'Fadd9': ['F1', 'C3', 'G3', 'A3', 'C4', 'G4']}
prog = ['Fmaj7', 'Am7', 'Bbmaj7', 'C', 'Fmaj7', 'Dm7', 'Bbmaj7', 'Gm7', 'C7sus',
        'Bbmaj7', 'C', 'Am7', 'Dm7', 'Bbmaj7', 'C', 'Am7', 'Dm7', 'Gm7', 'C7', 'Fmaj7', 'Bb/F', 'Fadd9']
# ---- piano left hand: broken-chord eighths (soft), lighter in the dark bars
for b, c in enumerate(prog):
    tones = CH[c]
    if b in (5, 6):  # lights off: just a low touch + a single high bell note
        add(piano, tones[0], b, 0, 4, 38); add(celesta, tones[4], b, 1, 2, 40); add(celesta, tones[5], b, 2.5, 1.5, 34); continue
    if b >= 21: add(piano, tones[0], b, 0, 8, 44); add(piano, tones[2], b, .5, 7, 40); add(piano, tones[3], b, 1, 6, 38); add(piano, tones[5], b, 1.5, 6, 36); continue
    patt = [0, 2, 3, 4, 5, 4, 3, 2]; base = 58 if b < 9 else 60
    if b >= 19: base = 50
    for k, ti in enumerate(patt): add(piano, tones[ti], b, k * .5, 1.2 if k else 4, base - (k % 2) * 6 + (8 if k == 0 else 0))
# ---- melody (right hand)
mel = {
 0: [('A4', 0, 2), ('C5', 2, 1), ('E5', 3, 1)], 1: [('E5', 0, 1.5), ('D5', 1.5, .5), ('C5', 2, 2)], 2: [('D5', 0, 1), ('F5', 1, 1), ('A5', 2, 2)],
 3: [('G5', 0, 3), ('E5', 3, 1)], 4: [('F5', 0, 3.5)],
 7: [('Bb4', 0, 1), ('D5', 1, 1), ('F5', 2, 1), ('A5', 3, 1)], 8: [('G5', 0, 2), ('F5', 2, 1), ('E5', 3, 1)],
 9: [('D5', 0, 1), ('C5', 1, .5), ('Bb4', 1.5, .5), ('C5', 2, 1), ('F5', 3, 1)], 10: [('E5', 0, 1.5), ('D5', 1.5, .5), ('C5', 2, 2)],
 11: [('C5', 0, 1), ('A4', 1, .5), ('G4', 1.5, .5), ('A4', 2, 1), ('E5', 3, 1)], 12: [('F5', 0, 1.5), ('E5', 1.5, .5), ('D5', 2, 2)],
 13: [('D6', 0, 1), ('C6', 1, .5), ('Bb5', 1.5, .5), ('C6', 2, 1), ('F6', 3, 1)], 14: [('E6', 0, 1.5), ('D6', 1.5, .5), ('C6', 2, 2)],
 15: [('C6', 0, 1), ('A5', 1, .5), ('G5', 1.5, .5), ('A5', 2, 1), ('E6', 3, 1)], 16: [('F6', 0, 1.5), ('E6', 1.5, .5), ('D6', 2, 2)],
 17: [('Bb5', 0, 1), ('A5', 1, .5), ('G5', 1.5, .5), ('F5', 2, 1), ('D5', 3, 1)], 18: [('E5', 0, 2), ('G5', 2, 1), ('C6', 3, 1)],
 19: [('A5', 0, 3), ('G5', 3, 1)], 20: [('F5', 0, 2), ('D5', 2, 2)], 21: [('C5', 0, 1), ('F5', 1, 6)]}
for b, notes in mel.items():
    v = 76 if b < 9 else 80
    if b >= 19: v = 66
    for p, beat, d in notes: add(piano, p, b, beat, d, v + (6 if beat == 0 else 0))
# ---- colours per world (doubling the melody in a new voice every 2 bars)
for b, i, oct_, v in [(11, flute, 0, 64), (12, flute, 0, 66), (13, accord, -12, 52), (14, accord, -12, 54), (15, celesta, 0, 60), (16, celesta, 0, 62)]:
    for p, beat, d in mel[b]: add(i, N(p) + oct_, b, beat, d, v)
for b in (9, 10):  # NYC: pizzicato bounce
    for k in range(8): add(pizz, CH[prog[b]][2 + (k % 3)], b, k * .5, .5, 58)
# ---- strings: enter on the build, swell into the coast, carry the resolution
for b in range(7, 21):
    c = CH[prog[b]]; v = 40 + min(30, (b - 7) * 3) + (14 if b in (17, 18) else 0)
    if b >= 19: v = 46 - (b - 19) * 8
    for ti in (1, 2, 3): add(strings, c[ti], b, 0, 4, v)
# ---- warm pad under the dark bars and the ending
for b in (5, 6, 19, 20, 21):
    for ti in (1, 2, 3): add(pad, CH[prog[b]][ti], b, 0, 4 if b < 21 else 8, 40 if b < 19 else 38)
# ---- bass on the journey
for b in range(9, 19): add(bass, N(CH[prog[b]][0]) + 12, b, 0, 2, 70); add(bass, N(CH[prog[b]][1]) + 12, b, 2, 2, 62)
# ---- harp gliss into each new world (lands on the downbeat)
for b in (9, 11, 13, 15, 17):
    c = CH[prog[b]][2:]
    for k in range(8): add(harp, N(c[k % 4]) + 12 * (k // 4), b - 1, 2 + k * .25, .6, 46 + k * 3)
mid.write('score.mid')
subprocess.run(['fluidsynth', '-ni', '-g', '0.8', '-r', '48000', '-F', 'score.wav', '/usr/share/sounds/sf2/FluidR3_GM.sf2', 'score.mid'], check=True, capture_output=True)
print('score.wav written', mid.get_end_time())
