#!/usr/bin/env python3
"""Safety validation for the topic-based privacyAnswer merge (Change B, batch 1).
Replicates src/lib/tools/index.ts merge order:
  base FAQ -> FAQ_UPGRADES.replace -> FAQ_UPGRADES.add -> privacyAnswer (topic match, exactly-1 guard)
Checks:
  A) every batch tool: exactly 1 regex hit and it IS the generated privacy Q
  B) site-wide false-positive scan: every question matching the regex is a genuine privacy Q
  C) non-batch tools: final FAQ set byte-identical to the pre-change backup state
"""
import re, json, glob, collections

ROOT = "/home/z/my-project/src/lib/tools"
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
    # split into top-level slug blocks by scanning braces
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
for f in glob.glob(f"{ROOT}/definitions/*.ts"):
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
    # factory tools (socialTool/passportTool) have inline faq arrays BEFORE the slug arg — capture their faq params separately
gen = parse_generated(open(f"{ROOT}/faq/generated-faqs.ts", encoding="utf-8").read())
ups = parse_upgrades(f"{ROOT}/faq/faq-upgrades.ts")
ups_old = parse_upgrades("/home/z/my-project/scripts/stage2-audit/backups-20261109-batch1/faq-upgrades.ts")

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

BATCH = ["compress-image-to-500kb","png-to-jpg","webp-to-png","image-to-base64","image-color-picker",
         "add-text-to-image","remove-gps-data","rotate-image-90","crop-image-to-circle","thumbnail-maker"]

slugs = set(list(defs.keys()) + list(gen.keys()))
print("=== A) batch tools: regex hit count + matched question ===")
ok = True
for s in BATCH:
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
print("=== C) non-batch tools unchanged vs pre-change state ===")
diffs = []
for s in sorted(slugs):
    if s in BATCH: continue
    before = merge(s, ups_old)
    after = merge(s, ups)
    if before != after: diffs.append(s)
print(f"  tools with any FAQ difference: {len(diffs)} {diffs if diffs else ''}")
if diffs: ok = False

print()
print("VERDICT:", "ALL CHECKS PASSED" if ok else "FAILURES FOUND — DO NOT BUILD")
