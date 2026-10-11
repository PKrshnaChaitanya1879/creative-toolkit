#!/usr/bin/env bash
# Encode final deliverables from frames + audio.
# Usage: export.sh frames_dir fps audio.wav name   ->  name.mp4 (master), name-web.mp4 (<30 MB for chat), name-poster.jpg
F=$1; R=$2; A=$3; N=$4
ffmpeg -v error -y -framerate $R -i $F/f%05d.jpg -i "$A" -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$N.mp4"
CRF=24; while :; do
  ffmpeg -v error -y -i "$N.mp4" -vf "scale='min(1920,iw)':-2" -c:v libx264 -preset slow -crf $CRF -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$N-web.mp4"
  S=$(stat -c%s "$N-web.mp4"); [ $S -lt 29000000 ] || [ $CRF -ge 34 ] && break; CRF=$((CRF+2)); done
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$N.mp4"); ffmpeg -v error -y -ss $(echo "$D*0.3" | bc) -i "$N.mp4" -frames:v 1 -q:v 2 "$N-poster.jpg"
ls -la "$N.mp4" "$N-web.mp4" "$N-poster.jpg"
