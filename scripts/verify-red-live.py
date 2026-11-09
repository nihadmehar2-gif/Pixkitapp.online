#!/usr/bin/env python3
"""Post-deploy live verification for the iLovePDF-red redesign.
Checks: HTTP 200, FAQPage JSON-LD presence, canonical, generic-answer
control pages unchanged, brand red live, sitemap/robots healthy."""
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor

BASE = "https://www.pixkitapp.online"

# page -> distinctive tool-specific privacy ANSWER substring (from
# src/lib/tools/faq/faq-upgrades.ts, the deployed FAQ upgrade texts)
FAQ_PAGES = {
    "png-to-jpg": "flattened onto the background color you picked",
    "add-background-color": "Compositing happens entirely in your browser",
    "remove-gps-data": "EXIF parser reads the file locally and reports what it found",
    "compress-image-to-500kb": "re-encoded at progressively lower quality",
    "meme-generator": "captions are drawn together on a canvas in this tab",
    "base64-to-image": "is converted with a built-in JavaScript function",
}
CONTROL_PAGES = [  # generic-FAQ pages that must stay generic
    "grayscale-image", "jpg-to-png", "sepia-image", "threshold-image",
]
GENERIC_MARK = "Everything runs locally in your browser"
PRIV_MARK = "Is it safe to use"


def fetch(path: str) -> tuple[int, str]:
    r = subprocess.run(["curl", "-s", "-w", "\n%{http_code}", f"{BASE}{path}"],
                       capture_output=True, text=True, timeout=30)
    body, _, code = r.stdout.rpartition("\n")
    return int(code), body


def faq_first_question(html: str) -> str | None:
    for ld in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S):
        try:
            data = json.loads(ld)
        except Exception:
            continue
        for node in (data.get("@graph") or [data]):
            if node.get("@type") == "FAQPage":
                qs = node.get("mainEntity") or []
                return qs[0].get("name") if qs else None
    return None


fails: list[str] = []

def check_faq(slug: str, expected_answer: str):
    code, html = fetch(f"/{slug}")
    ld_all = " ".join(re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S))
    unescaped = ld_all.replace("&#x27;", "'").replace("&amp;", "&").replace('\\"', '"')
    q = faq_first_question(html)
    ok = code == 200 and expected_answer in unescaped and q is not None
    if not ok:
        fails.append(f"/{slug}: code={code} answer-live={expected_answer in unescaped}")
    return f"/{slug}: {'OK' if ok else 'FAIL'} (tool-specific privacy answer live)"

def check_control(slug: str):
    code, html = fetch(f"/{slug}")
    q = faq_first_question(html) or ""
    ok = code == 200 and GENERIC_MARK in html and not q.startswith(PRIV_MARK)
    if not ok:
        fails.append(f"/{slug}: code={code} generic-missing={GENERIC_MARK not in html}")
    return f"/{slug}: {'OK' if ok else 'FAIL'} (generic answer intact)"

def check_page(path: str):
    code, html = fetch(path)
    if path.endswith((".xml", ".txt")):  # non-HTML endpoints: no canonical
        if code != 200:
            fails.append(f"{path}: code={code}")
        return f"{path}: {'OK' if code == 200 else 'FAIL'}"
    canon_ok = True
    if path.startswith("/") and path != "/":
        canon_ok = f'href="{BASE}{path}"' in html
    if code != 200 or not canon_ok:
        fails.append(f"{path}: code={code} canon={canon_ok}")
    return f"{path}: {'OK' if code == 200 and canon_ok else 'FAIL'}"

with ThreadPoolExecutor(max_workers=8) as pool:
    results = list(pool.map(check_faq, FAQ_PAGES.keys(), FAQ_PAGES.values()))
    results += list(pool.map(check_control, CONTROL_PAGES))
    statics = ["/", "/tools", "/about", "/privacy", "/terms", "/contact",
               "/categories/convert", "/categories/compress",
               "/image-format-converter", "/crop-image-to-circle",
               "/sitemap.xml", "/robots.txt"]
    results += list(pool.map(check_page, statics))

for r in results:
    print(r)

# brand red live across ALL homepage CSS chunks
_, home = fetch("/")
chunks = re.findall(r'href="(/_next/static/chunks/[^"]+\.css)"', home)
red_live = any("e02e29" in fetch(c)[1] for c in chunks)
tan_live = any("d8b38a" in fetch(c)[1] for c in chunks)
print(f"brand-red-live: {'OK' if red_live and not tan_live else 'FAIL'} ({len(chunks)} chunks; red={red_live} tan={tan_live})")
if not (red_live and not tan_live):
    fails.append("brand red missing live")

smap_code, smap = fetch("/sitemap.xml")
urls = len(re.findall(r"<loc>", smap))
print(f"sitemap: {'OK' if smap_code == 200 and urls == 147 else 'FAIL'} ({urls} urls)")
robots_code, _ = fetch("/robots.txt")
print(f"robots: {'OK' if robots_code == 200 else 'FAIL'}")

print(f"\nTOTAL: {len(results)+3 - len(fails)} OK, {len(fails)} FAIL")
for f in fails:
    print("  FAIL:", f)
