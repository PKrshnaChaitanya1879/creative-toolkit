# creative-toolkit

GUM's shared toolbox for everything Claude makes: videos, posters, pages, 3D, music, plots.
**Claude: at the start of any creative task, clone this repo, run `bash setup/bootstrap.sh`, and reuse what's here before writing anything new.**
The design rules live in the skills (premium-design, video-finish, game-finish, model-3d-finish); this repo holds the working code.

| Folder | What's in it |
|---|---|
| `render/render_canvas.js` | Renders any canvas motion-graphics page frame by frame (fake origin, no taint, local fonts). Preview stills with `--preview`. |
| `render/snap.js` | HTML → PNG at 2x for posters, thumbnails, page checks. Warns on horizontal overflow. |
| `render/contact_sheet.py` | Tiles stills into one sheet to check a whole video or set at a glance. |
| `templates/motion.html` | Starter page for titles/motion: easing helpers, word-by-word reveal, grain, Geist fonts. |
| `video/kenburns.py` | Shot list (clips + stills) → graded background video with slow zooms, frame-exact cuts. |
| `video/export.sh` | Master (CRF 17) + web version under 30 MB for chat + poster frame. |
| `video/vertical_crop.sh` | 16:9 → 9:16 with a gentle drift. |
| `audio/beatgrid.py` | Song → steady beat grid (librosa + straight-line fit) for cutting on the beat. |
| `audio/tts.py` | Piper voices (her = lessac, him = ryan) with Whisper check of every line. |
| `audio/mixdown.py` | Music + voice + SFX mix with ducking. |
| `audio/loudness.sh` | Normalise to -14 LUFS (social) or -16 (film). |
| `blender/studio.py` | Apple-style product studio: cyclorama, softbox + rim lights, material presets, auto framing, turntables. |
| `blender/export_unity.py` | FBX export for Unity URP with correct scale/axes + triangle counts. |
| `styles/` | `gum.mplstyle` (lab plots), `tokens.css` (page colours/spacing), project style-sheet template. |
| `fonts/` | Local Geist, Geist Mono, Inter; `fetch_fonts.py` adds any Google Font. |
| `archive/` | Source of past projects (World Tour, LAUNCH, SIDE B, rain_2am, Voyager poster) to copy from. |

## Quick recipes
```bash
# poster / page screenshot
node render/snap.js poster.html poster.png --w 1200 --h 1680
# motion graphics: preview 3 stills, then full render, then encode
node render/render_canvas.js work motion.html --preview 0.5,2,4
node render/render_canvas.js work motion.html --dur 12 --fps 30
bash video/export.sh work/frames 30 work/mix.wav out/MyVideo
# lab plot
python3 -c "import matplotlib.pyplot as plt; plt.style.use('styles/gum.mplstyle')"
```
Node scripts need `NODE_PATH=$(npm root -g)`. Chromium is at `/opt/pw-browsers/chromium`.

## Rules for adding to this repo
- Generalise before saving: a tool here must work for the next project, not just this one.
- Media (footage, songs, renders) never goes in the repo; only code, fonts, small examples. Her music stays on her PC.
- Update this README table when adding a tool.
