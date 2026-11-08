#!/usr/bin/env python3
"""Read-only live SEO verification for pixkitapp.online (no changes made)."""
import json
import re
import subprocess
import sys

WWW = "https://www.pixkitapp.online"

def curl(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(["curl", *args], capture_output=True, text=True, timeout=60)

def header_line(url: str) -> str:
    """First status line + location header for a URL (no body)."""
    r = curl(["-sI", "-o", "/dev/null", "-w", "%{http_code} %{redirect_url}", url])
    return f"{r.stdout.strip()}  <- {url}"

print("=" * 72)
print("1. REDIRECT MATRIX (status + target)")
print("=" * 72)
for u in [
    "http://pixkitapp.online/",
    "https://pixkitapp.online/",
    "http://www.pixkitapp.online/",
    "https://pixkitapp.online/tools/image-compressor",
    f"{WWW}/about/",  # trailing slash probe
]:
    print(" ", header_line(u))

print()
print("=" * 72)
print("2. PRODUCTION PAGE HEAD TAGS (canonical / og:url / robots / title)")
print("=" * 72)
pages = [
    ("home", f"{WWW}/"),
    ("tool", f"{WWW}/image-compressor"),
    ("category", f"{WWW}/categories/compress"),
    ("tools index", f"{WWW}/tools"),
    ("tools search", f"{WWW}/tools?q=compress"),
    ("about", f"{WWW}/about"),
    ("404 probe", f"{WWW}/this-page-does-not-exist-xyz"),
]
for label, u in pages:
    r = curl(["-s", "-w", "\n%{http_code}", u])
    body, _, code = r.stdout.rpartition("\n")
    canon = re.findall(r'<link[^>]+rel="canonical"[^>]*>', body)
    ogurl = re.findall(r'<meta[^>]+property="og:url"[^>]*>', body)
    robots = re.findall(r'<meta[^>]+name="robots"[^>]*>', body)
    title = re.findall(r"<title>(.*?)</title>", body)
    hr = curl(["-sI", "-o", "/dev/null", "-w", "%header{x-robots-tag}"])
    xrob = hr.stdout.strip()
    print(f"\n  [{label}] {u} -> {code}  X-Robots-Tag={xrob or '(none)'}")
    for tag in canon:
        print(f"    CANONICAL : {tag}")
    for tag in ogurl:
        print(f"    OG:URL    : {tag}")
    for tag in robots:
        print(f"    ROBOTS    : {tag}")
    if title:
        print(f"    TITLE     : {title[0][:90]}")
    # count duplicates
    if len(canon) > 1:
        print(f"    !! DUPLICATE CANONICAL TAGS: {len(canon)}")

print()
print("=" * 72)
print("3. ROBOTS.TXT (live)")
print("=" * 72)
r = curl(["-s", f"{WWW}/robots.txt"])
print(r.stdout or "(empty)")

print()
print("=" * 72)
print("4. SITEMAP.XML (live) — counts + domain audit")
print("=" * 72)
r = curl(["-s", f"{WWW}/sitemap.xml"])
xml = r.stdout
locs = re.findall(r"<loc>(.*?)</loc>", xml)
print(f"  total <loc> entries: {len(locs)}")
non_www = [u for u in locs if not u.startswith(WWW)]
http = [u for u in locs if u.startswith("http://")]
slash = [u for u in locs if u != WWW and u.endswith("/")]
dupes = {u for u in locs if locs.count(u) > 1}
lastmod = re.findall(r"<lastmod>", xml)
print(f"  non-www URLs : {len(non_www)} {non_www[:3]}")
print(f"  http:// URLs : {len(http)}")
print(f"  trailing-slash URLs: {len(slash)}")
print(f"  duplicate URLs: {len(dupes)} {list(dupes)[:3]}")
print(f"  lastmod tags present: {len(lastmod)}")
print(f"  first 3: {locs[:3]}")
print(f"  last 2 : {locs[-2:]}")

print()
print("=" * 72)
print("5. HOMEPAGE JSON-LD URL AUDIT")
print("=" * 72)
r = curl(["-s", WWW])
blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', r.stdout, re.S)
print(f"  JSON-LD blocks on homepage: {len(blocks)}")
for b in blocks:
    try:
        data = json.loads(b)
        urls = re.findall(r"https?://[^\"]+", b)
        bad = [u for u in urls if "pixkitapp.online" in u and not u.startswith(WWW)]
        print(f"    types: {[n.get('@type') for n in data.get('@graph', [])]} | bad URLs: {bad or 'none'}")
    except Exception as e:
        print(f"    PARSE ERROR: {e}")

print()
print("=" * 72)
print("6. WWW HOST ROOT HEADERS (security/indexing)")
print("=" * 72)
r = curl(["-sI", WWW])
for line in r.stdout.splitlines():
    low = line.lower()
    if low.startswith(("http/", "x-robots-tag", "content-security-policy", "referrer-policy", "location")):
        print(f"  {line.strip()}")
print("\nDONE (read-only, nothing was changed)")
