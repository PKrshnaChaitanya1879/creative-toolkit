# Hyderabad film (Oct 2026) — photo film from GUM's X-M5 shots, no people
- Two cuts: 16:9 (~2:02, letterboxed 2:1, chapters) and 9:16 reel (~51 s). 30 fps, cuts on a 100 BPM grid (0.6 s) so a 100 BPM track can be dropped in later.
- Grade arc: day = cinematic teal/orange -> golden hour -> night = cyberpunk (greens->cyan, sodium orange->pink, red halation); Acros B&W shots -> neon duotone.
- Concept/running joke: HUD "HUMANS DETECTED: 0" (glitches to "1?" on her shadow, "LIFEFORMS: 1 (LIZARD)" on the lizard), clock runs 23:41 -> VHS rewind -> morning -> midnight.
- Fun captions (she asked for fun, not romantic-poetic): physics nerd jokes (Noether symmetry, parallel lines meet at infinity, chaotic traffic, "the only speed limit i respect is c").
- Pipeline: pregrade.py (grade_looks) -> photofilm.py spec16 / spec916 -> sfx_design.py -> loudnorm + mux.
- Lesson: background jobs on her laptop shell die with the call; make proxies in foreground batches (~80 imgs / 170 s). Don't minterpolate 6K clips on 2 cores.
