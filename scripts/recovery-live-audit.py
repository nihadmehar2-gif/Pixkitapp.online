#!/usr/bin/env python3
"""Full live-site audit for the indexing investigation.

For every URL in the live sitemap, records:
- HTTP status / final URL (redirect target)
- X-Robots-Tag header
- meta robots content
- canonical link href
- <title>
- h1 count
- approximate SSR text length (tags stripped, scripts/styles removed)
- Monetag markers (monetag meta, nap5k, n6wxm, zone ids)
- AdSense loader (adsbygoogle client id)

Usage: python3 scripts/recovery-live-audit.py <outfile.json> [sitemap_url]
"""
import concurrent.futures as cf
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

DEFAULT_SITEMAP = "https://www.pixkitapp.online/sitemap.xml"
MONETAG_PAT = re.compile(r"monetag|nap5k\.com|n6wxm\.com|12203276|12203278", re.I)
ADSENSE_PAT = re.compile(r"ca-pub-(\d+)")
CANON_PAT = re.compile(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"')
CANON_PAT2 = re.compile(r'<link[^>]+href="([^"]+)"[^>]+rel="canonical"')
ROBOTS_PAT = re.compile(r'<meta name="robots" content="([^"]*)"')
TITLE_PAT = re.compile(r"<title>([^<]*)</title>")
H1_PAT = re.compile(r"<h1[ >]", re.I)
SCRIPT_STYLE_PAT = re.compile(r"<script\b.*?</script>|<style\b.*?</style>", re.S | re.I)
TAG_PAT = re.compile(r"<[^>]+>")


def curl(url: str, extra: list[str] | None = None, timeout: int = 30) -> str:
    cmd = ["curl", "-s", "-L", "--max-time", str(timeout), *(extra or []), url]
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 10).stdout


def fetch_one(url: str) -> dict:
    meta = curl(url, ["-o", "/dev/null", "-w", "%{http_code}|%{url_effective}|%{x_robots_tag}"])
    parts = meta.strip().split("|")
    code = int(parts[0]) if parts and parts[0].isdigit() else 0
    final_url = parts[1] if len(parts) > 1 else ""
    x_robots = parts[2] if len(parts) > 2 else ""
    html = ""
    if code == 200:
        html = curl(url)
    body = SCRIPT_STYLE_PAT.sub(" ", html)
    text = TAG_PAT.sub(" ", body)
    text = re.sub(r"\s+", " ", text).strip()
    canon = CANON_PAT.search(html) or CANON_PAT2.search(html)
    rec = {
        "url": url,
        "status": code,
        "final_url": final_url,
        "x_robots_tag": x_robots,
        "meta_robots": (m.group(1) if (m := ROBOTS_PAT.search(html)) else ""),
        "canonical": canon.group(1) if canon else "",
        "title": (m.group(1) if (m := TITLE_PAT.search(html)) else ""),
        "h1_count": len(H1_PAT.findall(html)),
        "ssr_text_len": len(text),
        "monetag_hits": sorted(set(MONETAG_PAT.findall(html))),
        "adsense_clients": sorted(set(ADSENSE_PAT.findall(html))),
    }
    return rec


def main() -> None:
    out_path = sys.argv[1] if len(sys.argv) > 1 else "scripts/seo-audit-data/recovery-live-audit.json"
    sitemap_url = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_SITEMAP
    xml = curl(sitemap_url)
    root = ET.fromstring(xml.encode())
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locs = [e.text.strip() for e in root.findall(".//sm:loc", ns) if e.text]
    print(f"Sitemap URLs: {len(locs)}")
    recs = []
    with cf.ThreadPoolExecutor(max_workers=10) as ex:
        for rec in ex.map(fetch_one, locs):
            recs.append(rec)
            flag = ""
            if rec["status"] != 200:
                flag = " <-- BAD STATUS"
            elif rec["x_robots_tag"]:
                flag = " <-- X-ROBOTS"
            elif rec["meta_robots"] and "noindex" in rec["meta_robots"].lower():
                flag = " <-- NOINDEX"
            elif rec["canonical"] and rec["canonical"].rstrip("/") != rec["url"].rstrip("/"):
                flag = " <-- CANONICAL MISMATCH"
            if flag:
                print(f"  {rec['status']} {rec['url']}{flag}")
    summary = {
        "total": len(recs),
        "ok_200": sum(1 for r in recs if r["status"] == 200),
        "non_200": [r["url"] for r in recs if r["status"] != 200],
        "x_robots_nonempty": [r["url"] for r in recs if r["x_robots_tag"]],
        "noindex_pages": [r["url"] for r in recs if "noindex" in (r["meta_robots"] or "").lower()],
        "canonical_mismatch": [
            {"url": r["url"], "canonical": r["canonical"]}
            for r in recs
            if r["canonical"] and r["canonical"].rstrip("/") != r["url"].rstrip("/")
        ],
        "missing_canonical": [r["url"] for r in recs if not r["canonical"]],
        "monetag_pages": [r["url"] for r in recs if r["monetag_hits"]],
        "adsense_clients_seen": sorted({c for r in recs for c in r["adsense_clients"]}),
        "thin_ssr_under_500_chars": [
            {"url": r["url"], "len": r["ssr_text_len"]} for r in recs if r["ssr_text_len"] < 500
        ],
        "records": recs,
    }
    with open(out_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nSummary: {summary['ok_200']}/{summary['total']} OK; "
          f"noindex={len(summary['noindex_pages'])} x-robots={len(summary['x_robots_nonempty'])} "
          f"canon-mismatch={len(summary['canonical_mismatch'])} canon-missing={len(summary['missing_canonical'])} "
          f"monetag-pages={len(summary['monetag_pages'])} thin<500={len(summary['thin_ssr_under_500_chars'])}")
    print(f"AdSense clients seen: {summary['adsense_clients_seen']}")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
