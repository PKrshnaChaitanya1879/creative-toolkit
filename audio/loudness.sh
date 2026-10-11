#!/usr/bin/env bash
# Normalise a finished mix. Usage: loudness.sh in.wav out.wav [social|film]
# social = -14 LUFS (Instagram/YouTube/Bluesky), film = -16 LUFS. True peak -1 dBTP.
T=-14; [ "$3" = film ] && T=-16
ffmpeg -v error -y -i "$1" -af loudnorm=I=$T:TP=-1:LRA=11 -ar 48000 "$2" && ffmpeg -i "$2" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
