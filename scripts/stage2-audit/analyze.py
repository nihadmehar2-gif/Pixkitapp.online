#!/usr/bin/env python3
"""
Stage-2 SEO audit ANALYSIS — READ-ONLY. Reads crawl.json, prints findings,
saves analyze.json. No site changes.
"""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

OUT = Path("/home/z/my-project/scripts/stage2-audit")
pages = json.loads((OUT / "crawl.json").read_text())
ok = [p for p in pages if p.get("status") == 200]
WWW = "https://www.pixkitapp.online"
R = {}  # report dict

def url_path(u): return u.replace(WWW, "").rstrip("/") or "/"

# ---------- 1. Titles ----------
titles = [(url_path(p["url"]), p.get("title") or "") for p in ok]
dup_titles = {t: [u for u, x in titles if x == t] for t, c in Counter(t for _, t in titles).items() if c > 1}
short_titles = [(u, t, len(t)) for u, t in titles if 0 < len(t) < 30]
long_titles = [(u, t, len(t)) for u, t in titles if len(t) > 65]
missing_titles = [(u, t) for u, t in titles if not t]
R["titles"] = {"count": len(titles), "duplicates": dup_titles, "short(<30)": short_titles,
               "long(>65)": long_titles, "missing": missing_titles,
               "len_stats": {"min": min(len(t) for _, t in titles), "max": max(len(t) for _, t in titles),
                              "avg": round(sum(len(t) for _, t in titles) / len(titles), 1)}}

# ---------- 2. Meta descriptions ----------
descs = [(url_path(p["url"]), (p.get("description") or "").strip()) for p in ok]
dup_descs = {d: [u for u, x in descs if x == d] for d, c in Counter(d for _, d in descs).items() if c > 1}
missing_descs = [u for u, d in descs if not d]
short_descs = [(u, len(d)) for u, d in descs if 0 < len(d) < 70]
long_descs = [(u, len(d)) for u, d in descs if len(d) > 165]
# near-duplicates: same first 60 normalized chars
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", s.lower())[:60]
pref = defaultdict(list)
for u, d in descs:
    if d: pref[norm(d)].append(u)
near_dup_descs = {k: v for k, v in pref.items() if len(v) > 1}
R["descriptions"] = {"count": len(descs), "duplicates": dup_descs, "near_duplicates(60char-prefix)": near_dup_descs,
                     "missing": missing_descs, "short(<70)": short_descs, "long(>165)": long_descs,
                     "len_stats": {"min": min(len(d) for _, d in descs), "max": max(len(d) for _, d in descs),
                                    "avg": round(sum(len(d) for _, d in descs) / len(descs), 1)}}

# ---------- 3. H1 ----------
h1_issues = {"missing": [], "multiple": []}
h1_list = []
for p in ok:
    h1 = p.get("h1") or []
    u = url_path(p["url"])
    if not h1: h1_issues["missing"].append(u)
    if len(h1) > 1: h1_issues["multiple"].append((u, h1))
    h1_list.extend((u, h) for h in h1)
h1_dup = {h: [u for u, x in h1_list if x == h] for h, c in Counter(h for _, h in h1_list).items() if c > 1}
R["h1"] = {**h1_issues, "duplicate_h1_text_across_pages": h1_dup,
           "len_stats": {"min": min(len(h) for _, h in h1_list), "max": max(len(h) for _, h in h1_list)}}

# ---------- 4. Canonical / og:url consistency ----------
canon_bad = [(url_path(p["url"]), p.get("canonical")) for p in ok if p.get("canonical") != p["url"]]
og_bad = [(url_path(p["url"]), p.get("og_url"), p.get("canonical")) for p in ok
          if (p.get("og_url") or "").rstrip("/") != (p.get("canonical") or "").rstrip("/")]
R["canonical"] = {"self_mismatches": canon_bad, "ogurl_mismatches": og_bad}

# ---------- 5. Content depth ----------
reading_words = []
thin = []
for p in ok:
    u = url_path(p["url"])
    mw, bw = p["main_words"], p["body_words"]
    reading_words.append((u, mw, bw, p["h2_count"]))
    if mw < 150: thin.append((u, mw))
R["content"] = {"thin(<150 words in <main>)": sorted(thin, key=lambda x: x[1]),
                "lowest15": sorted(reading_words, key=lambda x: x[1])[:15],
                "highest5": sorted(reading_words, key=lambda x: x[1])[-5:],
                "avg_main_words": round(sum(m for _, m, _, _ in reading_words) / len(reading_words))}

# ---------- 6. Duplicate / similar content (5-word shingle Jaccard) ----------
def shingles(text, n=5):
    toks = re.findall(r"[a-z0-9']+", text.lower())
    return {hash(" ".join(toks[i:i+n])) for i in range(max(0, len(toks)-n+1))}

texts = {}
for p in ok:
    # reuse main content by re-fetching? No — word counts only saved. Use title+h1+desc+h2? 
    pass
# shingles need raw text: rebuild approximate page fingerprint from fields we saved
# -> use description + h1 + links? Not enough. Instead compare (title,desc,h1) triples + link overlap.
# Content-level similarity is computed separately in content-similarity.py using stored main text.
# Here: structural duplication = same (title,desc,h1) pattern or same description prefix (above).
same_triples = defaultdict(list)
for p in ok:
    same_triples[(p.get("title"), p.get("description"), tuple(p.get("h1") or []))].append(url_path(p["url"]))
R["duplication_structural"] = {str(k): v for k, v in same_triples.items() if len(v) > 1}

# ---------- 7. Images / ALT ----------
img_missing_alt, img_empty_alt, imgs_noalt_list = [], [], []
total_imgs = 0
for p in ok:
    for im in p.get("images", []):
        total_imgs += 1
        u = url_path(p["url"])
        if im.get("alt") is None:
            img_missing_alt.append((u, im["src"]))
        elif im["alt_empty"]:
            img_empty_alt.append((u, im["src"]))
R["images"] = {"total_img_tags": total_imgs, "alt_missing(null)": img_missing_alt,
               "alt_empty(decorative-ok)": len(img_empty_alt),
               "alt_empty_list": img_empty_alt[:20],
               "svg_icons_total": sum(p["svg_total"] for p in ok),
               "svg_icons_aria_hidden": sum(p["svg_hidden"] for p in ok)}

# ---------- 8. Internal link graph ----------
paths = {url_path(p["url"]) for p in ok}
inlinks = defaultdict(set)
ext = Counter()
for p in ok:
    src = url_path(p["url"])
    for l in p["links"]:
        if l.startswith("EXT:"): ext[l[4:]] += 1
        elif l in paths and l != src: inlinks[l].add(src)
orphans = sorted(p for p in paths if len(inlinks.get(p, ())) == 0)
low_in = sorted(((len(inlinks.get(p, ())), p) for p in paths))[:20]
# tool pages & categories linkage
tool_in = [(len(inlinks.get(p, ())), p) for p in paths if p.startswith("/categor") is False and p not in ("/", "/tools", "/about", "/contact", "/privacy", "/terms") and not p.startswith("/categories")]
R["links"] = {"orphans": orphans, "lowest_inlink_20": low_in,
              "external_domains": dict(ext.most_common(12)),
              "avg_outlinks": round(sum(p["link_count"] for p in ok) / len(ok), 1)}

# ---------- 9. Structured data ----------
sd = {"pages_without_jsonld": [], "type_matrix": Counter(), "issues": []}
faq_mismatch = []
for p in ok:
    u = url_path(p["url"])
    blocks = p.get("jsonld") or []
    if not blocks:
        sd["pages_without_jsonld"].append(u)
        continue
    types = []
    for b in blocks:
        if "_parse_error" in b:
            sd["issues"].append((u, "JSON parse error", b["_parse_error"])); continue
        for node in b.get("@graph", [b]):
            t = node.get("@type"); types.append(t)
            if t == "WebApplication":
                if node.get("url") != p.get("canonical"): sd["issues"].append((u, "WebApplication.url != canonical", node.get("url")))
                if not node.get("offers"): sd["issues"].append((u, "WebApplication missing offers", ""))
                if not node.get("description"): sd["issues"].append((u, "WebApplication missing description", ""))
            if t == "BreadcrumbList":
                items = node.get("itemListElement", [])
                if [i.get("position") for i in items] != list(range(1, len(items)+1)):
                    sd["issues"].append((u, "Breadcrumb positions wrong", ""))
                for i in items:
                    it = i.get("item")
                    if isinstance(it, str) and not it.startswith(WWW): sd["issues"].append((u, "Breadcrumb non-canonical URL", it))
                    if isinstance(it, dict) and not str(it.get("id", it.get("item", ""))).startswith(WWW): sd["issues"].append((u, "Breadcrumb non-canonical URL", str(it)))
            if t == "FAQPage":
                qs = [q.get("name") for q in node.get("mainEntity", [])]
                if not qs: sd["issues"].append((u, "FAQPage with no questions", ""))
            if t == "CollectionPage":
                if node.get("url") != p.get("canonical"): sd["issues"].append((u, "CollectionPage.url != canonical", node.get("url")))
                il = node.get("mainEntity", {})
                if il.get("@type") == "ItemList" and not il.get("numberOfItems"): sd["issues"].append((u, "ItemList missing numberOfItems", ""))
            if t == "WebSite":
                pa = node.get("potentialAction", {})
                if pa and "{search_term_string}" not in json.dumps(pa): sd["issues"].append((u, "SearchAction missing placeholder", json.dumps(pa)[:80]))
    sd["type_matrix"][tuple(sorted(set(types)))] += 1
R["structured_data"] = {"type_matrix": {" + ".join(k): v for k, v in sd["type_matrix"].items()},
                        "pages_without_jsonld": sd["pages_without_jsonld"],
                        "issues": sd["issues"]}

(OUT / "analyze.json").write_text(json.dumps(R, indent=1, default=str))

# ---------- print summary ----------
print("=" * 70); print("TITLES"); print("=" * 70)
print(json.dumps(R["titles"]["len_stats"]), "| dups:", len(dup_titles), "| short:", len(short_titles), "| long:", len(long_titles))
for u, t, l in long_titles[:8]: print(f"  LONG{l:>4} {u}: {t}")
for t, us in list(dup_titles.items())[:5]: print(f"  DUP x{len(us)}: {t[:70]}")
print("=" * 70); print("DESCRIPTIONS"); print("=" * 70)
print(json.dumps(R["descriptions"]["len_stats"]), "| dups:", len(dup_descs), "| near-dup:", len(near_dup_descs),
      "| missing:", len(missing_descs), "| short:", len(short_descs), "| long:", len(long_descs))
for d, us in list(dup_descs.items())[:5]: print(f"  DUP x{len(us)}: {d[:80]}")
for k, us in list(near_dup_descs.items())[:8]: print(f"  NEAR x{len(us)}: {k[:60]} -> {us}")
for u, l in long_descs[:10]: print(f"  LONG{l:>4} {u}")
print("=" * 70); print("H1"); print("=" * 70)
print("missing:", len(h1_issues["missing"]), "| multiple:", len(h1_issues["multiple"]), "| dup text:", len(h1_dup))
for u in h1_issues["missing"][:5]: print("  MISSING", u)
for u, h in h1_issues["multiple"][:5]: print("  MULTIPLE", u, h)
for h, us in list(h1_dup.items())[:8]: print(f"  DUP-TEXT x{len(us)}: {h[:70]} -> {us}")
print("=" * 70); print("CONTENT DEPTH"); print("=" * 70)
print("avg main words:", R["content"]["avg_main_words"], "| thin(<150):", len(thin))
for u, mw, bw, h2 in R["content"]["lowest15"]: print(f"  {mw:>5}w h2:{h2} {u}")
print("=" * 70); print("IMAGES/ALT"); print("=" * 70)
print("img tags:", total_imgs, "| alt missing:", len(img_missing_alt), "| alt empty (decorative):", len(img_empty_alt),
      "| svg icons:", R["images"]["svg_icons_total"], "hidden:", R["images"]["svg_icons_aria_hidden"])
for u, s in img_missing_alt[:10]: print("  NO-ALT", u, s)
print("=" * 70); print("LINK GRAPH"); print("=" * 70)
print("orphans:", len(orphans), orphans[:10])
print("lowest inlinks:", low_in[:12])
print("external domains:", dict(list(ext.most_common(8))))
print("=" * 70); print("STRUCTURED DATA"); print("=" * 70)
for k, v in R["structured_data"]["type_matrix"].items(): print(f"  x{v:<4} {k}")
print("pages w/o JSON-LD:", len(sd["pages_without_jsonld"]), sd["pages_without_jsonld"][:8])
print("issues:", len(sd["issues"]))
for i in sd["issues"][:12]: print("  ", i)
print("=" * 70); print("CANONICAL/OG"); print("=" * 70)
print("canonical mismatches:", len(canon_bad), "| og:url mismatches:", len(og_bad))
print("\nSaved analyze.json")
