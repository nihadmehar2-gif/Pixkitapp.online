#!/usr/bin/env python3
"""Generate all Android launcher icon assets from the existing PixKitApp
website branding (public/icon-512.png + public/icon-512-maskable.png).

Outputs (into android/app/src/main/res/):
  mipmap-*/ic_launcher.png          legacy square (rounded corners), transparent-safe
  mipmap-*/ic_launcher_round.png    legacy circular
  mipmap-*/ic_launcher_foreground.png  adaptive foreground (the maskable art)
  android/artifacts/playstore-icon-512.png  opaque 512 listing icon
"""
from PIL import Image, ImageDraw, ImageOps
import os, sys

ROOT = "/home/z/my-project"
RES = os.path.join(ROOT, "android/app/src/main/res")
ARTIFACTS = os.path.join(ROOT, "android/artifacts")

SQUARE_SRC = os.path.join(ROOT, "public/icon-512.png")          # rounded-rect, transparent corners
MASKABLE_SRC = os.path.join(ROOT, "public/icon-512-maskable.png")  # full-bleed gradient + glyph

DENSITIES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
FG_DENSITIES = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}


def rounded(image, radius_ratio=0.18):
    """Round the corners of a square RGBA image."""
    size = image.size[0]
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(image, (0, 0), mask)
    return out


def circle(image):
    size = image.size[0]
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([0, 0, size - 1, size - 1], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(image, (0, 0), mask)
    return out


def main():
    square = Image.open(SQUARE_SRC).convert("RGBA")    # 512, transparent corners
    maskable = Image.open(MASKABLE_SRC).convert("RGBA")  # 512, opaque full-bleed

    os.makedirs(ARTIFACTS, exist_ok=True)

    # 1. Legacy launcher icons (Android 7.x launchers show PNG as-is).
    for dpi, px in DENSITIES.items():
        folder = os.path.join(RES, f"mipmap-{dpi}")
        os.makedirs(folder, exist_ok=True)
        square.resize((px, px), Image.LANCZOS).save(os.path.join(folder, "ic_launcher.png"))
        circle(maskable.resize((px, px), Image.LANCZOS)).save(os.path.join(folder, "ic_launcher_round.png"))

    # 2. Adaptive icon foreground = the maskable artwork (built for safe zones).
    for dpi, px in FG_DENSITIES.items():
        folder = os.path.join(RES, f"mipmap-{dpi}")
        os.makedirs(folder, exist_ok=True)
        maskable.resize((px, px), Image.LANCZOS).save(os.path.join(folder, "ic_launcher_foreground.png"))

    # 3. Play Store listing icon: 512x512, opaque (Play rejects transparency).
    play = maskable.convert("RGB").convert("RGBA")
    play.save(os.path.join(ARTIFACTS, "playstore-icon-512.png"))

    print("Icons generated:")
    for dpi, px in DENSITIES.items():
        print(f"  mipmap-{dpi}: ic_launcher {px}px, round {px}px, foreground {FG_DENSITIES[dpi]}px")
    print("  artifacts/playstore-icon-512.png")


if __name__ == "__main__":
    sys.exit(main())
