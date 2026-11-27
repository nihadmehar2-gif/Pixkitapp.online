/** SEO content registry — merges per-category records and validates completeness. */

import { ToolSeo } from "../types";
import { COMPRESSION_SEO } from "./compression";
import { RESIZING_SEO } from "./resizing-cropping";
import { CONVERSION_SEO } from "./conversion-rotation";
import { FILTERS_SEO } from "./filters-color";
import { WATERMARK_SEO } from "./watermark-text";
import { SOCIAL_SEO } from "./social-passport";
import { SEO_EXTRAS } from "./extras";

export const SEO_BY_SLUG: Record<string, ToolSeo> = {
  ...COMPRESSION_SEO,
  ...RESIZING_SEO,
  ...CONVERSION_SEO,
  ...FILTERS_SEO,
  ...WATERMARK_SEO,
  ...SOCIAL_SEO,
};

// Attach page-specific depth content (intro / table / mistakes) to the
// records that define it. Kept in a separate module so the long positional
// seo() call sites above stay untouched.
for (const [slug, extras] of Object.entries(SEO_EXTRAS)) {
  if (SEO_BY_SLUG[slug]) SEO_BY_SLUG[slug].extras = extras;
}

export function getToolSeo(slug: string): ToolSeo | undefined {
  return SEO_BY_SLUG[slug];
}
