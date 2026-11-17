#!/usr/bin/env python3
"""F3 pre-implementation baseline crawl (READ-ONLY).
GET requests only against production https://www.pixkitapp.online.
Collects per-page internal links + canonical + status so incoming-link
counts can be recomputed with the reconciliation-audit methodology.
Writes to scripts/seo-audit-data/crawl-baseline-f3.json (new file; the
November audit crawl.json is preserved untouched)."""
import argparse
import json, re, time
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from bs4 import BeautifulSoup

BASE = "https://www.pixkitapp.online"
UA = {"User-Agent": "Mozilla/5.0 (compatible; PixKitSEOAudit/1.0; read-only audit)"}
OUT = "/home/z/my-project/scripts/seo-audit-data/crawl-baseline-f3.json"
TIMEOUT = 30


def get_sitemap():
    r = requests.get(BASE + "/sitemap.xml", headers=UA, timeout=TIMEOUT)
    r.raise_for_status()
    return re.findall(r"<loc>\s*([^<]+?)\s*</loc>", r.text)


def crawl(url):
    rec = {"url": url}
    try:
        r = requests.get(url, headers=UA, timeout=TIMEOUT, allow_redirects=True)
        rec["status"] = r.status_code
        rec["final_url"] = r.url
        rec["redirected"] = r.url.rstrip("/") != url.rstrip("/")
        html = r.text
    except Exception as e:
        rec["status"] = f"ERROR: {type(e).__name__}: {e}"
        return rec
    soup = BeautifulSoup(html, "html.parser")
    can = soup.head.find("link", rel="canonical") if soup.head else None
    rec["canonical"] = can["href"].strip() if can and can.get("href") else None

    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("//"):
            continue
        if href.startswith("/"):
            links.append(href.split("#")[0].split("?")[0])
        elif href.startswith(BASE):
            links.append(href[len(BASE):].split("#")[0].split("?")[0])
    rec["internal_links"] = links
    rec["internal_link_count"] = len(links)
    return rec


def main():
    global BASE, OUT
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=BASE)
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()
    BASE, OUT = a.base.rstrip("/"), a.out
    urls = get_sitemap()
    print(f"base={BASE} sitemap URLs: {len(urls)}")
    paths = [u.replace("https://www.pixkitapp.online", "") or "/" for u in urls]
    results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(crawl, BASE + p): p for p in paths}
        for i, f in enumerate(as_completed(futs), 1):
            rec = f.result()
            results.append(rec)
            if i % 25 == 0:
                print(f"  {i}/{len(paths)}")
    time.sleep(0.2)
    results.sort(key=lambda x: x["url"])
    with open(OUT, "w") as f:
        json.dump(results, f, indent=1)
    ok = sum(1 for r in results if r.get("status") == 200)
    print(f"done: {ok}/{len(results)} status-200 -> {OUT}")

if __name__ == "__main__":
    main()
