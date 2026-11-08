// Content similarity audit — READ-ONLY. Assembles the exact reading content
// rendered on each tool page (about + guide + FAQs) and measures duplication.
import { TOOLS } from "../../src/lib/tools/index.ts";
import fs from "node:fs";

type Tool = any;

function toolContent(t: Tool): string {
  const parts: string[] = [];
  if (t.about) parts.push(t.about);
  if (t.seo?.guide) {
    const g = t.seo.guide;
    if (g.how) parts.push(g.how);
    if (g.steps) parts.push(g.steps);
    if (g.formats) parts.push(g.formats);
    if (g.cases) parts.push(g.cases);
  }
  if (t.faq) for (const f of t.faq) parts.push(`${f.q} ${f.a}`);
  return parts.join("\n");
}

function shingles(text: string, n = 5): Set<string> {
  const toks = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= toks.length; i++) out.add(toks.slice(i, i + n).join(" "));
  return out;
}

const tools = TOOLS as Tool[];
const content: Record<string, string> = {};
const sh: Record<string, Set<string>> = {};
for (const t of tools) {
  content[t.slug] = toolContent(t);
  sh[t.slug] = shingles(content[t.slug]);
}

// 1) coverage stats
let noSeo = 0, noAbout = 0, noFaq = 0, noGuide = 0;
for (const t of tools) {
  if (!t.seo) noSeo++;
  if (!t.seo?.guide) noGuide++;
  if (!t.about) noAbout++;
  if (!t.faq?.length) noFaq++;
}
console.log(`TOOLS=${tools.length} no-seo=${noSeo} no-guide=${noGuide} no-about=${noAbout} no-faq=${noFaq}`);

// 2) exact duplicate FAQ answers shared across tools
const ansMap = new Map<string, Set<string>>();
for (const t of tools) for (const f of t.faq ?? []) {
  const key = f.a.trim().toLowerCase();
  ansMap.set(key, (ansMap.get(key) ?? new Set()).add(t.slug));
}
const shared = [...ansMap.entries()].filter(([, s]) => s.size > 1).sort((a, b) => b[1].size - a[1].size);
console.log(`\nFAQ answers reused on >1 tool: ${shared.length} distinct answers`);
for (const [a, s] of shared.slice(0, 10)) console.log(`  x${s.size}: "${a.slice(0, 90)}..."`);
const toolsWithAnyShared = new Set<string>();
for (const [, s] of shared) for (const x of s) toolsWithAnyShared.add(x);
console.log(`Tools with at least one reused FAQ answer: ${toolsWithAnyShared.size}/${tools.length}`);
// fully unique-faq tools
const fullyUnique = tools.filter(t => !(t.faq ?? []).some(f => (ansMap.get(f.a.trim().toLowerCase()) ?? new Set()).size > 1));
console.log(`Tools whose FAQ set is 100% unique: ${fullyUnique.length}`);

// 3) pairwise Jaccard of full page reading content
const slugs = tools.map(t => t.slug);
const pairs: [number, string, string][] = [];
for (let i = 0; i < slugs.length; i++)
  for (let j = i + 1; j < slugs.length; j++) {
    const a = sh[slugs[i]], b = sh[slugs[j]];
    let inter = 0;
    const [small, big] = a.size < b.size ? [a, b] : [b, a];
    for (const s of small) if (big.has(s)) inter++;
    const jac = inter / (a.size + b.size - inter);
    if (jac > 0.25) pairs.push([jac, slugs[i], slugs[j]]);
  }
pairs.sort((x, y) => y[0] - x[0]);
console.log(`\nPairs with reading-content Jaccard > 0.25: ${pairs.length}`);
for (const [j, a, b] of pairs.slice(0, 15)) console.log(`  ${j.toFixed(2)}  /${a}  <->  /${b}`);

// 4) per-tool word counts of reading content
const wc = slugs.map(s => ({ slug: s, words: content[s].split(/\s+/).filter(Boolean).length }))
  .sort((a, b) => a.words - b.words);
console.log(`\nReading-content words per tool — min: ${wc[0].words} /${wc[0].slug} | median: ${wc[Math.floor(wc.length/2)].words} | max: ${wc[wc.length-1].words} /${wc[wc.length-1].slug}`);
console.log("10 thinnest:", wc.slice(0, 10).map(w => `${w.slug}:${w.words}`).join(", "));

fs.writeFileSync("/home/z/my-project/scripts/stage2-audit/content-sim.json", JSON.stringify({
  coverage: { noSeo, noGuide, noAbout, noFaq },
  sharedFaqAnswers: shared.map(([a, s]) => { return { answer: a, count: s.size, tools: [...s] }; }),
  fullyUniqueFaqTools: fullyUnique.length,
  similarPairs: pairs.map(([j, a, b]) => ({ j: +j.toFixed(3), a, b })),
  wordCounts: wc,
}, null, 1));
console.log("\nSaved content-sim.json");
