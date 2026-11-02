#!/usr/bin/env python3
"""Poll live site until commit 661bba4's quality fixes are deployed (Vercel Ready)."""
import random, sys, time, urllib.request

SITE = "https://www.pixkitapp.online"
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) deploy-verify/1.0"}

# Marker: the new image-compressor about copy (only in 661bba4+)
MARKER = "Your image's original format is preserved"
OLD_MARKER = "opaque PNGs converted to JPEG can drop far more"


def fetch(url):
    req = urllib.request.Request(url + ("?cb=%d" % random.randint(10**7, 10**8)), headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode("utf-8", errors="replace")


for attempt in range(1, 13):
    try:
        html = fetch(SITE + "/image-compressor")
    except Exception as e:
        print(f"[{attempt}] fetch error: {e}", flush=True)
        time.sleep(30)
        continue
    new_ok = MARKER in html
    old_gone = OLD_MARKER not in html
    print(f"[{attempt}] new-copy={new_ok} old-copy-gone={old_gone}", flush=True)
    if new_ok and old_gone:
        print("=== DEPLOYMENT READY — quality fix is LIVE ===", flush=True)
        sys.exit(0)
    time.sleep(30)
print("=== WARNING: not verified after 12 attempts ===", flush=True)
sys.exit(1)
