#!/usr/bin/env python3
"""Regenerate all favicon PNGs + ICO from the recolored public/icon.svg.

Sizes match the manifest/layout metadata declarations:
  favicon-48, favicon-96, icon-192, icon-512, icon-512-maskable,
  apple-touch-icon (180), favicon.ico (16/32/48).
"""
import io
import subprocess

import cairosvg
from PIL import Image

SRC = "/home/z/my-project/public/icon.svg"
OUT = "/home/z/my-project/public"


def render(size: int) -> Image.Image:
    png = cairosvg.svg2png(url=SRC, output_width=size, output_height=size)
    return Image.open(io.BytesIO(png)).convert("RGBA")


# Simple square icons
for name, size in [
    ("favicon-48x48.png", 48),
    ("favicon-96x96.png", 96),
    ("icon-192.png", 192),
    ("icon-512.png", 512),
    ("apple-touch-icon.png", 180),
]:
    render(size).save(f"{OUT}/{name}")
    print(f"wrote {name} ({size}px)")

# Maskable: brand glyph needs a safe zone — render the artwork at 80%
# centered over the same red so circles/rounded masks never clip it.
base = Image.new("RGBA", (512, 512), (224, 46, 41, 255))
art = render(410)
base.alpha_composite(art, ((512 - 410) // 2, (512 - 410) // 2))
base.save(f"{OUT}/icon-512-maskable.png")
print("wrote icon-512-maskable.png (512px, safe-zone padded)")

# favicon.ico: 16 + 32 + 48 in one file
frames = [render(s) for s in (16, 32, 48)]
frames[0].save(f"{OUT}/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("wrote favicon.ico (16/32/48)")

# Verify no old-brand colors remain in the SVG
svg = open(SRC).read()
leftovers = [c for c in ("#38bdf8", "#a855f7", "#60a5fa", "#d946ef", "#c026d3", "#2563eb", "#7c3aed", "#d946ef") if c in svg]
print("old-color leftovers in svg:", leftovers or "none")
subprocess.run(["git", "-C", "/home/z/my-project", "status", "--short", "public/"], check=False)
