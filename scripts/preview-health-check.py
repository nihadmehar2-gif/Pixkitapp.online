#!/usr/bin/env python3
"""Comprehensive preview health check for PixKitApp.

Checks:
1. Every sitemap URL returns 200 through the local server (:3000)
2. No X-Frame-Options header anywhere; CSP frame-ancestors * present
3. External preview URL responds 200 with clean headers
4. robots.txt and sitemap.xml sanity
"""
import concurrent.futures as cf
import re
import sys
import urllib.request

LOCAL = "http://localhost:3000"
EXTERNAL = "https://preview-chat-a778cd1d-1ad1-48d3-ada8-e9cabb0729b7.space-z.ai"

FAILS = []


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (health-check)"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), b""
    except Exception as e:  # noqa: BLE001
        return -1, {}, str(e).encode()


def main():
    # --- 1. Build route list from sitemap ---
    status, headers, body = fetch(f"{LOCAL}/sitemap.xml")
    if status != 200:
        print(f"FATAL: sitemap.xml => {status}")
        sys.exit(1)
    urls = re.findall(r"<loc>(.*?)</loc>", body.decode("utf-8", "replace"))
    print(f"sitemap.xml: {status}, {len(urls)} URLs")

    # --- 2. Check every URL locally (concurrent) ---
    def check(u):
        s, _, _ = fetch(u.replace("https://www.pixkitapp.online", LOCAL))
        return u, s

    bad = []
    with cf.ThreadPoolExecutor(max_workers=16) as ex:
        for u, s in ex.map(check, urls):
            if s != 200:
                bad.append((u, s))
    if bad:
        FAILS.append(f"{len(bad)} sitemap URLs not 200: {bad[:10]}")
    print(f"local route sweep: {len(urls) - len(bad)}/{len(urls)} => 200")

    # --- 3. Header checks on key pages ---
    for path in ["/", "/image-compressor", "/tools", "/privacy", "/sitemap.xml"]:
        s, h, _ = fetch(f"{LOCAL}{path}")
        xfo = h.get("X-Frame-Options")
        csp = h.get("Content-Security-Policy", "")
        ok_csp = "frame-ancestors" in csp
        line = f"  {path}: {s} XFO={'YES(BAD)' if xfo else 'no'} frame-ancestors={'yes' if ok_csp else 'MISSING'}"
        print(line)
        if s != 200 or xfo or not ok_csp:
            FAILS.append(f"headers bad on {path}: XFO={xfo} CSP={csp}")

    # --- 4. External preview ---
    s, h, b = fetch(EXTERNAL + "/", timeout=45)
    xfo = h.get("X-Frame-Options")
    csp = h.get("Content-Security-Policy", "")
    print(f"external preview: {s}, bytes={len(b)}, XFO={'YES(BAD)' if xfo else 'no'}, frame-ancestors={'yes' if 'frame-ancestors' in csp else 'MISSING'}")
    if s != 200 or xfo:
        FAILS.append(f"external preview bad: {s} XFO={xfo}")

    ext_tool = fetch(EXTERNAL + "/image-compressor", timeout=45)[0]
    print(f"external tool page: {ext_tool}")
    if ext_tool != 200:
        FAILS.append(f"external tool page: {ext_tool}")

    # --- 5. robots sanity ---
    s, _, b = fetch(f"{LOCAL}/robots.txt")
    robots = b.decode("utf-8", "replace")
    has_sitemap = "sitemap" in robots.lower()
    print(f"robots.txt: {s}, sitemap-ref={'yes' if has_sitemap else 'MISSING'}")
    if s != 200 or not has_sitemap:
        FAILS.append(f"robots.txt bad: {s}")

    print("=" * 50)
    if FAILS:
        print(f"RESULT: {len(FAILS)} FAILURES")
        for f in FAILS:
            print(f" - {f}")
        sys.exit(1)
    print("RESULT: ALL CHECKS PASS")


if __name__ == "__main__":
    main()
