#!/usr/bin/env python3
"""Final live verification for commit 75bc8b0 deployment."""
import urllib.request, random

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) deploy-verify/1.0"}
W = "https://www.pixkitapp.online"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def get(url, no_redirect=False):
    req = urllib.request.Request(url, headers=UA)
    handlers = [NoRedirect()] if no_redirect else []
    opener = urllib.request.build_opener(*handlers)
    try:
        with opener.open(req, timeout=25) as r:
            return r.status, dict(r.headers), r.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), b""


results = []

def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))

# 1. JPG to PNG page wording
slug_url = W + "/jpg-to-png"
st, hd, body = get(slug_url)
check("jpg-to-png page loads (200)", st == 200, f"status={st}")
check("JPG->PNG: NEW 'No extra quality loss during conversion'", "No extra quality loss during conversion" in body)
check("JPG->PNG: OLD 'Lossless output with no quality loss' gone", "Lossless output with no quality loss" not in body)

# 2. Transparency category wording (search homepage/tools html)
st2, _, body2 = get(W + "/tools")
allh = body + body2
check("Transparency: 'Remove white backgrounds' wording present", "Remove white backgrounds" in allh)

# 3. near-lossless 308 redirect (old URL -> new)
st3, hd3, _ = get(W + "/lossless-image-compressor", no_redirect=True)
loc3 = hd3.get("location", "") or hd3.get("Location", "")
check("old compressor URL redirects", st3 in (301, 302, 307, 308) and "near-lossless-image-compressor" in loc3, f"status={st3} location={loc3}")

# 4. http -> https + non-www -> www
try:
    st4, hd4, _ = get("http://pixkitapp.online/", no_redirect=True)
    loc4 = hd4.get("location", "") or hd4.get("Location", "")
    check("http non-www -> https www", st4 in (301, 302, 307, 308) and loc4.startswith("https://www."), f"status={st4} location={loc4}")
except Exception as e:
    check("http non-www -> https www", False, str(e))

# 5. sitemap + robots + 404
st5, _, b5 = get(W + "/sitemap.xml")
check("sitemap.xml 200 with 147 URLs", st5 == 200 and b5.count("<loc>") >= 147, f"status={st5} locs={b5.count('<loc>')}")
st6, _, _ = get(W + "/robots.txt")
check("robots.txt 200", st6 == 200, f"status={st6}")
st7, _, _ = get(W + "/this-page-does-not-exist-xyz123")
check("invalid URL -> 404", st7 == 404, f"status={st7}")

# 6. Vercel serving headers on homepage
st8, hd8, _ = get(W + "/")
vercel_id = hd8.get("x-vercel-id", "") or hd8.get("X-Vercel-Id", "")
cache = hd8.get("x-vercel-cache", "") or hd8.get("X-Vercel-Cache", "")
check("served by Vercel", "vercel" in str(hd8).lower(), f"x-vercel-id={vercel_id} x-vercel-cache={cache}")

print("=" * 60)
passed = 0
for name, ok, detail in results:
    mark = "PASS" if ok else "FAIL"
    passed += ok
    print(f"[{mark}] {name}" + (f"  ({detail})" if detail else ""))
print("=" * 60)
print(f"{passed}/{len(results)} checks passed")
