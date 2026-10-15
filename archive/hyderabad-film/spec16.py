"""HYDERABAD — 16:9 film. Cuts on a 100 BPM grid (0.6 s)."""
SIZE = (1920, 1080); FPS = 30; LETTERBOX = 64; FADE_OUT = 1.2
SHOTS, TEXTS, EXTRA_SFX = [], [], []
_t = [0.0]
def shot(kind='img', dur=2.4, **kw):
    d = dict(kind=kind, dur=dur, **kw); SHOTS.append(d); t = _t[0]; _t[0] += dur; return t
def img(src, dur=2.4, **kw): return shot('img', dur, src=src, **kw)
def cap(t, d, main, aside=None, **kw): TEXTS.append(dict(kind='caption', t=t, d=d, main=main, aside=aside, **kw))
def note(t, d, text, **kw): TEXTS.append(dict(kind='aside_only', t=t, d=d, text=text, **kw))
def chapter(t, num, title, d=1.75): TEXTS.append(dict(kind='chapter', t=t, d=d, num=num, title=title))
PORTRAIT = lambda a, b: dict(fy=(a, b), z=(1.02, 1.07))

# ---------------- cold open ----------------
t = shot('black', 2.1)
TEXTS.append(dict(kind='boot', t=t + 0.15, d=1.95, lines=['> booting hyderabad.exe', '> scanning for humans...', '> 0 found. perfect.'], gap=0.5))
t_open = shot('clip', 1.2, src='clip1349', z=(1.0, 1.08), tin=('glitch', 0.3), hist=True)
img('1355', 0.6, z=(1.12, 1.05), tin=('glitch', 0.2), hist=True)
img('1354', 0.6, fy=(0.22, 0.30), z=(1.02, 1.08), hist=True)
img('1352', 0.6, fy=(0.30, 0.38), z=(1.08, 1.02), hist=True)
t_title = img('1363', 3.9, z=(1.0, 1.07), dim=0.30, tin=('glitch', 0.3), hist=True)
TEXTS.append(dict(kind='title', t=t_title + 0.1, d=3.7, text='HYDERABAD', sub='a film with zero people in it.', aside='(they kept blinking.)'))
t_rew = shot('rewind', 1.5)
note(t_rew + 0.1, 1.4, 'ok wait. let\'s start from the morning.', color=(244, 244, 246))

# ---------------- CH.01 day shift ----------------
t_day = img('1187', 3.6, z=(1.0, 1.10), tin=('glitch', 0.3))
chapter(t_day + 0.15, 'CH.01', 'day shift')
cap(t_day + 1.95, 3.0, 'step one: go outside.', '(rare event. documented for science.)')
img('1189', 2.4, z=(1.07, 1.07), fx=(0.05, 0.6))
img('1191', 1.8, z=(1.02, 1.14))
shot('split', 2.4, srcs=['1192', '1196'])
t_sh = shot('split', 3.0, srcs=['1195', '1198'])
cap(t_sh + 0.6, 2.4, 'me. technically.', '(shadows don\'t count.)', aside_delay=0.75)
img('1200', 2.4, fx=(0.25, 0.75), z=(1.06, 1.06), tin=('whip', 0.3), dir=1)
t = img('1205', 3.0, z=(1.0, 1.12))
cap(t + 0.3, 2.6, 'perfect symmetry.', '(noether would be proud.)')
t = img('1181', 2.4, z=(1.08, 1.02), fx=(0.2, 0.8))
cap(t + 0.2, 2.2, 'lab day. zero experiments.', '(just vibes.)', aside_delay=0.9)
t = img('1207', 2.4, z=(1.0, 1.10), tin=('zoom', 0.35))
cap(t + 0.25, 2.1, 'the real reason we left the house.')
t = img('1293', 2.4, z=(1.02, 1.10))
cap(t + 0.2, 2.2, 'hyderabad traffic.', '(a textbook chaotic system.)', aside_delay=0.7)
t = shot('split', 2.4, srcs=['1277', '1275'])
cap(t + 0.3, 2.1, 'speed limit: 40.', '(the bus took it as a suggestion.)', aside_delay=0.7)
t = img('1279', 3.0, fy=(1.0, 0.30), z=(1.02, 1.06), tin=('whip', 0.3), dir=1)
cap(t + 0.35, 2.6, 'parallel lines meet at infinity.', '(allegedly. still checking.)', aside_delay=1.0)
img('1258', 1.8, z=(1.06, 1.06), fx=(0.0, 1.0))
t = img('1289', 2.4, z=(1.0, 1.10))
cap(t + 0.2, 2.2, 'empty platform.', '(main character unlocked.)', aside_delay=0.7)
img('1288', 1.8, **PORTRAIT(0.25, 0.6))

# ---------------- CH.02 ikea detour ----------------
t_ikea = img('1310', 3.0, z=(1.02, 1.12), tin=('flash', 0.6))
chapter(t_ikea + 0.15, 'CH.02', 'ikea detour')
cap(t_ikea + 1.95, 3.5, 'adding to cart: everything.', '(bought: one candle.)', aside_delay=1.3)
shot('split', 2.4, srcs=['1306', '1303'])
t = img('1315', 2.4, z=(1.0, 1.10))
cap(t + 0.2, 2.2, 'plot twist: these flowers are fake.')
t = img('1317', 2.4, z=(1.08, 1.08), fx=(0.8, 0.2))
cap(t + 0.15, 2.2, 'the vibes? very real.')
shot('split', 2.4, srcs=['1318', '1327', '1324'])
img('1321', 1.8, **PORTRAIT(0.75, 0.3))

# ---------------- CH.03 cyberabad ----------------
t_cy = img('1338', 3.6, z=(1.0, 1.10), tin=('glitch', 0.3))
chapter(t_cy + 0.15, 'CH.03', 'cyberabad')
note(t_cy + 2.0, 1.55, '(real nickname. look it up.)')
img('1344', 1.8, **PORTRAIT(0.65, 0.4))
t_liz = img('1348', 3.6, z=(1.0, 1.12), fx=(0.65, 0.65))
cap(t_liz + 0.3, 3.2, 'met a local.', '(only model who didn\'t ask to see the photos.)', aside_delay=0.8)
t = img('1346', 2.4, z=(1.07, 1.0))
cap(t + 0.2, 2.2, 'task: touch grass.', 'status: complete.', aside_delay=0.7, aside_color=(53, 224, 255))
img('1343', 1.8, **PORTRAIT(0.35, 0.6))
t_gold = img('1424', 3.0, z=(1.0, 1.08), tin=('flash', 0.6))
cap(t_gold + 0.25, 2.7, 'the sun clocked out.')
t = img('1421', 2.4, **PORTRAIT(0.15, 0.65))
note(t + 0.2, 2.1, '(the city didn\'t.)')
img('1414', 1.8, **PORTRAIT(0.35, 0.55))

# ---------------- CH.04 after hours ----------------
t_night = img('1352', 3.2, z=(1.0, 1.08), fy=(0.62, 0.86), tin=('night', 0.6))
TEXTS.append(dict(kind='center', t=t_night + 0.02, d=1.05, text='NIGHT MODE: ON', size=58, color=(53, 224, 255), y=470))
chapter(t_night + 1.25, 'CH.04', 'after hours', d=1.85)
t = img('1354', 1.8, **PORTRAIT(0.12, 0.32))
cap(t + 0.1, 4.0, 'everyone\'s still working.', '(i\'m just here for the lighting.)', aside_delay=0.9)
img('1355', 2.4, z=(1.08, 1.08), fx=(0.0, 0.7))
t = img('1361', 2.4, z=(1.0, 1.10))
cap(t + 0.2, 3.3, 'the city doesn\'t sleep.', '(neither do physics majors.)', aside_delay=0.9)
img('1372', 2.4, z=(1.10, 1.02))
t = img('1227', 1.8, z=(1.04, 1.12), tin=('whip', 0.3), dir=1)
cap(t + 0.1, 1.65, 'speed limit?')
t = img('1243', 1.2, z=(1.0, 1.12), tin=('whip', 0.25), dir=1)
cap(t + 0.1, 3.3, 'the only one i respect is c.', '(speed of light. physics joke. sorry.)', aside_delay=1.2)
img('1249', 1.2, z=(1.0, 1.15), fy=(0.5, 0.5))
img('1242', 1.2, **PORTRAIT(0.6, 0.45))
img('1236', 1.8, tin=('glitch', 0.2), **PORTRAIT(0.6, 0.4))
t = img('1238', 2.4, z=(1.0, 1.10))
cap(t + 0.2, 2.2, 'midnight dessert.', '(scientifically necessary.)', aside_delay=0.6)
t = shot('split', 2.4, srcs=['1387', '1390'])
cap(t + 0.25, 2.1, 'ordered a drink with\nsix words in its name.')
img('1360', 1.8, z=(1.06, 1.06), fx=(0.3, 0.65))
img('1365', 1.8, **PORTRAIT(0.3, 0.6))
img('1371', 1.8, **PORTRAIT(0.55, 0.3))
t = img('1223', 3.0, z=(1.0, 1.12))
cap(t + 0.25, 2.6, 'the moon stayed up with me.')
t_end = shot('black', 6.6, tin=('dissolve', 0.9))
TEXTS.append(dict(kind='end', t=t_end + 0.2, d=6.4, title='HYDERABAD', credit='SHOT ON FUJIFILM X-M5',
                  line='no humans were photographed\nin the making of this film.'))

# ---------------- HUD ----------------
hm = lambda h, m, s=0: h * 3600 + m * 60 + s
CLOCK = [(0, hm(23, 41, 7)), (t_rew, hm(23, 41, 7) + t_rew), (t_rew + 1.5, hm(6, 58)), (t_ikea, hm(14, 30)), (t_cy, hm(16, 50)),
         (t_gold, hm(18, 5)), (t_night, hm(19, 32)), (t_end, hm(23, 58, 40)), (t_end + 10, hm(23, 58, 50))]
def hud_state(t):
    st = {}
    if t < 0.25: return {'off': True}
    if t < t_day: st['chapter'] = ''
    elif t < t_ikea: st['chapter'] = 'CH.01  DAY SHIFT'
    elif t < t_cy: st['chapter'] = 'CH.02  IKEA DETOUR'
    elif t < t_night: st['chapter'] = 'CH.03  CYBERABAD'
    elif t < t_end: st['chapter'] = 'CH.04  AFTER HOURS'
    else: st['chapter'] = 'END OF TAPE'
    if t_rew <= t < t_rew + 1.5: st['rew'] = True
    if t_sh + 0.35 <= t < t_sh + 1.45:
        st['counter'] = 'HUMANS DETECTED: 1?' if int(t * 12) % 3 else 'HUMANS DETECTED: ?'; st['counter_color'] = (255, 61, 139)
    if t_liz + 0.2 <= t < t_liz + 3.6:
        st['counter'] = 'LIFEFORMS DETECTED: 1 (LIZARD)'; st['counter_color'] = (255, 61, 139)
    if t >= t_end + 1.5: st['counter'] = 'HUMANS DETECTED: 0   STATUS: PERFECT'
    return st
EXTRA_SFX = [dict(t=0.05, kind='shutter'), dict(t=t_night - 1.8, kind='riser', d=1.8), dict(t=t_sh + 0.35, kind='blip'),
             dict(t=t_liz + 0.2, kind='blip'), dict(t=t_title, kind='boom'), dict(t=t_night, kind='boom'), dict(t=t_end + 1.5, kind='blip')]
DAY, NIGHT = (t_day, t_night), (t_night, t_end)
