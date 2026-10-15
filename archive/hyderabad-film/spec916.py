"""HYDERABAD — 9:16 reel cut-down (~51 s). Text kept clear of the bottom 20% and right 15% (app UI)."""
SIZE = (1080, 1920); FPS = 30; LETTERBOX = 0; FADE_OUT = 1.0
SHOTS, TEXTS = [], []
_t = [0.0]
def shot(kind='img', dur=2.4, **kw):
    d = dict(kind=kind, dur=dur, **kw); SHOTS.append(d); t = _t[0]; _t[0] += dur; return t
def img(src, dur=2.4, **kw): return shot('img', dur, src=src, **kw)
def cap(t, d, main, aside=None, **kw): TEXTS.append(dict(kind='caption', t=t, d=d, main=main, aside=aside, **kw))
def note(t, d, text, **kw): TEXTS.append(dict(kind='aside_only', t=t, d=d, text=text, **kw))
P = lambda a=0.5, b=0.5, z=(1.02, 1.08): dict(fy=(a, b), z=z)          # portrait source
Lx = lambda a=0.5, b=0.5, z=(1.0, 1.08): dict(fx=(a, b), z=z)          # landscape source, horizontal window

t = shot('black', 1.4)
TEXTS.append(dict(kind='boot', t=t + 0.1, d=1.3, lines=['> booting hyderabad.exe', '> humans found: 0'], gap=0.55))
shot('clip', 1.2, src='clip1349', tin=('glitch', 0.3), **Lx(0.55, 0.62))
img('1355', 0.6, tin=('glitch', 0.2), **Lx(0.30, 0.36, (1.1, 1.04)))
t_title = img('1352', 3.3, tin=('glitch', 0.3), dim=0.35, **P(0.30, 0.42, (1.0, 1.06)))
TEXTS.append(dict(kind='title', t=t_title + 0.1, d=3.1, text='HYDERABAD', sub='a film with zero people in it.', aside='(they kept blinking.)'))
t_day = img('1186', 2.4, tin=('glitch', 0.3), **P(0.5, 0.5, (1.0, 1.10)))
cap(t_day + 0.2, 2.2, 'step one:\ngo outside.', '(rare event.)', aside_delay=0.9)
t_sh = img('1195', 2.4, **P(0.4, 0.55))
cap(t_sh + 0.3, 2.0, 'me. technically.', '(shadows don\'t count.)', aside_delay=0.7)
t = img('1205', 2.4, **Lx(0.5, 0.5, (1.0, 1.12)))
cap(t + 0.2, 2.2, 'perfect symmetry.', '(noether would\nbe proud.)', aside_delay=0.7)
t = img('1207', 2.4, tin=('zoom', 0.35), **Lx(0.62, 0.62, (1.0, 1.1)))
cap(t + 0.2, 2.2, 'the real reason\nwe left the house.')
t = img('1279', 3.0, tin=('whip', 0.3), dir=1, **P(1.0, 0.3, (1.0, 1.05)))
cap(t + 0.3, 2.6, 'parallel lines meet\nat infinity.', '(allegedly.)', aside_delay=1.2)
t = img('1260', 2.4, **P(0.4, 0.6))
cap(t + 0.2, 2.2, 'hyderabad traffic.', '(a textbook\nchaotic system.)', aside_delay=0.7)
t = img('1318', 2.4, tin=('flash', 0.6), **P(0.45, 0.6))
cap(t + 0.25, 2.1, 'plot twist:\nthese flowers are fake.')
t = img('1327', 1.8, **P(0.55, 0.4))
note(t + 0.1, 1.6, '(the vibes are\nreal though.)')
t_liz = img('1348', 3.0, **Lx(0.72, 0.72, (1.0, 1.12)))
cap(t_liz + 0.25, 2.7, 'met a local.', '(only model who didn\'t\nask to see the photos.)', aside_delay=0.7)
t = img('1346', 2.4, **Lx(0.45, 0.55, (1.08, 1.0)))
cap(t + 0.2, 2.2, 'task: touch grass.', 'status: complete.', aside_delay=0.7, aside_color=(53, 224, 255))
t = img('1421', 2.4, tin=('flash', 0.6), **P(0.3, 0.6))
cap(t + 0.2, 2.2, 'the sun clocked out.', '(the city didn\'t.)', aside_delay=1.0)
t_night = img('1354', 2.4, tin=('night', 0.6), **P(0.10, 0.30))
TEXTS.append(dict(kind='center', t=t_night + 0.02, d=1.05, text='NIGHT MODE: ON', size=56, color=(53, 224, 255), y=820))
t = img('1352', 2.2, **P(0.6, 0.85))
cap(t + 0.1, 2.0, 'everyone\'s still\nworking.', '(i\'m here for\nthe lighting.)', aside_delay=0.6)
t = img('1227', 1.5, tin=('whip', 0.3), dir=1, **Lx(0.5, 0.6))
cap(t + 0.1, 1.35, 'speed limit?')
t = img('1249', 1.2, tin=('whip', 0.25), dir=1, **P(0.5, 0.5, (1.0, 1.14)))
cap(t + 0.1, 2.5, 'the only one\ni respect is c.', '(speed of light.\nphysics joke. sorry.)', aside_delay=0.9)
img('1242', 1.5, **P(0.6, 0.45))
t = img('1371', 2.4, tin=('glitch', 0.2), **P(0.55, 0.3))
cap(t + 0.2, 2.2, 'the city doesn\'t sleep.', '(neither do\nphysics majors.)', aside_delay=0.8)
t = img('1223', 2.4, **Lx(0.6, 0.6, (1.0, 1.12)))
cap(t + 0.2, 2.1, 'the moon stayed\nup with me.')
t_end = shot('black', 4.4, tin=('dissolve', 0.8))
TEXTS.append(dict(kind='end', t=t_end + 0.15, d=4.2, title='HYDERABAD', credit='SHOT ON FUJIFILM X-M5',
                  line='no humans were\nphotographed in the\nmaking of this film.'))

hm = lambda h, m, s=0: h * 3600 + m * 60 + s
CLOCK = [(0, hm(23, 41, 7)), (t_day - 0.01, hm(23, 41, 13)), (t_day, hm(7, 2)), (t_night, hm(18, 40)), (t_end, hm(23, 58, 40)), (t_end + 9, hm(23, 58, 49))]
def hud_state(t):
    st = {}
    if t < 0.25: return {'off': True}
    st['chapter'] = '' if t < t_day else ('DAY SHIFT' if t < t_night else ('AFTER HOURS' if t < t_end else 'END OF TAPE'))
    if t_sh + 0.3 <= t < t_sh + 1.3:
        st['counter'] = 'HUMANS: 1?' if int(t * 12) % 3 else 'HUMANS: ?'; st['counter_color'] = (255, 61, 139)
    else: st['counter'] = 'HUMANS: 0'
    if t_liz + 0.2 <= t < t_liz + 3.0: st['counter'] = 'LIFEFORMS: 1 (LIZARD)'; st['counter_color'] = (255, 61, 139)
    if t >= t_end + 1.2: st['counter'] = 'HUMANS: 0  STATUS: PERFECT'
    return st
EXTRA_SFX = [dict(t=0.05, kind='shutter'), dict(t=t_night - 1.6, kind='riser', d=1.6), dict(t=t_sh + 0.3, kind='blip'),
             dict(t=t_liz + 0.2, kind='blip'), dict(t=t_title, kind='boom'), dict(t=t_night, kind='boom'), dict(t=t_end + 1.2, kind='blip')]
DAY, NIGHT = (t_day, t_night), (t_night, t_end)
