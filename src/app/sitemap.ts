import type { MetadataRoute } from "next";
import { TOOLS, SITE_URL } from "@/lib/tools";
import { CATEGORIES } from "@/lib/tools/categories";
import { IS_PREVIEW } from "@/lib/seo";

/**
 * Production sitemap: exactly the 147 intended indexable URLs —
 * 1 homepage + 5 static pages (/tools /about /contact /privacy /terms)
 * + 14 category pages + 127 tool pages — all absolute https://www.pixkitapp.online
 * URLs, no query variants, no fragments, no duplicates.
 *
 * Preview/staging must not publish the production sitemap (robots.txt
 * already omits the reference; the route itself stays empty there).
 *
 * No <lastmod>: we have no accurate, maintainable per-URL change tracking
 * (a build timestamp would mark every URL as changed on every deploy, which
 * search engines learn to ignore — or worse, distrust). Omitted entirely so
 * crawlers rely on our own fetch/recrawl signals instead. changeFrequency and
 * priority are kept as coarse, stable hints.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (IS_PREVIEW) return [];
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/tools`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE_URL}/categories/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const toolPages: MetadataRoute.Sitemap = TOOLS.map((t) => ({
    url: `${SITE_URL}/${t.slug}`,
    changeFrequency: "weekly",
    priority: t.popular ? 0.9 : 0.7,
  }));
  return [...staticPages, ...categoryPages, ...toolPages];
}
