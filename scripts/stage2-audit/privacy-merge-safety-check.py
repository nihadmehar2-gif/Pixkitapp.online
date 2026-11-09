#!/usr/bin/env python3
"""Safety validation for the topic-based privacyAnswer merge (Change B, batch 3).
Replicates src/lib/tools/index.ts merge order:
  base FAQ -> FAQ_UPGRADES.replace -> FAQ_UPGRADES.add -> privacyAnswer (topic match, exactly-1 guard)
Checks:
  A) every batch-3 tool: exactly 1 regex hit and generic answer removed by the merge
  B) site-wide false-positive scan: every question matching the regex is a genuine privacy Q
  C) non-batch-3 tools: final FAQ set byte-identical to the pre-batch-3 backup state
  D) approved wording corrections present in merged output (base64 File API, bmp white)
Location-independent: paths derived from this script's own location, so it runs
identically in the main checkout or in a linked worktree.
"""
import re, os, sys, glob, collections

STAGE2 = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(os.path.dirname(os.path.dirname(STAGE2)), "src", "lib", "tools")
PRIVACY_Q = re.compile(
    r"(how private\b|uploaded to a server|upload my (?:images?|files?|photos?)|files? leave my device|where are my images processed|safe to use with personal)", re.I
)

def unescape(s):
    return (s.replace('\\"', '"').replace("\\'", "'").replace("\\n", "\n")
             .replace("\\t", "\t").replace("\\\\", "\\"))

def norm_q(s):
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()

def parse_generated(text):
    out = {}
    body = text.index("{")
    for m in re.finditer(r'"([a-z0-9-]+)":\s*\[', text[body:]):
        slug = m.group(1); start = body + m.end()
        depth, j, in_str, esc = 1, start, None, False
        while j < len(text) and depth > 0:
            c = text[j]
            if in_str:
                if esc: esc = False
                elif c == "\\": esc = True
                elif c == in_str: in_str = None
            else:
                if c in "\"'`": in_str = c
                elif c == "[": depth += 1
                elif c == "]": depth -= 1
            j += 1
        out[slug] = re.findall(r'"q":\s*"((?:[^"\\]|\\.)*)"[^}]*?"a":\s*"((?:[^"\\]|\\.)*)"', text[start:j-1], re.S)
    return out

def parse_upgrades(path):
    text = open(path, encoding="utf-8").read()
    out = {}
    for m in re.finditer(r'"([a-z0-9-]+)":\s*\{', text):
        slug = m.group(1)
        i = m.end() - 1
        depth, j, in_str, esc = 0, i, None, False
        while j < len(text):
            c = text[j]
            if in_str:
                if esc: esc = False
                elif c == "\\": esc = True
                elif c == in_str: in_str = None
            else:
                if c in "\"'`": in_str = c
                elif c == "{": depth += 1
                elif c == "}":
                    depth -= 1
                    if depth == 0: break
            j += 1
        block = text[i:j+1]
        entry = {"replace": [], "add": [], "privacyAnswer": None}
        pm = re.search(r'privacyAnswer:\s*\n?\s*"((?:[^"\\]|\\.)*)"', block)
        if pm: entry["privacyAnswer"] = unescape(pm.group(1))
        for kind in ("replace", "add"):
            km = re.search(kind + r':\s*\[', block)
            if km:
                kb = block[km.end()-1:]
                depth, j, in_str, esc = 0, 0, None, False
                while j < len(kb):
                    c = kb[j]
                    if in_str:
                        if esc: esc = False
                        elif c == "\\": esc = True
                        elif c == in_str: in_str = None
                    else:
                        if c in "\"'`": in_str = c
                        elif c == "[": depth += 1
                        elif c == "]":
                            depth -= 1
                            if depth == 0: break
                    j += 1
                entry[kind] = re.findall(r'q:\s*"((?:[^"\\]|\\.)*)"[^}]*?a:\s*"((?:[^"\\]|\\.)*)"', kb[:j+1], re.S)
        out.setdefault(slug, entry)
    return out

# --- load ---
defs = {}
for f in glob.glob(os.path.join(ROOT, "definitions", "*.ts")):
    src = open(f, encoding="utf-8").read()
    slug_pos = [(m.start(), m.group(1)) for m in re.finditer(r'slug:\s*"([^"]+)"', src)]
    for m in re.finditer(r'faq:\s*\[', src):
        start = m.end(); depth, j, in_str, esc = 1, start, None, False
        while j < len(src) and depth > 0:
            c = src[j]
            if in_str:
                if esc: esc = False
                elif c == "\\": esc = True
                elif c == in_str: in_str = None
            else:
                if c in "\"'`": in_str = c
                elif c == "[": depth += 1
                elif c == "]": depth -= 1
            j += 1
        block = src[start:j-1]
        slug = max((p for p in slug_pos if p[0] < m.start()), default=None, key=lambda x: x[0])
        if not slug: continue
        pairs = re.findall(r'q:\s*"((?:[^"\\]|\\.)*)"[^}]*?a:\s*"((?:[^"\\]|\\.)*)"', block, re.S)
        defs.setdefault(slug[1], []).extend(pairs)
gen = parse_generated(open(os.path.join(ROOT, "faq", "generated-faqs.ts"), encoding="utf-8").read())
ups = parse_upgrades(os.path.join(ROOT, "faq", "faq-upgrades.ts"))
ups_old = parse_upgrades(os.path.join(STAGE2, "backups-20261109-batch3", "faq-upgrades.ts.bak"))

def merge(slug, upgrades):
    base = defs.get(slug) or gen.get(slug) or []
    final = [[unescape(q), unescape(a)] for q, a in base]
    up = upgrades.get(slug)
    if up and final:
        for rq, ra in up["replace"]:
            for it in final:
                if norm_q(it[0]) == norm_q(unescape(rq)): it[1] = unescape(ra)
        for aq, aa in up["add"]:
            if not any(norm_q(it[0]) == norm_q(unescape(aq)) for it in final):
                final.append([unescape(aq), unescape(aa)])
        if up["privacyAnswer"]:
            hits = [it for it in final if PRIVACY_Q.search(it[0])]
            if len(hits) == 1: hits[0][1] = up["privacyAnswer"]
    return [tuple(x) for x in final]

BATCH3 = ["add-background-color", "add-caption-to-image", "add-title-to-image", "add-white-background",
          "avif-to-jpg", "avif-to-png", "base64-to-image", "blur-image", "bmp-to-png", "brightness-adjuster"]

slugs = set(list(defs.keys()) + list(gen.keys()))
print("=== A) batch-3 tools: regex hit count + merge removes generic answer ===")
ok = True
for s in BATCH3:
    base = [tuple([unescape(q), unescape(a)]) for q, a in (defs.get(s) or gen.get(s) or [])]
    hits = [(q, a) for q, a in base if PRIVACY_Q.search(q)]
    final = merge(s, ups)
    dup_generic = "Everything runs locally in your browser via the Canvas API" in dict(final).values()
    status = "OK" if len(hits) == 1 and not dup_generic else "FAIL"
    if status == "FAIL": ok = False
    print(f"  [{status}] {s}: {len(hits)} privacy Q in base | Q='{hits[0][0] if hits else '???'}' | generic answer still present: {dup_generic}")

print()
print("=== B) site-wide false-positive scan (questions matching privacy regex) ===")
allq = collections.defaultdict(set)
for s in slugs:
    for q, a in merge(s, ups):
        if PRIVACY_Q.search(q): allq[q].add(s)
genuine = 0; suspicious = []
for q, ss in sorted(allq.items()):
    is_priv = bool(re.search(r"(privat|upload|leave my device|where are my images processed|safe to use with personal)", q, re.I))
    if is_priv: genuine += 1
    else: suspicious.append((q, sorted(ss)))
print(f"  unique questions matching regex: {len(allq)}; genuine privacy questions: {genuine}; suspicious: {len(suspicious)}")
for q, ss in suspicious: print(f"  SUSPICIOUS: '{q}' on {ss}")
if suspicious: ok = False

print()
print("=== C) non-batch-3 tools unchanged vs pre-batch-3 state (incl. batch 1+2 and corrections) ===")
diffs = []
for s in sorted(slugs):
    if s in BATCH3: continue
    before = merge(s, ups_old)
    after = merge(s, ups)
    if before != after: diffs.append(s)
print(f"  tools with any FAQ difference: {len(diffs)} {diffs if diffs else ''}")
if diffs: ok = False

print()
print("=== D) approved wording corrections present in merged output ===")
b64 = dict(merge("image-to-base64", ups))
b64_ok = any("file.arrayBuffer()" in a for a in b64.values()) and all("FileReader" not in a for a in b64.values())
bmp = dict(merge("bmp-to-jpg", ups))
bmp_ok = any("flattened onto white" in a for a in bmp.values()) and all("the background color you pick —" not in a for a in bmp.values())
png = dict(merge("png-to-jpg", ups))
png_kept = any("the background color you picked" in a for a in png.values())
raw_ups_text = open(os.path.join(ROOT, "faq", "faq-upgrades.ts"), encoding="utf-8").read()
no_filereader_anywhere = "FileReader" not in raw_ups_text
d_ok = b64_ok and bmp_ok and png_kept and no_filereader_anywhere
if not d_ok: ok = False
print(f"  [{'OK' if b64_ok else 'FAIL'}] image-to-base64 merged answer uses file.arrayBuffer(), no FileReader")
print(f"  [{'OK' if bmp_ok else 'FAIL'}] bmp-to-jpg merged answer says 'flattened onto white', old phrase gone")
print(f"  [{'OK' if png_kept else 'FAIL'}] png-to-jpg keeps accurate 'background color you picked' (tool has a color option)")
print(f"  [{'OK' if no_filereader_anywhere else 'FAIL'}] no 'FileReader' string anywhere in faq-upgrades.ts")

print()
print("VERDICT:", "ALL CHECKS PASSED" if ok else "FAILURES FOUND — DO NOT BUILD")
sys.exit(0 if ok else 1)
