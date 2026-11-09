/** Tool registry — all definitions, lookup and search. */

import { ToolDef, ToolCategory } from "./types";
import { CATEGORIES, categoryById } from "./categories";
import { COMPRESSION_TOOLS, OPTIMIZATION_TOOLS } from "./definitions/compression";
import { RESIZE_TOOLS, CROP_TOOLS } from "./definitions/resizing-cropping";
import { CONVERSION_TOOLS, ROTATION_TOOLS } from "./definitions/conversion-rotation";
import { FILTER_TOOLS, COLOR_TOOLS, METADATA_TOOLS } from "./definitions/filters-color";
import { WATERMARK_TOOLS, TEXT_TOOLS, TRANSPARENCY_TOOLS } from "./definitions/watermark-text";
import { SOCIAL_TOOLS, PASSPORT_TOOLS } from "./definitions/social-passport";
import { SEO_BY_SLUG } from "./seo";
import { GENERATED_FAQS } from "./faq/generated-faqs";
import { FAQ_UPGRADES } from "./faq/faq-upgrades";

export const TOOLS: ToolDef[] = [
  ...COMPRESSION_TOOLS,
  ...RESIZE_TOOLS,
  ...CROP_TOOLS,
  ...CONVERSION_TOOLS,
  ...ROTATION_TOOLS,
  ...FILTER_TOOLS,
  ...OPTIMIZATION_TOOLS,
  ...METADATA_TOOLS,
  ...COLOR_TOOLS,
  ...WATERMARK_TOOLS,
  ...TEXT_TOOLS,
  ...TRANSPARENCY_TOOLS,
  ...SOCIAL_TOOLS,
  ...PASSPORT_TOOLS,
];

/** The one canonical production origin — every sitemap/robots/canonical/OG/schema URL derives from it. */
export const SITE_URL = "https://www.pixkitapp.online";
export const SITE_NAME = "PixKitApp";

/** Lightweight tool shape for client components — excludes SEO guides, FAQs and options. */
export type ToolLite = Pick<ToolDef, "slug" | "name" | "description" | "category" | "keywords" | "icon">;

export function toLite(t: ToolDef): ToolLite {
  return { slug: t.slug, name: t.name, description: t.description, category: t.category, keywords: t.keywords, icon: t.icon };
}

export function liteTools(list: ToolDef[]): ToolLite[] {
  return list.map(toLite);
}

// Attach per-tool SEO content (unique titles, meta descriptions, keywords, guides).
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
for (const tool of TOOLS) {
  tool.seo = SEO_BY_SLUG[tool.slug];
  // Tools without a hand-written FAQ get a grounded generated one (3-4 Q&As
  // built from the tool's real formats, options and limits).
  if (!tool.faq || tool.faq.length === 0) {
    const generated = GENERATED_FAQS[tool.slug];
    if (generated) tool.faq = generated;
  }
  // Targeted FAQ upgrades run last: replace specific answers, append new Q&As
  // (same question is never duplicated).
  const up = FAQ_UPGRADES[tool.slug];
  if (up && tool.faq) {
    if (up.replace) {
      for (const rep of up.replace) {
        const hit = tool.faq.find((f) => norm(f.q) === norm(rep.q));
        if (hit) hit.a = rep.a;
      }
    }
    if (up.add) {
      for (const item of up.add) {
        if (!tool.faq.some((f) => norm(f.q) === norm(item.q))) tool.faq.push(item);
      }
    }
    // Tool-specific privacy answer: the auto-generator rotates six privacy
    // question phrasings ("How private is X?", "Is my image uploaded to a
    // server…?", "Where are my images processed?" …), so the match is done by
    // TOPIC, not exact wording. Safety: the answer is only swapped when
    // exactly ONE question matches the privacy pattern — zero or multiple
    // matches leave the FAQ untouched (and warn in dev), so unrelated Q&As
    // can never be overwritten.
    if (up.privacyAnswer) {
      const PRIVACY_Q =
        /(how private\b|uploaded to a server|upload my (?:images?|files?|photos?)|files? leave my device|where are my images processed|safe to use with personal)/i;
      const hits = tool.faq.filter((f) => PRIVACY_Q.test(f.q));
      if (hits.length === 1) hits[0].a = up.privacyAnswer;
      else if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[faq] privacyAnswer for ${tool.slug}: expected exactly 1 privacy question, found ${hits.length} — skipped`
        );
      }
    }
  }
}
if (process.env.NODE_ENV !== "production") {
  const missing = TOOLS.filter((t) => !t.seo).map((t) => t.slug);
  if (missing.length) console.warn(`[seo] Tools without SEO content: ${missing.join(", ")}`);
  const noFaq = TOOLS.filter((t) => !t.faq || t.faq.length === 0).map((t) => t.slug);
  if (noFaq.length) console.warn(`[faq] Tools without FAQ: ${noFaq.join(", ")}`);
}

const toolMap = new Map<string, ToolDef>(TOOLS.map((t) => [t.slug, t]));

export function getTool(slug: string): ToolDef | undefined {
  return toolMap.get(slug);
}

export function toolsByCategory(categoryId: string): ToolDef[] {
  return TOOLS.filter((t) => t.category === categoryId);
}

export function popularTools(limit = 12): ToolDef[] {
  const popular = TOOLS.filter((t) => t.popular);
  return popular.slice(0, limit);
}

export function categoryWithCount(cat: ToolCategory): ToolCategory & { count: number } {
  return { ...cat, count: toolsByCategory(cat.id).length };
}

export function categoriesWithCounts() {
  return CATEGORIES.map(categoryWithCount);
}

/** Simple fuzzy-ish search over name, description, keywords and slug. */
export function searchTools(query: string, limit = 30): ToolDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  const scored = TOOLS.map((tool) => {
    const haystack = `${tool.name} ${tool.slug} ${tool.description} ${tool.keywords.join(" ")}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (tool.slug.includes(term)) score += 10;
      if (tool.name.toLowerCase().includes(term)) score += 8;
      if (tool.keywords.some((k) => k.toLowerCase().includes(term))) score += 5;
      if (haystack.includes(term)) score += 2;
    }
    return { tool, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.tool);
}

export { CATEGORIES, categoryById };
export type { ToolDef, ToolCategory };
