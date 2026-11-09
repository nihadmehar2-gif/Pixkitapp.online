#!/usr/bin/env python3
"""Read-only analysis: find exact duplicated FAQ answers across tool pages.
Replicates the merge logic of src/lib/tools/index.ts:
  final_faq = hand_written_faq (from definitions) OR GENERATED_FAQS[slug]
  then FAQ_UPGRADES[slug].replace (case-insensitive question match)
  then FAQ_UPGRADES[slug].add (append if question not already present)
"""
import re, json, collections, glob

ROOT = "/home/z/my-project/src/lib/tools"

def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()

def parse_ts_array_objects(text, start_idx):
    """Given index of '{' parse a balanced-brace object, return (obj_str, end_idx)."""
    depth = 0
    i = start_idx
    in_str = None
    esc = False
    while i < len(text):
        c = text[i]
        if in_str:
            if esc: esc = False
            elif c == "\\": esc = True
            elif c == in_str: in_str = None
        else:
            if c in "\"'`": in_str = c
            elif c == "{": depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return text[start_idx:i+1], i+1
        i += 1
    raise ValueError("unbalanced")

def extract_faq_arrays(src_text):
    """Find every `faq: [ ... ]` and the enclosing tool slug. Returns {slug: [(q,a),...]}."""
    out = collections.defaultdict(list)
    # find slug occurrences to attribute faq arrays to tools
    slug_positions = [(m.start(), m.group(1)) for m in re.finditer(r'slug:\s*"([^"]+)"', src_text)]
    for m in re.finditer(r'faq:\s*\[', src_text):
        start = m.end()  # after '['
        # find matching closing bracket
        depth = 1
        i = start
        in_str = None
        esc = False
        while i < len(src_text) and depth > 0:
            c = src_text[i]
            if in_str:
                if esc: esc = False
                elif c == "\\": esc = True
                elif c == in_str: in_str = None
            else:
                if c in "\"'`": in_str = c
                elif c == "[": depth += 1
                elif c == "]": depth -= 1
            i += 1
        block = src_text[start:i-1]
        # attribute to nearest slug BEFORE this position
        slug = None
        for pos, s in slug_positions:
            if pos < m.start():
                slug = s
            else:
                break
        # parse q/a pairs
        for qm in re.finditer(r'q:\s*"((?:[^"\\]|\\.)*)"', block):
            pass
        pairs = re.findall(r'q:\s*"((?:[^"\\]|\\.)*)"[^}]*?a:\s*"((?:[^"\\]|\\.)*)"', block, re.S)
        if not pairs:
            pairs = re.findall(r'"q":\s*"((?:[^"\\]|\\.)*)"[^}]*?"a":\s*"((?:[^"\\]|\\.)*)"', block, re.S)
        for q, a in pairs:
            out[slug].append((q, a))
    return out

def parse_generated_faqs(text):
    """Parse GENERATED_FAQS Record<string, [...]>."""
    out = {}
    body_start = text.index("{")
    i = body_start + 1
    # find each "slug": [ ... ]
    for m in re.finditer(r'"([a-z0-9-]+)":\s*\[', text[body_start:]):
        slug = m.group(1)
        start = body_start + m.end()
        depth = 1
        j = start
        in_str = None
        esc = False
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
        block = text[start:j-1]
        pairs = re.findall(r'"q":\s*"((?:[^"\\]|\\.)*)"[^}]*?"a":\s*"((?:[^"\\]|\\.)*)"', block, re.S)
        out[slug] = [(q, a) for q, a in pairs]
    return out

def parse_upgrades(text):
    """Parse FAQ_UPGRADES Record<string, {replace?, add?}>."""
    out = {}
    for m in re.finditer(r'"([a-z0-9-]+)":\s*\{', text):
        slug = m.group(1)
        obj_str, end = parse_ts_array_objects(text, text.index("{", m.start()))
        seg = out.setdefault(slug, {"replace": [], "add": []})
        rm = re.search(r'replace:\s*\[', obj_str)
        if rm:
            block = obj_str[rm.end()-1:]
            # cut at matching bracket of this array
            depth = 0; j = 0; in_str=None; esc=False
            while j < len(block):
                c = block[j]
                if in_str:
                    if esc: esc=False
                    elif c == "\\": esc=True
                    elif c == in_str: in_str=None
                else:
                    if c in "\"'`": in_str=c
                    elif c == "[": depth+=1
                    elif c == "]":
                        depth-=1
                        if depth==0: break
                j += 1
            rb = block[:j+1]
            pairs = re.findall(r'q:\s*"((?:[^"\\]|\\.)*)"[^}]*?a:\s*"((?:[^"\\]|\\.)*)"', rb, re.S)
            seg["replace"] = pairs
        am = re.search(r'add:\s*\[', obj_str)
        if am:
            block = obj_str[am.end()-1:]
            depth = 0; j = 0; in_str=None; esc=False
            while j < len(block):
                c = block[j]
                if in_str:
                    if esc: esc=False
                    elif c == "\\": esc=True
                    elif c == in_str: in_str=None
                else:
                    if c in "\"'`": in_str=c
                    elif c == "[": depth+=1
                    elif c == "]":
                        depth-=1
                        if depth==0: break
                j += 1
            ab = block[:j+1]
            pairs = re.findall(r'q:\s*"((?:[^"\\]|\\.)*)"[^}]*?a:\s*"((?:[^"\\]|\\.)*)"', ab, re.S)
            seg["add"] = pairs
    return out

def unescape(s):
    return (s.replace('\\"', '"').replace("\\'", "'").replace("\\n", "\n")
             .replace("\\t", "\t").replace("\\\\", "\\"))

def norm_q(s):
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()

# ---- Load everything ----
defs = {}
for f in glob.glob(f"{ROOT}/definitions/*.ts"):
    defs.update(extract_faq_arrays(read(f)))

gen = parse_generated_faqs(read(f"{ROOT}/faq/generated-faqs.ts"))
ups = parse_upgrades(read(f"{ROOT}/faq/faq-upgrades.ts"))

# ---- Merge exactly like index.ts ----
final_faqs = {}
for slug in set(list(defs.keys()) + list(gen.keys())):
    base = defs.get(slug) or gen.get(slug) or []
    final = [[q, a] for q, a in base]
    up = ups.get(slug)
    if up and final:
        for rq, ra in up["replace"]:
            for item in final:
                if norm_q(unescape(item[0])) == norm_q(unescape(rq)):
                    item[1] = unescape(ra)
        for aq, aa in up["add"]:
            if not any(norm_q(unescape(item[0])) == norm_q(unescape(aq)) for item in final):
                final.append([unescape(aq), unescape(aa)])
    final_faqs[slug] = [(unescape(q), unescape(a)) for q, a in final]

# ---- Count exact duplicated ANSWER strings ----
answer_pages = collections.defaultdict(list)
q_by_answer = collections.defaultdict(set)
for slug, faqs in final_faqs.items():
    for q, a in faqs:
        answer_pages[a].append(slug)
        q_by_answer[a].add(q)

ranked = sorted(answer_pages.items(), key=lambda kv: -len(kv[1]))

print(f"Total tools with FAQs: {len(final_faqs)}")
print(f"Total FAQ Q&A pairs across site: {sum(len(v) for v in final_faqs.values())}")
print()
print("=== TOP duplicated exact answer strings ===")
for a, pages in ranked[:12]:
    print(f"\n[{len(pages)} pages] questions used: {sorted(q_by_answer[a])}")
    print(f"  ANSWER: {a[:160]}{'...' if len(a)>160 else ''}")

# Save full report
report = {
    "total_tools": len(final_faqs),
    "total_pairs": sum(len(v) for v in final_faqs.values()),
    "ranked": [
        {"count": len(pages), "answer": a, "questions": sorted(q_by_answer[a]), "pages": sorted(pages)}
        for a, pages in ranked if len(pages) >= 2
    ],
}
with open("/home/z/my-project/scripts/stage2-audit/faq-dup-report.json", "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print("\nSaved: scripts/stage2-audit/faq-dup-report.json")
