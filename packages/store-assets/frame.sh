#!/usr/bin/env bash
# Frame raw App Store screenshots onto an on-brand 1290x2796 canvas (6.7"/6.9" slot).
# Rounds corners, adds a bezel + soft shadow, and a Garamond caption.
# Re-run any time raw/ changes:  bash frame.sh
set -euo pipefail
cd "$(dirname "$0")"

FONT="../../src/app/fonts/GaramondLibre-Bold.otf"
CW=1290 CH=2796                 # App Store 6.7"/6.9" accepted size
RAD=96 BEZEL=20                 # screenshot corner radius + bezel thickness

# Brand palette (from globals.css)
PAPER="#f5efe0"; PAPER_INK="#1f1812"; ACCENT="#c7651c"
DARK="#101a30";  DARK_INK="#ece3d2";  DARK_ACCENT="#e0833a"

mkdir -p framed tmp

# Build the two background canvases once (gradient + brand washes / NightSky stars).
build_bg () {
  # LIGHT — warm paper gradient + two faint watercolor-disc washes (echoes the home grid)
  magick -size "${CW}x${CH}" radial-gradient:'#fbf7ed'-'#e6d9bd' tmp/bg-light.png
  magick -size "${CW}x${CH}" xc:none -fill "$ACCENT" -draw "circle 1150,250 1150,-90" \
    -blur 0x115 -channel A -evaluate multiply 0.26 +channel tmp/w1.png
  magick -size "${CW}x${CH}" xc:none -fill "#d98a3a" -draw "circle 140,2520 140,2820" \
    -blur 0x135 -channel A -evaluate multiply 0.24 +channel tmp/w2.png
  magick tmp/bg-light.png tmp/w1.png -composite tmp/w2.png -composite tmp/bg-light.png

  # DARK — night gradient + warm glow + a sparse star field (echoes NightSky)
  magick -size "${CW}x${CH}" radial-gradient:'#203052'-'#080d18' tmp/bg-dark.png
  magick -size "${CW}x${CH}" xc:none -fill "$DARK_ACCENT" -draw "circle 645,2520 645,2860" \
    -blur 0x150 -channel A -evaluate multiply 0.20 +channel tmp/wd.png
  magick -size "${CW}x${CH}" xc:none -fill white \
    -draw "circle 110,120 110,123"  -draw "circle 250,72 250,74"   -draw "circle 392,158 392,161" \
    -draw "circle 520,96 520,98"    -draw "circle 705,58 705,61"   -draw "circle 884,132 884,134" \
    -draw "circle 1040,84 1040,87"  -draw "circle 1182,168 1182,170" -draw "circle 168,268 168,270" \
    -draw "circle 436,250 436,253"  -draw "circle 762,232 762,234"  -draw "circle 1092,278 1092,281" \
    -draw "circle 312,190 312,192"  -draw "circle 958,206 958,208"  -draw "circle 622,166 622,169" \
    -draw "circle 58,1420 58,1422"  -draw "circle 1232,1610 1232,1613" -draw "circle 48,2010 48,2012" \
    -draw "circle 1240,2210 1240,2212" -draw "circle 72,2520 72,2522" -draw "circle 1226,2660 1226,2662" \
    -blur 0x0.6 tmp/stars.png
  magick tmp/bg-dark.png tmp/wd.png -composite \
    \( tmp/stars.png -channel A -evaluate multiply 0.8 +channel \) -composite tmp/bg-dark.png
}
build_bg

# raw file | caption | theme(light|dark)
frame () {
  local SRC="$1" CAP="$2" THEME="$3" OUT="$4"
  local INK BGF
  if [ "$THEME" = dark ]; then INK="$DARK_INK"; BGF=tmp/bg-dark.png
  else INK="$PAPER_INK"; BGF=tmp/bg-light.png; fi

  local W H; W=$(magick identify -format '%w' "$SRC"); H=$(magick identify -format '%h' "$SRC")
  local BW=$((W+2*BEZEL)) BH=$((H+2*BEZEL)) BRAD=$((RAD+BEZEL))

  # 1. round the screenshot corners
  magick "$SRC" -alpha set \
    \( -size "${W}x${H}" xc:none -fill white -draw "roundrectangle 0,0,$((W-1)),$((H-1)),$RAD,$RAD" \) \
    -compose DstIn -composite tmp/rounded.png

  # 2. bezel: dark rounded slab behind the screenshot
  magick -size "${BW}x${BH}" xc:none -fill "#0c0c0e" \
    -draw "roundrectangle 0,0,$((BW-1)),$((BH-1)),$BRAD,$BRAD" tmp/bezel.png
  magick tmp/bezel.png tmp/rounded.png -gravity center -composite tmp/phone.png

  # 3. soft drop shadow
  magick tmp/phone.png \( +clone -background black -shadow 55x28+0+18 \) \
    +swap -background none -layers merge +repage tmp/phone_shadow.png

  # 4. caption — fixed size, manual line breaks (\n in $CAP) + compose on canvas
  magick -background none -fill "$INK" -font "$FONT" -pointsize 82 \
    -interline-spacing 6 -gravity center label:"$CAP" tmp/cap.png
  magick "$BGF" \
    \( tmp/phone_shadow.png -resize x2300 \) -gravity south -geometry +0+70 -composite \
    tmp/cap.png -gravity north -geometry +0+140 -composite \
    "framed/$OUT"
  echo "  framed/$OUT"
}

echo "Framing…"
# Ordered by benefit impact: identity → reading proof → audio (player + lock screen) → comfort → engagement.
frame raw/IMG_5388.PNG $'Old Wisdom.\nPlain English.'    light ios-6.7-en-01-home.png
frame raw/IMG_5389.PNG $'The Buddha’s First Talk,\nin Plain English.' light ios-6.7-en-02-read.png
frame raw/IMG_lockscreen.PNG $'Soothing Audio, Even Offline.\nListen Anywhere.' light ios-6.7-en-03-lockscreen.png
frame raw/IMG_5390.PNG $'Read or Listen — Free.\nSet Your Own Pace.' light ios-6.7-en-04-listen.png
frame raw/IMG_5392.PNG $'Low-Contrast Night Mode.\nEasy Bedtime Reading.'    light ios-6.7-en-05-display.png
frame raw/IMG_notes.PNG $'Highlight & Note.\nKeep What Speaks to You.'        light ios-6.7-en-06-notes.png

rm -rf tmp
echo "Done → packages/store-assets/framed/"
