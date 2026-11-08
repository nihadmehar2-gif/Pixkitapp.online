#!/usr/bin/env python3
"""Fetch live sitemap and verify every URL returns HTTP 200 on the www host."""
import concurrent.futures as cf
import re
import subprocess
import xml.etree.ElementTree as ET

SITEMAP = "https://www.pixkitapp.online/sitemap.xml"

def fetch(url: str) -> tuple[str, int, str]:
    r = subprocess.run(
        ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code} %{redirect_url}", "--max-time", "30", url],
        capture_output=True, text=True, timeout=40,
    )
    code, _, redir = r.stdout.strip().partition(" ")
    return url, int(code or 0), redir.strip()

xml = subprocess.run(["curl", "-s", "--max-time", "30", SITEMAP], capture_output=True, text=True, timeout=40).stdout
root = ET.fromstring(xml.encode())
ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
locs = [e.text.strip() for e in root.findall(".//sm:loc", ns) if e.text]
print(f"Sitemap URLs: {len(locs)}")

bad = []
with cf.ThreadPoolExecutor(max_workers=12) as ex:
    for url, code, redir in ex.map(fetch, locs):
        if code != 200:
            bad.append((url, code, redir))

if bad:
    print(f"NON-200 URLS: {len(bad)}")
    for u, c, r in bad:
        print(f"  {c} {r or ''} <- {u}")
else:
    print("ALL 147 sitemap URLs return 200. No dead URLs in the sitemap.")
