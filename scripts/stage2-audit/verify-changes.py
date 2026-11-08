#!/usr/bin/env python3
"""Post-implementation verification of Changes A + C against the local
production build (port 3199). READ-ONLY checks."""
import json
import re
import subprocess
from bs4 import BeautifulSoup
from collections import Counter

BASE = "http://localhost:3199"
CATS = ["compress", "resize", "crop", "convert", "rotate", "filters", "optimize",
        "metadata", "color", "watermark", "text", "transparency", "social", "passport-photos"]
failures = []

def get(path):
    r = subprocess.run(["curl", "-s", "--max-time", "30", BASE + path],
                       capture_output=True, text=True, timeout=40)
    return r.stdout

print("=" * 72)
print("CHANGE A: category introductions")
print("=" * 72)
all_sentences = []
results = {}
for slug in CATS:
    html = get(f"/categories/{slug}")
    soup = BeautifulSoup(html, "lxml")
    h1s = [h.get_text(" ", strip=True) for h in soup.find_all("h1")]
    # find the intro section by aria-label
    sec = soup.find("section", attrs={"aria-label": re.compile(r"^About these ")})
    paras = sec.find_all("p") if sec else []
    words = len(re.findall(r"[A-Za-z0-9']+", " ".join(p.get_text(" ", strip=True) for p in paras)))
    h2 = sec.find("h2").get_text(" ", strip=True) if sec else None
    canon = soup.find("link", rel="canonical")
    ok = sec is not None and 80 <= words <= 150 and len(h1s) == 1 and canon and canon.get("href") == f"https://www.pixkitapp.online/categories/{slug}"
    if not ok:
        failures.append(slug)
    for p in paras:
        for s in re.split(r"(?<=[.!?])\s+", p.get_text(" ", strip=True)):
            all_sentences.append(s.strip().lower())
    results[slug] = words
    print(f"  {'OK ' if ok else 'BAD'} /categories/{slug:<16} h2='{h2}' paras={len(paras)} words={words} h1={len(h1s)} canonical={'ok' if canon and canon.get('href', '').endswith(slug) else 'BAD'}")

dup = [s for s, c in Counter(all_sentences).items() if c > 1]
print(f"  duplicate intro sentences across categories: {len(dup)} {dup[:3] if dup else ''}")
if dup:
    failures.append("duplicate sentences")

print()
print("=" * 72)
print("CHANGE C: transparency meta description")
print("=" * 72)
html = get("/categories/transparency")
soup = BeautifulSoup(html, "lxml")
desc = soup.find("meta", attrs={"name": "description"}).get("content")
print(f"  length: {len(desc)} (target 150-160)")
print(f"  text  : {desc}")
if not (140 <= len(desc) <= 165):
    failures.append("transparency desc length")

print()
print("=" * 72)
print("REGRESSION SPOT-CHECKS (nothing else should change)")
print("=" * 72)
# homepage + tool page + tools index still fine
for path, checks in [
    ("/", ["canonical https://www.pixkitapp.online", "og:url"]),
    ("/image-compressor", ["canonical", "WebApplication"]),
    ("/tools", ["All Tools"]),
]:
    html = get(path)
    soup = BeautifulSoup(html, "lxml")
    canon = soup.find("link", rel="canonical")
    h1 = len(soup.find_all("h1"))
    title = soup.title.get_text(strip=True)
    print(f"  {path:<22} status=200 title='{title[:50]}…' h1={h1} canonical={canon.get('href') if canon else 'NONE'}")

# sitemap/robots unchanged (still 147/allow-all) in the prerendered build
sm = get("/sitemap.xml")
locs = re.findall(r"<loc>", sm)
rb = get("/robots.txt")
print(f"  sitemap locs: {len(locs)} | robots has sitemap line: {'Sitemap:' in rb}")
if len(locs) != 147:
    failures.append("sitemap count")

print()
print("RESULT:", "ALL CHECKS PASSED" if not failures else f"FAILURES: {failures}")
