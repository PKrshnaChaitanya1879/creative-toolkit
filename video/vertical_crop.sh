#!/usr/bin/env bash
# 16:9 -> 9:16 crop with a slow drift so it doesn't feel static. Usage: vertical_crop.sh in.mp4 out.mp4 [x_center 0-1]
X=${3:-0.5}
ffmpeg -v error -y -i "$1" -vf "scale=-2:1920,crop=1080:1920:'(iw-1080)*$X+40*sin(t/5)':0" -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a copy "$2"
