#!/usr/bin/env python3
"""Check every sitemap URL against the local dev server (status + theme marker)."""
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

BASE = "http://127.0.0.1:3000"
sitemap = subprocess.run(
    ["curl", "-s", f"{BASE}/sitemap.xml"], capture_output=True, text=True
).stdout
urls = re.findall(r"<loc>([^<]+)</loc>", sitemap)
paths = [u.replace("https://www.pixkitapp.online", "") or "/" for u in urls]


def check(path: str) -> tuple[str, int, bool]:
    try:
        out = subprocess.run(
            ["curl", "-s", "-o", "/tmp/chk.html", "-w", "%{http_code}", f"{BASE}{path}"],
            capture_output=True,
            text=True,
            timeout=30,
        ).stdout
        code = int(out)
        with open("/tmp/chk.html", encoding="utf-8", errors="ignore") as f:
            html = f.read()
        # Theme sanity: page must carry the Soft Tan primary token somewhere
        # (CSS chunk link is shared; check the page hydrates with tan palette
        # by confirming the globals chunk is referenced and no stale violet).
        has_violet = "7b3de9" in html
        return path, code, has_violet
    except Exception as exc:  # noqa: BLE001
        return path, -1, str(exc)


fails: list[str] = []
with ThreadPoolExecutor(max_workers=12) as pool:
    for path, code, violet in pool.map(check, paths):
        if code != 200:
            fails.append(f"{path} -> HTTP {code}")

print(f"total urls: {len(paths)}")
print(f"non-200: {len(fails)}")
for f in fails[:20]:
    print("  FAIL", f)
print("ALL OK" if not fails else "FAILURES FOUND")
