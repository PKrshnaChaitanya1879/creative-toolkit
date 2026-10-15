# window-journey (GUM personal reel, 60 s, 9:16) — Ghibli-style version
- Story: cozy colourful room → she pulls the lamp cord (lights off, desk lamp only) → camera past her head into first person →
  the house becomes a train: one window pane, worlds slide past (rainy NYC, rainforest, farmland w/ telegraph wires, snow, coastline + rainbow) → asleep at the desk, night countryside outside.
- All procedural canvas painting (no footage). Files: lib (paint helpers), room, girl, home_view (rain on glass), worlds (parallax strips per world), pov, main (timeline + post).
- Smooth lofi look = STYLE {edge .28, tex .3} in lib.js + finish(): bloom (downscale, contrast threshold, blur, screen) + soft-light grade purple→amber.
  Bloom threshold matters: brightness(.78) contrast(3.4) or bright day scenes blow out.
- Timeline locked to music: BAR = 2.74 s (87.6 bpm); every world = 2 bars, cuts on downbeats. score.py (pretty_midi → fluidsynth FluidR3), sfx.py (rain, cord click, train clacks, mist whooshes, sea), then volume to -14 LUFS.
- Render: node render/render_canvas.js . index.html --w 1080 --h 1920 --fps 30 --dur 60 (~8 min), video/export.sh.
- Next: Demon Slayer-style version reuses timeline/score structure; swap paint style (ink outlines, flat cel shading, bold contrast).
