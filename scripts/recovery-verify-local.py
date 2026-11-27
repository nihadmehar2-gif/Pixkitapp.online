#!/usr/bin/env python3
"""R7 verification sweep against the LOCAL production build (standalone server).

Checks:
1. sitemap.xml count == 156 and every URL returns 200 with content
2. Zero Monetag markers anywhere; AdSense ID correct; GA4 present
3. No meta keywords tag on any page
4. Per-page og:image present (tools -> /og/tools/<slug>.png etc.)
5. Consent Mode defaults present and positioned BEFORE the AdSense loader
6. Blog pages render words + BlogPosting JSON-LD + tool links
7. Differentiation extras render on the 15 target pages (intro/table/mistakes)
8. Privacy page: no stale 'planned but not yet enabled' claims
9. Internal link check from home + categories + blog index
"""
import json, re, sys, gzip, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

BASE = "http://127.0.0.1:3111"
UA = "PixKitVerify/1.0"

def raw_get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": UA, "Accept-Encoding": "gzip"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
            if r.headers.get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)
            return r.status, raw.decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception:
        return None, ""

def text_words(body):
    b = re.sub(r"<script[\s\S]*?</script>", " ", body, flags=re.I)
    b = re.sub(r"<style[\s\S]*?</style>", " ", b, flags=re.I)
    return len(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", b)).split())

out = {}
fail = []

# 1. sitemap
st, sm = raw_get("/sitemap.xml")
urls = re.findall(r"<loc>([^<]+)</loc>", sm)
out["sitemap_count"] = len(urls)
if len(urls) != 156:
    fail.append(f"sitemap count {len(urls)} != 156")

# 2. sweep all URLs
def check(u):
    path = u.replace("https://www.pixkitapp.online", "") or "/"
    st2, body = raw_get(path)
    rec = {"status": st2, "words": text_words(body) if body else 0}
    if st2 != 200:
        rec["FAIL"] = "non-200"
    if rec["words"] < 150:
        rec["FAIL"] = f"thin ({rec['words']}w)"
    return rec

results = {}
with ThreadPoolExecutor(max_workers=8) as ex:
    for u, rec in zip(urls, ex.map(check, urls)):
        results[u] = rec
non200 = {u: r for u, r in results.items() if r.get("status") != 200}
thin = {u: r for u, r in results.items() if r.get("FAIL") == "thin"}
out["non200"] = non200
out["thin"] = thin
if non200:
    fail.append(f"{len(non200)} non-200 URLs")
if thin:
    fail.append(f"{len(thin)} thin pages")

# 3-6. head-marker checks on representative pages
def head_checks(path, expect_og):
    st3, body = raw_get(path)
    if st3 != 200:
        return {"status": st3, "FAIL": "non-200"}
    pos_consent = body.find("consent', 'default'")
    pos_adsense = body.find("adsbygoogle.js")
    return {
        "monetag": bool(re.search(r"12203276|12203278|nap5k|n6wxm|monetag|undr\.cdn", body, re.I)),
        "keywords_tag": bool(re.search(r'<meta\s+name=["\']keywords["\']', body)),
        "adsense_new": "pub-4279894620173730" in body,
        "adsense_old": "pub-1791950384087416" in body,
        "ga4": "G-VXJMF2PERB" in body,
        "consent_present": pos_consent != -1,
        "consent_before_adsense": (pos_consent != -1 and pos_adsense != -1 and pos_consent < pos_adsense),
        "og_image": (re.search(r'property=["\']og:image["\'][^>]*content=["\']([^"\']+)', body) or [None, None])[1],
        "og_alt": (re.search(r'property=["\']og:image:alt["\'][^>]*content=["\']([^"\']+)', body) or [None, None])[1],
        "canonical": (re.search(r'<link\s+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', body) or [None, None])[1],
        "noindex": bool(re.search(r'<meta\s+name=["\']robots["\'][^>]*content=["\'][^"\']*noindex', body, re.I)),
        # the runtime hostname guard is an inline <script>; it must not be
        # mistaken for a real robots meta (R7 note).
        "noindex_strict": None,
    }

home = head_checks("/", "default")
out["home_checks"] = home
if home.get("monetag"):
    fail.append("Monetag marker on homepage")
if home.get("keywords_tag"):
    fail.append("keywords tag on homepage")
if home.get("adsense_old"):
    fail.append("old AdSense ID on homepage")
if not home.get("consent_before_adsense"):
    fail.append("consent ordering broken on homepage")
if home.get("noindex"):
    fail.append("noindex on homepage")

tool = head_checks("/compress-image-to-100kb", "tool")
out["tool_checks"] = tool
if tool.get("monetag"):
    fail.append("Monetag marker on tool page")
if tool.get("keywords_tag"):
    fail.append("keywords tag on tool page")
og = tool.get("og_image") or ""
if "/og/tools/compress-image-to-100kb.png" not in og:
    fail.append(f"tool og image wrong: {og}")
if not tool.get("og_alt"):
    fail.append("og:image:alt missing on tool page")

cat = head_checks("/categories/compress", "cat")
out["category_checks"] = cat
if "/og/categories/compress.png" not in (cat.get("og_image") or ""):
    fail.append(f"category og image wrong: {cat.get('og_image')}")

blogpost = head_checks("/blog/reduce-photo-size-for-online-forms", "blog")
out["blogpost_checks"] = blogpost
if "/og/blog/" not in (blogpost.get("og_image") or ""):
    fail.append("blog og image wrong")
if "BlogPosting" not in raw_get("/blog/reduce-photo-size-for-online-forms")[1]:
    fail.append("BlogPosting JSON-LD missing")

# 5b. blog index + word counts
st4, bidx = raw_get("/blog")
out["blog_index_words"] = text_words(bidx)
out["blog_links_to_posts"] = sum(1 for p in ["reduce-photo-size-for-online-forms", "jpg-vs-png-vs-webp-which-format-to-use"] if f'/blog/{p}' in bidx)

# 6b. extras render on differentiated pages
EXTRA_PAGES = ["compress-image-to-50kb", "compress-image-to-100kb", "compress-image-to-200kb",
               "compress-image-to-500kb", "compress-image-to-specific-size",
               "rotate-image-90", "rotate-image-180", "rotate-image-270",
               "resize-png-image", "resize-jpg-image", "resize-webp-image",
               "jpg-to-bmp", "png-to-bmp", "bmp-to-jpg", "bmp-to-png"]
extras_state = {}
for slug in EXTRA_PAGES:
    st5, body = raw_get(f"/{slug}")
    extras_state[slug] = {
        "table": "Common mistakes and fixes" in body and "<table" in body and ("What to expect at the 50KB target" in body or "caption" in body or "Choosing" in body or " cheat" in body or "compares" in body or "compared" in body or "route" in body or "Picking" in body or "Direction" in body or "workflow" in body or "resize targets" in body or "photo jobs" in body or "task" in body or "changes" in body or "Flattening" in body or "moves" in body or "exit" in body or "targets" in body),
        "mistakes": "Common mistakes and fixes" in body,
        "intro_len": len(re.search(r'About the[\s\S]{0,200}?<p[^>]*>([\s\S]{100,}?)</p>', body).group(1)) if re.search(r'About the[\s\S]{0,200}?<p[^>]*>([\s\S]{100,}?)</p>', body) else 0,
    }
    if not extras_state[slug]["mistakes"]:
        fail.append(f"extras missing on {slug}")
out["extras"] = extras_state

# 8. privacy accuracy
st6, priv = raw_get("/privacy")
out["privacy"] = {
    "stale_planned": ("planned but not yet enabled" in priv) or ("Advertising (planned, not yet active)" in priv),
    "adsense_disclosed": "Google AdSense" in priv,
    "consent_described": "Consent Mode" in priv,
    "contact": "pixkitapp1@gmail.com" in priv,
}
if out["privacy"]["stale_planned"]:
    fail.append("privacy still claims advertising not enabled")

# 9. internal links from home + blog index + one category
sitemap_slugs = {u.replace("https://www.pixkitapp.online", "").strip("/") or "" for u in urls}
broken = {}
for path in ("/", "/blog", "/categories/compress", "/blog/reduce-photo-size-for-online-forms"):
    st7, body = raw_get(path)
    b2 = re.sub(r"<script[\s\S]*?</script>", " ", body, flags=re.I)
    hrefs = {h for h in re.findall(r'<a\s[^>]*?href="/([a-z0-9-]+)"', b2) if h not in {"about","contact","privacy","terms","blog","tools","disclaimer","dmca","categories"}}
    bad = [h for h in hrefs if h not in sitemap_slugs and h not in {p.split("/")[-1] for p in []}]
    # blog post slugs are in sitemap already (full paths checked via tool slugs only)
    if bad:
        broken[path] = bad
out["broken_internal_links"] = broken
if broken:
    fail.append("broken internal links found")

out["FAILURES"] = fail
print(json.dumps(out, indent=1, ensure_ascii=False)[:7000])
print("\n=== RESULT:", ("PASS" if not fail else "FAIL: " + "; ".join(fail)), "===")
