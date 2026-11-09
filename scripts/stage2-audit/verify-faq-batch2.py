#!/usr/bin/env python3
"""E2E verification for Change B batch 2 + GPS correction + batch 1 stability.
Reads Next.js prerendered production HTML. Checks:
  batch-2 tools (10): new answer in visible FAQ + JSON-LD, generic removed
  batch-1 tools (10 spot: all still correct)
  GPS correction page (/remove-image-metadata): corrected comparison answer in visible + JSON-LD
  controls: unchanged
"""
import json, re, os, sys

APP = sys.argv[1] if len(sys.argv) > 1 else "/tmp/faqb-review/.next/server/app"
GENERIC = "Everything runs locally in your browser via the Canvas API"
BATCH2 = {
  "compress-jpeg-image": "The trade-off between size and quality",
  "bmp-to-jpg": "Old-school BMP files are decoded",
  "gif-to-webp": "Conversion happens locally",
  "image-dominant-color": "pure read-and-analyze job",
  "add-logo-watermark": "Both files stay on your side",
  "meme-generator": "Meme text is composited entirely",
  "enlarge-image": "Upscaling runs on your device",
  "flip-image-horizontal": "Mirroring is a pure pixel remap",
  "round-corners-image": "Rounding corners is done with a clipping path",
  "optimize-jpg-for-web": "Web optimization is a local re-encode",
}
BATCH1 = {
  "compress-image-to-500kb": "Compression happens entirely inside this browser tab",
  "png-to-jpg": "No upload ever happens",
  "webp-to-png": "The conversion runs locally",
  "image-to-base64": "even use canvas",
  "image-color-picker": "Reading a color is as low-risk",
  "add-text-to-image": "combined entirely on your device",
  "remove-gps-data": "The check and the cleanup both happen in your browser",
  "rotate-image-90": "simple pixel remap",
  "crop-image-to-circle": "Cropping to a circle happens on your device",
  "thumbnail-maker": "Thumbnailing runs entirely in the tab",
}
CONTROLS = ["blur-image", "jpg-to-webp", "resize-image-to-width", "bulk-watermark", "threshold-image"]
GPS_PAGE = ("remove-image-metadata", "the cleaned file comes out the same")
GPS_BAD = "keeps the rest of the metadata"

def page_html(slug):
    for p in (f"{APP}/{slug}.html", f"{APP}/{slug}/index.html"):
        if os.path.exists(p): return open(p, encoding="utf-8").read()
    return None

def jsonld_faq_texts(html):
    out = []
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try: data = json.loads(m.group(1))
        except Exception: continue
        for node in data.get("@graph", [data]):
            if node.get("@type") == "FAQPage":
                for q in node.get("mainEntity", []):
                    out.append((q["name"], q["acceptedAnswer"]["text"]))
    return out

fails = 0
def check(label, slug, marker, generic_must_be_gone=True):
    global fails
    html = page_html(slug)
    if not html:
        print(f"  [FAIL] {slug}: HTML not found"); fails += 1; return
    vis = marker in html
    ld = any(marker in a for _, a in jsonld_faq_texts(html))
    gen_ok = (not generic_must_be_gone) or (GENERIC not in html)
    ok = vis and ld and gen_ok
    if not ok: fails += 1
    print(f"  [{'OK' if ok else 'FAIL'}] {slug}: visible={vis} jsonld={ld} generic_removed={gen_ok}")

print("=== BATCH 2 (10) ===")
for slug, marker in BATCH2.items(): check("b2", slug, marker)
print()
print("=== CORRECTION 2 (/bmp-to-jpg: white flatten wording) ===")
html = page_html("bmp-to-jpg")
if html:
    white = "flattened onto white" in html
    old_gone = "the background color you pick" not in html
    ok = white and old_gone
    if not ok: fails += 1
    print(f"  [{'OK' if ok else 'FAIL'}] bmp-to-jpg: white wording={white} old 'background color you pick' removed={old_gone}")
else:
    print("  [FAIL] bmp-to-jpg: HTML not found"); fails += 1

print()
print("=== BATCH 1 stability (10) ===")
for slug, marker in BATCH1.items(): check("b1", slug, marker)
print()
print("=== GPS CORRECTION (/remove-image-metadata) ===")
slug, marker = GPS_PAGE
html = page_html(slug)
if html:
    vis = marker in html
    bad_gone = GPS_BAD not in html
    ld = any(marker in a for _, a in jsonld_faq_texts(html))
    ok = vis and ld and bad_gone
    if not ok: fails += 1
    print(f"  [{'OK' if ok else 'FAIL'}] {slug}: corrected visible={vis} jsonld={ld} old-claim-removed={bad_gone}")
else:
    print(f"  [FAIL] {slug}: HTML not found"); fails += 1
print()
print("=== CONTROLS (unchanged) ===")
for slug in CONTROLS:
    html = page_html(slug)
    if not html:
        print(f"  [FAIL] {slug}: HTML not found"); fails += 1; continue
    still = GENERIC in html
    ld_still = any(GENERIC in a for _, a in jsonld_faq_texts(html))
    ok = still and ld_still
    if not ok: fails += 1
    print(f"  [{'OK' if ok else 'FAIL'}] {slug}: generic in visible={still} jsonld={ld_still}")

print()
print("RESULT:", "ALL E2E CHECKS PASSED" if fails == 0 else f"{fails} FAILURES")
sys.exit(0 if fails == 0 else 1)
