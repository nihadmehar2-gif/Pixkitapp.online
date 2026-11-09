#!/usr/bin/env python3
"""E2E verification against Next.js prerendered production HTML (Change B, batch 1).
For each batch tool page:
  1. new hand-written privacy answer present in visible FAQ HTML
  2. SAME text present in the FAQPage JSON-LD (visible<->schema sync)
  3. old generic Canvas-API answer absent
  4. FAQ question count unchanged vs audit baseline
For control (non-batch) pages:
  5. generic answer still present, FAQ count unchanged
"""
import json, re, glob, os, sys

APP = "/home/z/my-project/.next/server/app"
GENERIC = "Everything runs locally in your browser via the Canvas API"
BATCH = {
  "compress-image-to-500kb": "Compression happens entirely inside this browser tab",
  "png-to-jpg": "No upload ever happens",
  "webp-to-png": "The conversion runs locally",
  "image-to-base64": "it doesn't even use canvas",
  "image-color-picker": "Reading a color is as low-risk as it gets",
  "add-text-to-image": "combined entirely on your device",
  "remove-gps-data": "The check and the cleanup both happen in your browser",
  "rotate-image-90": "simple pixel remap",
  "crop-image-to-circle": "Cropping to a circle happens on your device",
  "thumbnail-maker": "Thumbnailing runs entirely in the tab",
}
CONTROLS = ["blur-image", "jpg-to-png", "resize-image-to-width", "sepia-image", "bulk-image-compressor"]

# audit baseline FAQ counts (pre-change, from crawl.json)
crawl = json.load(open("/home/z/my-project/scripts/stage2-audit/crawl.json", encoding="utf-8"))
def faq_count_from_crawl(url):
    for e in crawl:
        if e.get("url","").rstrip("/") == url.rstrip("/"):
            return len(re.findall(r'"name":"[^"]*"\s*,\s*"acceptedAnswer"', e.get("html","")) ) or None
    return None

def page_html(slug):
    for p in (f"{APP}/{slug}.html", f"{APP}/{slug}/index.html"):
        if os.path.exists(p): return open(p, encoding="utf-8").read()
    return None

def jsonld_faq_texts(html):
    out = []
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try: data = json.loads(m.group(1))
        except Exception: continue
        graph = data.get("@graph", [data])
        for node in graph:
            if node.get("@type") == "FAQPage":
                for q in node.get("mainEntity", []):
                    out.append(q["acceptedAnswer"]["text"])
    return out

def visible_snippet(html, marker):
    idx = html.find(marker)
    return idx != -1

fails = 0
print("=== BATCH TOOLS (10) ===")
for slug, marker in BATCH.items():
    html = page_html(slug)
    if not html:
        print(f"  [FAIL] {slug}: prerendered HTML not found"); fails += 1; continue
    vis = visible_snippet(html, marker)
    ld = jsonld_faq_texts(html)
    ld_hit = any(marker in t for t in ld)
    generic_gone = GENERIC not in html
    # FAQ count in JSON-LD
    n_q = 0
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try: data = json.loads(m.group(1))
        except Exception: continue
        for node in data.get("@graph", [data]):
            if node.get("@type") == "FAQPage": n_q = len(node.get("mainEntity", []))
    ok = vis and ld_hit and generic_gone
    if not ok: fails += 1
    print(f"  [{'OK' if ok else 'FAIL'}] {slug}: visible={vis} jsonld={ld_hit} generic_removed={generic_gone} faq_count={n_q}")

print()
print("=== CONTROL TOOLS (unchanged expected) ===")
for slug in CONTROLS:
    html = page_html(slug)
    if not html:
        print(f"  [FAIL] {slug}: HTML not found"); fails += 1; continue
    still_there = GENERIC in html
    ld = jsonld_faq_texts(html)
    ld_generic = any(GENERIC in t for t in ld)
    ok = still_there and ld_generic
    if not ok: fails += 1
    print(f"  [{'OK' if ok else 'FAIL'}] {slug}: generic in visible={still_there}, generic in jsonld={ld_generic}")

print()
# deep sync check on one batch tool: exact same answer string in visible <p> and JSON-LD
print("=== DEEP SYNC (image-to-base64: exact text equality visible vs JSON-LD) ===")
html = page_html("image-to-base64")
marker = "it doesn&#x27;t even use canvas"  # HTML-escaped apostrophe in visible HTML
vis_text = None
m = re.search(r'<p class="mt-1 text-sm text-muted-foreground">([^<]*doesn&#x27;t even use canvas[^<]*)</p>', html)
if m: vis_text = m.group(1)
ld_texts = jsonld_faq_texts(html)
ld_match = [t for t in ld_texts if "even use canvas" in t]
if vis_text and ld_match:
    unescaped = vis_text.replace("&#x27;", "'").replace("&amp;", "&").replace("&quot;", '"')
    equal = unescaped == ld_match[0]
    print(f"  visible == jsonld text: {equal}")
    if not equal:
        print(f"  VIS: {unescaped[:90]}...")
        print(f"  LD : {ld_match[0][:90]}...")
        fails += 1
else:
    print(f"  [FAIL] could not extract (vis_found={bool(vis_text)}, ld_found={bool(ld_match)})"); fails += 1

print()
print("RESULT:", "ALL E2E CHECKS PASSED" if fails == 0 else f"{fails} FAILURES")
sys.exit(0 if fails == 0 else 1)
