#!/usr/bin/env python3
"""F3 internal-link validation suite (read-only crawler).

Validates, against a running build of the site:
  1. every sitemap URL returns HTTP 200;
  2. every tool page's "Related tools" section contains its expected cyclic
     sibling window (+-1, +-2 in registry order, self excluded) — the exact
     links F3 adds;
  3. every one of the 31 affected slugs (incoming-link floor identified by the
     October-vs-November reconciliation audit) now has >=7 raw incoming links;
  4. no internal link on any page is broken (all resolve 200).

Usage: python3 scripts/f3-link-validation.py --base http://localhost:3000 \
         --out scripts/seo-audit-data/f3-validation-after.json
GET requests only; modifies nothing.
"""
import argparse, json, re, sys, time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from bs4 import BeautifulSoup

UA = {"User-Agent": "Mozilla/5.0 (compatible; PixKitSEOAudit/1.0; read-only audit)"}
TIMEOUT = 30

# Category -> tool slugs in registry (definition-file) order. Must match
# src/lib/tools/definitions/*.ts exactly; order defines the cyclic window.
CATEGORY_ORDER = {
    "compression": ["image-compressor","compress-png-image","compress-jpeg-image","compress-webp-image","compress-image-to-50kb","compress-image-to-100kb","compress-image-to-200kb","compress-image-to-500kb","compress-image-to-specific-size","near-lossless-image-compressor","bulk-image-compressor"],
    "optimization": ["image-optimizer","optimize-image-for-web","optimize-png-for-web","optimize-jpg-for-web","favicon-generator","email-image-resizer","image-size-reducer"],
    "resizing": ["image-resizer","resize-image-by-percentage","resize-image-to-width","resize-image-to-height","resize-image-to-dimensions","resize-image-to-kb","resize-png-image","resize-jpg-image","resize-webp-image","enlarge-image","thumbnail-maker"],
    "cropping": ["crop-image","crop-image-to-square","crop-image-to-circle","crop-image-16-9","crop-image-9-16","crop-image-4-3","crop-image-3-2","crop-borders-auto"],
    "conversion": ["webp-to-jpg","webp-to-png","jpg-to-png","png-to-jpg","png-to-webp","jpg-to-webp","gif-to-png","gif-to-webp","bmp-to-jpg","bmp-to-png","jpg-to-bmp","png-to-bmp","avif-to-jpg","avif-to-png","image-to-pdf","image-to-ico","image-to-base64","base64-to-image","svg-to-png","image-format-converter"],
    "rotation": ["rotate-image","rotate-image-90","rotate-image-180","rotate-image-270","flip-image-horizontal","flip-image-vertical","straighten-image"],
    "filters": ["grayscale-image","sepia-image","invert-image-colors","blur-image","sharpen-image","brightness-adjuster","contrast-adjuster","saturation-adjuster","hue-rotate-image","vintage-filter","posterize-image","pixelate-image","duotone-image","film-grain-effect","vignette-effect"],
    "color": ["image-color-picker","image-color-palette","image-dominant-color","image-average-color","replace-color-in-image","remove-color-from-image","image-color-temperature","threshold-image","swap-color-channels"],
    "metadata": ["image-metadata-viewer","remove-image-metadata","remove-gps-data"],
    "watermarking": ["watermark-image","add-logo-watermark","tiled-watermark","date-watermark","bulk-watermark"],
    "text": ["add-text-to-image","add-caption-to-image","meme-generator","quote-card-maker","add-title-to-image"],
    "transparency": ["remove-white-background","make-image-transparent","add-white-background","add-background-color","round-corners-image","transparent-png-maker","png-drop-shadow"],
    "social": ["instagram-post-resizer","instagram-story-resizer","instagram-portrait-resizer","facebook-cover-resizer","facebook-profile-resizer","twitter-header-resizer","x-post-resizer","linkedin-banner-resizer","linkedin-post-resizer","youtube-thumbnail-resizer","youtube-banner-resizer","pinterest-pin-resizer"],
    "passport": ["passport-photo-maker","us-passport-photo","schengen-visa-photo","china-visa-photo","id-photo-1-inch","linkedin-profile-photo","photo-print-sheet"],
}

# The 31 affected slugs per the reconciliation audit (raw incoming <= 3 after
# the sitewide self-link removal; identical set to the audit's "4-link floor").
AFFECTED_31 = [
    "avif-to-jpg","avif-to-png","base64-to-image","bmp-to-jpg","brightness-adjuster",
    "compress-image-to-200kb","compress-image-to-500kb","contrast-adjuster","crop-image-3-2",
    "crop-image-4-3","enlarge-image","film-grain-effect","gif-to-webp","image-format-converter",
    "image-to-base64","jpg-to-bmp","jpg-to-webp","linkedin-post-resizer","near-lossless-image-compressor",
    "photo-print-sheet","pinterest-pin-resizer","pixelate-image","png-to-bmp","straighten-image",
    "svg-to-png","swap-color-channels","threshold-image","twitter-header-resizer","vintage-filter",
    "x-post-resizer","youtube-banner-resizer",
]


def expected_window(slug):
    """Cyclic sibling window (+-1, +-2, self excluded) — mirrors page.tsx."""
    for cat, slugs in CATEGORY_ORDER.items():
        if slug in slugs:
            i, n = slugs.index(slug), len(slugs)
            out = []
            for off in (-2, -1, 1, 2):
                t = slugs[(i + off + n) % n]
                if t != slug and t not in out:
                    out.append(t)
            return cat, out
    raise KeyError(slug)


def fetch(url):
    try:
        r = requests.get(url, headers=UA, timeout=TIMEOUT, allow_redirects=True)
        return r.status_code, r.text
    except Exception as e:
        return None, f"ERROR {type(e).__name__}: {e}"


def crawl_page(base, path):
    status, html = fetch(base + path)
    rec = {"path": path, "status": status}
    if status != 200 or not html:
        rec["links"] = []
        return rec
    soup = BeautifulSoup(html, "html.parser")
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("//"):
            continue
        if href.startswith("/"):
            links.append(href.split("#")[0].split("?")[0])
        elif href.startswith(base):
            links.append(href[len(base):].split("#")[0].split("?")[0])
    rec["links"] = links
    # Extract the Related-tools section only: the h2 whose text starts with
    # "Related tools", then every internal link inside its parent section.
    rel = []
    for h2 in soup.find_all("h2"):
        if h2.get_text(" ", strip=True).lower().startswith("related tools"):
            sec = h2.find_parent("section") or h2.parent
            for a in sec.find_all("a", href=True):
                href = a["href"].split("#")[0].split("?")[0]
                if href.startswith("/"):
                    rel.append(href)
                elif href.startswith(base):
                    rel.append(href[len(base):])
            break
    rec["related_section"] = [x for x in rel if x != "/tools"]
    return rec


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    ap.add_argument("--out", default="scripts/seo-audit-data/f3-validation.json")
    args = ap.parse_args()
    base = args.base.rstrip("/")

    _, sm = fetch(base + "/sitemap.xml")
    urls = re.findall(r"<loc>\s*([^<]+?)\s*</loc>", sm)
    paths = [u.replace("https://www.pixkitapp.online", "") or "/" for u in urls]
    print(f"sitemap URLs: {len(paths)}")

    results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(crawl_page, base, p): p for p in paths}
        for f in as_completed(futs):
            results.append(f.result())
    results.sort(key=lambda r: r["path"])

    pathmap = {r["path"]: set(r["links"]) for r in results if r["status"] == 200}
    tool_slugs = {s for slugs in CATEGORY_ORDER.values() for s in slugs}
    tool_paths = {f"/{s}" for s in tool_slugs}

    # --- check 1: status
    bad_status = [r["path"] for r in results if r["status"] != 200]

    # --- check 2: expected cyclic window present in Related-tools section
    window_fail = {}
    for s in tool_slugs:
        cat, win = expected_window(s)
        got = set(next(r for r in results if r["path"] == f"/{s}")["related_section"])
        missing = [w for w in win if f"/{w}" not in got]
        if missing:
            window_fail[s] = missing

    # --- check 3: incoming counts for all tools + affected >= 7
    inc = Counter()
    for src, links in pathmap.items():
        for l in links:
            if l in tool_paths and l != src:
                inc[l] += 1
    incoming = {f"/{s}": inc.get(f"/{s}", 0) for s in sorted(tool_slugs)}
    floor_fail = {p: c for p, c in incoming.items() if p.lstrip("/") in AFFECTED_31 and c < 7}

    # --- check 4: broken internal links
    broken = {}
    for src, links in pathmap.items():
        dead = sorted({l for l in links if l not in pathmap})
        if dead:
            broken[src] = dead

    ok = not (bad_status or window_fail or floor_fail or broken)
    report = {
        "base": base,
        "ok": ok,
        "pages": len(results),
        "bad_status": bad_status,
        "window_missing": window_fail,
        "incoming_floor_failures": floor_fail,
        "broken_internal_links": broken,
        "incoming_by_tool": incoming,
        "affected31_incoming": {f"/{s}": incoming[f"/{s}"] for s in AFFECTED_31},
    }
    with open(args.out, "w") as f:
        json.dump(report, f, indent=1)
    print(f"bad_status={len(bad_status)} window_fail={len(window_fail)} "
          f"floor_fail={len(floor_fail)} broken={len(broken)}")
    print(f"AFFECTED-31 incoming: min={min(report['affected31_incoming'].values())} "
          f"max={max(report['affected31_incoming'].values())}")
    print("RESULT:", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
