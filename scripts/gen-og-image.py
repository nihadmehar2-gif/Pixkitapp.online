#!/usr/bin/env python3
"""Generate the PixKitApp Open Graph social sharing image (1200x630 PNG).

Brand-consistent with the site: dark background (#1a1625), violet->orange
gradient accent (matches public/logo.svg), Inter-like heavy sans (DejaVu Sans
Bold is the closest installed), same wordmark treatment.

Output: public/og-default.png — served at https://www.pixkitapp.online/og-default.png
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math
import os

W, H = 1200, 630
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "og-default.png")

# ---- palette (from globals.css / logo.svg) --------------------------------
BG_TOP = (26, 22, 37)       # #1a1625 (dark --background)
BG_BOT = (20, 16, 30)       # slightly deeper
VIOLET = (168, 85, 247)     # #a855f7
ORANGE = (249, 115, 22)     # #f97316
WHITE = (255, 255, 255)
MUTED = (203, 213, 225)     # slate-300
FAINT = (148, 163, 184)     # slate-400

BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

f_wordmark = ImageFont.truetype(BOLD, 84)
f_tagline = ImageFont.truetype(BOLD, 44)
f_sub = ImageFont.truetype(REG, 27)
f_chip = ImageFont.truetype(REG, 24)
f_url = ImageFont.truetype(BOLD, 26)
f_stat = ImageFont.truetype(BOLD, 30)
f_stat_small = ImageFont.truetype(REG, 22)
f_logo_p = ImageFont.truetype(BOLD, 62)


def vertical_gradient(size, top, bottom):
    w, h = size
    base = Image.new("RGB", (1, h))
    px = base.load()
    for y in range(h):
        t = y / (h - 1)
        px[0, y] = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    return base.resize((w, h))


def radial_glow(size, color, max_alpha):
    """Soft radial blob used for ambient brand glows."""
    w, h = size
    layer = Image.new("L", (w, h), 0)
    cx, cy = w / 2, h / 2
    d = ImageDraw.Draw(layer)
    steps = 60
    for i in range(steps, 0, -1):
        r = max(w, h) / 2 * (i / steps)
        a = int(max_alpha * (1 - i / steps) ** 1.6)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=a)
    blob = Image.new("RGBA", (w, h), color + (0,))
    blob.putalpha(layer)
    return blob


def rounded_gradient_rect(draw_target_size, radius, c1, c2):
    w, h = draw_target_size
    grad = vertical_gradient((w, h), c1, c2)
    # diagonal feel: overlay horizontal gradient
    horiz = vertical_gradient((h, w), c2, c1).rotate(90, expand=True)
    grad = Image.blend(grad, horiz, 0.5)
    mask = Image.new("L", (w, h), 0)
    m = ImageDraw.Draw(mask)
    m.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out


def text_w(draw, s, font):
    b = draw.textbbox((0, 0), s, font=font)
    return b[2] - b[0]


# ---- compose ----------------------------------------------------------------
img = vertical_gradient((W, H), BG_TOP, BG_BOT).convert("RGBA")

# dot grid (very subtle, upper-right area)
dots = Image.new("RGBA", (W, H), (0, 0, 0, 0))
dd = ImageDraw.Draw(dots)
for gy in range(40, H, 42):
    for gx in range(560, W, 42):
        dd.ellipse([gx, gy, gx + 3, gy + 3], fill=(255, 255, 255, 14))
img = Image.alpha_composite(img, dots)

# ambient glows
glow_v = radial_glow((700, 700), VIOLET, 66)
img = Image.alpha_composite(img, Image.new("RGBA", (W, H), (0, 0, 0, 0)))
img.alpha_composite(glow_v, (-260, -320))
glow_o = radial_glow((620, 620), ORANGE, 44)
img.alpha_composite(glow_o, (W - 430, H - 360))

draw = ImageDraw.Draw(img)

MARGIN_X = 84

# ---- logo mark (rounded gradient tile + "P" + small square, like logo.svg) --
TILE = 104
tile = rounded_gradient_rect((TILE, TILE), 30, VIOLET, ORANGE)
td = ImageDraw.Draw(tile)
pb = td.textbbox((0, 0), "P", font=f_logo_p)
td.text((TILE / 2 - (pb[2] - pb[0]) / 2 - pb[0], TILE / 2 - (pb[3] - pb[1]) / 2 - pb[1] - 6),
        "P", font=f_logo_p, fill=WHITE)
td.rounded_rectangle([TILE - 34, TILE - 34, TILE - 16, TILE - 16], radius=5, fill=(255, 255, 255, 242))
img.alpha_composite(tile, (MARGIN_X, 64))

# ---- wordmark + tagline ------------------------------------------------------
logo_cx = MARGIN_X + TILE + 34
wm_y = 64 + TILE / 2
b = draw.textbbox((0, 0), "PixKitApp", font=f_wordmark)
draw.text((logo_cx, wm_y - (b[3] - b[1]) / 2 - b[1] - 8), "PixKitApp", font=f_wordmark, fill=WHITE)

draw.text((MARGIN_X, 232), "127 Free Online Image Tools", font=f_tagline, fill=WHITE)
draw.text((MARGIN_X, 306),
          "Compress, resize, crop, convert and more.",
          font=f_sub, fill=MUTED)
draw.text((MARGIN_X, 348),
          "Private by design — nothing is ever uploaded.",
          font=f_sub, fill=MUTED)

# ---- right-side visual: photo cards with baked-in glyph ----------------------
card_w, card_h = 330, 240
card1 = rounded_gradient_rect((card_w, card_h), 26, (124, 58, 237), (59, 130, 246))
card2 = rounded_gradient_rect((card_w, card_h), 26, (249, 115, 22), (236, 72, 153))

# draw the "image" glyph onto card2 BEFORE rotating (keeps alignment)
cd = ImageDraw.Draw(card2)
cd.ellipse([card_w - 64, 22, card_w - 28, 58], fill=(255, 255, 255, 215))
cd.polygon([(30, 200), (108, 100), (180, 200)], fill=(255, 255, 255, 228))
cd.polygon([(138, 200), (200, 128), (270, 200)], fill=(255, 255, 255, 185))
# subtle white frame lines on card1
c1d = ImageDraw.Draw(card1)
c1d.rounded_rectangle([22, 22, card_w - 22, card_h - 22], radius=16, outline=(255, 255, 255, 70), width=3)

c1 = card1.rotate(-7, expand=True, resample=Image.BICUBIC)
c2 = card2.rotate(5, expand=True, resample=Image.BICUBIC)
img.alpha_composite(c1, (800, 96))
img.alpha_composite(c2, (838, 158))

# ---- tool chips --------------------------------------------------------------
chips = ["Compress", "Resize", "Crop", "Convert"]
chip_y, chip_h, gap, pad_x = 436, 50, 12, 22
cx = MARGIN_X
for label in chips:
    tw = text_w(draw, label, f_chip)
    box = [cx, chip_y, cx + tw + pad_x * 2, chip_y + chip_h]
    draw.rounded_rectangle(box, radius=25, fill=(255, 255, 255, 16), outline=(255, 255, 255, 46), width=2)
    draw.text((cx + pad_x, chip_y + (chip_h - 30) / 2 - 2), label, font=f_chip, fill=MUTED)
    cx = box[2] + gap

# compression stat pill (flagship tool result, real numbers from testing).
# No percentage claim: a measured example stays honest without implying a
# guaranteed reduction rate.
pill_w, pill_h = 320, 88
pill_x, pill_y = 846, 474
draw.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=20,
                       fill=(18, 14, 28, 235), outline=(255, 255, 255, 60), width=2)
draw.text((pill_x + 24, pill_y + 10), "1.3 MB → 57 KB", font=f_stat, fill=WHITE)
draw.text((pill_x + 24, pill_y + 52), "100% private · no upload", font=f_stat_small, fill=FAINT)

# ---- footer url ----------------------------------------------------------------
draw.text((MARGIN_X, 552), "www.pixkitapp.online", font=f_url, fill=FAINT)

# subtle top hairline gradient strip (brand)
strip = vertical_gradient((W, 6), VIOLET, ORANGE).convert("RGBA")
img.alpha_composite(strip, (0, 0))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
final = img.convert("RGB")
final.save(OUT, "PNG", optimize=True)
print("saved", os.path.abspath(OUT), final.size,
      f"{os.path.getsize(os.path.abspath(OUT)) / 1024:.0f} KB")
