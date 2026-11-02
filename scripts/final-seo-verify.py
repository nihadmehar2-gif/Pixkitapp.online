#!/usr/bin/env python3
"""Final SEO validation (Phase 26) against the local standalone prod server.

Checks:
1. Every sitemap URL returns 200 (no redirects, no 404s).
2. Every indexed page's <link rel=canonical> matches its sitemap URL.
3. Every indexed page is indexable (no noindex) and has exactly one H1.
4. Internal links on homepage + a tool page + a category page all resolve 200.
5. No old-domain / localhost / vercel.app references in any fetched HTML.
"""
import re
import sys
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

BASE = "http://127.0.0.1:3100"
HOST = "www.pixkitapp.online"
HEADERS = {"Host": HOST, "X-Forwarded-Proto": "https"}

def fetch(path: str):
    req = Request(BASE + path, headers=HEADERS)
    try:
        with urlopen(req, timeout=20) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except Exception as e:  # HTTP errors raise
        code = getattr(e, "code", 0)
        body = ""
        try:
            body = e.read().decode("utf-8", "replace")[:500]
        except Exception:
            pass
        return code, body

problems = []

# --- 1+2+3: sitemap sweep ------------------------------------------------
_, sm_xml = fetch("/sitemap.xml")
root = ET.fromstring(sm_xml)
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
locs = [e.text.strip() for e in root.findall(".//s:loc", ns)]
print(f"sitemap URLs: {len(locs)}")

seen = set()
for loc in locs:
    if loc in seen:
        problems.append(f"DUPLICATE in sitemap: {loc}")
    seen.add(loc)
    path = urlsplit(loc).path or "/"
    status, html = fetch(path)
    if status != 200:
        problems.append(f"SITEMAP URL {loc} -> HTTP {status}")
        continue
    m = re.search(r'<link rel="canonical" href="([^"]+)"', html)
    canon = m.group(1) if m else None
    if canon != loc:
        problems.append(f"CANONICAL MISMATCH {loc}: canonical={canon}")
    if re.search(r'<meta name="robots" content="[^"]*noindex', html):
        problems.append(f"NOINDEX on sitemap URL {loc}")
    h1s = re.findall(r"<h1[\s>]", html)
    if len(h1s) != 1:
        problems.append(f"H1 COUNT {len(h1s)} on {loc}")
    for bad in ("pixkitapp.com/", "//pixkitapp.com", "localhost:", "vercel.app", "http://pixkitapp"):
        if bad in html:
            problems.append(f"BAD REFERENCE '{bad}' in {loc}")

# --- 4: internal links ---------------------------------------------------
def links(html):
    hrefs = set(re.findall(r'href="(/[^"#]*)"', html))
    return {h for h in hrefs if not h.startswith("//")}

pages = ["/", "/image-compressor", "/categories/compress", "/tools", "/about"]
all_links = set()
for p in pages:
    _, html = fetch(p)
    all_links |= links(html)

broken = []
for h in sorted(all_links):
    status, _ = fetch(h)
    if status != 200:
        broken.append(f"{h} -> {status}")
if broken:
    problems.append("BROKEN INTERNAL LINKS: " + "; ".join(broken))
print(f"internal links checked: {len(all_links)}")

# --- 5: 404 sanity -------------------------------------------------------
s404, _ = fetch("/definitely-not-a-real-page-xyz")
if s404 != 404:
    problems.append(f"404 page returns {s404}, expected 404")
s404b, _ = fetch("/fake-tool-slug-123")
if s404b != 404:
    problems.append(f"unknown tool slug returns {s404b}, expected 404")

print("\n" + ("=" * 60))
if problems:
    print(f"PROBLEMS FOUND ({len(problems)}):")
    for p in problems:
        print("  ✗", p)
    sys.exit(1)
print("ALL CHECKS PASS ✅  (sitemap, canonicals, robots, H1, links, 404)")
