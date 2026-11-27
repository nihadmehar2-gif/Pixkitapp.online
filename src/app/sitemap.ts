import type { MetadataRoute } from "next";
import { TOOLS, SITE_URL } from "@/lib/tools";
import { CATEGORIES } from "@/lib/tools/categories";
import { POSTS } from "@/lib/blog/posts";
import { IS_PREVIEW } from "@/lib/seo";

/**
 * Production sitemap: the intended indexable URLs —
 * 1 homepage + 5 static pages (/tools /about /contact /privacy /terms)
 * + 14 category pages + 127 tool pages + /blog and the 8 published guides
 * = 156 URLs — all absolute https://www.pixkitapp.online URLs, no query
 * variants, no fragments, no duplicates.
 *
 * Preview/staging must not publish the production sitemap (robots.txt
 * already omits the reference; the route itself stays empty there).
 *
 * lastmod policy (honesty rule): we do NOT stamp build timestamps — a
 * date that changes on every deploy teaches crawlers to distrust it.
 * lastmod appears ONLY where we know a true date: the blog guides carry
 * their publication date. Tool/category/static pages omit lastmod so
 * crawlers rely on our fetch/recrawl signals instead. changeFrequency
 * and priority are kept as coarse, stable hints.
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
  const blogPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...POSTS.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
  return [...staticPages, ...categoryPages, ...toolPages, ...blogPages];
}
