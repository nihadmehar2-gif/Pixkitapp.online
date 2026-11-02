#!/usr/bin/env python3
"""Generate the PixKitApp favicon set from the official uploaded logo.

The official mark (gradient 'P' with browser window + cursor on black) is
cropped from upload/IMG-20261102-WA0013.jpg, cleaned of JPEG noise, and
composed centered on a black square tile at multiple sizes.
"""
from PIL import Image

SRC = "upload/IMG-20261102-WA0013.jpg"
OUT = "public"

im = Image.open(SRC).convert("RGB")
W, H = im.size
print("source:", im.size)

# --- 1. isolate the P mark: use the area above the wordmark (top 66%) ---
crop_region = im.crop((0, 0, W, int(H * 0.66)))
gray = crop_region.convert("L")
# bbox of anything brighter than near-black
mask = gray.point(lambda v: 255 if v > 28 else 0)
bbox = mask.getbbox()
print("mark bbox in source:", bbox)
x0, y0, x1, y1 = bbox
# make it square around the mark (pad equally)
side = max(x1 - x0, y1 - y0)
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
pad = int(side * 0.06)
half = side // 2 + pad
sq = (max(0, cx - half), max(0, cy - half), min(W, cx + half), min(H, cy + half))
mark = im.crop(sq)
# square-ify
s = min(mark.size)
mark = mark.crop((0, 0, s, s))

# --- 2. clean JPEG noise: crush near-black to pure black ---
px = mark.load()
w, h = mark.size
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        if r < 14 and g < 14 and b < 14:
            px[x, y] = (0, 0, 0)

# --- 3. compose master tiles: mark centered at given scale on black ---
def tile(size: int, scale: float) -> Image.Image:
    canvas = Image.new("RGB", (size, size), (0, 0, 0))
    inner = int(size * scale)
    m = mark.resize((inner, inner), Image.LANCZOS)
    off = (size - inner) // 2
    canvas.paste(m, (off, off))
    return canvas

master = tile(512, 0.92)          # standard favicon tile
maskable = tile(512, 0.66)        # PWA maskable safe zone
apple = tile(180, 0.92)

# --- 4. write outputs ---
master.save(f"{OUT}/icon-512.png", optimize=True)
maskable.save(f"{OUT}/icon-512-maskable.png", optimize=True)
master.resize((192, 192), Image.LANCZOS).save(f"{OUT}/icon-192.png", optimize=True)
apple.save(f"{OUT}/apple-touch-icon.png", optimize=True)
master.resize((96, 96), Image.LANCZOS).save(f"{OUT}/favicon-96x96.png", optimize=True)
master.resize((48, 48), Image.LANCZOS).save(f"{OUT}/favicon-48x48.png", optimize=True)
master.resize((48, 48), Image.LANCZOS).save(
    f"{OUT}/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)]
)

# --- 5. verify ---
for f in ["favicon.ico", "favicon-48x48.png", "favicon-96x96.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-512-maskable.png"]:
    v = Image.open(f"{OUT}/{f}")
    frames = getattr(v, "n_frames", 1)
    print(f"{f}: {v.format} {v.size} mode={v.mode} frames={frames}")
print("done")
