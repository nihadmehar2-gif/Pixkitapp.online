#!/usr/bin/env python3
"""
Stage-2 SEO audit crawler — READ-ONLY.
Fetches every URL in the live sitemap and extracts SEO signals into
scripts/stage2-audit/crawl.json. Changes nothing on the site.
"""
import concurrent.futures as cf
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlsplit
from bs4 import BeautifulSoup

OUT = Path("/home/z/my-project/scripts/stage2-audit")
OUT.mkdir(parents=True, exist_ok=True)
SITEMAP = "https://www.pixkitapp.online/sitemap.xml"

def curl(url: str, timeout: int = 45) -> tuple[int, str, str]:
    r = subprocess.run(
        ["curl", "-s", "--compressed", "--max-time", str(timeout),
         "-w", "\n__CODE__%{http_code}", "-A", "Mozilla/5.0 (compatible; SEO-Audit/1.0)", url],
        capture_output=True, text=True, timeout=timeout + 10,
    )
    body, _, code = r.stdout.rpartition("__CODE__")
    return int(code or 0), body, r.stderr

xml = subprocess.run(["curl", "-s", "--max-time", "30", SITEMAP], capture_output=True, text=True, timeout=40).stdout
root = ET.fromstring(xml.encode())
ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
urls = sorted({e.text.strip() for e in root.findall(".//sm:loc", ns) if e.text})
print(f"Fetching {len(urls)} URLs ...", flush=True)

def clean_text(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()

def parse_page(url: str, body: str) -> dict:
    soup = BeautifulSoup(body, "lxml")
    title = soup.title.get_text(" ", strip=True) if soup.title else None
    md = lambda n, a: (soup.find("meta", attrs={n: a}) or {}).get("content")
    h1s = [clean_text(h.get_text(" ", strip=True)) for h in soup.find_all("h1")]
    h2s = [clean_text(h.get_text(" ", strip=True)) for h in soup.find_all("h2")]

    main = soup.find("main", id="main-content")
    main_words = len(re.findall(r"[A-Za-z0-9']+", main.get_text(" ", strip=True))) if main else 0
    body_words = len(re.findall(r"[A-Za-z0-9']+", soup.body.get_text(" ", strip=True))) if soup.body else 0

    imgs = []
    for img in soup.find_all("img"):
        imgs.append({
            "src": (img.get("src") or "")[:160],
            "alt": img.get("alt"),
            "alt_empty": (img.get("alt") or "").strip() == "",
            "loading": img.get("loading"),
            "dims": f'{img.get("width", "?")}x{img.get("height", "?")}',
        })
    svg_total = len(soup.find_all("svg"))
    svg_hidden = len([s for s in soup.find_all("svg") if s.get("aria-hidden") == "true"])

    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"].split("#")[0]
        if href.startswith("/"):
            links.append(href.rstrip("/") or "/")
        elif href.startswith("https://www.pixkitapp.online"):
            p = urlsplit(href).path.rstrip("/") or "/"
            links.append(p)
        elif href.startswith(("http://", "https://")):
            links.append("EXT:" + urlsplit(href).netloc)
    jsonld = []
    for s in soup.find_all("script", type="application/ld+json"):
        try:
            jsonld.append(json.loads(s.string or ""))
        except Exception as e:
            jsonld.append({"_parse_error": str(e)})
    canon = soup.find("link", rel="canonical")
    return {
        "url": url,
        "title": title,
        "description": md("name", "description"),
        "keywords_len": len(md("name", "keywords") or ""),
        "robots_meta": md("name", "robots"),
        "og_url": md("property", "og:url"),
        "canonical": canon.get("href") if canon else None,
        "h1": h1s,
        "h2_count": len(h2s),
        "main_words": main_words,
        "body_words": body_words,
        "images": imgs,
        "img_count": len(imgs),
        "svg_total": svg_total,
        "svg_hidden": svg_hidden,
        "links": sorted(set(links)),
        "link_count": len(links),
        "jsonld": jsonld,
        "html_bytes": len(body.encode("utf-8", "ignore")),
    }

def fetch(url: str) -> dict:
    code, body, err = curl(url)
    if code != 200 or not body:
        return {"url": url, "status": code, "error": err[:120]}
    d = parse_page(url, body)
    d["status"] = code
    return d

results = []
with cf.ThreadPoolExecutor(max_workers=10) as ex:
    for i, d in enumerate(ex.map(fetch, urls), 1):
        results.append(d)
        if i % 25 == 0:
            print(f"  {i}/{len(urls)}", flush=True)

ok = [d for d in results if d.get("status") == 200]
bad = [d for d in results if d.get("status") != 200]
(OUT / "crawl.json").write_text(json.dumps(results, indent=1))
print(f"Done. OK={len(ok)} FAILED={len(bad)}")
for b in bad:
    print("  BAD:", b["url"], b.get("status"), b.get("error", ""))
