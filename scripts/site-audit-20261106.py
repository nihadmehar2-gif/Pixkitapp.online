#!/usr/bin/env python3
"""Read-only full-site audit for pixkitapp.online (report-only, fixes NOTHING).

Checks:
 1. Sitemap: every URL -> status, TTFB, title, description, canonical,
    robots meta, viewport, h1 count, og:title/og:image, X-Robots-Tag header.
 2. robots.txt + ads.txt + app-ads.txt byte-exact content.
 3. Internal links + img/og assets from key pages -> broken-link check.
 4. Ad artefacts: banner-stack zones present, old MultiTag absent, AdSense loader.
 5. Response/security headers on homepage; http->https; 404 behaviour.
"""
import concurrent.futures as cf
import json
import re
import sys
import time
import urllib.request
import urllib.error

BASE = "https://www.pixkitapp.online"
HOST_OK = {"www.pixkitapp.online", "pixkitapp.online"}
UA = {"User-Agent": "Mozilla/5.0 (site-audit; +https://pixkitapp.online)"}
ADS_TXT = "google.com, pub-1791950384087416, DIRECT, f08c47fec0942fa0\n"
APP_ADS_TXT = "google.com, pub-8515722808565593, DIRECT, f08c47fec0942fa0\n"

issues = {"errors": [], "advisories": []}
stats = {"ttfb": [], "titles": {}}


def err(msg): issues["errors"].append(msg)
def adv(msg): issues["advisories"].append(msg)


def fetch(url, timeout=20, method="GET"):
    t0 = time.time()
    req = urllib.request.Request(url, headers=UA, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read(400000)
            return {
                "ok": True, "status": r.status, "final_url": r.geturl(),
                "ttfb": time.time() - t0, "headers": dict(r.headers), "body": body,
            }
    except urllib.error.HTTPError as e:
        return {"ok": False, "status": e.code, "final_url": url,
                "ttfb": time.time() - t0, "headers": dict(e.headers or {}), "body": b""}
    except Exception as e:
        return {"ok": False, "status": None, "final_url": url,
                "ttfb": time.time() - t0, "headers": {}, "body": str(e).encode()}


def norm(u):
    u = u.split("#")[0].split("?")[0]
    return u.rstrip("/") or u


def page_report(url, res):
    html = res["body"].decode("utf-8", "replace")
    stats["ttfb"].append((res["ttfb"], url))
    title = re.search(r"<title>([^<]*)</title>", html)
    title = title.group(1).strip() if title else ""
    desc = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', html) or \
           re.search(r'<meta\s+content="([^"]*)"\s+name="description"', html)
    desc = desc.group(1).strip() if desc else ""
    canon = re.search(r'<link\s+rel="canonical"\s+href="([^"]*)"', html)
    canon = canon.group(1).strip() if canon else ""
    robots_m = re.search(r'<meta\s+name="robots"\s+content="([^"]*)"', html)
    robots_m = robots_m.group(1) if robots_m else ""
    viewport = 'name="viewport"' in html
    h1 = len(re.findall(r"<h1[\s>]", html))
    og_img = re.search(r'property="og:image"\s+content="([^"]*)"', html) or \
             re.search(r'content="([^"]*)"\s+property="og:image"', html)
    og_img = og_img.group(1) if og_img else ""
    xrt = res["headers"].get("X-Robots-Tag", "") or res["headers"].get("x-robots-tag", "")

    if not title:
        err(f"{url}: missing <title>")
    elif len(title) > 65 or len(title) < 25:
        adv(f"{url}: title length {len(title)} ('{title[:60]}')")
    if title:
        stats["titles"].setdefault(title, []).append(url)
    if not desc:
        err(f"{url}: missing meta description")
    elif len(desc) > 165 or len(desc) < 50:
        adv(f"{url}: description length {len(desc)}")
    if not canon:
        err(f"{url}: missing canonical")
    elif norm(canon) != norm(url):
        adv(f"{url}: canonical '{canon}' != sitemap URL")
    if "noindex" in robots_m or "noindex" in xrt:
        err(f"{url}: NOINDEX on production (meta='{robots_m}' x-robots='{xrt}')")
    if not viewport:
        err(f"{url}: missing viewport meta (mobile)")
    if h1 == 0:
        adv(f"{url}: no <h1>")
    elif h1 > 1:
        adv(f"{url}: {h1} <h1> elements")
    return {"url": url, "status": res["status"], "ttfb": round(res["ttfb"], 2),
            "title": title, "desc_len": len(desc), "canonical": canon,
            "viewport": viewport, "h1": h1, "og_img": og_img,
            "links": set(), "imgs": set()}


def extract_assets(html, base_url):
    links, imgs = set(), set()
    for m in re.findall(r'<a[^>]+href="([^"]*)"', html):
        h = m.strip()
        if h.startswith(("mailto:", "tel:", "javascript:", "data:")):
            continue
        if h.startswith("//"):
            u = "https:" + h
        elif h.startswith("http"):
            u = h
        elif h.startswith("/"):
            u = BASE + h
        else:
            continue
        p = urllib.parse.urlparse(u)
        if p.netloc in HOST_OK and not p.path.startswith("/_next/"):
            links.add(u.split("#")[0])
    for m in re.findall(r'<img[^>]+src="([^"]*)"', html):
        s = m.strip()
        if s.startswith("/"):
            imgs.add(BASE + s)
        elif s.startswith("http") and urllib.parse.urlparse(s).netloc in HOST_OK:
            imgs.add(s)
    return links, imgs


import urllib.parse  # noqa: E402

def main():
    report = {"sitemap_count": 0, "pages": [], "link_results": {},
              "asset_results": {}, "summary": {}}

    # ---------- 1) sitemap ----------
    sm = fetch(BASE + "/sitemap.xml")
    if not sm["ok"] or sm["status"] != 200:
        err("sitemap.xml not reachable (status %s)" % sm["status"])
        urls = []
    else:
        xml = sm["body"].decode("utf-8", "replace")
        urls = re.findall(r"<loc>([^<]+)</loc>", xml)
        urls = [u.strip() for u in urls if u.strip().startswith("http")]
        report["sitemap_count"] = len(urls)
        if not urls:
            err("sitemap.xml has zero <loc> URLs")
        rob = fetch(BASE + "/robots.txt")
        robtxt = rob["body"].decode("utf-8", "replace") if rob["ok"] else ""
        if rob["status"] != 200:
            err("robots.txt not 200")
        if "Sitemap:" not in robtxt:
            err("robots.txt missing Sitemap: directive")
        if BASE + "/sitemap.xml" not in robtxt and "sitemap.xml" not in robtxt:
            adv("robots.txt Sitemap line does not reference this sitemap URL")

    pages = []
    with cf.ThreadPoolExecutor(12) as ex:
        futs = {ex.submit(fetch, u): u for u in urls}
        for f in cf.as_completed(futs):
            u, res = futs[f], f.result()
            if not res["ok"] or res["status"] != 200:
                err(f"SITEMAP URL {u}: HTTP {res['status']}")
                continue
            pr = page_report(u, res)
            html = res["body"].decode("utf-8", "replace")
            pr["links"], pr["imgs"] = extract_assets(html, u)
            if pr["og_img"]:
                pr["imgs"].add(pr["og_img"])
            pages.append(pr)
    report["pages"] = [{k: v for k, v in p.items() if k not in ("links", "imgs")} for p in pages]

    # duplicate titles
    for t, us in stats["titles"].items():
        if len(us) > 1:
            adv(f"duplicate title on {len(us)} pages: '{t[:60]}' e.g. {us[:3]}")

    # ---------- 2) link + asset check ----------
    all_links, all_imgs = set(), set()
    key = [p for p in pages if p["url"] in
           (BASE, BASE + "/tools", BASE + "/about", BASE + "/privacy",
            BASE + "/terms", BASE + "/contact")]
    sample_tools = [p for p in pages if "/tools/" in p["url"] or p["url"].count("/") >= 4][:6]
    for p in key + sample_tools:
        all_links |= p["links"]
        all_imgs |= p["imgs"]
    all_links = {l for l in all_links if norm(l) != norm(BASE)}  # skip self-home
    all_links = set(list(all_links)[:400])
    all_imgs = set(list(all_imgs)[:120])

    def check(u):
        r = fetch(u, timeout=15)
        return u, r

    with cf.ThreadPoolExecutor(12) as ex:
        for u, r in ex.map(check, sorted(all_links)):
            report["link_results"][u] = r["status"]
            if not r["ok"] or r["status"] != 200:
                err(f"BROKEN LINK {u}: HTTP {r['status']}")
            elif norm(r["final_url"]) != norm(u):
                adv(f"link redirects: {u} -> {r['final_url']}")
        for u, r in ex.map(check, sorted(all_imgs)):
            report["asset_results"][u] = r["status"]
            if not r["ok"] or r["status"] != 200:
                err(f"BROKEN ASSET {u}: HTTP {r['status']}")

    # ---------- 3) ad artefacts ----------
    home = next((p for p in pages if p["url"].rstrip("/") == BASE), None)
    home_res = fetch(BASE + "/")
    home_html = home_res["body"].decode("utf-8", "replace")
    if "12203276" not in home_html or "nap5k.com/tag.min.js" not in home_html:
        err("production: In-Page Push zone 12203276 loader missing")
    if "12203278" not in home_html or "n6wxm.com/vignette.min.js" not in home_html:
        err("production: Vignette zone 12203278 loader missing")
    if "306556" in home_html or "quge5" in home_html:
        err("production: old MultiTag (306556/quge5) still present")
    if "adsbygoogle.js?client=ca-pub-1791950384087416" not in home_html:
        err("production: AdSense loader missing")
    if "fc91e716faf8b5d724195354b78bd1cc" not in home_html:
        err("production: monetag verification meta missing")

    a1 = fetch(BASE + "/ads.txt")
    if a1["body"].decode("utf-8", "replace") != ADS_TXT:
        err("ads.txt content mismatch")
    a2 = fetch(BASE + "/app-ads.txt")
    if a2["body"].decode("utf-8", "replace") != APP_ADS_TXT:
        err("app-ads.txt content mismatch")
    ct = (a2["headers"].get("Content-Type") or a2["headers"].get("content-type") or "")
    if "text/plain" not in ct:
        adv(f"app-ads.txt content-type is '{ct}' (expected text/plain)")

    # ---------- 4) headers + redirect + 404 ----------
    hdrs = home_res["headers"]
    lc = {k.lower(): v for k, v in hdrs.items()}
    csp = lc.get("content-security-policy", "")
    if "frame-ancestors 'self'" not in csp:
        adv(f"production CSP unexpected: '{csp}'")
    for h in ("x-content-type-options", "referrer-policy", "permissions-policy"):
        if h not in lc:
            adv(f"missing security header: {h}")
    if "strict-transport-security" not in lc:
        adv("missing HSTS header (advisory; Vercel may add it at edge)")
    http_r = fetch("http://www.pixkitapp.online/", timeout=10)
    if http_r["status"] not in (301, 308):
        adv(f"http://www does not redirect (status {http_r['status']})")
    apex_r = fetch(BASE.replace("https://www.", "https://") + "/", timeout=10)
    if apex_r["status"] not in (301, 308):
        adv(f"apex does not redirect to www (status {apex_r['status']})")
    nf = fetch(BASE + "/definitely-not-a-page-audit-xyz", timeout=10)
    if nf["status"] == 200:
        err("soft-404: unknown URL returns 200 (should be 404)")
    elif nf["status"] != 404:
        adv(f"unknown URL returns {nf['status']} (404 preferred)")

    # ---------- 5) speed stats ----------
    t = sorted(x[0] for x in stats["ttfb"])
    if t:
        report["summary"]["ttfb_p50"] = round(t[len(t) // 2], 2)
        report["summary"]["ttfb_p90"] = round(t[int(len(t) * 0.9)], 2)
        report["summary"]["ttfb_max"] = round(t[-1], 2)
        for v, u in stats["ttfb"]:
            if v > 1.5:
                adv(f"slow TTFB {v:.2f}s: {u}")

    report["summary"]["errors"] = issues["errors"]
    report["summary"]["advisories"] = issues["advisories"]
    with open("/home/z/my-project/scripts/site-audit-20261106-out.json", "w") as fh:
        json.dump(report, fh, indent=1)

    print(f"sitemap URLs: {report['sitemap_count']}")
    print(f"pages OK: {len(report['pages'])}")
    print(f"links checked: {len(report['link_results'])}, assets checked: {len(report['asset_results'])}")
    print(f"TTFB p50/p90/max: {report['summary'].get('ttfb_p50')}/{report['summary'].get('ttfb_p90')}/{report['summary'].get('ttfb_max')}s")
    print(f"ERRORS: {len(issues['errors'])}")
    for e in issues["errors"]:
        print("  [E] " + e)
    print(f"ADVISORIES: {len(issues['advisories'])}")
    for a in issues["advisories"]:
        print("  [A] " + a)


if __name__ == "__main__":
    sys.exit(main())
