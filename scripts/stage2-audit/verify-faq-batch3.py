#!/usr/bin/env python3
"""E2E verification for Change B batch 3 (+ corrections + batch 2 stability).
Reads Next.js prerendered production HTML from a linked worktree build.
Checks:
  batch-3 tools (10): new answer in visible FAQ + JSON-LD, generic removed
  batch-2 stability (10): previous answers still correct
  corrections: /image-to-base64 File API wording (FileReader gone),
               /bmp-to-jpg white flatten wording (old phrase gone)
  controls: 5 untouched pages still show the generic answer
Usage: python3 verify-faq-batch3.py [path/to/.next/server/app]
"""
import json, re, os, sys

APP = sys.argv[1] if len(sys.argv) > 1 else "/tmp/faqb-review/.next/server/app"
GENERIC = "Everything runs locally in your browser via the Canvas API"
BATCH3 = {
  "add-background-color": "Compositing happens entirely in your browser",
  "add-caption-to-image": "Your caption is rendered on your device",
  "add-title-to-image": "Title rendering is fully local",
  "add-white-background": "Flattening onto white runs entirely in this tab",
  "avif-to-jpg": "a local decode-and-re-encode",
  "avif-to-png": "Decoding happens in your browser and nothing leaves it",
  "base64-to-image": "pure text processing in your browser",
  "blur-image": "Blurring runs on your device",
  "bmp-to-png": "The conversion happens entirely in your browser",
  "brightness-adjuster": "GPU-accelerated filter pipeline",
}
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
CONTROLS = ["jpg-to-png", "resize-image-to-width", "bulk-watermark", "threshold-image", "grayscale-image"]

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
def check(slug, marker, generic_must_be_gone=True):
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

print("=== BATCH 3 (10) ===")
for slug, marker in BATCH3.items(): check(slug, marker)
print()
print("=== BATCH 2 stability (10) ===")
for slug, marker in BATCH2.items(): check(slug, marker)
print()
print("=== CORRECTION 1 (/image-to-base64: File API wording, FileReader gone) ===")
html = page_html("image-to-base64")
if html:
    api_vis = "file.arrayBuffer()" in html
    api_ld = any("file.arrayBuffer()" in a for _, a in jsonld_faq_texts(html))
    fr_gone = "FileReader" not in html
    ok = api_vis and api_ld and fr_gone
    if not ok: fails += 1
    print(f"  [{'OK' if ok else 'FAIL'}] image-to-base64: visible={api_vis} jsonld={api_ld} FileReader_removed={fr_gone}")
else:
    print("  [FAIL] image-to-base64: HTML not found"); fails += 1
print()
print("=== CORRECTION 2 (/bmp-to-jpg: white flatten wording) ===")
html = page_html("bmp-to-jpg")
if html:
    white_vis = "flattened onto white" in html
    white_ld = any("flattened onto white" in a for _, a in jsonld_faq_texts(html))
    old_gone = "the background color you pick" not in html
    ok = white_vis and white_ld and old_gone
    if not ok: fails += 1
    print(f"  [{'OK' if ok else 'FAIL'}] bmp-to-jpg: white visible={white_vis} jsonld={white_ld} old_phrase_removed={old_gone}")
else:
    print("  [FAIL] bmp-to-jpg: HTML not found"); fails += 1
print()
print("=== CONTROLS (unchanged expected) ===")
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
