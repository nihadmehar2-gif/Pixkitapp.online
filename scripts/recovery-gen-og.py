#!/usr/bin/env python3
"""Generate per-page Open Graph images (1200x630) in the site's brand style.

Outputs (all under public/):
  og/tools/<slug>.png       — 127 tool pages   (title = tool h1)
  og/categories/<slug>.png  — 14 category pages
  og/blog/index.png         — /blog index
  og/blog/<slug>.png        — 8 published guides

Visual language mirrors scripts/gen-og-image.py: dark vertical gradient,
violet->orange ambient glows, DejaVu Sans Bold, small PixKitApp wordmark,
content chip, big wrapped title, URL at the bottom.

The tool/category/blog registries are parsed from the TypeScript sources so
the images can never drift from what the pages actually render.
"""
import re, glob, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = "/home/z/my-project/recovery-wt"
OUT = os.path.join(ROOT, "public")

W, H = 1200, 630
BG_TOP = (26, 22, 37)
BG_BOT = (20, 16, 30)
VIOLET = (168, 85, 247)
ORANGE = (249, 115, 22)
WHITE = (255, 255, 255)
MUTED = (203, 213, 225)
FAINT = (148, 163, 184)

BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

f_wordmark = ImageFont.truetype(BOLD, 34)
f_chip = ImageFont.truetype(REG, 24)
f_title_big = ImageFont.truetype(BOLD, 64)
f_title_med = ImageFont.truetype(BOLD, 54)
f_title_small = ImageFont.truetype(BOLD, 44)
f_url = ImageFont.truetype(BOLD, 26)


def vertical_gradient(size, top, bottom):
    w, h = size
    base = Image.new("RGB", (1, h))
    px = base.load()
    for y in range(h):
        t = y / (h - 1)
        px[0, y] = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    return base.resize((w, h))


def radial_glow(size, color, max_alpha, cx_f=0.5, cy_f=0.42):
    w, h = size
    layer = Image.new("L", (w, h), 0)
    cx, cy = w * cx_f, h * cy_f
    d = ImageDraw.Draw(layer)
    steps = 60
    for i in range(steps, 0, -1):
        r = max(w, h) / 2 * (i / steps)
        a = int(max_alpha * (1 - i / steps) ** 1.6)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=a)
    blob = Image.new("RGBA", (w, h), color + (0,))
    blob.putalpha(layer)
    return blob


def wrap(text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if font.getbbox(t)[2] <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


def make_image(path, title, chip, url_label="www.pixkitapp.online"):
    img = vertical_gradient((W, H), BG_TOP, BG_BOT).convert("RGBA")
    img.alpha_composite(radial_glow((W, H), VIOLET, 110, 0.18, 0.2))
    img.alpha_composite(radial_glow((W, H), ORANGE, 80, 0.86, 0.85))
    d = ImageDraw.Draw(img)

    # wordmark
    d.text((64, 44), "PixKitApp", font=f_wordmark, fill=WHITE)

    # chip
    if chip:
        bbox = f_chip.getbbox(chip)
        cw = bbox[2] - bbox[0] + 36
        ch = 44
        x0, y0 = 64, 104
        d.rounded_rectangle([x0, y0, x0 + cw, y0 + ch], radius=22, fill=(255, 255, 255, 18), outline=(255, 255, 255, 60), width=1)
        tb = f_chip.getbbox(chip)
        d.text((x0 + 18, y0 + (ch - (tb[3] - tb[1])) // 2 - tb[1]), chip, font=f_chip, fill=MUTED)

    # title (pick font size by wrapped line count)
    lines = wrap(title, f_title_big, W - 128)
    font = f_title_big
    if len(lines) > 3:
        lines = wrap(title, f_title_med, W - 128)
        font = f_title_med
    if len(lines) > 3:
        lines = wrap(title, f_title_small, W - 128)
        font = f_title_small
    if len(lines) > 4:
        lines = lines[:4]
        lines[-1] = lines[-1].rstrip(" .,;") + "…"

    # vertical placement: after chip, centered in remaining space above URL
    top = 200 if chip else 170
    line_h = font.size + 14
    block_h = line_h * len(lines)
    y = top + max(0, (H - 120 - top - block_h) // 2) - 40
    y = max(y, top)
    for ln in lines:
        d.text((64, y), ln, font=font, fill=WHITE)
        y += line_h

    # URL bottom
    d.text((64, H - 84), url_label, font=f_url, fill=FAINT)
    d.rounded_rectangle([64, H - 40, 64 + 8, H - 24], radius=4, fill=ORANGE)

    img.convert("RGB").save(path, "PNG", optimize=True)


def parse_tools():
    tools = []
    for f in glob.glob(os.path.join(ROOT, "src/lib/tools/definitions/*.ts")):
        src = open(f, encoding="utf-8").read()
        # plain object literals: slug followed by h1 / name
        for m in re.finditer(r'slug:\s*"([a-z0-9-]+)"[\s\S]{0,400}?\n\s+h1:\s*"([^"]+)"', src):
            tools.append((m.group(1), m.group(2)))
        # factories: socialTool("slug", "name", "h1", ...
        for m in re.finditer(r'(?:socialTool|passportTool)\(\s*"([a-z0-9-]+)",\s*"([^"]+)",\s*"([^"]+)"', src):
            tools.append((m.group(1), m.group(3)))
    # dedupe, keep order
    seen, out = set(), []
    for s, t in tools:
        if s not in seen:
            seen.add(s)
            out.append((s, t))
    return out


def parse_categories():
    src = open(os.path.join(ROOT, "src/lib/tools/categories.ts"), encoding="utf-8").read()
    cats = re.findall(r'name:\s*"([^"]+)",\s*\n\s*slug:\s*"([a-z0-9-]+)",', src)
    return [(slug, name) for name, slug in cats]


def parse_posts():
    posts = []
    for f in ("posts-a.ts", "posts-b.ts"):
        src = open(os.path.join(ROOT, "src/lib/blog", f), encoding="utf-8").read()
        for m in re.finditer(r'slug:\s*"([a-z0-9-]+)",\s*\n\s*title:\s*"([^"]+)",', src):
            posts.append((m.group(1), m.group(2)))
    return posts


def main():
    os.makedirs(os.path.join(OUT, "og/tools"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "og/categories"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "og/blog"), exist_ok=True)

    tools = parse_tools()
    cats = parse_categories()
    posts = parse_posts()
    print(f"parsed: {len(tools)} tools, {len(cats)} categories, {len(posts)} posts")

    for slug, h1 in tools:
        make_image(os.path.join(OUT, f"og/tools/{slug}.png"), h1, "Free browser-based tool")
    for slug, name in cats:
        make_image(os.path.join(OUT, f"og/categories/{slug}.png"), f"{name} Tools", "PixKitApp tool category")
    for slug, title in posts:
        make_image(os.path.join(OUT, f"og/blog/{slug}.png"), title, "PixKitApp guide")
    make_image(os.path.join(OUT, "og/blog/index.png"), "Image Guides & Practical Tutorials", "PixKitApp blog")

    print("done")


if __name__ == "__main__":
    main()
